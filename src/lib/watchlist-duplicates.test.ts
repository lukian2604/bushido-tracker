import { describe, it, expect } from 'vitest'
import { findDuplicateItem } from './watchlist-duplicates'

const items = [
  { id: 'a', title: 'Агасфер. Том 1', year: '1993' },
  { id: 'b', title: 'Dune', year: '1984' },
  { id: 'c', title: 'InFAMOUS', year: '' },
]

describe('findDuplicateItem', () => {
  it('matches the same title ignoring case, punctuation and extra spaces', () => {
    expect(findDuplicateItem(items, { title: 'агасфер  том 1', year: '1993' })?.id).toBe('a')
    expect(findDuplicateItem(items, { title: 'Infamous', year: '2009' })?.id).toBe('c')
  })

  it('allows the same title with a different year (remakes, new editions)', () => {
    expect(findDuplicateItem(items, { title: 'Dune', year: '2021' })).toBeUndefined()
    expect(findDuplicateItem(items, { title: 'Dune', year: '' })?.id).toBe('b')
  })

  it('ignores the item being edited and different titles', () => {
    expect(findDuplicateItem(items, { title: 'Dune', year: '1984' }, 'b')).toBeUndefined()
    expect(findDuplicateItem(items, { title: 'Агасфер. Том 2', year: '1993' })).toBeUndefined()
    expect(findDuplicateItem(items, { title: '  ', year: '' })).toBeUndefined()
  })
})
