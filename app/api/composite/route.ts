import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import path from 'path'
import { getOfficialArtworkUrl } from '@/lib/pokemon'
import { scenes } from '@/lib/scenes'

const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 900
const POKEMON_SIZE = 380
const PJ_HEIGHT = 500
const CAPTION_H = 100

const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', 'Bangers-Regular.ttf')

export async function POST(req: NextRequest) {
  try {
    const { sceneId, pokemonId, pokemonName } = await req.json()

    const scene = scenes.find(s => s.id === sceneId)
    if (!scene) return NextResponse.json({ error: 'Invalid scene' }, { status: 400 })
    if (!pokemonId || !pokemonName) return NextResponse.json({ error: 'Missing pokemon data' }, { status: 400 })

    // Load scene background
    const scenePath = path.join(process.cwd(), 'public', 'images', scene.file)
    const baseImage = sharp(scenePath).resize(CANVAS_WIDTH, CANVAS_HEIGHT)

    // Fetch Pokemon sprite
    const artworkUrl = getOfficialArtworkUrl(pokemonId)
    const pokemonRes = await fetch(artworkUrl)
    if (!pokemonRes.ok) throw new Error(`Failed to fetch Pokemon artwork: ${pokemonRes.status}`)
    const pokemonBuffer = Buffer.from(await pokemonRes.arrayBuffer())
    const resizedPokemon = await sharp(pokemonBuffer)
      .resize(POKEMON_SIZE, POKEMON_SIZE, { fit: 'inside' })
      .toBuffer()

    // Pokemon placement: random position in right 60% of canvas
    const leftMin = Math.floor(CANVAS_WIDTH * 0.4)
    const leftMax = CANVAS_WIDTH - POKEMON_SIZE
    const pokemonLeft = leftMin + Math.floor(Math.random() * (leftMax - leftMin))
    const topCenter = Math.floor((CANVAS_HEIGHT - POKEMON_SIZE) / 2)
    const vertOffset = Math.floor((Math.random() - 0.5) * 200)
    const pokemonTop = Math.max(0, Math.min(topCenter + vertOffset, CANVAS_HEIGHT - POKEMON_SIZE))

    // Load PJ character
    const pjPath = path.join(process.cwd(), 'public', 'images', 'PokeMaster PJ.png')
    const pjBuffer = await sharp(pjPath)
      .resize({ height: PJ_HEIGHT, fit: 'inside' })
      .toBuffer()
    const pjMeta = await sharp(pjBuffer).metadata()
    const pjLeft = 20
    const pjTop = CANVAS_HEIGHT - (pjMeta.height || PJ_HEIGHT)

    // Caption text
    const displayName = pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1)
    const captionText = `Aziah meets ${displayName}!`
    const captionY = CANVAS_HEIGHT - CAPTION_H - 10

    // Semi-transparent dark bar behind text
    const barBuf = await sharp({
      create: {
        width: CANVAS_WIDTH,
        height: CAPTION_H,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 170 },
      },
    }).png().toBuffer()

    // Sharp native text rendering via Pango — uses bundled font file directly
    let textBuf: Buffer | null = null
    try {
      console.log('[composite] using Sharp text rendering with fontfile:', FONT_PATH)
      textBuf = await sharp({
        text: {
          text: `<span foreground="white" size="52000" weight="bold">${captionText}</span>`,
          fontfile: FONT_PATH,
          font: 'Bangers',
          width: CANVAS_WIDTH - 40,
          height: CAPTION_H,
          align: 'centre',
          rgba: true,
        },
      }).png().toBuffer()
      console.log('[composite] sharp text OK, buffer size:', textBuf.length)
    } catch (e) {
      console.error('[composite] sharp text failed, no text overlay:', (e as Error).message)
    }

    // Composite all layers
    const layers: sharp.OverlayOptions[] = [
      { input: resizedPokemon, top: pokemonTop, left: pokemonLeft },
      { input: pjBuffer, top: pjTop, left: pjLeft },
      { input: barBuf, top: captionY, left: 0 },
    ]
    if (textBuf) {
      layers.push({ input: textBuf, top: captionY + 10, left: 20 })
    }

    const compositeImage = await baseImage.composite(layers).png().toBuffer()

    return new NextResponse(compositeImage as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Composite error:', error)
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })
  }
}
