'use client'

import { useEffect, useRef, useState } from 'react'
import { pickRandomTrack } from '@/lib/scenes'

const DEFAULT_VOLUME = 0.15

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const themeRef = useRef<HTMLAudioElement | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [volume, setVolume] = useState(DEFAULT_VOLUME)
  const [isPlayingTheme, setIsPlayingTheme] = useState(false)

  useEffect(() => {
    const track = pickRandomTrack()
    const audio = new Audio(`/music/${encodeURIComponent(track)}`)
    audio.loop = true
    audio.volume = DEFAULT_VOLUME
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
      themeRef.current?.pause()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stopTheme = () => {
    if (themeRef.current) {
      themeRef.current.pause()
      themeRef.current.currentTime = 0
      themeRef.current = null
    }
    setIsPlayingTheme(false)
    if (audioRef.current && hasStarted) {
      audioRef.current.play().catch(() => {})
    }
  }

  const playTheme = () => {
    if (isPlayingTheme) {
      stopTheme()
      return
    }

    // Pause background music
    audioRef.current?.pause()

    const theme = new Audio('/music/playtheme.mp3')
    theme.volume = volume
    theme.muted = isMuted
    themeRef.current = theme

    theme.addEventListener('ended', stopTheme, { once: true })
    theme.play().catch(() => {})
    setIsPlayingTheme(true)
  }

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
    }
    if (themeRef.current) {
      themeRef.current.muted = !isMuted
    }
    setIsMuted(!isMuted)
  }

  const nextTrack = () => {
    const track = pickRandomTrack()
    if (audioRef.current) {
      audioRef.current.pause()
    }
    const audio = new Audio(`/music/${encodeURIComponent(track)}`)
    audio.loop = true
    audio.volume = volume
    audio.muted = isMuted
    audioRef.current = audio
    if (hasStarted && !isPlayingTheme) {
      audio.play().catch(() => {})
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    if (audioRef.current) {
      audioRef.current.volume = v
    }
    if (themeRef.current) {
      themeRef.current.volume = v
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      {/* Volume slider — hidden when muted */}
      {!isMuted && (
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={handleVolumeChange}
          className="w-24 sm:w-28 h-8 accent-[#FFCB05] cursor-pointer"
          style={{ touchAction: 'none' }}
          aria-label="Music volume"
        />
      )}

      <button
        type="button"
        onClick={playTheme}
        title={isPlayingTheme ? 'Stop theme' : 'Play theme'}
        className="bg-white/80 backdrop-blur rounded-full px-3 py-3 min-h-[48px] shadow-lg border border-amber-200 text-sm font-bold hover:bg-white transition-colors whitespace-nowrap"
      >
        {isPlayingTheme ? '⏹ Stop Theme' : '🎵 Play Theme'}
      </button>

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
