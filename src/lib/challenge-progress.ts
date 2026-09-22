import { enumerateDateKeys } from './date-utils'
import type { Challenge } from './types'

export interface ChallengeProgress {
  completedCount: number
  totalCount: number
  percent: number
}

export const computeChallengeProgress = (challenge: Challenge, today: string): ChallengeProgress => {
  const dateKeys = enumerateDateKeys(challenge.startDate, challenge.endDate)
  const totalCount = dateKeys.length
  const isAuto = challenge.mode === 'auto'

  let completedCount: number
  if (isAuto) {
    const elapsed = dateKeys.filter((dateKey) => dateKey <= today).length
    const failedInRange = (challenge.failedDates || []).filter((dateKey) => dateKey <= today).length
    completedCount = Math.max(0, elapsed - failedInRange)
  } else {
    completedCount = (challenge.completedDates || []).length
  }

  return { completedCount, totalCount, percent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0 }
}
