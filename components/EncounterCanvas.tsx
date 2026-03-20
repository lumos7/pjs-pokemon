'use client'

interface EncounterCanvasProps {
  imageUrl: string | null
  pokemonName: string | null
  isLoading: boolean
}

export function EncounterCanvas({ imageUrl, pokemonName, isLoading }: EncounterCanvasProps) {
  const handleDownload = () => {
    if (!imageUrl || !pokemonName) return
    const a = document.createElement('a')
    a.href = imageUrl
    a.download = `aziah-meets-${pokemonName.toLowerCase()}.png`
    a.click()
  }

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
        <button
          onClick={handleDownload}
          className="bg-[#3B4CCA] text-white font-bold text-lg rounded-full px-8 py-4 min-h-[56px] mt-4 hover:bg-blue-700 transition-colors shadow-lg"
        >
          Download Image
        </button>
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
