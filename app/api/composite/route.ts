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
    const captionText = `PJ meets ${displayName}!`

    const layers: sharp.OverlayOptions[] = [
      { input: resizedPokemon, top: pokemonTop, left: pokemonLeft },
      { input: pjBuffer, top: pjTop, left: pjLeft },
    ]

    try {
      console.log('[composite] rendering text with Sharp/Pango fontfile:', FONT_PATH)
      // 31000 * 0.75 ≈ 23000 — another 25% smaller
      const FONT_SIZE = 23000
      const TEXT_W = CANVAS_WIDTH - 80
      const STROKE = 3
      const PAD = STROKE

      // Dark stroke text
      const darkBuf = await sharp({
        text: {
          text: `<span foreground="#111111" size="${FONT_SIZE}" weight="bold">${captionText}</span>`,
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
          text: `<span foreground="white" size="${FONT_SIZE}" weight="bold">${captionText}</span>`,
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
      const th = darkMeta.height ?? 50

      const canvasW = tw + PAD * 2
      const canvasH = th + PAD * 2

      // Build outlined text: dark at N/S/E/W offsets, white centred
      const outlinedBuf = await sharp({
        create: { width: canvasW, height: canvasH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
      })
        .composite([
          { input: darkBuf, left: PAD,   top: 0     },  // N
          { input: darkBuf, left: PAD,   top: PAD*2 },  // S
          { input: darkBuf, left: 0,     top: PAD   },  // W
          { input: darkBuf, left: PAD*2, top: PAD   },  // E
          { input: whiteBuf, left: PAD,  top: PAD   },  // white centre
        ])
        .png()
        .toBuffer()

      // True horizontal centre on canvas
      const captionLeft = Math.max(0, Math.floor((CANVAS_WIDTH - canvasW) / 2))
      const captionTop  = Math.max(0, CANVAS_HEIGHT - canvasH - 25)

      console.log('[composite] outlined text OK — canvas:', canvasW, 'x', canvasH, '| left:', captionLeft, '| top:', captionTop)
      layers.push({ input: outlinedBuf, top: captionTop, left: captionLeft })
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
