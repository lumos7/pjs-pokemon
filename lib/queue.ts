'use client'

import { useSyncExternalStore } from 'react'

/**
 * Encounter Queue ("Next Up") — a cross-page, sessionStorage-backed store.
 *
 * Module-level state survives client-side navigation (encounter ↔ pokedex),
 * and sessionStorage rehydrates it across a full page refresh. Components read
 * it with `useQueue()` (useSyncExternalStore) and mutate via `queueStore`.
 */

export interface QueueItem {
  uid: string // unique per queue entry — duplicates of the same Pokémon are allowed
  id: number
  name: string
}

const STORAGE_KEY = 'pj-encounter-queue'
const EMPTY: QueueItem[] = []

let state: QueueItem[] = EMPTY
let uidCounter = 0
const listeners = new Set<() => void>()

// Hydrate from sessionStorage on first client import.
if (typeof window !== 'undefined') {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) state = parsed
    }
  } catch {
    /* corrupt/unavailable storage — start empty */
  }
}

function persist() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* quota / private mode — in-memory state still works */
  }
}

function emit(next: QueueItem[]) {
  state = next
  persist()
  listeners.forEach((l) => l())
}

function nextUid(id: number): string {
  uidCounter += 1
  return `${id}-${uidCounter}`
}

export const queueStore = {
  get(): QueueItem[] {
    return state
  },

  add(id: number, name: string): QueueItem {
    const item: QueueItem = { uid: nextUid(id), id, name }
    emit([...state, item])
    return item
  },

  remove(uid: string) {
    emit(state.filter((it) => it.uid !== uid))
  },

  /** Remove and return the head; emits the remaining queue. */
  shift(): QueueItem[] {
    if (state.length === 0) return state
    emit(state.slice(1))
    return state
  },

  reorder(fromIndex: number, toIndex: number) {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= state.length ||
      toIndex >= state.length
    ) {
      return
    }
    const next = [...state]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    emit(next)
  },

  clear() {
    if (state.length === 0) return
    emit([])
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

/** React hook — re-renders on any queue change. SSR-safe (empty on server). */
export function useQueue(): QueueItem[] {
  return useSyncExternalStore(
    queueStore.subscribe,
    () => state,
    () => EMPTY,
  )
}
