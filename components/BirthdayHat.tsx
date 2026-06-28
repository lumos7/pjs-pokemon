'use client'

import { useState } from 'react'
import { useBirthday } from '@/lib/useBirthday'

/**
 * Party hat overlaid on PJ's head on the homepage lineup during birthday week.
 * Must be rendered inside a `relative` container that wraps PJ's <img>.
 *
 * The hat PNG is a square 1024×1024 with the hat centred amid transparent
 * padding (visible hat ≈ 60% wide / 85% tall of the file), so the <img> box is
 * larger than the hat you see — these constants account for that. PJ's head
 * also sits slightly LEFT of his image centre, so the hat is nudged left.
 *
 * --- Adjustable constants (nudge these) ---
 *   HOMEPAGE_HAT_WIDTH       hat <img> width relative to PJ's container
 *   HOMEPAGE_HAT_TOP_OFFSET  vertical position (CSS top); more negative = higher
 *   HOMEPAGE_HAT_LEFT_OFFSET horizontal nudge from centre; negative = left
 */
const HOMEPAGE_HAT_WIDTH = '38%'
const HOMEPAGE_HAT_TOP_OFFSET = '-25%'
const HOMEPAGE_HAT_LEFT_OFFSET = '-3%'
const HOMEPAGE_HAT_TILT = '-10deg' // tip points up and away from his head

export function BirthdayHat() {
  const { ready, isWeek } = useBirthday()
  const [imgFailed, setImgFailed] = useState(false)
  if (!ready || !isWeek) return null

  const cls = 'pointer-events-none absolute z-10'
  const style: React.CSSProperties = {
    width: HOMEPAGE_HAT_WIDTH,
    left: `calc(50% + ${HOMEPAGE_HAT_LEFT_OFFSET})`,
    top: HOMEPAGE_HAT_TOP_OFFSET,
    transform: `translateX(-50%) rotate(${HOMEPAGE_HAT_TILT})`,
    transformOrigin: '50% 90%',
    filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.25))',
  }

  if (imgFailed) {
    // Emoji has no transparent padding, so it sits lower than the PNG.
    return (
      <span
        className={cls}
        style={{ ...style, top: '-8%', fontSize: '2rem', lineHeight: 1 }}
        aria-hidden
      >
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
