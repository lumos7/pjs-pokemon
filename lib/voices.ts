export const VOICE_IDS = [
  'EXAVITQu4vr4xnSDxMaL', // Bella (free tier)
  'EXAVITQu4vr4xnSDxMaL', // Bella (free tier)
  'EXAVITQu4vr4xnSDxMaL', // Bella (free tier)
] as const

export type VoiceId = typeof VOICE_IDS[number]

export function pickRandomVoice(): VoiceId {
  return VOICE_IDS[Math.floor(Math.random() * VOICE_IDS.length)]
}
