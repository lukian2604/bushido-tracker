import { describe, it, expect } from 'vitest'
import { computeChallengeProgress } from './challenge-progress'
import type { Challenge } from './types'

const baseChallenge = (overrides: Partial<Challenge>): Challenge => ({
  id: 'c1',
  name: 'Test challenge',
  startDate: '2026-01-01',
  endDate: '2026-01-10',
  mode: 'manual',
  completedDates: [],
  createdAt: null,
  ...overrides,
})

describe('computeChallengeProgress: manual mode', () => {
  it('counts only the explicitly completed dates', () => {
    const challenge = baseChallenge({ mode: 'manual', completedDates: ['2026-01-01', '2026-01-02'] })
    const result = computeChallengeProgress(challenge, '2026-01-05')
    expect(result).toEqual({ completedCount: 2, totalCount: 10, percent: 20 })
  })

  it('ignores today/failedDates entirely in manual mode', () => {
    const challenge = baseChallenge({ mode: 'manual', completedDates: ['2026-01-01'], failedDates: ['2026-01-02'] })
    const result = computeChallengeProgress(challenge, '2026-01-01')
    expect(result.completedCount).toBe(1)
  })
})

describe('computeChallengeProgress: auto mode', () => {
  it('counts every elapsed day as completed when nothing failed', () => {
    const challenge = baseChallenge({ mode: 'auto', startDate: '2026-01-01', endDate: '2026-01-10' })
    const result = computeChallengeProgress(challenge, '2026-01-05')
    expect(result).toEqual({ completedCount: 5, totalCount: 10, percent: 50 })
  })

  it('subtracts failed dates within the elapsed range', () => {
    const challenge = baseChallenge({
      mode: 'auto',
      startDate: '2026-01-01',
      endDate: '2026-01-10',
      failedDates: ['2026-01-02', '2026-01-03'],
    })
    const result = computeChallengeProgress(challenge, '2026-01-05')
    expect(result.completedCount).toBe(3)
  })

  it('ignores failed dates that fall after the given "today"', () => {
    const challenge = baseChallenge({
      mode: 'auto',
      startDate: '2026-01-01',
      endDate: '2026-01-10',
      failedDates: ['2026-01-09'],
    })
    const result = computeChallengeProgress(challenge, '2026-01-05')
    expect(result.completedCount).toBe(5)
  })

  it('never goes below zero even if failedDates outnumber elapsed days', () => {
    const challenge = baseChallenge({
      mode: 'auto',
      startDate: '2026-01-01',
      endDate: '2026-01-10',
      failedDates: ['2026-01-01', '2026-01-02', '2026-01-03'],
    })
    const result = computeChallengeProgress(challenge, '2026-01-01')
    expect(result.completedCount).toBe(0)
  })

  it('counts the full range as elapsed once "today" is past the end date', () => {
    const challenge = baseChallenge({ mode: 'auto', startDate: '2026-01-01', endDate: '2026-01-10' })
    const result = computeChallengeProgress(challenge, '2026-06-01')
    expect(result).toEqual({ completedCount: 10, totalCount: 10, percent: 100 })
  })
})

describe('computeChallengeProgress: edge cases', () => {
  it('returns 0 percent for a single-day challenge not yet completed', () => {
    const challenge = baseChallenge({ mode: 'manual', startDate: '2026-01-01', endDate: '2026-01-01', completedDates: [] })
    const result = computeChallengeProgress(challenge, '2026-01-01')
    expect(result).toEqual({ completedCount: 0, totalCount: 1, percent: 0 })
  })

  it('returns 0 totalCount and 0 percent for an inverted date range', () => {
    const challenge = baseChallenge({ startDate: '2026-01-10', endDate: '2026-01-01' })
    const result = computeChallengeProgress(challenge, '2026-01-05')
    expect(result).toEqual({ completedCount: 0, totalCount: 0, percent: 0 })
  })
})
