'use client'

import { useEffect } from 'react'

/** Registers the PWA service worker (production only). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* registration failed — app still works, just not installable/offline */
    })
  }, [])

  return null
}
