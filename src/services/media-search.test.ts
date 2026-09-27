import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { searchMedia, fetchResultDetails } from './media-search'
import type { MediaSearchResult } from '@/lib/types'

const jsonResponse = (body: unknown, ok = true) =>
  Promise.resolve({ ok, json: () => Promise.resolve(body) } as Response)

type FetchRoute = (url: string, init?: RequestInit) => Promise<Response> | undefined

const routedFetch = (...routes: FetchRoute[]) =>
  vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    for (const route of routes) {
      const result = route(url, init)
      if (result) return result
    }
    throw new Error(`Unhandled fetch: ${url}`)
  })

const tmdbRoute = (results: Record<string, unknown>[]): FetchRoute => (url) =>
  url.includes('themoviedb.org') ? jsonResponse({ results }) : undefined

const aniListRoute = (media: Record<string, unknown>[]): FetchRoute => (url) =>
  url.includes('anilist.co') ? jsonResponse({ data: { Page: { media } } }) : undefined

const googleBooksRoute = (items: Record<string, unknown>[]): FetchRoute => (url) =>
  url.includes('googleapis.com/books') ? jsonResponse({ items }) : undefined

const shikimoriRoute = (entries: Record<string, unknown>[]): FetchRoute => (url) =>
  url.includes('shikimori.io') ? jsonResponse(entries) : undefined

const rawgRoute = (results: Record<string, unknown>[]): FetchRoute => (url) =>
  url.includes('api.rawg.io') ? jsonResponse({ results }) : undefined

const igdbRoute = (results: Record<string, unknown>[]): FetchRoute => (url) =>
  url.includes('/api/igdb-search') ? jsonResponse(results) : undefined

const freeToGameRoute = (games: Record<string, unknown>[]): FetchRoute => (url) =>
  url.includes('freetogame.com') ? jsonResponse(games) : undefined

const cheapSharkRoute = (games: Record<string, unknown>[]): FetchRoute => (url) =>
  url.includes('cheapshark.com') ? jsonResponse(games) : undefined

const wikidataRoute = (
  search: { id: string }[],
  entities: Record<string, unknown>,
  covers: Record<string, string> = {},
): FetchRoute => (url) => {
  if (url.includes('wikidata.org') && url.includes('action=wbsearchentities')) return jsonResponse({ search })
  if (url.includes('wikidata.org') && url.includes('action=wbgetentities')) {
    const ids = (new URL(url).searchParams.get('ids') || '').split('|')
    return jsonResponse({ entities: Object.fromEntries(ids.filter((id) => entities[id]).map((id) => [id, entities[id]])) })
  }
  if (url.includes('en.wikipedia.org')) {
    const pages = Object.entries(covers).map(([title, source], index) => [index, { title, thumbnail: { source: `${source}?utm_source=x` } }])
    return jsonResponse({ query: { pages: Object.fromEntries(pages) } })
  }
  return undefined
}

const openLibraryRoute = (docs: Record<string, unknown>[]): FetchRoute => (url) =>
  url.includes('openlibrary.org/search.json') && !url.includes('subject=comics') ? jsonResponse({ docs }) : undefined

const openLibraryComicsRoute = (docs: Record<string, unknown>[]): FetchRoute => (url) =>
  url.includes('openlibrary.org/search.json') && url.includes('subject=comics') ? jsonResponse({ docs }) : undefined

// Mappa testo-in -> testo-tradotto, così ogni chiamata a MyMemory (sia per la query sia
// per i titoli dei risultati) può restituire una risposta diversa e realistica.
const myMemoryRoute = (translations: Record<string, string>): FetchRoute => (url) => {
  if (!url.includes('mymemory.translated.net')) return undefined
  const q = new URL(url).searchParams.get('q') || ''
  return jsonResponse({ responseData: { translatedText: translations[q] ?? q } })
}

const emptyOk: FetchRoute = () => jsonResponse({})

// altTitles/tmdbRef servono solo al controllo doppioni: li togliamo dove il test verifica
// i campi mostrati all'utente.
const shownFields = (results: MediaSearchResult[]) =>
  results.map((result) => {
    const rest = { ...result }
    delete rest.altTitles
    delete rest.tmdbRef
    return rest
  })

beforeEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('searchMedia: input handling', () => {
  it('returns an empty array for an empty query without making any request', async () => {
    const fetchMock = routedFetch(emptyOk)
    vi.stubGlobal('fetch', fetchMock)
    expect(await searchMedia('video', '', 'en')).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns an empty array for a whitespace-only query', async () => {
    const fetchMock = routedFetch(emptyOk)
    vi.stubGlobal('fetch', fetchMock)
    expect(await searchMedia('video', '   ', 'en')).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('never throws, even if every underlying source fails', async () => {
    vi.stubEnv('VITE_TMDB_API_KEY', 'test-tmdb-key')
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('network down'))))
    await expect(searchMedia('video', 'Naruto', 'en')).resolves.toEqual([])
  })
})

describe('searchMedia: video', () => {
  it('merges TMDB and AniList results and sorts TMDB matches by popularity', async () => {
    vi.stubEnv('VITE_TMDB_API_KEY', 'test-tmdb-key')
    const fetchMock = routedFetch(
      tmdbRoute([
        { media_type: 'movie', title: 'Low Popularity Movie', popularity: 1, release_date: '2020-01-01', poster_path: '/a.jpg' },
        { media_type: 'tv', name: 'High Popularity Show', popularity: 99, first_air_date: '2021-05-05', poster_path: '/b.jpg' },
        { media_type: 'person', name: 'Someone Famous', popularity: 500 },
      ]),
      aniListRoute([
        {
          title: { romaji: 'Naruto', english: 'Naruto', native: 'ナルト' },
          startDate: { year: 2002 },
          coverImage: { medium: 'https://example.com/naruto.jpg' },
          studios: { nodes: [{ name: 'Studio Pierrot' }] },
          staff: { edges: [] },
        },
      ]),
      emptyOk,
    )
    vi.stubGlobal('fetch', fetchMock)

    const results = await searchMedia('video', 'test query', 'en')

    expect(results[0].title).toBe('High Popularity Show')
    expect(results[1].title).toBe('Low Popularity Movie')
    expect(results.some((r) => r.title === 'Someone Famous')).toBe(false)
    expect(results.some((r) => r.title === 'Naruto')).toBe(true)
    expect(results.find((r) => r.title === 'High Popularity Show')?.format).toBe('tv')
    expect(results.find((r) => r.title === 'Low Popularity Movie')?.format).toBe('movie')
  })

  it('falls back to AniList only when no TMDB key is configured', async () => {
    vi.stubEnv('VITE_TMDB_API_KEY', '')
    const fetchMock = routedFetch(
      aniListRoute([
        {
          title: { romaji: 'Bleach', english: 'Bleach', native: 'BLEACH' },
          startDate: { year: 2004 },
          coverImage: { medium: null },
          studios: { nodes: [] },
          staff: { edges: [] },
        },
      ]),
      emptyOk,
    )
    vi.stubGlobal('fetch', fetchMock)

    const results = await searchMedia('video', 'bleach', 'en')

    expect(shownFields(results)).toEqual([{ title: 'Bleach', year: '2004', studio: '', author: '', coverUrl: undefined }])
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('themoviedb.org'))).toBe(false)
  })

  it('translates a non-English query and searches both the original and translated text', async () => {
    vi.stubEnv('VITE_TMDB_API_KEY', '')
    const fetchMock = routedFetch(
      myMemoryRoute({ 'Американский дракон': 'american dragon' }),
      shikimoriRoute([{ russian: 'Американский дракон', aired_on: '2005-01-01', image: { original: '/img.jpg' } }]),
      aniListRoute([]),
      emptyOk,
    )
    vi.stubGlobal('fetch', fetchMock)

    const results = await searchMedia('video', 'Американский дракон', 'en')

    expect(results.some((r) => r.title === 'Американский дракон')).toBe(true)
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('mymemory.translated.net'))).toBe(true)
  })

  it('translates AniList anime titles into the site language when no TMDB key is configured', async () => {
    vi.stubEnv('VITE_TMDB_API_KEY', '')
    const fetchMock = routedFetch(
      myMemoryRoute({ shingeki: 'shingeki', 'Attack on Titan': "L'attacco dei giganti" }),
      aniListRoute([
        {
          title: { romaji: 'Shingeki no Kyojin', english: 'Attack on Titan', native: null },
          startDate: { year: 2013 },
          coverImage: { medium: null },
          studios: { nodes: [] },
          staff: { edges: [] },
        },
      ]),
      emptyOk,
    )
    vi.stubGlobal('fetch', fetchMock)

    const results = await searchMedia('video', 'shingeki', 'it')

    expect(shownFields(results)).toEqual([
      { title: "L'attacco dei giganti", year: '2013', studio: '', author: '', coverUrl: undefined, originalTitle: 'Attack on Titan' },
    ])
  })

  it('keeps the original title alongside a translated one, so an inaccurate machine translation stays recognizable', async () => {
    vi.stubEnv('VITE_TMDB_API_KEY', '')
    const fetchMock = routedFetch(
      myMemoryRoute({ shingeki: 'shingeki', 'Attack on Titan': 'Титры атаки' }),
      aniListRoute([
        {
          title: { romaji: 'Shingeki no Kyojin', english: 'Attack on Titan', native: null },
          startDate: { year: 2013 },
          coverImage: { medium: null },
          studios: { nodes: [] },
          staff: { edges: [] },
        },
      ]),
      emptyOk,
    )
    vi.stubGlobal('fetch', fetchMock)

    const [result] = await searchMedia('video', 'shingeki', 'ru')

    expect(result.title).toBe('Титры атаки')
    expect(result.originalTitle).toBe('Attack on Titan')
  })

  it('leaves AniList titles untouched for locales AniList already has a native title for', async () => {
    const fetchMock = routedFetch(
      myMemoryRoute({ shingeki: 'shingeki' }),
      aniListRoute([
        {
          title: { romaji: 'Shingeki no Kyojin', english: 'Attack on Titan', native: '進撃の巨人' },
          startDate: { year: 2013 },
          coverImage: { medium: null },
          studios: { nodes: [] },
          staff: { edges: [] },
        },
      ]),
      emptyOk,
    )
    vi.stubGlobal('fetch', fetchMock)

    const results = await searchMedia('video', 'shingeki', 'ja')

    expect(shownFields(results)).toEqual([{ title: '進撃の巨人', year: '2013', studio: '', author: '', coverUrl: undefined }])
  })

  it('does not call Shikimori for a non-Russian-script query', async () => {
    vi.stubEnv('VITE_TMDB_API_KEY', '')
    const fetchMock = routedFetch(aniListRoute([]), emptyOk)
    vi.stubGlobal('fetch', fetchMock)

    await searchMedia('video', 'One Piece', 'en')

    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('shikimori.io'))).toBe(false)
  })

  it('recovers if TMDB fails but AniList succeeds', async () => {
    vi.stubEnv('VITE_TMDB_API_KEY', 'test-tmdb-key')
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('themoviedb.org')) return Promise.reject(new Error('TMDB down'))
      if (url.includes('anilist.co'))
        return jsonResponse({
          data: {
            Page: {
              media: [
                {
                  title: { romaji: 'Death Note', english: 'Death Note', native: null },
                  startDate: { year: 2006 },
                  coverImage: { medium: null },
                  studios: { nodes: [] },
                  staff: { edges: [] },
                },
              ],
            },
          },
        })
      return jsonResponse({})
    })
    vi.stubGlobal('fetch', fetchMock)

    const results = await searchMedia('video', 'death note', 'en')

    expect(results).toEqual([{ title: 'Death Note', year: '2006', studio: '', author: '', coverUrl: undefined }])
  })
})

