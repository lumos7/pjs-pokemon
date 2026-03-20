import { NextRequest, NextResponse } from 'next/server'
import { pickRandomVoice } from '@/lib/voices'

const PHRASES = [
  (name: string) => `Look Aziah, this is ${name}!`,
  (name: string) => `Hey Aziah, meet ${name}!`,
  (name: string) => `Wow Aziah, it's ${name}!`,
  (name: string) => `Oh my days Aziah, it's ${name}!`,
  (name: string) => `Aziah, no way! It's ${name}!`,
  (name: string) => `Quick Aziah, look! It's ${name}!`,
]

export async function POST(req: NextRequest) {
  try {
    const { pokemonName } = await req.json()
    if (!pokemonName) {
      return NextResponse.json({ error: 'Missing pokemonName' }, { status: 400 })
    }

    const apiKey = process.env.ELEVENLABS_API_KEY
    console.log('[tts] API key present:', !!apiKey, '| pokemon:', pokemonName)
    if (!apiKey) {
      console.error('[tts] ELEVENLABS_API_KEY not set in environment')
      return NextResponse.json({ error: 'ELEVENLABS_API_KEY not configured' }, { status: 500 })
    }

    const voiceId = pickRandomVoice()
    const displayName = pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1)
    const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)]
    const text = phrase(displayName)
    console.log('[tts] voice:', voiceId, '| text:', text)

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
          model_id: 'eleven_multilingual_v2',
        }),
      }
    )

    console.log('[tts] ElevenLabs response status:', response.status)
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[tts] ElevenLabs error body:', errorText)
      return NextResponse.json({ error: 'TTS generation failed' }, { status: 502 })
    }

    const audioBuffer = await response.arrayBuffer()
    console.log('[tts] audio bytes:', audioBuffer.byteLength)
    return new NextResponse(audioBuffer, {
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
