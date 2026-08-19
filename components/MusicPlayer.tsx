'use client'

import { useEffect, useRef, useState } from 'react'
import { MUSIC_TRACKS, fisherYates } from '@/lib/scenes'
import { setBusMuted } from '@/lib/audioBus'

const DEFAULT_VOLUME = 0.15
const DUCK_FACTOR = 0.25 // bg music drops to 25% while TTS/cries play
type ThemeState = 'idle' | 'playing' | 'paused'

export function MusicPlayer() {
  // Shuffle queue — built once on mount, index-based advancement
  const queueRef     = useRef<string[]>([])
  const queueIdxRef  = useRef(0)

  function buildQueue() {
    const shuffled = fisherYates(MUSIC_TRACKS)
    // If rebuilding, ensure first track of new queue isn't the last played
    if (queueRef.current.length > 0) {
      const lastPlayed = queueRef.current[queueIdxRef.current - 1]
      if (shuffled.length > 1 && shuffled[0] === lastPlayed) {
        const swapIdx = 1 + Math.floor(Math.random() * (shuffled.length - 1))
        ;[shuffled[0], shuffled[swapIdx]] = [shuffled[swapIdx], shuffled[0]]
      }
    }
    queueRef.current = shuffled
    queueIdxRef.current = 0
  }

  function nextFromQueue(): string {
    // Build queue if empty or exhausted
    if (queueRef.current.length === 0 || queueIdxRef.current >= queueRef.current.length) {
      buildQueue()
    }
    const track = queueRef.current[queueIdxRef.current]
    queueIdxRef.current++
    return track
  }

  // Web Audio API refs for BG music
  const ctxRef       = useRef<AudioContext | null>(null)
  const gainRef      = useRef<GainNode | null>(null)
  const sourceRef    = useRef<AudioBufferSourceNode | null>(null)
  const loadTokenRef = useRef(0) // cancel stale fetches on nextTrack
  const nextBufRef   = useRef<{ track: string; buffer: AudioBuffer } | null>(null)

  // Theme player stays as HTML Audio (one-shot, independent)
  const themeRef = useRef<HTMLAudioElement | null>(null)

  const themeActiveRef = useRef(false)
  const hasStartedRef  = useRef(false)
  const startingRef    = useRef(false)

  const [isMuted, setIsMuted]     = useState(false)
  const [volume, setVolume]       = useState(DEFAULT_VOLUME)
  const [themeState, setThemeState] = useState<ThemeState>('idle')

  // Live refs so duck listeners always read fresh values
  const volumeRef = useRef(DEFAULT_VOLUME)
  const mutedRef  = useRef(false)
  const duckedRef = useRef(false)

  // Ramp the gain to the current target (volume × mute × duck) — no zipper noise
  const applyGain = () => {
    const base = mutedRef.current ? 0 : volumeRef.current
    const target = duckedRef.current ? base * DUCK_FACTOR : base
    const gain = gainRef.current
    const ctx = ctxRef.current
    if (gain && ctx) {
      gain.gain.cancelScheduledValues(ctx.currentTime)
      gain.gain.setTargetAtTime(target, ctx.currentTime, 0.1)
    } else if (gain) {
      gain.gain.value = target
    }
    if (themeRef.current) themeRef.current.volume = target
  }

  // Build the Web Audio graph once and return the AudioContext
  function getCtx(): AudioContext {
    if (ctxRef.current) return ctxRef.current

    const ctx = new AudioContext()

    const compressor = ctx.createDynamicsCompressor()
    compressor.threshold.setValueAtTime(-24, ctx.currentTime)
    compressor.knee.setValueAtTime(30, ctx.currentTime)
    compressor.ratio.setValueAtTime(12, ctx.currentTime)
    compressor.attack.setValueAtTime(0.003, ctx.currentTime)
    compressor.release.setValueAtTime(0.25, ctx.currentTime)
    compressor.connect(ctx.destination)

    const gain = ctx.createGain()
    gain.gain.value = DEFAULT_VOLUME
    gain.connect(compressor)

    gainRef.current = gain
    ctxRef.current  = ctx
    return ctx
  }

  async function loadBuffer(track: string): Promise<AudioBuffer> {
    const ctx = getCtx()
    const res = await fetch(`/music/${encodeURIComponent(track)}`)
    const arrayBuf = await res.arrayBuffer()
    return ctx.decodeAudioData(arrayBuf)
  }

  // Warm the next queue entry so track transitions are gapless
  function prefetchNext() {
    const nextIdx = queueIdxRef.current
    const track = nextIdx < queueRef.current.length ? queueRef.current[nextIdx] : null
    if (!track || nextBufRef.current?.track === track) return
    loadBuffer(track)
      .then((buffer) => { nextBufRef.current = { track, buffer } })
      .catch(() => {})
  }

  function playBuffer(track: string, buffer: AudioBuffer, token: number) {
    const ctx = getCtx()
    // Stop whatever was playing
    try { sourceRef.current?.stop() } catch { /* already stopped */ }

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(gainRef.current!)

    // When this track ends, play the next one from the queue
    source.onended = () => {
      if (loadTokenRef.current !== token) return // skip if user already skipped
      if (themeActiveRef.current) return // don't auto-advance during theme
      const next = nextFromQueue()
      const nextToken = ++loadTokenRef.current
      startBgTrack(next, nextToken).catch(() => {})
    }

    source.start()
    sourceRef.current = source
    hasStartedRef.current = true
    applyGain()
    prefetchNext()
  }

  // Fetch (or reuse prefetched), decode, and play a track through the graph
  async function startBgTrack(track: string, token: number) {
    const ctx = getCtx()
    if (ctx.state === 'suspended') await ctx.resume()

    const prefetched = nextBufRef.current
    if (prefetched?.track === track) {
      nextBufRef.current = null
      playBuffer(track, prefetched.buffer, token)
      return
    }

    const buffer = await loadBuffer(track)
    // Bail if a newer load was requested while we were fetching/decoding
    if (loadTokenRef.current !== token) return
    playBuffer(track, buffer, token)
  }

  useEffect(() => {
    // Build the initial queue on mount
    buildQueue()
    const track = nextFromQueue()

    const unlock = () => {
      if (hasStartedRef.current) {
        document.removeEventListener('click', unlock)
        document.removeEventListener('touchstart', unlock)
        return
      }
      if (themeActiveRef.current || startingRef.current) return
      startingRef.current = true
      const token = ++loadTokenRef.current
      startBgTrack(track, token)
        .then(() => {
          document.removeEventListener('click', unlock)
          document.removeEventListener('touchstart', unlock)
        })
        .catch(() => { startingRef.current = false }) // retry on next gesture
    }

    document.addEventListener('click', unlock)
    document.addEventListener('touchstart', unlock)

    // Duck under one-shot audio (TTS / cries / jingles) from the audio bus
    const onActive = () => { duckedRef.current = true; applyGain() }
    const onIdle   = () => { duckedRef.current = false; applyGain() }
    document.addEventListener('pj-audio-active', onActive)
    document.addEventListener('pj-audio-idle', onIdle)

    return () => {
      document.removeEventListener('click', unlock)
      document.removeEventListener('touchstart', unlock)
      document.removeEventListener('pj-audio-active', onActive)
      document.removeEventListener('pj-audio-idle', onIdle)
      try { sourceRef.current?.stop() } catch { /* ok */ }
      ctxRef.current?.close()
      themeRef.current?.pause()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- BG music controls ---

  const nextTrack = () => {
    // Don't consume a queue slot (or sever the auto-advance chain by bumping
    // the token) unless bg music is actually the active player right now.
    if (!hasStartedRef.current || themeState !== 'idle') return
    const track = nextFromQueue()
    const token = ++loadTokenRef.current
    startBgTrack(track, token).catch(() => {})
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    volumeRef.current = v
    applyGain()
  }

  const toggleMute = () => {
    const next = !isMuted
    setIsMuted(next)
    mutedRef.current = next
    setBusMuted(next) // mute cries/TTS/jingles too
    if (themeRef.current) themeRef.current.muted = next
    applyGain()
  }

  // --- Theme controls (HTML Audio, independent of Web Audio graph) ---

  const resumeBg = () => {
    if (hasStartedRef.current) {
      ctxRef.current?.resume().catch(() => {})
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
    themeActiveRef.current = true
    // Suspend BG via AudioContext (preserves playback position)
    ctxRef.current?.suspend().catch(() => {})

    const theme = new Audio('/music/playtheme.mp3')
    theme.volume = mutedRef.current ? 0 : volumeRef.current
    theme.muted  = isMuted
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

  // --- Render ---

  const btn = 'bg-white/90 rounded-full px-3 py-2 min-h-[44px] border border-amber-200 text-sm font-bold hover:bg-white active:scale-95 transition-all whitespace-nowrap shadow-sm'

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t-2 border-amber-200 shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
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
            title={isMuted ? 'Unmute all sound' : 'Mute all sound'}
            className="bg-white/90 rounded-full px-3 py-2 min-w-[44px] min-h-[44px] border border-amber-200 text-lg hover:bg-white active:scale-95 transition-all shadow-sm"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>
    </div>
  )
}