describe('searchMedia: manga', () => {
  it('combines AniList manga results with the Google Books comics fallback', async () => {
    const fetchMock = routedFetch(
      aniListRoute([
        {
          title: { romaji: 'One Piece', english: 'One Piece', native: null },
          startDate: { year: 1997 },
          coverImage: { medium: null },
          studios: { nodes: [] },
          staff: { edges: [{ node: { name: { full: 'Eiichiro Oda' } } }] },
        },
      ]),
      googleBooksRoute([
        { volumeInfo: { title: 'Watchmen', publishedDate: '1987-09-01', publisher: 'DC Comics', authors: ['Alan Moore'] } },
      ]),
      emptyOk,
    )
    vi.stubGlobal('fetch', fetchMock)

    const results = await searchMedia('manga', 'comics', 'en')

    expect(results.some((r) => r.title === 'One Piece' && r.author === 'Eiichiro Oda')).toBe(true)
    expect(results.some((r) => r.title === 'Watchmen' && r.studio === 'DC Comics')).toBe(true)
  })

  it('also includes Open Library comics results, tagged as comics', async () => {
    const fetchMock = routedFetch(
      aniListRoute([]),
      googleBooksRoute([]),
      openLibraryComicsRoute([{ title: 'Maus', author_name: ['Art Spiegelman'], first_publish_year: 1980 }]),
    )
    vi.stubGlobal('fetch', fetchMock)

    const results = await searchMedia('manga', 'maus', 'en')

    expect(results).toEqual([{ title: 'Maus', year: '1980', studio: '', author: 'Art Spiegelman', coverUrl: undefined, format: 'comic' }])
  })

  it('restricts the Google Books comics fallback to the site language', async () => {
    const fetchMock = routedFetch(myMemoryRoute({ fumetti: 'fumetti' }), aniListRoute([]), googleBooksRoute([]))
    vi.stubGlobal('fetch', fetchMock)

    await searchMedia('manga', 'fumetti', 'it')

    const comicsCall = fetchMock.mock.calls.find(([url]) => String(url).includes('subject:comics'))
    expect(comicsCall).toBeDefined()
    expect(String(comicsCall![0])).toContain('langRestrict=it')
  })

  it('restricts the comics fallback by the language of the query, not the site UI language', async () => {
    const fetchMock = routedFetch(shikimoriRoute([]), aniListRoute([]), googleBooksRoute([]))
    vi.stubGlobal('fetch', fetchMock)

    // Sito impostato in italiano, ma la query è scritta in russo.
    await searchMedia('manga', 'Психотрюки', 'it')

    const comicsCall = fetchMock.mock.calls.find(([url]) => String(url).includes('subject:comics'))
    expect(comicsCall).toBeDefined()
    expect(String(comicsCall![0])).toContain('langRestrict=ru')
  })

  it('tags each result with its exact format, so a manga, a light novel and a western comic are distinguishable', async () => {
    const fetchMock = routedFetch(
      aniListRoute([
        {
          title: { romaji: 'Rakudai Kishi no Cavalry', english: 'Chivalry of a Failed Knight', native: null },
          startDate: { year: 2014 },
          coverImage: { medium: null },
          studios: { nodes: [] },
          staff: { edges: [] },
          format: 'MANGA',
        },
        {
          title: { romaji: 'Rakudai Kishi no Cavalry', english: null, native: null },
          startDate: { year: 2013 },
          coverImage: { medium: null },
          studios: { nodes: [] },
          staff: { edges: [{ node: { name: { full: 'Riku Misora' } } }] },
          format: 'NOVEL',
        },
      ]),
      googleBooksRoute([{ volumeInfo: { title: 'Watchmen', publishedDate: '1987-09-01' } }]),
      emptyOk,
    )
    vi.stubGlobal('fetch', fetchMock)

    const results = await searchMedia('manga', 'rakudai', 'en')

    expect(results.find((r) => r.author === '')?.format).toBe('manga')
    expect(results.find((r) => r.author === 'Riku Misora')?.format).toBe('novel')
    expect(results.find((r) => r.title === 'Watchmen')?.format).toBe('comic')
  })
})

