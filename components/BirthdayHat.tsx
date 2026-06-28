'use client'

import { useState } from 'react'
import { useBirthday } from '@/lib/useBirthday'

/**
 * Party hat overlaid on PJ's head on the homepage lineup during birthday week.
 * Must be rendered inside a `relative` container that wraps PJ's <img>.
 *
 * PJ's head sits slightly LEFT of his image's horizontal centre, so the hat is
 * nudged left of centre. These values are intentionally easy to eyeball-tweak.
 * Falls back to a 🎉 emoji if the PNG is missing.
 */
export function BirthdayHat() {
  const { ready, isWeek } = useBirthday()
  const [imgFailed, setImgFailed] = useState(false)
  if (!ready || !isWeek) return null

  const style: React.CSSProperties = {
    width: '46%',
    left: '50%',
    top: '-10%',
    transform: 'translateX(-66%) rotate(-12deg)',
    transformOrigin: 'bottom center',
    filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.25))',
  }
  const cls = 'pointer-events-none absolute z-10'

  if (imgFailed) {
    return (
      <span className={cls} style={{ ...style, fontSize: '2.5rem', lineHeight: 1 }} aria-hidden>
        🎉
      </span>
    )
  }

  return (
    <img
      src="/images/birthday-hat.png"
      alt=""
      aria-hidden
      className={cls}
      style={style}
      onError={() => setImgFailed(true)}
    />
  )
}
