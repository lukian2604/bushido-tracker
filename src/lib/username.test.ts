import { describe, it, expect } from 'vitest'
import { isValidUsername, normalizeUsername, slugifyUsername } from './username'

describe('isValidUsername', () => {
  it('accepts lowercase letters, digits and underscores between 3 and 20 chars', () => {
    expect(isValidUsername('crowen_x4k2')).toBe(true)
    expect(isValidUsername('abc')).toBe(true)
    expect(isValidUsername('a'.repeat(20))).toBe(true)
  })

  it('rejects usernames shorter than 3 or longer than 20 characters', () => {
    expect(isValidUsername('ab')).toBe(false)
    expect(isValidUsername('a'.repeat(21))).toBe(false)
  })

  it('rejects uppercase letters and disallowed characters', () => {
    expect(isValidUsername('Crowen')).toBe(false)
    expect(isValidUsername('user name')).toBe(false)
    expect(isValidUsername('user-name')).toBe(false)
    expect(isValidUsername('utente.it')).toBe(false)
  })
})

describe('normalizeUsername', () => {
  it('trims whitespace and lowercases', () => {
    expect(normalizeUsername('  CrowenX4K2  ')).toBe('crowenx4k2')
  })
})

describe('slugifyUsername', () => {
  it('lowercases and strips non-alphanumeric characters', () => {
    expect(slugifyUsername('Crowen X4K2!')).toBe('crowenx4k2')
  })

  it('strips accents/diacritics rather than keeping them', () => {
    expect(slugifyUsername('Lukian Céres')).toBe('lukianceres')
  })

  it('truncates to 14 characters', () => {
    expect(slugifyUsername('a-very-long-display-name-here')).toBe('averylongdispl')
    expect(slugifyUsername('a-very-long-display-name-here').length).toBeLessThanOrEqual(14)
  })

  it('can produce an empty string for input with no alphanumeric characters', () => {
    expect(slugifyUsername('!!!')).toBe('')
  })
})
