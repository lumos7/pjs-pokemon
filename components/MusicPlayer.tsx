'use client'

import { useEffect, useRef, useState } from 'react'
import { pickRandomTrack } from '@/lib/scenes'

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    const track = pickRandomTrack()
    const audio = new Audio(`/music/${track}`)
    audio.loop = true
    audio.volume = 0.3
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

  const nextTrack = () => {
    const track = pickRandomTrack()
    if (audioRef.current) {
      audioRef.current.pause()
    }
    const audio = new Audio(`/music/${track}`)
    audio.loop = true
    audio.volume = 0.3
    audio.muted = isMuted
    audioRef.current = audio
    if (hasStarted) {
      audio.play().catch(() => {})
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex gap-2">
      <button
        type="button"
        onClick={nextTrack}
        title="Next track"
        className="bg-white/80 backdrop-blur rounded-full px-3 py-3 min-h-[48px] shadow-lg border border-amber-200 text-sm font-bold hover:bg-white transition-colors whitespace-nowrap"
      >
        Next ♪
      </button>
      <button
        type="button"
        onClick={toggleMute}
        title={isMuted ? 'Unmute music' : 'Mute music'}
        className="bg-white/80 backdrop-blur rounded-full px-4 py-3 min-w-[48px] min-h-[48px] shadow-lg border border-amber-200 text-xl hover:bg-white transition-colors"
      >
        {isMuted ? '🔇' : '🔊'}
      </button>
    </div>
  )
}
