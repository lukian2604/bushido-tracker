import { describe, it, expect } from 'vitest'
import { normalizeImageLink, MAX_IMAGE_LINK_LENGTH } from './image-data'

describe('normalizeImageLink', () => {
  it('accepts http(s) links, trimming spaces', () => {
    expect(normalizeImageLink('  https://example.com/cover.jpg ')).toBe('https://example.com/cover.jpg')
    expect(normalizeImageLink('http://books.google.com/x?id=1')).toBe('http://books.google.com/x?id=1')
  })

  it('rejects other protocols, garbage and overly long links', () => {
    expect(normalizeImageLink('javascript:alert(1)')).toBeNull()
    expect(normalizeImageLink('data:image/svg+xml;base64,AAAA')).toBeNull()
    expect(normalizeImageLink('not a url')).toBeNull()
    expect(normalizeImageLink('')).toBeNull()
    expect(normalizeImageLink(`https://example.com/${'a'.repeat(MAX_IMAGE_LINK_LENGTH)}`)).toBeNull()
  })
})
