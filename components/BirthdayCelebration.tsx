'use client'

import { useEffect, useRef, useState } from 'react'
import { useBirthday } from '@/lib/useBirthday'
import { Confetti } from './Confetti'

const SESSION_FLAG = 'pj-birthday-celebrated'

/** Speak "Happy Birthday PJ!" via a random ElevenLabs voice. Best-effort. */
async function speakHappyBirthday() {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Happy Birthday PJ!' }),
    })
    if (!res.ok) return
    const blob = await res.blob()
    const audio = new Audio(URL.createObjectURL(blob))
    audio.volume = 0.95
    audio.play().catch(() => {})
  } catch {
    /* celebration is best-effort — never throw */
  }
}

/**
 * Birthday-day-only celebration (June 30):
 *   - Confetti fires once on load (visual, no autoplay restriction).
 *   - On first user gesture: birthday jingle plays once per session,
 *     then a TTS "Happy Birthday PJ!" follows. Both degrade gracefully
 *     if their asset is missing.
 */
export function BirthdayCelebration() {
  const { ready, isDay } = useBirthday()
  const [showConfetti, setShowConfetti] = useState(false)
  const started = useRef(false)

  // Confetti — fires immediately on load for the day.
  useEffect(() => {
    if (ready && isDay) setShowConfetti(true)
  }, [ready, isDay])

  // Jingle + TTS — require a user gesture (browser autoplay policy), once/session.
  useEffect(() => {
    if (!ready || !isDay || typeof window === 'undefined') return
    if (sessionStorage.getItem(SESSION_FLAG)) return

    const cleanup = () => {
      document.removeEventListener('pointerdown', celebrate)
      document.removeEventListener('touchstart', celebrate)
      document.removeEventListener('keydown', celebrate)
    }

    function celebrate() {
      if (started.current || sessionStorage.getItem(SESSION_FLAG)) {
        cleanup()
        return
      }
      started.current = true
      sessionStorage.setItem(SESSION_FLAG, '1')
      cleanup()

      const jingle = new Audio('/music/birthday-song.mp3')
      jingle.volume = 0.7
      jingle.addEventListener('ended', () => { void speakHappyBirthday() }, { once: true })
      jingle.addEventListener('error', () => { void speakHappyBirthday() }, { once: true })
      jingle.play().catch(() => { void speakHappyBirthday() })
    }

    document.addEventListener('pointerdown', celebrate)
    document.addEventListener('touchstart', celebrate)
    document.addEventListener('keydown', celebrate)
    return cleanup
  }, [ready, isDay])

  if (!showConfetti) return null
  return <Confetti />
}
