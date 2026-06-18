import type { WeeklyActivityDay } from './types'

export const computeCurrentStreak = (series: WeeklyActivityDay[]): number => {
  let streak = 0
  for (let i = series.length - 1; i >= 0; i -= 1) {
    if (series[i].checked > 0) {
      streak += 1
    } else {
      break
    }
  }
  return streak
}

export const computeLongestStreak = (series: WeeklyActivityDay[]): number => {
  let longest = 0
  let current = 0
  for (const day of series) {
    if (day.checked > 0) {
      current += 1
      longest = Math.max(longest, current)
    } else {
      current = 0
    }
  }
  return longest
}
