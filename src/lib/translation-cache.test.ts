import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getCachedTitleTranslation, setCachedTitleTranslation } from './translation-cache'

class FakeLocalStorage {
  private store = new Map<string, string>()
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  setItem(key: string, value: string) {
    this.store.set(key, value)
  }
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('translation cache with localStorage available', () => {
  it('returns undefined for a title never cached', () => {
    vi.stubGlobal('localStorage', new FakeLocalStorage())
    expect(getCachedTitleTranslation('Naruto', 'it')).toBeUndefined()
  })

  it('returns a previously cached translation', () => {
    vi.stubGlobal('localStorage', new FakeLocalStorage())
    setCachedTitleTranslation('Naruto', 'it', 'Naruto (ita)')
    expect(getCachedTitleTranslation('Naruto', 'it')).toBe('Naruto (ita)')
  })

  it('is case-insensitive and trims the title when building the cache key', () => {
    vi.stubGlobal('localStorage', new FakeLocalStorage())
    setCachedTitleTranslation('  Naruto  ', 'it', 'Naruto (ita)')
    expect(getCachedTitleTranslation('naruto', 'it')).toBe('Naruto (ita)')
  })

  it('keeps separate translations per target language for the same title', () => {
    vi.stubGlobal('localStorage', new FakeLocalStorage())
    setCachedTitleTranslation('Naruto', 'it', 'Naruto (ita)')
    setCachedTitleTranslation('Naruto', 'ru', 'Наруто')
    expect(getCachedTitleTranslation('Naruto', 'it')).toBe('Naruto (ita)')
    expect(getCachedTitleTranslation('Naruto', 'ru')).toBe('Наруто')
  })
})

describe('translation cache resilience', () => {
  it('never throws when localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', undefined)
    expect(() => getCachedTitleTranslation('Naruto', 'it')).not.toThrow()
    expect(() => setCachedTitleTranslation('Naruto', 'it', 'x')).not.toThrow()
    expect(getCachedTitleTranslation('Naruto', 'it')).toBeUndefined()
  })

  it('never throws when localStorage holds corrupted JSON', () => {
    const storage = new FakeLocalStorage()
    storage.setItem('bushido:title-translations', '{not valid json')
    vi.stubGlobal('localStorage', storage)
    expect(getCachedTitleTranslation('Naruto', 'it')).toBeUndefined()
  })
})
