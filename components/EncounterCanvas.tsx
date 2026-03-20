'use client'

interface EncounterCanvasProps {
  imageUrl: string | null
  pokemonName: string | null
  isLoading: boolean
  onSpeakName?: () => void
}

export function EncounterCanvas({ imageUrl, pokemonName, isLoading, onSpeakName }: EncounterCanvasProps) {
  const handleDownload = () => {
    if (!imageUrl || !pokemonName) return
    const a = document.createElement('a')
    a.href = imageUrl
    a.download = `aziah-meets-${pokemonName.toLowerCase()}.png`
    a.click()
  }

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl mb-3 animate-bounce">🎮</div>
        <p className="text-xl font-bold text-gray-700">Creating your adventure...</p>
      </div>
    )
  }

  if (imageUrl) {
    return (
      <div className="flex flex-col items-center gap-4">
        <img
          src={imageUrl}
          alt={`Aziah meets ${pokemonName}`}
          className="rounded-2xl shadow-2xl max-w-full"
        />
        <div className="flex flex-wrap gap-3 justify-center">
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
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-amber-200 rounded-2xl">
      <div className="text-4xl mb-3">🌟</div>
      <p className="text-lg text-gray-600 font-medium">
        Choose a scene and Pokemon above!
      </p>
    </div>
  )
}
