import type { MediaSearchResult, MediaType } from '@/lib/types'
import { getCachedTitleTranslation, setCachedTitleTranslation } from '@/lib/translation-cache'

const ANILIST_ENDPOINT = 'https://graphql.anilist.co'
const GOOGLE_BOOKS_ENDPOINT = 'https://www.googleapis.com/books/v1/volumes'
const RAWG_ENDPOINT = 'https://api.rawg.io/api/games'
const TMDB_ENDPOINT = 'https://api.themoviedb.org/3/search/multi'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185'
const MYMEMORY_ENDPOINT = 'https://api.mymemory.translated.net/get'
const SHIKIMORI_ENDPOINT = 'https://shikimori.one/api'
const OPENLIBRARY_ENDPOINT = 'https://openlibrary.org/search.json'
const OPENLIBRARY_COVER_BASE = 'https://covers.openlibrary.org/b/id'
const FREETOGAME_ENDPOINT = 'https://www.freetogame.com/api/games'
const CHEAPSHARK_ENDPOINT = 'https://www.cheapshark.com/api/1.0/games'
// Nostra funzione serverless (api/igdb-search.ts) — IGDB richiede un Client-Secret
// che non può stare nel browser, quindi la vera chiamata avviene lì, lato server.
const IGDB_SEARCH_ENDPOINT = '/api/igdb-search'

// TMDB vuole un tag lingua-paese (es. "it-IT"), non solo il codice lingua a 2 lettere.
const LANGUAGE_TO_BCP47: Record<string, string> = {
  en: 'en-US', it: 'it-IT', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', pt: 'pt-PT', ru: 'ru-RU',
  ja: 'ja-JP', zh: 'zh-CN', nl: 'nl-NL', uk: 'uk-UA', pl: 'pl-PL', sv: 'sv-SE', no: 'no-NO',
  da: 'da-DK', fi: 'fi-FI', el: 'el-GR', tr: 'tr-TR', ko: 'ko-KR', id: 'id-ID', vi: 'vi-VN',
  th: 'th-TH', ar: 'ar-SA', he: 'he-IL',
}

