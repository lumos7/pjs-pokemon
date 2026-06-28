'use client'

import { useEffect, useState } from 'react'
import { isBirthdayWeek, isBirthdayDay, daysUntilBirthday, currentAge } from './birthday'

export interface BirthdayState {
  /** false during SSR / first paint — guards against hydration mismatch */
  ready: boolean
  isWeek: boolean
  isDay: boolean
  daysUntil: number
  age: number
}

/**
 * Resolves birthday state on the client using the visitor's LOCAL date.
 * Returns `ready: false` until mounted so server and client markup match.
 */
export function useBirthday(): BirthdayState {
  const [state, setState] = useState<BirthdayState>({
    ready: false,
    isWeek: false,
    isDay: false,
    daysUntil: 0,
    age: 0,
  })

  useEffect(() => {
    const now = new Date()
    setState({
      ready: true,
      isWeek: isBirthdayWeek(now),
      isDay: isBirthdayDay(now),
      daysUntil: daysUntilBirthday(now),
      age: currentAge(now),
    })
  }, [])

  return state
}
