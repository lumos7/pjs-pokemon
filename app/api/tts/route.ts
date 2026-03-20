import { NextRequest, NextResponse } from 'next/server'
import { pickRandomVoice } from '@/lib/voices'

export async function POST(req: NextRequest) {
  try {
    const { pokemonName } = await req.json()
    if (!pokemonName) {
      return NextResponse.json({ error: 'Missing pokemonName' }, { status: 400 })
    }

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ELEVENLABS_API_KEY not configured' }, { status: 500 })
    }

    const voiceId = pickRandomVoice()
    const displayName = pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1)
    const text = `Aziah meets ${displayName}!`

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

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs error:', response.status, errorText)
      return NextResponse.json({ error: 'TTS generation failed' }, { status: 502 })
    }

    const audioBuffer = await response.arrayBuffer()
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('TTS error:', error)
    return NextResponse.json({ error: 'TTS request failed' }, { status: 500 })
  }
}