// Servizio di traduzione gratuito, senza chiave — usato in due direzioni:
// 1) tradurre i titoli trovati (es. AniList non ha titoli in russo/italiano/ecc.)
// 2) tradurre la query di ricerca verso l'inglese, perché la maggior parte delle
//    banche dati (AniList, TMDB, RAWG) indicizza i titoli soprattutto in inglese/originale,
//    non nella traduzione del titolo nella lingua dell'utente.
const translateText = async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
  if (!text || sourceLang === targetLang) return text
  try {
    const url = `${MYMEMORY_ENDPOINT}?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
    const response = await fetch(url)
    if (!response.ok) return text
    const json = await response.json()
    const translated = json?.responseData?.translatedText
    return typeof translated === 'string' && translated.trim() ? translated : text
  } catch {
    return text
  }
}

// Nessuna fonte gratuita ha titoli "ufficiali" per anime/videogiochi in lingue diverse
// da inglese/giapponese, quindi per queste categorie il titolo va tradotto automaticamente.
// Una cache (in localStorage) evita di ritradurre lo stesso titolo ad ogni ricerca.
const translateTitle = async (title: string, targetLang: string): Promise<string> => {
  if (!title) return title
  const cached = getCachedTitleTranslation(title, targetLang)
  if (cached !== undefined) return cached

  const translated = await translateText(title, 'en', targetLang)
  if (translated !== title) setCachedTitleTranslation(title, targetLang, translated)
  return translated
}

// Il titolo tradotto qui non è mai una traduzione "ufficiale" di distribuzione (non esiste
// una fonte gratuita che la fornisca per queste categorie, solo una traduzione automatica
// letterale) — conserviamo quindi anche l'originale, per mostrarlo come riferimento se la
// traduzione risultasse imprecisa o irriconoscibile.
const translateTitles = (results: MediaSearchResult[], locale: string): Promise<MediaSearchResult[]> =>
  Promise.all(
    results.map(async (result) => {
      const translated = await translateTitle(result.title, locale)
      return translated === result.title ? result : { ...result, title: translated, originalTitle: result.title }
    }),
  )

const dedupeByTitle = (results: MediaSearchResult[]): MediaSearchResult[] => {
  const seen = new Set<string>()
  return results.filter((result) => {
    const key = result.title.toLowerCase().trim()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// Riconosce la lingua da come è scritta la query (dal suo alfabeto/script), non da quella
// impostata nel profilo — altrimenti una query in russo con il Paese su un altro paese
// finirebbe tradotta "da" una lingua sbagliata e la traduzione non farebbe nulla.
const SCRIPT_LANGUAGE_RANGES: { language: string; pattern: RegExp }[] = [
  { language: 'ru', pattern: /[Ѐ-ӿ]/ },
  { language: 'el', pattern: /[Ͱ-Ͽ]/ },
  { language: 'ar', pattern: /[؀-ۿ]/ },
  { language: 'he', pattern: /[֐-׿]/ },
  { language: 'th', pattern: /[฀-๿]/ },
  { language: 'ko', pattern: /[가-힯]/ },
  { language: 'ja', pattern: /[぀-ヿ]/ },
  { language: 'zh', pattern: /[一-鿿]/ },
]

const detectQueryLanguage = (query: string, fallback: string): string => {
  const match = SCRIPT_LANGUAGE_RANGES.find(({ pattern }) => pattern.test(query))
  return match?.language || fallback
}

// Prova la ricerca sia con la query originale sia (se non è già in inglese) con una
// traduzione in inglese — così "Американский дракон" trova comunque "American Dragon".
const searchWithTranslatedQuery = async (
  query: string,
  locale: string,
  search: (q: string, sourceLang: string) => Promise<MediaSearchResult[]>,
): Promise<MediaSearchResult[]> => {
  const sourceLang = detectQueryLanguage(query, locale)
  if (sourceLang === 'en') return search(query, sourceLang)

  const englishQuery = await translateText(query, sourceLang, 'en')
  if (englishQuery.trim().toLowerCase() === query.trim().toLowerCase()) return search(query, sourceLang)

  const [original, translated] = await Promise.all([
    search(query, sourceLang).catch(() => []),
    search(englishQuery, sourceLang).catch(() => []),
  ])
  return dedupeByTitle([...translated, ...original])
}

const ANILIST_QUERY = `
  query ($search: String, $type: MediaType) {
    Page(page: 1, perPage: 50) {
      media(search: $search, type: $type, sort: SEARCH_MATCH) {
        title { romaji english native }
        startDate { year }
        coverImage { medium }
        studios(isMain: true) { nodes { name } }
        staff(sort: RELEVANCE, perPage: 1) { edges { node { name { full } } } }
        format
      }
    }
  }
`

interface AniListMedia {
  title: { romaji: string | null; english: string | null; native: string | null }
  startDate: { year: number | null }
  coverImage: { medium: string | null }
  studios: { nodes: { name: string }[] }
  staff: { edges: { node: { name: { full: string } } }[] }
  format: string | null
}

const preferredAniListTitle = (title: AniListMedia['title'], locale: string) => {
  if ((locale === 'ja' || locale === 'zh') && title.native) return title.native
  return title.english || title.romaji || title.native || ''
}

// AniList distingue anche manga da light novel/one-shot (type: MANGA copre tutti e tre) e
// vari formati di anime (type: ANIME) — senza mostrarlo, risultati molto diversi tra loro
// (es. un manga e il suo light novel) sembrano voci identiche nella lista di ricerca.
const ANILIST_FORMAT_KEYS: Record<string, string> = {
  MANGA: 'manga', NOVEL: 'novel', ONE_SHOT: 'oneshot',
  TV: 'tv', TV_SHORT: 'tv', MOVIE: 'movie', SPECIAL: 'special', OVA: 'ova', ONA: 'ona', MUSIC: 'music',
}

const mapAniListMedia = (media: AniListMedia[], locale: string): MediaSearchResult[] =>
  media.map((item) => ({
    title: preferredAniListTitle(item.title, locale),
    year: item.startDate.year ? String(item.startDate.year) : '',
    studio: item.studios.nodes[0]?.name || '',
    author: item.staff.edges[0]?.node.name.full || '',
    coverUrl: item.coverImage.medium || undefined,
    format: (item.format && ANILIST_FORMAT_KEYS[item.format]) || undefined,
  }))

const ANILIST_NATIVE_LOCALES = ['en', 'ja', 'zh']

const searchAniListOnce = async (query: string, type: 'ANIME' | 'MANGA'): Promise<AniListMedia[]> => {
  const response = await fetch(ANILIST_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query: ANILIST_QUERY, variables: { search: query, type } }),
  })
  if (!response.ok) return []
  const json = await response.json()
  return json?.data?.Page?.media || []
}

// Shikimori: database di anime/manga russo, gratuito e senza chiave — ha titoli in russo
// veri (non tradotti automaticamente), molto meglio di AniList per un pubblico russofono.
interface ShikimoriEntry {
  name?: string
  russian?: string
  aired_on?: string | null
  image?: { original?: string }
}

const searchShikimoriOnce = async (query: string, kind: 'animes' | 'mangas'): Promise<MediaSearchResult[]> => {
  try {
    const url = `${SHIKIMORI_ENDPOINT}/${kind}?search=${encodeURIComponent(query)}&limit=8`
    const response = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!response.ok) return []
    const json: ShikimoriEntry[] = await response.json()
    if (!Array.isArray(json)) return []

    return json.map((item) => ({
      title: item.russian || item.name || '',
      year: (item.aired_on || '').slice(0, 4),
      studio: '',
      author: '',
      coverUrl: item.image?.original ? `https://shikimori.one${item.image.original}` : undefined,
      format: kind === 'animes' ? 'tv' : 'manga',
    }))
  } catch {
    return []
  }
}

