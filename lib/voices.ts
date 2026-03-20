export const VOICE_IDS = [
  '21m00Tcm4TlvDq8ikWAM', // Rachel
  'AZnzlk1XvdvUeBnXmlld', // Domi
  'EXAVITQu4vr4xnSDxMaL', // Bella
] as const

export type VoiceId = typeof VOICE_IDS[number]

export function pickRandomVoice(): VoiceId {
  return VOICE_IDS[Math.floor(Math.random() * VOICE_IDS.length)]
}
