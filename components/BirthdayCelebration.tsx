'use client'

import { useEffect, useRef, useState } from 'react'
import { useBirthday } from '@/lib/useBirthday'
import { Confetti } from './Confetti'
import { playClip } from '@/lib/encounterAudio'

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
    playClip(URL.createObjectURL(blob), 0.95, { revokeUrl: true })
  } catch {
    /* celebration is best-effort — never throw */
  }
}

/**
 * Birthday celebration:
 *   - Jingle (/music/birthday-song.mp3) plays once per session on the first
 *     user gesture ANY day of birthday week (June 23–30).
 *   - June 30 ONLY: confetti fires on load, and the jingle is followed by a
 *     TTS "Happy Birthday PJ!". Both degrade gracefully if their asset/key
 *     is missing.
 */
export function BirthdayCelebration() {
  const { ready, isWeek, isDay } = useBirthday()
  const [showConfetti, setShowConfetti] = useState(false)
  const started = useRef(false)

  // Confetti — June 30 only, fires immediately on load.
  useEffect(() => {
    if (ready && isDay) setShowConfetti(true)
  }, [ready, isDay])

  // Jingle — whole birthday week; requires a user gesture (autoplay policy), once/session.
  // TTS "Happy Birthday PJ!" only follows on the birthday itself.
  useEffect(() => {
    if (!ready || !isWeek || typeof window === 'undefined') return
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

      const jingle = playClip('/music/birthday-song.mp3', 0.7)
      void jingle.done.then(() => { if (isDay) void speakHappyBirthday() })
    }

    document.addEventListener('pointerdown', celebrate)
    document.addEventListener('touchstart', celebrate)
    document.addEventListener('keydown', celebrate)
    return cleanup
  }, [ready, isWeek, isDay])

  if (!showConfetti) return null
  return <Confetti />
}
