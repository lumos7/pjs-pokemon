/* PJ's Pokémon service worker — TEMPLATE.
 *
 * scripts/gen-sw.mjs substitutes __PJ_SW_VERSION__ (Vercel commit SHA, or a
 * dev timestamp) and writes public/sw.js at build time. A rotating VERSION
 * changes the SW bytes every deploy → install/activate re-run → the activate
 * purge below drops every previous version's caches, so swapped unhashed
 * assets (PJ photo, birthday hat, scenes, icons) actually reach installed
 * users instead of being served stale forever.
 *
 * Strategy:
 *  - Navigations: network-first, cached shell fallback (SHELL_CACHE, keys
 *    normalised to pathname so query variants don't multiply).
 *  - /_next/static/: cache-first in its own UNTRIMMED, version-scoped cache —
 *    content-hashed chunks must never be FIFO-evicted or the offline shell
 *    breaks (ChunkLoadError on offline boot).
 *  - Media/sprites (raw.githubusercontent.com, /music/, /images/, /icons/,
 *    /fonts/): cache-first in a trimmed cache.
 *  - Range requests: never intercepted — <audio> issues them, /music/ answers
 *    206, and cache.put throws on partial responses.
 *  - /api/* and pokeapi.co JSON: never intercepted.
 */

const VERSION = '__PJ_SW_VERSION__'
const SHELL_CACHE = `${VERSION}-shell`
const STATIC_CACHE = `${VERSION}-static`
const ASSET_CACHE = `${VERSION}-assets`
const ASSET_LIMIT = 300

const PRECACHE = [
  '/',
  '/encounter',
  '/pokemon-list',
  '/quiz',
  '/pokemon-of-the-day',
  '/manifest.webmanifest',
  '/images/PokeMaster PJ.png',
  '/images/canyon.jpg',
  '/images/coast.jpg',
  '/images/forest.jpg',
  '/images/glacier.jpg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  )
})

async function trimCache(cacheName, limit) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length > limit) {
    await cache.delete(keys[0])
    return trimCache(cacheName, limit)
  }
}

function isImmutableAsset(url) {
  return (
    url.hostname === 'raw.githubusercontent.com' ||
    url.hostname === 'play.pokemonshowdown.com' ||
    (url.origin === self.location.origin &&
      (url.pathname.startsWith('/music/') ||
        url.pathname.startsWith('/icons/') ||
        url.pathname.startsWith('/images/') ||
        url.pathname.startsWith('/fonts/')))
  )
}

function cacheFirst(request, cacheName, trim) {
  return caches.match(request, { cacheName }).then((cached) => {
    if (cached) return cached
    return fetch(request).then((res) => {
      if (res.ok && !res.redirected && (res.type === 'basic' || res.type === 'cors')) {
        const copy = res.clone()
        caches
          .open(cacheName)
          .then((cache) => {
            cache.put(request, copy).catch(() => {})
            if (trim) trimCache(cacheName, ASSET_LIMIT)
          })
          .catch(() => {})
      }
      return res
    })
  })
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  // <audio>/<video> issue Range requests; 206 partial responses can't be
  // cached (cache.put throws) and a cached full 200 breaks Safari seeking —
  // stay out of the way entirely.
  if (request.headers.has('range')) return

  const url = new URL(request.url)

  // Live data — never intercept
  if (url.pathname.startsWith('/api/') || url.hostname === 'pokeapi.co') return

  // Navigations: network first, cached page fallback, then cached home shell.
  // Keys are normalised to pathname so /encounter?pokemonId=25 doesn't create
  // a permanent per-query entry (and offline hits on it still get /encounter).
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok && !res.redirected) {
            const copy = res.clone()
            caches
              .open(SHELL_CACHE)
              .then((cache) => cache.put(url.pathname, copy).catch(() => {}))
              .catch(() => {})
          }
          return res
        })
        .catch(async () => {
          const cached = await caches.match(request, {
            cacheName: SHELL_CACHE,
            ignoreSearch: true,
          })
          return cached || caches.match('/', { cacheName: SHELL_CACHE })
        })
    )
    return
  }

  // App chunks: own untrimmed cache — never FIFO-evicted, purged per deploy
  if (url.origin === self.location.origin && url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE, false))
    return
  }

  // Media/sprites: cache first, trimmed
  if (isImmutableAsset(url)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE, true))
  }
})