const mapGoogleBooksItems = (items: { volumeInfo?: Record<string, unknown> }[], format?: string): MediaSearchResult[] =>
  items.map((item) => {
    const info = item.volumeInfo || {}
    const publishedDate = typeof info.publishedDate === 'string' ? info.publishedDate : ''
    const imageLinks = info.imageLinks as { thumbnail?: string } | undefined
    const authors = info.authors as string[] | undefined
    return {
      title: typeof info.title === 'string' ? info.title : '',
      year: publishedDate.slice(0, 4),
      studio: typeof info.publisher === 'string' ? info.publisher : '',
      author: authors?.join(', ') || '',
      coverUrl: imageLinks?.thumbnail,
      format,
    }
  })

// langRestrict va calcolato dalla lingua in cui è scritta la query (stesso rilevamento da
// alfabeto usato per Video/Manga), non dalla lingua dell'interfaccia del sito — altrimenti
// un utente con il sito in italiano che cerca un libro in russo troverebbe zero risultati,
// perché Google Books filtrerebbe solo il catalogo italiano.
const searchGoogleBooksOnce = async (query: string, lang: string): Promise<MediaSearchResult[]> => {
  try {
    const url = `${GOOGLE_BOOKS_ENDPOINT}?q=${encodeURIComponent(query)}&maxResults=40&langRestrict=${lang}`
    const response = await fetch(url)
    if (!response.ok) return []
    const json = await response.json()
    return mapGoogleBooksItems(json?.items || [])
  } catch {
    return []
  }
}

const mapOpenLibraryDocs = (docs: Record<string, unknown>[], format?: string): MediaSearchResult[] =>
  docs.map((doc) => {
    const authors = doc.author_name as string[] | undefined
    const coverId = doc.cover_i as number | undefined
    return {
      title: typeof doc.title === 'string' ? doc.title : '',
      year: doc.first_publish_year ? String(doc.first_publish_year) : '',
      studio: '',
      author: authors?.join(', ') || '',
      coverUrl: coverId ? `${OPENLIBRARY_COVER_BASE}/${coverId}-M.jpg` : undefined,
      format,
    }
  })

// Open Library (progetto gratuito di Internet Archive) — a differenza di ComicVine/MangaDex/
// Steam/Giant Bomb/Kitsu, risponde davvero con l'header CORS corretto dal browser (verificato).
// Usata IN AGGIUNTA a Google Books, non al suo posto: copre bene inglese/italiano ma la
// ricerca in alfabeti non latini (es. cirillico) funziona male, quindi da sola non basterebbe.
const searchOpenLibraryOnce = async (query: string): Promise<MediaSearchResult[]> => {
  try {
    const url = `${OPENLIBRARY_ENDPOINT}?q=${encodeURIComponent(query)}&limit=20&fields=title,author_name,first_publish_year,cover_i`
    const response = await fetch(url)
    if (!response.ok) return []
    const json = await response.json()
    return mapOpenLibraryDocs(json?.docs || [])
  } catch {
    return []
  }
}

