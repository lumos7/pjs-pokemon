'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { QueueItem, queueStore, useQueue } from '@/lib/queue'
import { getEncounterImage, prefetchEncounter, randomSceneId } from '@/lib/encounterImages'
import { fetchTtsClipUrl, playClip, playCryClip, stopClip } from '@/lib/encounterAudio'

export type PlaybackPhase = 'idle' | 'generating' | 'audio' | 'counting' | 'finished'

export const COUNTDOWN_SECONDS = 5

export interface QueuePlayback {
  items: QueueItem[]
  current: QueueItem | null
  imageUrl: string | null
  playing: boolean
  phase: PlaybackPhase
  countdown: number
  countdownTotal: number
  finished: boolean
  togglePlay: () => void
  skip: () => void
  replayCry: () => void
  clearQueue: () => void
  stop: () => void
  bumpCountdown: () => void
}

/**
 * Auto-advance playback engine for the encounter queue.
 *
 * Per head item: generate (cached/prefetched) → display → TTS → cry → 5s
 * countdown → advance. Any interaction during the countdown restarts it, and
 * the next item is prefetched while the current one plays so advancing is
 * instant. `lockedSceneId` (when set) forces every encounter to that scene.
 */
export function useQueuePlayback(lockedSceneId: string | null): QueuePlayback {
  const items = useQueue()
  const head = items[0] ?? null
  const headUid = head?.uid ?? null

  const [playing, setPlaying] = useState(false)
  const [phase, setPhase] = useState<PlaybackPhase>('idle')
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [current, setCurrent] = useState<QueueItem | null>(null)
  const [finished, setFinished] = useState(false)

  // Live refs so stable callbacks read fresh values without re-subscribing.
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const currentRef = useRef(current)
  currentRef.current = current
  const playingRef = useRef(playing)
  playingRef.current = playing
  const lockedSceneRef = useRef(lockedSceneId)
  lockedSceneRef.current = lockedSceneId

  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const activeAudio = useRef<HTMLAudioElement | null>(null)
  const runId = useRef(0)
  const sceneMap = useRef(new Map<string, string>())

  const clearCountdown = useCallback(() => {
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current)
      countdownTimer.current = null
    }
  }, [])

  const stopAudio = useCallback(() => {
    stopClip(activeAudio.current)
    activeAudio.current = null
  }, [])

  // Pick (and remember) the scene for an item so prefetch and play agree → cache hit.
  const sceneFor = useCallback((uid: string): string => {
    if (lockedSceneRef.current) return lockedSceneRef.current
    const map = sceneMap.current
    let scene = map.get(uid)
    if (!scene) {
      scene = randomSceneId()
      map.set(uid, scene)
    }
    return scene
  }, [])

  const advance = useCallback(() => {
    clearCountdown()
    stopAudio()
    runId.current += 1 // invalidate any in-flight sequence
    const remaining = queueStore.shift()
    if (remaining.length === 0) {
      setPlaying(false)
      setPhase('finished')
      setFinished(true)
      setCurrent(null)
      setImageUrl(null)
    }
    // otherwise headUid changes → the main effect re-runs for the new head
  }, [clearCountdown, stopAudio])

  const startCountdown = useCallback(() => {
    clearCountdown()
    setPhase('counting')
    setCountdown(COUNTDOWN_SECONDS)
    let remaining = COUNTDOWN_SECONDS
    countdownTimer.current = setInterval(() => {
      remaining -= 1
      if (remaining <= 0) {
        clearCountdown()
        setCountdown(0)
        advance() // called from the timer callback, never inside a setState updater
      } else {
        setCountdown(remaining)
      }
    }, 1000)
  }, [clearCountdown, advance])

  // "Still looking" — any interaction during the countdown restarts it.
  const bumpCountdown = useCallback(() => {
    if (phaseRef.current === 'counting') startCountdown()
  }, [startCountdown])

  const replayCry = useCallback(() => {
    const cur = currentRef.current
    if (!cur) return
    stopAudio()
    const cry = playCryClip(cur.id)
    activeAudio.current = cry.audio
    if (phaseRef.current === 'counting') startCountdown()
  }, [stopAudio, startCountdown])

  const togglePlay = useCallback(() => {
    if (playingRef.current) {
      clearCountdown()
      stopAudio()
      setPhase('idle')
      setPlaying(false)
    } else {
      if (queueStore.get().length === 0) return
      setFinished(false)
      setPlaying(true)
    }
  }, [clearCountdown, stopAudio])

  const skip = useCallback(() => {
    advance()
  }, [advance])

  const stop = useCallback(() => {
    clearCountdown()
    stopAudio()
    runId.current += 1
    setPlaying(false)
    setPhase('idle')
    setCurrent(null)
    setImageUrl(null)
    setFinished(false)
  }, [clearCountdown, stopAudio])

  const clearQueue = useCallback(() => {
    queueStore.clear()
    stop()
  }, [stop])

  // Main sequence — runs for the current head whenever it (or `playing`) changes.
  useEffect(() => {
    if (!playing) return
    const item = queueStore.get()[0]
    if (!item) return // empty queue — `advance` already handled the finished state

    const myRun = ++runId.current
    let cancelled = false
    const alive = () => !cancelled && myRun === runId.current

    setCurrent(item)
    setFinished(false)
    setPhase('generating')

    ;(async () => {
      const sceneId = sceneFor(item.uid)
      let url: string | null = null
      try {
        url = await getEncounterImage(item.id, item.name, sceneId)
      } catch {
        url = null
      }
      if (!alive()) return
      if (!url) {
        advance() // generation failed — don't get stuck, move on
        return
      }
      setImageUrl(url)
      setPhase('audio')

      // Warm the next item while this one plays so advancing is instant.
      const next = queueStore.get()[1]
      if (next) prefetchEncounter(next.id, next.name, sceneFor(next.uid))

      const ttsUrl = await fetchTtsClipUrl(item.name)
      if (!alive()) return
      if (ttsUrl) {
        const tts = playClip(ttsUrl, 0.95)
        activeAudio.current = tts.audio
        await tts.done
        if (!alive()) return
      }

      const cry = playCryClip(item.id)
      activeAudio.current = cry.audio
      await cry.done
      if (!alive()) return

      startCountdown()
    })()

    return () => {
      cancelled = true
      clearCountdown()
      stopAudio()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, headUid])

  // Reset countdown on ANY interaction while it is running.
  useEffect(() => {
    if (phase !== 'counting') return
    const handler = () => bumpCountdown()
    document.addEventListener('pointerdown', handler)
    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('pointerdown', handler)
      document.removeEventListener('keydown', handler)
    }
  }, [phase, bumpCountdown])

  // Tidy up timers/audio on unmount.
  useEffect(() => {
    return () => {
      clearCountdown()
      stopAudio()
    }
  }, [clearCountdown, stopAudio])

  return {
    items,
    current,
    imageUrl,
    playing,
    phase,
    countdown,
    countdownTotal: COUNTDOWN_SECONDS,
    finished,
    togglePlay,
    skip,
    replayCry,
    clearQueue,
    stop,
    bumpCountdown,
  }
}
