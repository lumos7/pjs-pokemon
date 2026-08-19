'use client'

import { useEffect, useRef, useState } from 'react'
import { GENERATIONS } from '@/lib/pokemon'

interface GenFilterProps {
  selectedGens: number[]
  onChange: (ids: number[]) => void
}

export function GenFilter({ selectedGens, onChange }: GenFilterProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const allSelected = selectedGens.length === GENERATIONS.length

  // Close when tapping anywhere outside the dropdown
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const toggle = (id: number) => {
    const next = selectedGens.includes(id)
      ? selectedGens.filter(g => g !== id)
      : [...selectedGens, id]
    if (next.length > 0) onChange(next)
  }

  const toggleAll = () => {
    onChange(allSelected ? [1] : GENERATIONS.map(g => g.id))
  }

  const label = allSelected
    ? 'All Gens'
    : selectedGens.length === 1
      ? GENERATIONS.find(g => g.id === selectedGens[0])?.label ?? 'Gen ?'
      : `${selectedGens.length} Gens`

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors min-h-[44px] whitespace-nowrap"
      >
        {label}
        <span className="text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute top-full mt-1 right-0 z-50 bg-white border border-amber-200 rounded-xl shadow-xl p-3 min-w-[200px]">
          <label className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-amber-50 rounded-lg mb-1 border-b border-amber-100 pb-2">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="accent-[#CC0000] w-5 h-5"
            />
            <span className="text-sm font-bold text-gray-800">Select All</span>
          </label>
          {GENERATIONS.map(gen => (
            <label key={gen.id} className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-amber-50 rounded-lg">
              <input
                type="checkbox"
                checked={selectedGens.includes(gen.id)}
                onChange={() => toggle(gen.id)}
                className="accent-[#CC0000] w-5 h-5"
              />
              <span className="text-sm text-gray-700">{gen.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
