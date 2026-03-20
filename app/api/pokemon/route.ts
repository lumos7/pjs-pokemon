import { NextResponse } from 'next/server'
import { fetchFirst250 } from '@/lib/pokemon'

export async function GET() {
  try {
    const pokemon = await fetchFirst250()
    return NextResponse.json(pokemon)
  } catch (error) {
    console.error('Pokemon fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch Pokemon' }, { status: 500 })
  }
}
