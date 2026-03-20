import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import path from 'path'
import { getOfficialArtworkUrl } from '@/lib/pokemon'
import { scenes } from '@/lib/scenes'

const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 900
const POKEMON_SIZE = 380
const PJ_HEIGHT = 500

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

    // Caption — mixed case, Bangers, 40% smaller (31000 vs old 52000)
    const displayName = pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1)
    const captionText = `Aziah meets ${displayName}!`

    const layers: sharp.OverlayOptions[] = [
      { input: resizedPokemon, top: pokemonTop, left: pokemonLeft },
      { input: pjBuffer, top: pjTop, left: pjLeft },
    ]

    try {
      console.log('[composite] rendering text with Sharp/Pango fontfile:', FONT_PATH)
      const TEXT_W = CANVAS_WIDTH - 40  // 20px padding each side
      const STROKE = 3                   // outline offset in px
      const PAD = STROKE

      // Dark stroke text (rendered once, composited at 4 offsets)
      const darkBuf = await sharp({
        text: {
          text: `<span foreground="#111111" size="31000" weight="bold">${captionText}</span>`,
          fontfile: FONT_PATH,
          font: 'Bangers',
          width: TEXT_W,
          height: 80,
          align: 'centre',
          rgba: true,
        },
      }).png().toBuffer()

      // White text
      const whiteBuf = await sharp({
        text: {
          text: `<span foreground="white" size="31000" weight="bold">${captionText}</span>`,
          fontfile: FONT_PATH,
          font: 'Bangers',
          width: TEXT_W,
          height: 80,
          align: 'centre',
          rgba: true,
        },
      }).png().toBuffer()

      const darkMeta = await sharp(darkBuf).metadata()
      const tw = darkMeta.width ?? TEXT_W
      const th = darkMeta.height ?? 60

      // Canvas with room for the stroke offsets on all sides
      const canvasW = tw + PAD * 2
      const canvasH = th + PAD * 2

      // Build outlined text: dark at N/S/E/W offsets, white centered
      const outlinedBuf = await sharp({
        create: { width: canvasW, height: canvasH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
      })
        .composite([
          { input: darkBuf, left: PAD,        top: 0    },   // N
          { input: darkBuf, left: PAD,        top: PAD*2 },  // S
          { input: darkBuf, left: 0,          top: PAD   },  // W
          { input: darkBuf, left: PAD*2,      top: PAD   },  // E
          { input: whiteBuf, left: PAD,       top: PAD   },  // white centre
        ])
        .png()
        .toBuffer()

      // Position: bottom of image with 25px comfortable padding
      const captionTop = CANVAS_HEIGHT - canvasH - 25
      // Center horizontally (TEXT_W starts at left=20, PAD shifts it back)
      const captionLeft = 20 - PAD

      console.log('[composite] outlined text OK — canvas:', canvasW, 'x', canvasH, '| top:', captionTop)
      layers.push({ input: outlinedBuf, top: Math.max(0, captionTop), left: Math.max(0, captionLeft) })
    } catch (e) {
      console.error('[composite] text rendering failed, skipping caption:', (e as Error).message)
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
