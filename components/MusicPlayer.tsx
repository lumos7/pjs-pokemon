'use client'

import { useEffect, useRef, useState } from 'react'
import { pickRandomTrack } from '@/lib/scenes'

const DEFAULT_VOLUME = 0.15
type ThemeState = 'idle' | 'playing' | 'paused'

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const themeRef = useRef<HTMLAudioElement | null>(null)
  // Ref so the unlock closure always sees the current value (avoids stale closure bug)
  const themeActiveRef = useRef(false)
  const hasStartedRef = useRef(false)

  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(DEFAULT_VOLUME)
  const [themeState, setThemeState] = useState<ThemeState>('idle')

  useEffect(() => {
    const track = pickRandomTrack()
    const audio = new Audio(`/music/${encodeURIComponent(track)}`)
    audio.loop = true
    audio.volume = DEFAULT_VOLUME
    audioRef.current = audio

    // Only start BG music if theme isn't active
    const unlock = () => {
      if (!hasStartedRef.current && !themeActiveRef.current) {
        audio.play().then(() => {
          hasStartedRef.current = true
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
  }, [])

  const resumeBg = () => {
    if (audioRef.current && hasStartedRef.current) {
      audioRef.current.play().catch(() => {})
    }
  }

  const stopTheme = () => {
    if (themeRef.current) {
      themeRef.current.pause()
      themeRef.current.currentTime = 0
      themeRef.current.onended = null
      themeRef.current = null
    }
    themeActiveRef.current = false
    setThemeState('idle')
    resumeBg()
  }

  const playTheme = () => {
    // Mark theme active BEFORE pausing BG — prevents unlock handler from restarting BG
    themeActiveRef.current = true

    // Ensure BG is paused
    if (audioRef.current) {
      audioRef.current.pause()
    }

    const theme = new Audio('/music/playtheme.mp3')
    theme.volume = volume
    theme.muted = isMuted
    theme.onended = stopTheme
    themeRef.current = theme
    theme.play().catch(() => {})
    setThemeState('playing')
  }

  const pauseTheme = () => {
    themeRef.current?.pause()
    setThemeState('paused')
  }

  const resumeTheme = () => {
    themeRef.current?.play().catch(() => {})
    setThemeState('playing')
  }

  const toggleMute = () => {
    if (audioRef.current) audioRef.current.muted = !isMuted
    if (themeRef.current) themeRef.current.muted = !isMuted
    setIsMuted(prev => !prev)
  }

  const nextTrack = () => {
    const track = pickRandomTrack()
    audioRef.current?.pause()
    const audio = new Audio(`/music/${encodeURIComponent(track)}`)
    audio.loop = true
    audio.volume = volume
    audio.muted = isMuted
    audioRef.current = audio
    if (hasStartedRef.current && themeState === 'idle') {
      audio.play().catch(() => {})
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    if (audioRef.current) audioRef.current.volume = v
    if (themeRef.current) themeRef.current.volume = v
  }

  const btn = 'bg-white/90 rounded-full px-3 py-2 min-h-[40px] border border-amber-200 text-sm font-bold hover:bg-white transition-colors whitespace-nowrap shadow-sm'

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t-2 border-amber-200 shadow-lg">
      <div className="max-w-2xl mx-auto px-4 py-2 flex items-center gap-2 flex-wrap justify-between">
        {/* Left: theme controls */}
        <div className="flex items-center gap-2">
          <button type="button" onClick={themeState === 'idle' ? playTheme : stopTheme} className={btn}>
            {themeState === 'idle' ? '🎵 Play Theme' : '⏹ Stop'}
          </button>
          {themeState !== 'idle' && (
            <button
              type="button"
              onClick={themeState === 'playing' ? pauseTheme : resumeTheme}
              className={btn}
            >
              {themeState === 'playing' ? '⏸ Pause' : '▶ Resume'}
            </button>
          )}
        </div>

        {/* Right: BG music controls */}
        <div className="flex items-center gap-2">
          {!isMuted && (
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 sm:w-28 accent-[#FFCB05] cursor-pointer"
              style={{ touchAction: 'none' }}
              aria-label="Music volume"
            />
          )}
          <button type="button" onClick={nextTrack} className={btn}>
            Next ♪
          </button>
          <button
            type="button"
            onClick={toggleMute}
            title={isMuted ? 'Unmute music' : 'Mute music'}
            className="bg-white/90 rounded-full px-3 py-2 min-w-[40px] min-h-[40px] border border-amber-200 text-lg hover:bg-white transition-colors shadow-sm"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>
    </div>
  )
}
