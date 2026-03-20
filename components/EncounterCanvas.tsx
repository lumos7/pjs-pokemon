'use client'

import { useEffect } from 'react'

interface EncounterCanvasProps {
  imageUrl: string | null
  pokemonName: string | null
  isLoading: boolean
  onSpeakName?: () => void
  onClose?: () => void
}

export function EncounterCanvas({ imageUrl, pokemonName, isLoading, onSpeakName, onClose }: EncounterCanvasProps) {
  const handleDownload = () => {
    if (!imageUrl || !pokemonName) return
    const a = document.createElement('a')
    a.href = imageUrl
    a.download = `aziah-meets-${pokemonName.toLowerCase()}.png`
    a.click()
  }

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

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
            alt={`Aziah meets ${pokemonName}`}
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
