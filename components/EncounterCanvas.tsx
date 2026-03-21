'use client'

import { useEffect, useState } from 'react'
import { getOfficialArtworkUrl } from '@/lib/pokemon'

interface EncounterCanvasProps {
  imageUrl: string | null
  pokemonName: string | null
  pokemonId: number | null
  isLoading: boolean
  onSpeakName?: () => void
  onClose?: () => void
}

const AZIAH_HEIGHT_M = 1.0
const MAX_BAR_HEIGHT = 160 // px max for the taller one

interface SizeData {
  pokemonHeightM: number
  caption: string
}

export function EncounterCanvas({ imageUrl, pokemonName, pokemonId, isLoading, onSpeakName, onClose }: EncounterCanvasProps) {
  const [sizeData, setSizeData] = useState<SizeData | null>(null)

  const handleDownload = () => {
    if (!imageUrl || !pokemonName) return
    const a = document.createElement('a')
    a.href = imageUrl
    a.download = `pj-meets-${pokemonName.toLowerCase()}.png`
    a.click()
  }

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  // Fetch pokemon height for size comparison
  useEffect(() => {
    if (!pokemonId || !pokemonName || !imageUrl) {
      setSizeData(null)
      return
    }
    let cancelled = false
    fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        const heightM = data.height / 10 // API returns decimetres
        const name = capitalize(pokemonName!)
        const ratio = heightM / AZIAH_HEIGHT_M
        let caption: string
        if (ratio > 2) caption = `Whoa, ${name} is huge!`
        else if (ratio >= 0.5) caption = `${name} is about PJ's size!`
        else caption = `${name} is tiny!`
        setSizeData({ pokemonHeightM: heightM, caption })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [pokemonId, pokemonName, imageUrl])

  // Close on Escape key
  useEffect(() => {
    if (!imageUrl) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [imageUrl, onClose])

  // Loading spinner — shown inline while generating
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl mb-3 animate-bounce">🎮</div>
        <p className="text-xl font-bold text-gray-700">Creating your adventure...</p>
      </div>
    )
  }

  // Modal overlay — shown when image is ready
  if (imageUrl) {
    // Size comparison scaling
    let aziahPx = MAX_BAR_HEIGHT
    let pokemonPx = MAX_BAR_HEIGHT
    if (sizeData) {
      const maxHeight = Math.max(AZIAH_HEIGHT_M, sizeData.pokemonHeightM)
      aziahPx = (AZIAH_HEIGHT_M / maxHeight) * MAX_BAR_HEIGHT
      pokemonPx = (sizeData.pokemonHeightM / maxHeight) * MAX_BAR_HEIGHT
    }

    return (
      <div
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}
      >
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col items-center gap-4 p-4 sm:p-6 max-h-[90dvh] overflow-y-auto">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold transition-colors"
          >
            ×
          </button>

          <img
            src={imageUrl}
            alt={`PJ meets ${pokemonName}`}
            className="rounded-2xl shadow-lg max-w-full w-full"
          />

          <div className="flex flex-wrap gap-3 justify-center pb-1">
            {onSpeakName && pokemonName && (
              <button
                type="button"
                onClick={onSpeakName}
                className="bg-[#FFCB05] text-gray-900 font-bold text-lg rounded-full px-6 py-4 min-h-[56px] hover:bg-yellow-400 transition-colors shadow-lg"
              >
                🔊 {capitalize(pokemonName)}
              </button>
            )}
            <button
              type="button"
              onClick={handleDownload}
              className="bg-[#3B4CCA] text-white font-bold text-lg rounded-full px-8 py-4 min-h-[56px] hover:bg-blue-700 transition-colors shadow-lg"
            >
              Download Image
            </button>
          </div>

          {/* Size comparison */}
          {sizeData && pokemonId && pokemonName && (
            <div className="w-full bg-amber-50 rounded-2xl border border-amber-100 p-4">
              <div className="flex items-end justify-center gap-8">
                {/* PJ */}
                <div className="flex flex-col items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/PokeMaster PJ.png"
                    alt="PJ"
                    style={{ height: `${aziahPx}px` }}
                    className="object-contain"
                  />
                  <span className="text-xs font-bold text-gray-700 mt-1">PJ: {AZIAH_HEIGHT_M}m</span>
                </div>
                {/* Pokemon */}
                <div className="flex flex-col items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getOfficialArtworkUrl(pokemonId)}
                    alt={capitalize(pokemonName)}
                    style={{ height: `${pokemonPx}px` }}
                    className="object-contain"
                  />
                  <span className="text-xs font-bold text-gray-700 mt-1">{capitalize(pokemonName)}: {sizeData.pokemonHeightM}m</span>
                </div>
              </div>
              <p className="text-center text-sm font-bold text-gray-600 mt-2">{sizeData.caption}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Empty state
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-amber-200 rounded-2xl">
      <div className="text-4xl mb-3">🌟</div>
      <p className="text-lg text-gray-600 font-medium">
        Choose a scene and Pokemon above!
      </p>
    </div>
  )
}
