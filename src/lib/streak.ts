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
