'use client'

import { useRef, useState } from 'react'
import { queueStore } from '@/lib/queue'

interface AddToQueueButtonProps {
  id: number
  name: string
  label?: string
  className?: string
}

/**
 * Adds a Pokémon to the "Next Up" queue without navigating. Briefly flashes
 * "Added ✓" for child-friendly feedback. Stops event propagation so it works
 * inside clickable cards/rows.
 */
export function AddToQueueButton({ id, name, label = '+ Queue', className = '' }: AddToQueueButtonProps) {
  const [added, setAdded] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    queueStore.add(id, name)
    setAdded(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setAdded(false), 1200)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Add ${name} to queue`}
      className={
        className ||
        `rounded-full px-3 py-1 text-xs font-bold transition-colors whitespace-nowrap ${
          added ? 'bg-green-500 text-white' : 'bg-amber-100 text-gray-800 hover:bg-amber-200'
        }`
      }
    >
      {added ? '✓ Added' : label}
    </button>
  )
}
