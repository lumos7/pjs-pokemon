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
  'pokemon-theme.mp3',
  'title-screen.mp3',
  'jigglypuffs-song.mp3',
  'opening-theme.mp3',
  'professor-oaks-theme.mp3',
  'bicycle-theme.mp3',
  'lance-and-red-battle-theme.mp3',
  'celadon-city-fuchsia-city.mp3',
  'pokemon-center-lofi.mp3',
  'route-3-lofi.mp3',
]

export function pickRandomTrack(): string {
  return MUSIC_TRACKS[Math.floor(Math.random() * MUSIC_TRACKS.length)]
}
