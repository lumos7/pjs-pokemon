import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import { getOfficialArtworkUrl } from '@/lib/pokemon'
import { scenes } from '@/lib/scenes'
import { isBirthdayWeek } from '@/lib/birthday'

const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 900
const POKEMON_SIZE = 380
const PJ_HEIGHT = 500

const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', 'Bangers-Regular.ttf')

// --- Birthday hat (composited onto PJ during birthday week only) ---
// These are deliberately easy to nudge after seeing the first render: PJ's head
// position within his image is fixed, so the exact vertical/horizontal offsets
// are eyeball-tuned against the console log emitted below.
const HAT_PATH = path.join(process.cwd(), 'public', 'images', 'birthday-hat.png')
const HAT_WIDTH_RATIO = 0.45       // hat width as a fraction of PJ's rendered width
const HAT_VERTICAL_OFFSET = 0.12   // hat BOTTOM edge sits this far down from PJ's image top (fraction of PJ height)
const HAT_HORIZONTAL_OFFSET = -38  // px nudge; PJ's head sits left of his image centre
const HAT_TILT_DEGREES = 10        // playful tilt

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 }

// Sharp cold start + artwork download + 4 Pango renders can brush past the
// default limit — give the function headroom.
export const maxDuration = 30

// Warm-invocation memos: the PJ character never changes, and queue playback
// hits this route repeatedly — skip re-reading/resizing identical inputs.
let pjMemo: { buffer: Buffer; width: number; height: number } | null = null
const artworkMemo = new Map<number, Buffer>() // resized artwork by pokemon id
const ARTWORK_MEMO_MAX = 30

function escapePango(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const sceneId = body.sceneId
    const pokemonId = Number.parseInt(String(body.pokemonId), 10)
    const pokemonName = typeof body.pokemonName === 'string' ? body.pokemonName.trim().slice(0, 40) : ''

    const scene = scenes.find(s => s.id === sceneId)
    if (!scene) return NextResponse.json({ error: 'Invalid scene' }, { status: 400 })
    if (!Number.isInteger(pokemonId) || pokemonId < 1 || pokemonId > 1025 || !pokemonName) {
      return NextResponse.json({ error: 'Missing pokemon data' }, { status: 400 })
    }

    // Load scene background
    const scenePath = path.join(process.cwd(), 'public', 'images', scene.file)
    const baseImage = sharp(scenePath).resize(CANVAS_WIDTH, CANVAS_HEIGHT)

    // Fetch Pokemon artwork (memoised per id)
    let resizedPokemon = artworkMemo.get(pokemonId)
    if (!resizedPokemon) {
      const artworkUrl = getOfficialArtworkUrl(pokemonId)
      const pokemonRes = await fetch(artworkUrl, { signal: AbortSignal.timeout(8000) })
      if (!pokemonRes.ok) throw new Error(`Failed to fetch Pokemon artwork: ${pokemonRes.status}`)
      const pokemonBuffer = Buffer.from(await pokemonRes.arrayBuffer())
      resizedPokemon = await sharp(pokemonBuffer)
        .resize(POKEMON_SIZE, POKEMON_SIZE, { fit: 'inside' })
        .toBuffer()
      if (artworkMemo.size >= ARTWORK_MEMO_MAX) {
        const oldest = artworkMemo.keys().next().value
        if (oldest !== undefined) artworkMemo.delete(oldest)
      }
      artworkMemo.set(pokemonId, resizedPokemon)
    }

    // Pokemon placement: random position in right 60% of canvas
    const leftMin = Math.floor(CANVAS_WIDTH * 0.4)
    const leftMax = CANVAS_WIDTH - POKEMON_SIZE
    const pokemonLeft = leftMin + Math.floor(Math.random() * (leftMax - leftMin))
    const topCenter = Math.floor((CANVAS_HEIGHT - POKEMON_SIZE) / 2)
    const vertOffset = Math.floor((Math.random() - 0.5) * 200)
    const pokemonTop = Math.max(0, Math.min(topCenter + vertOffset, CANVAS_HEIGHT - POKEMON_SIZE))

    // Load PJ character (memoised — identical on every request)
    if (!pjMemo) {
      const pjPath = path.join(process.cwd(), 'public', 'images', 'PokeMaster PJ.png')
      const buffer = await sharp(pjPath)
        .resize({ height: PJ_HEIGHT, fit: 'inside' })
        .toBuffer()
      const meta = await sharp(buffer).metadata()
      pjMemo = {
        buffer,
        width: meta.width || Math.round(PJ_HEIGHT * (1024 / 1536)),
        height: meta.height || PJ_HEIGHT,
      }
    }
    const pjBuffer = pjMemo.buffer
    const pjMeta = pjMemo
    const pjLeft = 20
    const pjTop = CANVAS_HEIGHT - pjMeta.height

    // Caption — mixed case, Bangers (escaped: the name lands inside Pango markup)
    const displayName = pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1)
    const captionText = escapePango(`PJ meets ${displayName}!`)

    const layers: sharp.OverlayOptions[] = [
      { input: resizedPokemon, top: pokemonTop, left: pokemonLeft },
      { input: pjBuffer, top: pjTop, left: pjLeft },
    ]

    // Birthday hat — composite a party hat onto PJ's head during birthday week.
    // The supplied PNG is a hat centred in a square canvas with lots of
    // transparent padding, so we .trim() it down to the hat shape first.
    if (isBirthdayWeek() && fs.existsSync(HAT_PATH)) {
      try {
        const pjWidth = pjMeta.width || Math.round(PJ_HEIGHT * (1024 / 1536))
        const pjHeight = pjMeta.height || PJ_HEIGHT
        const hatTargetWidth = Math.round(pjWidth * HAT_WIDTH_RATIO)

        // 1) trim transparent padding so the bounds hug the hat, 2) resize to target width
        const trimmedHat = await sharp(HAT_PATH)
          .trim()
          .resize({ width: hatTargetWidth })
          .png()
          .toBuffer()

        // 3) tilt slightly with a transparent background (separate pipeline → predictable order)
        const rotatedHat = await sharp(trimmedHat)
          .rotate(HAT_TILT_DEGREES, { background: TRANSPARENT })
          .png()
          .toBuffer()

        const hatMeta = await sharp(rotatedHat).metadata()
        const hatW = hatMeta.width || hatTargetWidth
        const hatH = hatMeta.height || hatTargetWidth

        // Centre over PJ's head; bottom edge of hat overlaps the top of his head
        const pjCenterX = pjLeft + pjWidth / 2 + HAT_HORIZONTAL_OFFSET
        const hatLeft = Math.max(0, Math.round(pjCenterX - hatW / 2))
        const hatBottomY = pjTop + Math.round(pjHeight * HAT_VERTICAL_OFFSET)
        const hatTop = Math.max(0, Math.round(hatBottomY - hatH))

        console.log(
          '[composite] birthday hat | pjWidth:', pjWidth, '| pjHeight:', pjHeight,
          '| pjLeft:', pjLeft, '| pjTop:', pjTop,
          '| hat:', `${hatW}x${hatH}`, '| left:', hatLeft, '| top:', hatTop,
          '| consts {', `width:${HAT_WIDTH_RATIO}, vOffset:${HAT_VERTICAL_OFFSET}, hOffset:${HAT_HORIZONTAL_OFFSET}, tilt:${HAT_TILT_DEGREES}`, '}'
        )

        layers.push({ input: rotatedHat, top: hatTop, left: hatLeft })
      } catch (e) {
        console.error('[composite] birthday hat skipped:', (e as Error).message)
      }
    }

    try {
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
