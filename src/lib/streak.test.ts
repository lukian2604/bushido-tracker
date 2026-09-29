import { describe, it, expect } from 'vitest'
import { computeCurrentStreak } from './streak'
import type { WeeklyActivityDay } from './types'

const day = (checked: number): WeeklyActivityDay => ({ date: new Date(), checked, total: 1 })

describe('computeCurrentStreak', () => {
  it('returns 0 for an empty series', () => {
    expect(computeCurrentStreak([])).toBe(0)
  })

  it('returns 0 when the most recent day has no check-ins', () => {
    expect(computeCurrentStreak([day(1), day(1), day(0)])).toBe(0)
  })

  it('counts consecutive checked days ending at the last entry', () => {
    expect(computeCurrentStreak([day(0), day(1), day(1), day(1)])).toBe(3)
  })

  it('counts every day when the whole series is checked', () => {
    expect(computeCurrentStreak([day(1), day(1), day(1)])).toBe(3)
  })

  it('stops at the first gap looking backward from the end', () => {
    expect(computeCurrentStreak([day(1), day(0), day(1), day(1)])).toBe(2)
  })
})
