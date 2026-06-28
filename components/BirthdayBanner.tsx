'use client'

import { useBirthday } from '@/lib/useBirthday'

/**
 * Sticky festive banner shown the whole birthday week (June 23–30).
 * Sits directly below the nav bar (nav is h-12 / sticky top-0).
 */
export function BirthdayBanner() {
  const { ready, isWeek, isDay, daysUntil, age } = useBirthday()
  if (!ready || !isWeek) return null

  const message = isDay
    ? `🎂 PJ is ${age} today! Happy Birthday! 🎂`
    : `🎉 PJ turns ${age} in ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}! 🎉`

  return (
    <div
      className="sticky top-12 z-40 w-full text-white shadow-md"
      style={{
        background: 'linear-gradient(90deg,#ff6ec4,#7873f5,#42d392,#ffd84d,#ff6ec4)',
        backgroundSize: '300% 100%',
        animation: 'bday-shimmer 8s linear infinite',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <div className="max-w-5xl mx-auto px-4 py-1.5 flex items-center justify-center gap-2 text-sm sm:text-base font-bold">
        <span aria-hidden>🎈</span>
        <span style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.35)' }}>{message}</span>
        <span aria-hidden>🎈</span>
      </div>
    </div>
  )
}
