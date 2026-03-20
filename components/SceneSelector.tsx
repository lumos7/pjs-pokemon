'use client'

import { scenes } from '@/lib/scenes'

interface SceneSelectorProps {
  selected: string | null
  onSelect: (sceneId: string) => void
}

export function SceneSelector({ selected, onSelect }: SceneSelectorProps) {
  console.log('[SceneSelector] render, selected:', selected)
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {scenes.map((scene) => (
        <button
          type="button"
          key={scene.id}
          onClick={() => { console.log('[SceneSelector] clicked:', scene.id); onSelect(scene.id) }}
          className={`relative rounded-xl overflow-hidden cursor-pointer border-4 transition-all min-h-[80px] ${
            selected === scene.id
              ? 'border-[#FFCB05] scale-105'
              : 'border-transparent hover:border-amber-300'
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
