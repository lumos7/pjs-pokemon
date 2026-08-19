import { NextRequest, NextResponse } from 'next/server'
import { pickRandomVoice } from '@/lib/voices'
import { POKEMON_NAMES } from '@/lib/pokemonNames'

const SPOKEN_NAME = 'PJ'

const PHRASES = [
  (name: string) => `Look ${SPOKEN_NAME}, this is ${name}!`,
  (name: string) => `Hey ${SPOKEN_NAME}, meet ${name}!`,
  (name: string) => `Wow ${SPOKEN_NAME}, it's ${name}!`,
  (name: string) => `Oh my days ${SPOKEN_NAME}, it's ${name}!`,
  (name: string) => `${SPOKEN_NAME}, no way! It's ${name}!`,
  (name: string) => `Quick ${SPOKEN_NAME}, look! It's ${name}!`,
]

// Only fixed messages may bypass the pokemonName path — the route is public,
// so free-form text would let anyone burn the ElevenLabs quota.
const ALLOWED_MESSAGES = new Set(['Happy Birthday PJ!'])

// Fixed-window per-IP rate limit. In-memory (per warm instance) is fine at
// this scale — the goal is stopping quota-burn hammering, not perfect fairness.
const RATE_LIMIT = 30 // requests per window per IP
const RATE_WINDOW_MS = 60_000
const rateBuckets = new Map<string, { windowStart: number; count: number }>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  // Prune stale buckets so the map can't grow unbounded
  if (rateBuckets.size > 500) {
    rateBuckets.forEach((b, k) => {
      if (now - b.windowStart > RATE_WINDOW_MS) rateBuckets.delete(k)
    })
  }
  const bucket = rateBuckets.get(ip)
  if (!bucket || now - bucket.windowStart > RATE_WINDOW_MS) {
    rateBuckets.set(ip, { windowStart: now, count: 1 })
    return false
  }
  bucket.count += 1
  return bucket.count > RATE_LIMIT
}

// In-memory cache + in-flight dedupe. Texts are drawn from a small fixed set
// (names + 6 phrases), so repeats are common — especially nameOnly clips.
const audioCache = new Map<string, ArrayBuffer>()
const inflight = new Map<string, Promise<ArrayBuffer | null>>()
const CACHE_MAX = 80

function cachePut(key: string, buf: ArrayBuffer) {
  if (audioCache.size >= CACHE_MAX) {
    const oldest = audioCache.keys().next().value
    if (oldest !== undefined) audioCache.delete(oldest)
  }
  audioCache.set(key, buf)
}

async function generate(voiceId: string, text: string, apiKey: string): Promise<ArrayBuffer | null> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        // Flash is 3-5× faster than multilingual_v2 and plenty for short lines
        model_id: 'eleven_flash_v2_5',
      }),
      signal: AbortSignal.timeout(15000),
    }
  )
  if (!response.ok) {
    const errorText = await response.text()
    console.error('[tts] ElevenLabs error:', response.status, errorText.slice(0, 200))
    return null
  }
  return response.arrayBuffer()
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'
    if (rateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } },
      )
    }

    const { pokemonName, nameOnly, message } = await req.json()
    const customMessage = typeof message === 'string' ? message.trim() : ''

    if (customMessage && !ALLOWED_MESSAGES.has(customMessage)) {
      return NextResponse.json({ error: 'Unsupported message' }, { status: 400 })
    }
    // pokemonName must be an exact canonical PokeAPI name — this endpoint is
    // public and billable, so free-form text is rejected outright.
    const name = typeof pokemonName === 'string' ? pokemonName.trim().toLowerCase() : ''
    if (!customMessage && !POKEMON_NAMES.has(name)) {
      return NextResponse.json({ error: 'Unknown Pokemon name' }, { status: 400 })
    }

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      console.error('[tts] ELEVENLABS_API_KEY not set in environment')
      return NextResponse.json({ error: 'ELEVENLABS_API_KEY not configured' }, { status: 500 })
    }

    const voiceId = pickRandomVoice()
    let text: string
    if (customMessage) {
      text = customMessage
    } else {
      const displayName = name.charAt(0).toUpperCase() + name.slice(1)
      text = nameOnly
        ? displayName
        : PHRASES[Math.floor(Math.random() * PHRASES.length)](displayName)
    }

    const key = `${voiceId}:${text}`
    let audioBuffer = audioCache.get(key) ?? null

    if (!audioBuffer) {
      // Dedupe concurrent requests for the same text (free tier only allows
      // ~2 concurrent generations — rapid taps used to 429 here)
      let pending = inflight.get(key)
      if (!pending) {
        pending = generate(voiceId, text, apiKey).finally(() => inflight.delete(key))
        inflight.set(key, pending)
      }
      audioBuffer = await pending
      if (!audioBuffer) {
        return NextResponse.json({ error: 'TTS generation failed' }, { status: 502 })
      }
      cachePut(key, audioBuffer)
    }

    return new NextResponse(audioBuffer.slice(0), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[tts] caught error:', error)
    return NextResponse.json({ error: 'TTS request failed' }, { status: 500 })
  }
}
