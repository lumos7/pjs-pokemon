'use client'

import { useBirthday } from '@/lib/useBirthday'

// Subtle corner accents — kept clear of the bottom music bar (fixed bottom-0).
const DECOR = [
  { emoji: '🎈', position: 'top-20 left-2 sm:left-6',      delay: '0s'   },
  { emoji: '🎊', position: 'top-24 right-2 sm:right-6',    delay: '1.2s' },
  { emoji: '🎈', position: 'bottom-28 left-2 sm:left-6',   delay: '0.6s' },
  { emoji: '🎉', position: 'bottom-32 right-2 sm:right-6', delay: '1.8s' },
]

/** Gentle floating balloon/confetti emoji in page corners during birthday week. */
export function BirthdayDecor() {
  const { ready, isWeek } = useBirthday()
  if (!ready || !isWeek) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-30 select-none overflow-hidden" aria-hidden>
      {DECOR.map((d, i) => (
        <span
          key={i}
          className={`absolute text-3xl sm:text-4xl opacity-50 ${d.position}`}
          style={{ animation: 'bday-float 4s ease-in-out infinite', animationDelay: d.delay }}
        >
          {d.emoji}
        </span>
      ))}
    </div>
  )
}
