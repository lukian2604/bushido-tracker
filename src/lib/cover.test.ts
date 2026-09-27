import { describe, it, expect } from 'vitest'
import { largerCoverUrl } from './cover'

describe('largerCoverUrl', () => {
  it('upgrades known thumbnail formats to a larger size', () => {
    expect(largerCoverUrl('https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx1-abc.jpg')).toBe(
      'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1-abc.jpg',
    )
    expect(largerCoverUrl('https://image.tmdb.org/t/p/w185/poster.jpg')).toBe('https://image.tmdb.org/t/p/w500/poster.jpg')
    expect(largerCoverUrl('https://covers.openlibrary.org/b/id/123-M.jpg')).toBe('https://covers.openlibrary.org/b/id/123-L.jpg')
    expect(largerCoverUrl('https://images.igdb.com/igdb/image/upload/t_cover_big/co1.jpg')).toBe(
      'https://images.igdb.com/igdb/image/upload/t_cover_big_2x/co1.jpg',
    )
    expect(largerCoverUrl('https://commons.wikimedia.org/wiki/Special:FilePath/Game.png?width=300')).toBe(
      'https://commons.wikimedia.org/wiki/Special:FilePath/Game.png?width=900',
    )
  })

  it('leaves unknown URLs (e.g. user uploads) unchanged', () => {
    const url = 'https://firebasestorage.googleapis.com/v0/b/x/o/cover.jpg?alt=media'
    expect(largerCoverUrl(url)).toBe(url)
  })
})