describe('searchMedia: books and audiobooks', () => {
  it('ranks results by how well they match the query (exact title first, author words count too)', async () => {
    const fetchMock = routedFetch(
      googleBooksRoute([
        { volumeInfo: { title: 'Евангелие от Агасфера', publishedDate: '2022', authors: ['Лебедько'] } },
        { volumeInfo: { title: 'Мистики и тамплиеры', publishedDate: '1998', authors: ['Никитин'] } },
        { volumeInfo: { title: 'Агасфер. Вечный жид', publishedDate: '2015', authors: ['Эжен Сю'] } },
        { volumeInfo: { title: 'Агасфер', publishedDate: '2018', authors: ['Эжен Сю'] } },
      ]),
      openLibraryRoute([]),
    )
    vi.stubGlobal('fetch', fetchMock)

    const byTitle = await searchMedia('book', 'агасфер', 'ru')
    expect(byTitle.map((r) => r.title)).toEqual(['Агасфер', 'Агасфер. Вечный жид', 'Евангелие от Агасфера', 'Мистики и тамплиеры'])

    const withAuthor = await searchMedia('book', 'вечный жид сю', 'ru')
    expect(withAuthor[0].title).toBe('Агасфер. Вечный жид')
  })

  it('keeps books with the same title but different authors, and merges the same author written differently', async () => {
    const fetchMock = routedFetch(
      googleBooksRoute([
        { volumeInfo: { title: 'Агасфер', publishedDate: '2018', authors: ['Эжен Сю'] } },
        { volumeInfo: { title: 'Агасфер', publishedDate: '2009', authors: ['Александр Шойхет'] } },
      ]),
      openLibraryRoute([{ title: 'Агасфер', author_name: ['Сю, Эжен'], first_publish_year: 1844, cover_i: 42 }]),
    )
    vi.stubGlobal('fetch', fetchMock)

    const results = await searchMedia('book', 'Агасфер', 'ru')

    expect(results.map((r) => [r.title, r.author, r.year])).toEqual([
      ['Агасфер', 'Эжен Сю', '2018'],
      ['Агасфер', 'Александр Шойхет', '2009'],
    ])
    expect(results[0].coverUrl).toBe('https://covers.openlibrary.org/b/id/42-M.jpg')
  })

  it('queries Google Books restricted to the given locale and maps fields', async () => {
    const fetchMock = routedFetch(
      googleBooksRoute([
        {
          volumeInfo: {
            title: 'Il nome della rosa',
            publishedDate: '1980-01-01',
            publisher: 'Bompiani',
            authors: ['Umberto Eco'],
            imageLinks: { thumbnail: 'https://example.com/cover.jpg' },
          },
        },
      ]),
    )
    vi.stubGlobal('fetch', fetchMock)

    const results = await searchMedia('book', 'il nome della rosa', 'it')

    expect(results).toEqual([
      { title: 'Il nome della rosa', year: '1980', studio: 'Bompiani', author: 'Umberto Eco', coverUrl: 'https://example.com/cover.jpg' },
    ])
    const calledUrl = String(fetchMock.mock.calls[0][0])
    expect(calledUrl).toContain('langRestrict=it')
    expect(calledUrl).toContain('il%20nome%20della%20rosa')
  })

  it('restricts by the language the query is written in, not the site UI language', async () => {
    const fetchMock = routedFetch(googleBooksRoute([{ volumeInfo: { title: 'Психотрюки', publishedDate: '2018-01-01' } }]))
    vi.stubGlobal('fetch', fetchMock)

    // Sito impostato in italiano, ma la query è scritta in russo (cirillico).
    const results = await searchMedia('book', 'Психотрюки', 'it')

    expect(results[0].title).toBe('Психотрюки')
    const calledUrl = String(fetchMock.mock.calls[0][0])
    expect(calledUrl).toContain('langRestrict=ru')
    expect(calledUrl).not.toContain('langRestrict=it')
  })

  it('treats audiobook the same as book', async () => {
    const fetchMock = routedFetch(googleBooksRoute([]))
    vi.stubGlobal('fetch', fetchMock)
    expect(await searchMedia('audiobook', 'some title', 'en')).toEqual([])
  })

  it('returns an empty array when Google Books responds with an error status', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({}, false)))
    expect(await searchMedia('book', 'anything', 'en')).toEqual([])
  })

  it('supplements Google Books with Open Library results, deduping by title', async () => {
    const fetchMock = routedFetch(
      googleBooksRoute([{ volumeInfo: { title: 'Dune', authors: ['Frank Herbert'], publishedDate: '1965-01-01' } }]),
      openLibraryRoute([
        { title: 'Dune', author_name: ['Frank Herbert'], first_publish_year: 1965 },
        { title: 'Dune Messiah', author_name: ['Frank Herbert'], first_publish_year: 1969, cover_i: 123 },
      ]),
    )
    vi.stubGlobal('fetch', fetchMock)

    const results = await searchMedia('book', 'dune', 'en')

    expect(results.some((r) => r.title === 'Dune')).toBe(true)
    expect(results.filter((r) => r.title === 'Dune')).toHaveLength(1)
    expect(results.find((r) => r.title === 'Dune Messiah')).toEqual({
      title: 'Dune Messiah', year: '1969', studio: '', author: 'Frank Herbert',
      coverUrl: 'https://covers.openlibrary.org/b/id/123-M.jpg', format: undefined,
    })
  })

  it('still finds books via Open Library when Google Books fails (e.g. quota exceeded)', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('googleapis.com/books')) return jsonResponse({}, false)
      if (url.includes('openlibrary.org/search.json')) return jsonResponse({ docs: [{ title: 'Foundation', author_name: ['Isaac Asimov'] }] })
      throw new Error(`Unhandled fetch: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    const results = await searchMedia('book', 'foundation', 'en')

    expect(results.some((r) => r.title === 'Foundation')).toBe(true)
  })
})

describe('searchMedia: games', () => {
  // searchFreeToGameOnce tiene il catalogo scaricato in una cache a livello di modulo
  // (l'API non offre un parametro di ricerca, quindi lo si scarica una sola volta per
  // sessione e si filtra per titolo lato client). Per non far "trapelare" quella cache
  // da un test al successivo, ricarichiamo il modulo da zero prima di ogni test.
  let searchMedia: typeof import('./media-search').searchMedia

  beforeEach(async () => {
    vi.resetModules()
    ;({ searchMedia } = await import('./media-search'))
  })

  it('does not call RAWG without an API key, but still queries the keyless sources', async () => {
    vi.stubEnv('VITE_RAWG_API_KEY', '')
    const fetchMock = routedFetch(igdbRoute([]), freeToGameRoute([]), cheapSharkRoute([]))
    vi.stubGlobal('fetch', fetchMock)

    expect(await searchMedia('game', 'zelda', 'en')).toEqual([])
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('api.rawg.io'))).toBe(false)
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/api/igdb-search'))).toBe(true)
  })

  it('maps RAWG results when a key is configured', async () => {
    vi.stubEnv('VITE_RAWG_API_KEY', 'test-rawg-key')
    const fetchMock = routedFetch(
      rawgRoute([{ name: 'The Legend of Zelda', released: '1986-02-21', background_image: 'https://example.com/zelda.jpg' }]),
      igdbRoute([]),
      freeToGameRoute([]),
      cheapSharkRoute([]),
    )
    vi.stubGlobal('fetch', fetchMock)

    const results = await searchMedia('game', 'zelda', 'en')

    expect(results).toEqual([
      { title: 'The Legend of Zelda', year: '1986', studio: '', author: '', coverUrl: 'https://example.com/zelda.jpg' },
    ])
  })

  it('maps IGDB results from our serverless proxy (available even without a RAWG key)', async () => {
    vi.stubEnv('VITE_RAWG_API_KEY', '')
    const fetchMock = routedFetch(
      igdbRoute([{ title: 'Hollow Knight', year: '2017', coverUrl: 'https://example.com/hollow-knight.jpg' }]),
      freeToGameRoute([]),
      cheapSharkRoute([]),
    )
    vi.stubGlobal('fetch', fetchMock)

    const results = await searchMedia('game', 'hollow knight', 'en')

    expect(results).toEqual([
      { title: 'Hollow Knight', year: '2017', studio: '', author: '', coverUrl: 'https://example.com/hollow-knight.jpg' },
    ])
  })

  it('maps Wikidata games (keyless), skipping non-game entities, with developer, first release year and Wikipedia cover', async () => {
    vi.stubEnv('VITE_RAWG_API_KEY', '')
    const claim = (value: unknown) => ({ mainsnak: { datavalue: { value } } })
    const fetchMock = routedFetch(
      igdbRoute([]),
      freeToGameRoute([]),
      cheapSharkRoute([]),
      wikidataRoute(
        [{ id: 'Q1346174' }, { id: 'Q467078' }],
        {
          Q1346174: {
            labels: { en: { value: 'InFamous' } },
            claims: {
              P31: [claim({ id: 'Q7889' })],
              P178: [claim({ id: 'Q916714' })],
              P577: [claim({ time: '+2009-06-05T00:00:00Z' }), claim({ time: '+2009-05-26T00:00:00Z' })],
            },
            sitelinks: { enwiki: { title: 'Infamous (video game)' } },
          },
          // Film con lo stesso nome: va scartato (P31 non è un videogioco).
          Q467078: { labels: { en: { value: 'Infamous' } }, claims: { P31: [claim({ id: 'Q11424' })] } },
          Q916714: { labels: { mul: { value: 'Sucker Punch Productions' } } },
        },
        { 'Infamous (video game)': 'https://upload.wikimedia.org/infamous.jpg' },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const results = await searchMedia('game', 'infamous', 'en')

    expect(results).toEqual([
      { title: 'InFamous', year: '2009', studio: 'Sucker Punch Productions', author: '', coverUrl: 'https://upload.wikimedia.org/infamous.jpg' },
    ])
  })

  it('keeps same-title works with different years apart when there is no author to tell them apart', async () => {
    vi.stubEnv('VITE_RAWG_API_KEY', '')
    const fetchMock = routedFetch(
      igdbRoute([
        { title: 'Doom', year: '1993', studio: 'id Software' },
        { title: 'Doom', year: '2016', studio: 'id Software' },
      ]),
      freeToGameRoute([]),
      cheapSharkRoute([{ external: 'DOOM', thumb: 'https://example.com/doom.jpg' }]),
    )
    vi.stubGlobal('fetch', fetchMock)

    const results = await searchMedia('game', 'doom', 'en')

    expect(results.map((r) => r.year)).toEqual(['1993', '2016'])
  })

  it('fills a missing cover from a duplicate found by another source', async () => {
    vi.stubEnv('VITE_RAWG_API_KEY', '')
    const fetchMock = routedFetch(
      igdbRoute([{ title: 'Hades', year: '2020', studio: 'Supergiant Games' }]),
      freeToGameRoute([]),
      cheapSharkRoute([{ external: 'HADES', thumb: 'https://example.com/hades.jpg' }]),
    )
    vi.stubGlobal('fetch', fetchMock)

    const results = await searchMedia('game', 'hades', 'en')

    expect(results).toEqual([
      { title: 'Hades', year: '2020', studio: 'Supergiant Games', author: '', coverUrl: 'https://example.com/hades.jpg' },
    ])
  })

  it('maps CheapShark results', async () => {
    vi.stubEnv('VITE_RAWG_API_KEY', '')
    const fetchMock = routedFetch(
      igdbRoute([]),
      freeToGameRoute([]),
      cheapSharkRoute([{ external: 'Batman: Arkham Knight', thumb: 'https://example.com/batman.jpg' }]),
    )
    vi.stubGlobal('fetch', fetchMock)

    const results = await searchMedia('game', 'batman', 'en')

    expect(results).toEqual([
      { title: 'Batman: Arkham Knight', year: '', studio: '', author: '', coverUrl: 'https://example.com/batman.jpg' },
    ])
  })

  it('downloads the FreeToGame catalog once and filters it by title, case-insensitively', async () => {
    vi.stubEnv('VITE_RAWG_API_KEY', '')
    const fetchMock = routedFetch(
      igdbRoute([]),
      freeToGameRoute([
        { title: 'War Thunder', release_date: '2013-08-15', thumbnail: 'https://example.com/war-thunder.jpg' },
        { title: 'Path of Exile', release_date: '2013-10-23', thumbnail: 'https://example.com/poe.jpg' },
      ]),
      cheapSharkRoute([]),
    )
    vi.stubGlobal('fetch', fetchMock)

    const firstQuery = await searchMedia('game', 'WAR', 'en')
    expect(firstQuery).toEqual([
      { title: 'War Thunder', year: '2013', studio: '', author: '', coverUrl: 'https://example.com/war-thunder.jpg' },
    ])

    // Una seconda ricerca non deve ri-scaricare il catalogo FreeToGame.
    const freeToGameCallsBefore = fetchMock.mock.calls.filter(([url]) => String(url).includes('freetogame.com')).length
    await searchMedia('game', 'exile', 'en')
    const freeToGameCallsAfter = fetchMock.mock.calls.filter(([url]) => String(url).includes('freetogame.com')).length
    expect(freeToGameCallsAfter).toBe(freeToGameCallsBefore)
  })

  it('does not machine-translate game titles (keeps the official name)', async () => {
    vi.stubEnv('VITE_RAWG_API_KEY', '')
    const fetchMock = routedFetch(
      myMemoryRoute({ 'hollow knight': 'hollow knight', 'Hollow Knight': 'Cavaliere cavo' }),
      igdbRoute([{ title: 'Hollow Knight', year: '2017', studio: 'Team Cherry' }]),
      freeToGameRoute([]),
      cheapSharkRoute([]),
    )
    vi.stubGlobal('fetch', fetchMock)

    const results = await searchMedia('game', 'hollow knight', 'it')

    expect(results).toEqual([{ title: 'Hollow Knight', year: '2017', studio: 'Team Cherry', author: '', coverUrl: undefined }])
  })

  it('uses the real localized name from Wikidata and merges it with the English result from another source', async () => {
    vi.stubEnv('VITE_RAWG_API_KEY', '')
    const claim = (value: unknown) => ({ mainsnak: { datavalue: { value } } })
    const fetchMock = routedFetch(
      myMemoryRoute({}),
      igdbRoute([{ title: 'The Witcher 3: Wild Hunt', year: '2015', studio: 'CD Projekt Red', coverUrl: 'https://example.com/w3.jpg' }]),
      freeToGameRoute([]),
      cheapSharkRoute([]),
      wikidataRoute(
        [{ id: 'Q107727' }],
        {
          Q107727: {
            labels: { ru: { value: 'Ведьмак 3: Дикая Охота' }, en: { value: 'The Witcher 3: Wild Hunt' } },
            claims: { P31: [claim({ id: 'Q7889' })], P577: [claim({ time: '+2015-05-19T00:00:00Z' })] },
          },
        },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const results = await searchMedia('game', 'witcher 3', 'ru')

    expect(shownFields(results)).toEqual([
      {
        title: 'Ведьмак 3: Дикая Охота',
        originalTitle: 'The Witcher 3: Wild Hunt',
        year: '2015',
        studio: 'CD Projekt Red',
        author: '',
        coverUrl: 'https://example.com/w3.jpg',
      },
    ])
  })
})

describe('fetchResultDetails', () => {
  it('returns production companies and all translated titles for a TMDB movie', async () => {
    vi.stubEnv('VITE_TMDB_API_KEY', 'test-tmdb-key')
    const fetchMock = routedFetch((url) =>
      url.includes('/movie/335984?')
        ? jsonResponse({
            production_companies: [{ name: 'Alcon Entertainment' }, { name: 'Columbia Pictures' }, { name: 'Scott Free' }],
            translations: { translations: [{ data: { title: 'Бегущий по лезвию 2049' } }, { data: { title: '' } }] },
          })
        : undefined,
    )
    vi.stubGlobal('fetch', fetchMock)

    const details = await fetchResultDetails({
      title: 'Blade Runner 2049',
      year: '2017',
      studio: '',
      author: '',
      tmdbRef: { type: 'movie', id: 335984 },
    })

    expect(details).toEqual({ altTitles: ['Бегущий по лезвию 2049'], studio: 'Alcon Entertainment / Columbia Pictures' })
  })

  it('works without a TMDB reference (uses the titles already known)', async () => {
    const details = await fetchResultDetails({ title: 'Ведьмак 3', originalTitle: 'The Witcher 3', year: '', studio: '', author: '' })
    expect(details).toEqual({ altTitles: ['The Witcher 3'], studio: '' })
  })
})
