export interface Scene {
  id: string
  name: string
  file: string
  thumbnail: string
}

export const scenes: Scene[] = [
  { id: 'canyon', name: 'Canyon', file: 'canyon.jpg', thumbnail: '/images/canyon.jpg' },
  { id: 'coast', name: 'Coast', file: 'coast.jpg', thumbnail: '/images/coast.jpg' },
  { id: 'forest', name: 'Forest', file: 'forest.jpg', thumbnail: '/images/forest.jpg' },
  { id: 'glacier', name: 'Glacier', file: 'glacier.jpg', thumbnail: '/images/glacier.jpg' },
]

export const MUSIC_TRACKS = [
  '01 - Pokemon Main Theme.mp3',
  '02 - Pallet Town (Pokemon Red_Blue).mp3',
  '17 Professor Oak\'s Theme.mp3',
  '49 Bicycle Theme.mp3',
  '78_celadon_city,_fuchsia_city.mp3',
  '092 - Pokemon - jigglypuff\'s song.mp3',
  'Kato - Pokémon Center - Lofi.mp3',
  'Kato - Route 3 - Lofi.mp3',
]

export function pickRandomTrack(): string {
  return MUSIC_TRACKS[Math.floor(Math.random() * MUSIC_TRACKS.length)]
}

export function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