const searchOpenLibraryComicsOnce = async (query: string): Promise<MediaSearchResult[]> => {
  try {
    const url = `${OPENLIBRARY_ENDPOINT}?q=${encodeURIComponent(query)}&subject=comics&limit=20&fields=title,author_name,first_publish_year,cover_i`
    const response = await fetch(url)
    if (!response.ok) return []
    const json = await response.json()
    return mapOpenLibraryDocs(json?.docs || [], 'comic')
  } catch {
    return []
  }
}

const searchGoogleBooks = async (query: string, locale: string): Promise<MediaSearchResult[]> => {
  const lang = detectQueryLanguage(query, locale)
  const [googleResults, openLibraryResults] = await Promise.all([
    searchGoogleBooksOnce(query, lang),
    searchOpenLibraryOnce(query),
  ])
  return dedupeByTitle([...googleResults, ...openLibraryResults])
}

// Non esiste una fonte gratuita e senza CORS per i fumetti occidentali con dati "da fumetteria"
// dedicati (ComicVine, MangaDex e Giant Bomb bloccano tutte le richieste dal browser; Marvel
// richiede una firma HMAC lato server) — Google Books e Open Library indicizzano comunque bene
// i fumetti/graphic novel occidentali come libri con ISBN, quindi li usiamo insieme come
// "fonte comics" filtrando per soggetto.
const searchGoogleBooksComicsOnce = async (query: string, lang: string): Promise<MediaSearchResult[]> => {
  try {
    const url = `${GOOGLE_BOOKS_ENDPOINT}?q=${encodeURIComponent(query)}+subject:comics&maxResults=40&langRestrict=${lang}`
    const response = await fetch(url)
    if (!response.ok) return []
    const json = await response.json()
    return mapGoogleBooksItems(json?.items || [], 'comic')
  } catch {
    return []
  }
}

const searchMangaAndComics = async (query: string, locale: string): Promise<MediaSearchResult[]> => {
  return searchWithTranslatedQuery(query, locale, async (q, sourceLang) => {
    const [aniListMedia, shikimoriResults, comicsResults, openLibraryComicsResults] = await Promise.all([
      searchAniListOnce(q, 'MANGA'),
      sourceLang === 'ru' ? searchShikimoriOnce(query, 'mangas') : Promise.resolve([]),
      searchGoogleBooksComicsOnce(q, sourceLang),
      searchOpenLibraryComicsOnce(q),
    ])

    // Solo i titoli di AniList sono in inglese/romaji e vanno tradotti: quelli di Shikimori
    // sono già in russo vero, quelli di Google Books sono già nella lingua del catalogo.
    let aniListResults = mapAniListMedia(aniListMedia, locale)
    if (!ANILIST_NATIVE_LOCALES.includes(locale)) {
      aniListResults = await translateTitles(aniListResults, locale)
    }

    return dedupeByTitle([...shikimoriResults, ...aniListResults, ...comicsResults, ...openLibraryComicsResults])
  })
}

const searchTMDBOnce = async (query: string, locale: string, apiKey: string): Promise<MediaSearchResult[]> => {
  const language = LANGUAGE_TO_BCP47[locale] || 'en-US'
  const url = `${TMDB_ENDPOINT}?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=${language}&include_adult=false`
  const response = await fetch(url)
  if (!response.ok) return []
  const json = await response.json()
  const results = json?.results || []

  // TMDB non ordina /search/multi per popolarità: lo facciamo noi, altrimenti film
  // molto cercati (es. un sequel meno recente) restano nascosti oltre il limite di risultati.
  return results
    .filter((item: { media_type?: string }) => item.media_type === 'movie' || item.media_type === 'tv')
    .sort((a: { popularity?: number }, b: { popularity?: number }) => (b.popularity || 0) - (a.popularity || 0))
    .map((item: { media_type?: string; title?: string; name?: string; release_date?: string; first_air_date?: string; poster_path?: string | null }) => ({
      title: item.title || item.name || '',
      year: (item.release_date || item.first_air_date || '').slice(0, 4),
      studio: '',
      author: '',
      coverUrl: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : undefined,
      format: item.media_type === 'movie' ? 'movie' : 'tv',
    }))
}

