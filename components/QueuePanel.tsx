'use client'

import { useState } from 'react'
import { getOfficialArtworkUrl } from '@/lib/pokemon'
import { queueStore } from '@/lib/queue'
import type { QueuePlayback } from '@/lib/useQueuePlayback'

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

interface QueuePanelProps {
  playback: QueuePlayback
  open: boolean
  onToggleOpen: () => void
  sceneLocked: boolean
  onToggleSceneLock: () => void
  lockedSceneName: string | null
}

/** Friendly depleting ring with the remaining seconds in the centre. */
function CountdownRing({ value, total }: { value: number; total: number }) {
  const size = 44
  const stroke = 4
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const frac = Math.max(0, Math.min(1, value / total))
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#FDE68A" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#CC0000"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - frac)}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-base font-extrabold text-[#CC0000]">
        {value}
      </span>
    </div>
  )
}

export function QueuePanel({
  playback,
  open,
  onToggleOpen,
  sceneLocked,
  onToggleSceneLock,
  lockedSceneName,
}: QueuePanelProps) {
  const { items, current, playing, phase, countdown, countdownTotal, finished, togglePlay, skip, clearQueue } =
    playback
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const count = items.length
  const counting = phase === 'counting'

  const ctrlBtn =
    'flex-1 rounded-full px-2 py-2 min-h-[44px] text-sm font-bold shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
  const miniBtn =
    'w-7 h-7 rounded-full bg-amber-100 hover:bg-amber-200 text-gray-700 text-xs font-bold flex items-center justify-center disabled:opacity-30'

  return (
    <>
      {/* Collapsed tab — always reachable */}
      {!open && (
        <button
          type="button"
          onClick={onToggleOpen}
          className="fixed right-0 top-28 z-40 flex items-center gap-1 rounded-l-2xl bg-[#CC0000] text-white font-bold text-sm pl-3 pr-2 py-3 shadow-lg hover:bg-red-700 transition-colors"
        >
          📋 Next Up
          {count > 0 && (
            <span className="ml-1 bg-[#FFCB05] text-gray-900 rounded-full min-w-[20px] h-5 px-1 text-xs flex items-center justify-center">
              {count}
            </span>
          )}
        </button>
      )}

      {/* Mobile backdrop */}
      {open && <div className="fixed inset-0 z-40 bg-black/40 sm:hidden" onClick={onToggleOpen} aria-hidden />}

      {/* Panel */}
      <aside
        className={`fixed top-14 right-0 bottom-16 z-50 w-[88vw] max-w-xs bg-[#FFF8E7] border-l-4 border-[#FFCB05] shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#CC0000] text-white">
          <h2 className="font-extrabold text-lg" style={{ fontFamily: "'Bangers','Impact',cursive", letterSpacing: '0.04em' }}>
            📋 Next Up
          </h2>
          <button
            type="button"
            onClick={onToggleOpen}
            aria-label="Close queue"
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-xl font-bold flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Controls */}
        <div className="px-3 py-2 border-b border-amber-200 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={togglePlay}
              disabled={count === 0 && !playing}
              className={`${ctrlBtn} ${playing ? 'bg-amber-200 text-gray-900 hover:bg-amber-300' : 'bg-[#FFCB05] text-gray-900 hover:bg-yellow-400'}`}
            >
              {playing ? '⏸ Pause' : '▶ Play'}
            </button>
            <button
              type="button"
              onClick={skip}
              disabled={!playing}
              className={`${ctrlBtn} bg-[#3B4CCA] text-white hover:bg-blue-700`}
            >
              ⏭ Skip
            </button>
            <button
              type="button"
              onClick={clearQueue}
              disabled={count === 0}
              className={`${ctrlBtn} bg-gray-200 text-gray-800 hover:bg-gray-300`}
            >
              🗑 Clear
            </button>
          </div>

          {/* Countdown */}
          {counting && (
            <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-1.5 border border-amber-200">
              <CountdownRing value={countdown} total={countdownTotal} />
              <span className="text-sm font-bold text-gray-700">
                Next in {countdown}…
              </span>
            </div>
          )}

          {/* Lock scene */}
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 cursor-pointer select-none">
            <input type="checkbox" checked={sceneLocked} onChange={onToggleSceneLock} className="w-5 h-5 accent-[#CC0000]" />
            <span>🔒 Lock scene</span>
            <span className="text-xs font-normal text-gray-500 truncate">
              {sceneLocked ? (lockedSceneName ? `→ ${lockedSceneName}` : '(pick a scene)') : '(random each)'}
            </span>
          </label>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {count === 0 ? (
            <div className="text-center text-gray-500 py-10 px-2">
              {finished ? (
                <>
                  <div className="text-4xl mb-2">🎉</div>
                  <p className="font-bold text-gray-700">Queue finished!</p>
                  <p className="text-sm mt-1">Add more Pokémon to keep playing.</p>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-2">🌟</div>
                  <p className="font-medium">Queue is empty.</p>
                  <p className="text-sm mt-1">Add Pokémon with the “+ Queue” buttons.</p>
                </>
              )}
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((item, i) => {
                const isCurrent = current?.uid === item.uid
                return (
                  <li
                    key={item.uid}
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setOverIndex(i)
                    }}
                    onDragEnd={() => {
                      setDragIndex(null)
                      setOverIndex(null)
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      if (dragIndex !== null) queueStore.reorder(dragIndex, i)
                      setDragIndex(null)
                      setOverIndex(null)
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-colors ${
                      isCurrent ? 'bg-yellow-100 border-[#FFCB05] shadow-sm' : 'bg-white border-amber-100'
                    } ${overIndex === i && dragIndex !== i ? 'ring-2 ring-[#CC0000]' : ''}`}
                  >
                    <span className="cursor-grab text-gray-300 select-none text-lg leading-none" aria-hidden>
                      ⠿
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getOfficialArtworkUrl(item.id)}
                      alt=""
                      className="w-10 h-10 object-contain flex-shrink-0"
                      loading="lazy"
                    />
                    <span className="flex-1 font-bold text-sm text-gray-800 truncate">
                      {isCurrent && playing && <span className="text-[#CC0000]">▶ </span>}
                      {cap(item.name)}
                    </span>
                    {/* Touch-friendly reorder */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => queueStore.reorder(i, i - 1)}
                        disabled={i === 0}
                        aria-label="Move up"
                        className={miniBtn}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => queueStore.reorder(i, i + 1)}
                        disabled={i === count - 1}
                        aria-label="Move down"
                        className={miniBtn}
                      >
                        ▼
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => queueStore.remove(item.uid)}
                      aria-label={`Remove ${item.name}`}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 text-lg font-bold flex items-center justify-center flex-shrink-0"
                    >
                      ×
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </aside>
    </>
  )
}
