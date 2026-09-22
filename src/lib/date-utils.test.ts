import { describe, it, expect } from 'vitest'
import { todayDateKey, enumerateDateKeys, daysInMonth } from './date-utils'

describe('todayDateKey', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(todayDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('pads single-digit months and days', () => {
    expect(todayDateKey(new Date(2026, 8, 9))).toBe('2026-09-09')
  })

  it('handles December correctly', () => {
    expect(todayDateKey(new Date(2026, 11, 31))).toBe('2026-12-31')
  })
})

describe('enumerateDateKeys', () => {
  it('returns a single key when start equals end', () => {
    expect(enumerateDateKeys('2026-08-09', '2026-08-09')).toEqual(['2026-08-09'])
  })

  it('enumerates every day inclusive of both endpoints', () => {
    expect(enumerateDateKeys('2026-08-01', '2026-08-05')).toEqual([
      '2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-08-05',
    ])
  })

  it('crosses a month boundary correctly', () => {
    expect(enumerateDateKeys('2026-01-30', '2026-02-02')).toEqual([
      '2026-01-30', '2026-01-31', '2026-02-01', '2026-02-02',
    ])
  })

  it('returns an empty list when the range is inverted', () => {
    expect(enumerateDateKeys('2026-08-10', '2026-08-05')).toEqual([])
  })
})

describe('daysInMonth', () => {
  it('returns 31 for January', () => {
    expect(daysInMonth(2026, 0)).toBe(31)
  })

  it('returns 28 for February in a non-leap year', () => {
    expect(daysInMonth(2026, 1)).toBe(28)
  })

  it('returns 29 for February in a leap year', () => {
    expect(daysInMonth(2028, 1)).toBe(29)
  })

  it('returns 30 for April', () => {
    expect(daysInMonth(2026, 3)).toBe(30)
  })
})