const searchVideo = async (query: string, locale: string): Promise<MediaSearchResult[]> => {
  const tmdbKey = import.meta.env.VITE_TMDB_API_KEY

  return searchWithTranslatedQuery(query, locale, async (q, sourceLang) => {
    const shikimoriPromise = sourceLang === 'ru' ? searchShikimoriOnce(query, 'animes').catch(() => []) : Promise.resolve([])

    // Come per i manga: i titoli AniList sono solo in inglese/romaji/nativo, quindi vanno
    // tradotti nella lingua del sito (con cache) — TMDB e Shikimori sono già localizzati.
    if (!tmdbKey) {
      const [aniListMedia, shikimoriResults] = await Promise.all([searchAniListOnce(q, 'ANIME'), shikimoriPromise])
      let aniListResults = mapAniListMedia(aniListMedia, locale)
      if (!ANILIST_NATIVE_LOCALES.includes(locale)) aniListResults = await translateTitles(aniListResults, locale)
      return dedupeByTitle([...shikimoriResults, ...aniListResults])
    }

    // Con la chiave TMDB configurata cerchiamo su più fonti insieme: TMDB copre bene
    // film/serie di ogni tipo, AniList resta più preciso per anime di nicchia, Shikimori
    // aggiunge titoli in russo veri per chi cerca in quella lingua.
    const [tmdbResults, aniListMedia, shikimoriResults] = await Promise.all([
      searchTMDBOnce(q, locale, tmdbKey).catch(() => []),
      searchAniListOnce(q, 'ANIME').catch(() => []),
      shikimoriPromise,
    ])
    let aniListResults = mapAniListMedia(aniListMedia, locale)
    if (!ANILIST_NATIVE_LOCALES.includes(locale)) aniListResults = await translateTitles(aniListResults, locale)
    return dedupeByTitle([...shikimoriResults, ...tmdbResults, ...aniListResults])
  })
}

const searchRawgOnce = async (query: string): Promise<MediaSearchResult[]> => {
  const apiKey = import.meta.env.VITE_RAWG_API_KEY
  if (!apiKey) return []

  const url = `${RAWG_ENDPOINT}?key=${apiKey}&search=${encodeURIComponent(query)}&page_size=40`
  const response = await fetch(url)
  if (!response.ok) return []
  const json = await response.json()
  const results = json?.results || []

  return results.map((item: { name?: string; released?: string; background_image?: string }) => ({
    title: item.name || '',
    year: (item.released || '').slice(0, 4),
    studio: '',
    author: '',
    coverUrl: item.background_image || undefined,
  }))
}

// IGDB (via api/igdb-search.ts, che tiene le credenziali Twitch lato server) — la fonte
// con il catalogo migliore, sempre disponibile perché non richiede nessuna chiave lato
// client. Se la funzione serverless non è configurata/raggiungibile (es. sviluppo locale
// senza `vercel dev`), risponde comunque con un array vuoto: nessun errore, si continua
// con le altre fonti.
const searchIgdbOnce = async (query: string): Promise<MediaSearchResult[]> => {
  try {
    const response = await fetch(`${IGDB_SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}`)
    if (!response.ok) return []
    const json = await response.json()
    if (!Array.isArray(json)) return []
    return json.map((item: { title?: string; year?: string; coverUrl?: string }) => ({
      title: item.title || '',
      year: item.year || '',
      studio: '',
      author: '',
      coverUrl: item.coverUrl,
    }))
  } catch {
    return []
  }
}

// FreeToGame non offre un parametro di ricerca testuale nella sua API pubblica — solo
// "tutti i giochi" o filtro per categoria/piattaforma. Il catalogo è piccolo (poche
// centinaia di titoli free-to-play) e cambia di rado, quindi lo scarichiamo una volta
// per sessione di pagina e filtriamo per titolo lato client.
interface FreeToGameCacheEntry {
  title: string
  year: string
  coverUrl?: string
}

