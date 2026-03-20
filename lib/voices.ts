export const VOICE_IDS = [
  'Gsndh0O5AnuI2Hj3YUlA',
  'O4fnkotIypvedJqBp4yb',
  'iukn3a1vSSNFmdi5NZS4',
] as const

export type VoiceId = typeof VOICE_IDS[number]

export function pickRandomVoice(): VoiceId {
  return VOICE_IDS[Math.floor(Math.random() * VOICE_IDS.length)]
}
