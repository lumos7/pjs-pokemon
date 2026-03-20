'use client'

import { scenes } from '@/lib/scenes'

interface SceneSelectorProps {
  selected: string | null
  onSelect: (sceneId: string) => void
}

export function SceneSelector({ selected, onSelect }: SceneSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {scenes.map((scene) => (
        <button
          key={scene.id}
          onClick={() => onSelect(scene.id)}
          className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all min-h-[80px] ${
            selected === scene.id
              ? 'border-[#FFCB05] ring-4 ring-[#FFCB05] scale-105'
              : 'border-amber-200 hover:border-amber-400'
          }`}
        >
          <img
            src={scene.thumbnail}
            alt={scene.name}
            className="w-full aspect-video object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs font-bold py-1 text-center">
            {scene.name}
          </div>
        </button>
      ))}
    </div>
  )
}
