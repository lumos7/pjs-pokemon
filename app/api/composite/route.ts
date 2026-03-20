import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import { getOfficialArtworkUrl } from '@/lib/pokemon'
import { scenes } from '@/lib/scenes'

const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 900
const POKEMON_SIZE = 380
const PJ_HEIGHT = 500

// Load font once at module scope (cold start), base64-encode for SVG embedding
let fontBase64: string | null = null
function getFontBase64(): string {
  if (fontBase64) return fontBase64
  const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Bangers-Regular.ttf')
  fontBase64 = fs.readFileSync(fontPath).toString('base64')
  return fontBase64
}

export async function POST(req: NextRequest) {
  try {
    const { sceneId, pokemonId, pokemonName } = await req.json()

    const scene = scenes.find(s => s.id === sceneId)
    if (!scene) {
      return NextResponse.json({ error: 'Invalid scene' }, { status: 400 })
    }
    if (!pokemonId || !pokemonName) {
      return NextResponse.json({ error: 'Missing pokemon data' }, { status: 400 })
    }

    // Load scene background
    const scenePath = path.join(process.cwd(), 'public', 'images', scene.file)
    const baseImage = sharp(scenePath).resize(CANVAS_WIDTH, CANVAS_HEIGHT)

    // Fetch Pokemon sprite from GitHub CDN
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

    // Build SVG caption with embedded Bangers font (base64) — works on Vercel serverless
    const displayName = pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1)
    const captionText = `Aziah meets ${displayName}!`
    const cx = CANVAS_WIDTH / 2
    const SVG_H = 110
    const fontB64 = getFontBase64()

    const svgStr = `<svg width="${CANVAS_WIDTH}" height="${SVG_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @font-face {
        font-family: 'Bangers';
        src: url('data:font/truetype;base64,${fontB64}') format('truetype');
      }
    </style>
  </defs>
  <text x="${cx + 3}" y="84" font-family="Bangers,Arial,sans-serif" font-size="72" fill="rgba(0,0,0,0.85)" text-anchor="middle" letter-spacing="2">${captionText}</text>
  <text x="${cx}" y="80" font-family="Bangers,Arial,sans-serif" font-size="72" fill="white" stroke="#111111" stroke-width="5" paint-order="stroke fill" text-anchor="middle" letter-spacing="2">${captionText}</text>
</svg>`

    const svgCaption = Buffer.from(svgStr)

    // Composite all layers — SVG last so it renders on top
    const compositeImage = await baseImage
      .composite([
        { input: resizedPokemon, top: pokemonTop, left: pokemonLeft },
        { input: pjBuffer, top: pjTop, left: pjLeft },
        { input: svgCaption, top: CANVAS_HEIGHT - SVG_H - 10, left: 0 },
      ])
      .png()
      .toBuffer()

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
