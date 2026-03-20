'use client'

import { useEffect, useRef, useState } from 'react'
import { MUSIC_TRACKS, pickRandomTrack } from '@/lib/scenes'

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    const track = pickRandomTrack()
    const audio = new Audio(`/music/${track}`)
    audio.loop = true
    audioRef.current = audio

    const unlock = () => {
      if (!hasStarted) {
        audio.play().then(() => {
          setHasStarted(true)
          document.removeEventListener('click', unlock)
          document.removeEventListener('touchstart', unlock)
        }).catch(() => {})
      }
    }

    document.addEventListener('click', unlock)
    document.addEventListener('touchstart', unlock)

    return () => {
      document.removeEventListener('click', unlock)
      document.removeEventListener('touchstart', unlock)
      audio.pause()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  return (
    <button
      onClick={toggleMute}
      title={isMuted ? 'Unmute music' : 'Mute music'}
      className="fixed bottom-4 right-4 z-50 bg-white/80 backdrop-blur rounded-full px-4 py-3 min-w-[48px] min-h-[48px] shadow-lg border border-amber-200 text-xl hover:bg-white transition-colors"
    >
      {isMuted ? '🔇' : '🔊'}
    </button>
  )
}