let freeToGameCatalogCache: FreeToGameCacheEntry[] | null = null

const getFreeToGameCatalog = async (): Promise<FreeToGameCacheEntry[]> => {
  if (freeToGameCatalogCache) return freeToGameCatalogCache
  try {
    const response = await fetch(FREETOGAME_ENDPOINT)
    if (!response.ok) return []
    const json = await response.json()
    if (!Array.isArray(json)) return []
    freeToGameCatalogCache = json.map((item: { title?: string; release_date?: string; thumbnail?: string }) => ({
      title: item.title || '',
      year: (item.release_date || '').slice(0, 4),
      coverUrl: item.thumbnail || undefined,
    }))
    return freeToGameCatalogCache
  } catch {
    return []
  }
}

const searchFreeToGameOnce = async (query: string): Promise<MediaSearchResult[]> => {
  const needle = query.toLowerCase().trim()
  if (!needle) return []
  const catalog = await getFreeToGameCatalog()
  return catalog
    .filter((item) => item.title.toLowerCase().includes(needle))
    .map((item) => ({ ...item, studio: '', author: '' }))
}

// CheapShark: nessuna chiave, nessun limite, ricerca per titolo nativa — copre soprattutto
// giochi PC in vendita sui principali store digitali (Steam, Epic, GOG...).
const searchCheapSharkOnce = async (query: string): Promise<MediaSearchResult[]> => {
  try {
    const url = `${CHEAPSHARK_ENDPOINT}?title=${encodeURIComponent(query)}&limit=40`
    const response = await fetch(url)
    if (!response.ok) return []
    const json = await response.json()
    if (!Array.isArray(json)) return []
    return json.map((item: { external?: string; thumb?: string }) => ({
      title: item.external || '',
      year: '',
      studio: '',
      author: '',
      coverUrl: item.thumb || undefined,
    }))
  } catch {
    return []
  }
}

// Quattro fonti in parallelo: IGDB (miglior catalogo, sempre attiva) + RAWG (se l'utente
// ha configurato la sua chiave gratuita) + FreeToGame + CheapShark come reti di sicurezza
// aggiuntive — stesso pattern già usato per Libri (Google Books + Open Library) e Anime
// (AniList + Shikimori). L'ordine dell'array decide quale copertina "vince" quando due
// fonti trovano lo stesso titolo (dedupeByTitle tiene la prima occorrenza).
const searchGamesOnce = async (query: string): Promise<MediaSearchResult[]> => {
  const rawgKey = import.meta.env.VITE_RAWG_API_KEY
  const [igdbResults, rawgResults, freeToGameResults, cheapSharkResults] = await Promise.all([
    searchIgdbOnce(query).catch(() => []),
    rawgKey ? searchRawgOnce(query).catch(() => []) : Promise.resolve([]),
    searchFreeToGameOnce(query).catch(() => []),
    searchCheapSharkOnce(query).catch(() => []),
  ])
  return dedupeByTitle([...igdbResults, ...rawgResults, ...freeToGameResults, ...cheapSharkResults])
}

// I titoli dei videogiochi restano quasi sempre solo in inglese su tutte queste fonti (i
// nomi non cambiano nemmeno sugli store ufficiali in altre lingue), quindi li traduciamo
// come per anime/manga.
const searchGames = (query: string, locale: string): Promise<MediaSearchResult[]> =>
  searchWithTranslatedQuery(query, locale, async (q) => {
    const results = await searchGamesOnce(q)
    return locale === 'en' ? results : translateTitles(results, locale)
  })

export const searchMedia = async (mediaType: MediaType, query: string, locale: string): Promise<MediaSearchResult[]> => {
  const trimmed = query.trim()
  if (!trimmed) return []

  try {
    switch (mediaType) {
      case 'video':
        return await searchVideo(trimmed, locale)
      case 'manga':
        return await searchMangaAndComics(trimmed, locale)
      case 'book':
      case 'audiobook':
        return await searchGoogleBooks(trimmed, locale)
      case 'game':
        return await searchGames(trimmed, locale)
      default:
        return []
    }
  } catch {
    return []
  }
}
