/**
 * PJ's Birthday Mode — single source of truth.
 *
 * PJ's date of birth: June 30, 2023.
 * Birthday window: June 23–30 (inclusive) every year, calculated dynamically.
 *
 *   - COUNTDOWN MODE  June 23–29  → birthday theme + countdown
 *   - BIRTHDAY DAY    June 30     → full celebration
 *   - NORMAL MODE     July 1 – June 22 → everything off
 *
 * Every function accepts an optional `date` (defaults to now) so the logic can
 * be reasoned about / tested for any year without waiting for the calendar.
 */

export const PJ_BIRTH_YEAR = 2023
const BIRTHDAY_MONTH = 6 // June (1-indexed for readability)
const BIRTHDAY_DAY = 30
const WINDOW_START_DAY = 23

function parts(date: Date) {
  return { month: date.getMonth() + 1, day: date.getDate() }
}

/** True for the whole window June 23–30 (inclusive). */
export function isBirthdayWeek(date: Date = new Date()): boolean {
  const { month, day } = parts(date)
  return month === BIRTHDAY_MONTH && day >= WINDOW_START_DAY && day <= BIRTHDAY_DAY
}

/** True only on the birthday itself, June 30. */
export function isBirthdayDay(date: Date = new Date()): boolean {
  const { month, day } = parts(date)
  return month === BIRTHDAY_MONTH && day === BIRTHDAY_DAY
}

/**
 * The age PJ is turning this year. Never hardcoded — current year minus 2023.
 * On June 30, 2026 he turns 3.
 */
export function currentAge(date: Date = new Date()): number {
  return date.getFullYear() - PJ_BIRTH_YEAR
}

/**
 * Whole days from `date` until this year's June 30. 0 on the day itself.
 * Compares calendar days at local midnight so partial days don't skew the count.
 */
export function daysUntilBirthday(date: Date = new Date()): number {
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const birthday = new Date(date.getFullYear(), BIRTHDAY_MONTH - 1, BIRTHDAY_DAY)
  return Math.round((birthday.getTime() - today.getTime()) / 86_400_000)
}
