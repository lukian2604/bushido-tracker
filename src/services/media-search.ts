import type { MediaSearchResult, MediaType } from '@/lib/types'
import { getCachedTitleTranslation, setCachedTitleTranslation } from '@/lib/translation-cache'

const ANILIST_ENDPOINT = 'https://graphql.anilist.co'
const GOOGLE_BOOKS_ENDPOINT = 'https://www.googleapis.com/books/v1/volumes'
const RAWG_ENDPOINT = 'https://api.rawg.io/api/games'
const TMDB_ENDPOINT = 'https://api.themoviedb.org/3/search/multi'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185'
const MYMEMORY_ENDPOINT = 'https://api.mymemory.translated.net/get'
const SHIKIMORI_ENDPOINT = 'https://shikimori.io/api'
const OPENLIBRARY_ENDPOINT = 'https://openlibrary.org/search.json'
const OPENLIBRARY_COVER_BASE = 'https://covers.openlibrary.org/b/id'
const FREETOGAME_ENDPOINT = 'https://www.freetogame.com/api/games'
const CHEAPSHARK_ENDPOINT = 'https://www.cheapshark.com/api/1.0/games'
const WIKIDATA_ENDPOINT = 'https://www.wikidata.org/w/api.php'
const WIKIPEDIA_EN_ENDPOINT = 'https://en.wikipedia.org/w/api.php'
const WIKIMEDIA_COMMONS_FILE_BASE = 'https://commons.wikimedia.org/wiki/Special:FilePath'
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
// Stessa traduzione chiesta più volte nella stessa ricerca (query per le fonti e per
// l'ordinamento): la teniamo in memoria per non ripetere la chiamata.
const translationMemo = new Map<string, Promise<string>>()

const translateText = (text: string, sourceLang: string, targetLang: string): Promise<string> => {
  if (!text || sourceLang === targetLang) return Promise.resolve(text)
  const memoKey = `${sourceLang}|${targetLang}|${text}`
  const memoized = translationMemo.get(memoKey)
  if (memoized) return memoized
  const translation = fetchTranslation(text, sourceLang, targetLang)
  translationMemo.set(memoKey, translation)
  return translation
}

const fetchTranslation = async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
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

// Tiene la prima occorrenza di ogni titolo (la fonte più affidabile), ma riempie i suoi
// campi vuoti (copertina, anno, studio/autore) con quelli dei doppioni trovati da altre
// fonti — così un risultato senza copertina prende quella di un'altra fonte.
// Stesso titolo ma autori diversi = libri diversi (es. "Агасфер" di Eugène Sue e quello
// di Шойхет). Autori compatibili se uno dei due manca o se condividono almeno una parola
// (così "Эжен Сю" e "Сю, Эжен" restano lo stesso autore).
const authorTokens = (author: string) =>
  new Set(author.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((token) => token.length >= 2))

const authorsCompatible = (a: string, b: string) => {
  const tokensA = authorTokens(a)
  const tokensB = authorTokens(b)
  if (tokensA.size === 0 || tokensB.size === 0) return true
  return [...tokensA].some((token) => tokensB.has(token))
}

// Senza autori per distinguerli (film, serie, giochi) decide l'anno: "Война" film 2007 e
// "Война" serie 2026 sono opere diverse. Un anno di scarto è tollerato (fonti diverse
// datano a volte in modo diverso la stessa uscita). Con gli autori decidono gli autori:
// le edizioni dello stesso libro hanno anni diversi ma vanno unite.
const sameWork = (a: MediaSearchResult, b: MediaSearchResult) => {
  if (!authorsCompatible(a.author, b.author)) return false
  if (authorTokens(a.author).size > 0 && authorTokens(b.author).size > 0) return true
  const yearA = parseInt(a.year, 10)
  const yearB = parseInt(b.year, 10)
  return !yearA || !yearB || Math.abs(yearA - yearB) <= 1
}

const dedupeByTitle = (results: MediaSearchResult[]): MediaSearchResult[] => {
  const byTitle = new Map<string, MediaSearchResult[]>()
  const ordered: MediaSearchResult[] = []
  for (const result of results) {
    // Anche il titolo originale fa da chiave: "Ведьмак 3" (nome localizzato) e "The
    // Witcher 3" (nome inglese da un'altra fonte) sono lo stesso risultato.
    const keys = [result.title, result.originalTitle || '']
      .map((title) => title.toLowerCase().trim())
      .filter(Boolean)
    if (keys.length === 0) continue
    const existing = keys
      .flatMap((key) => byTitle.get(key) || [])
      .find((entry) => sameWork(entry, result))
    if (!existing) {
      const copy = { ...result }
      for (const key of keys) byTitle.set(key, [...(byTitle.get(key) || []), copy])
      ordered.push(copy)
      continue
    }
    if (!existing.coverUrl && result.coverUrl) existing.coverUrl = result.coverUrl
    if (!existing.year && result.year) existing.year = result.year
    if (!existing.studio && result.studio) existing.studio = result.studio
    if (!existing.author && result.author) existing.author = result.author
  }
  return ordered
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

const otherTitles = (title: string, candidates: (string | null | undefined)[]) => {
  const others = [...new Set(candidates.filter((candidate): candidate is string => !!candidate && candidate !== title))]
  return others.length ? { altTitles: others } : {}
}

const mapAniListMedia = (media: AniListMedia[], locale: string): MediaSearchResult[] =>
  media.map((item) => ({
    title: preferredAniListTitle(item.title, locale),
    ...otherTitles(preferredAniListTitle(item.title, locale), [item.title.romaji, item.title.english, item.title.native]),
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

const searchShikimoriOnce = async (query: string, kind: 'animes' | 'mangas' | 'ranobe'): Promise<MediaSearchResult[]> => {
  try {
    const url = `${SHIKIMORI_ENDPOINT}/${kind}?search=${encodeURIComponent(query)}&limit=8`
    const response = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!response.ok) return []
    const json: ShikimoriEntry[] = await response.json()
    if (!Array.isArray(json)) return []

    return json.map((item) => ({
      title: item.russian || item.name || '',
      ...otherTitles(item.russian || item.name || '', [item.name]),
      year: (item.aired_on || '').slice(0, 4),
      studio: '',
      author: '',
      coverUrl: item.image?.original ? `https://shikimori.io${item.image.original}` : undefined,
      format: kind === 'animes' ? 'tv' : kind === 'ranobe' ? 'novel' : 'manga',
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
// Senza chiave Google Books usa una quota anonima condivisa da tutti i siti che la
// chiamano senza chiave, che si esaurisce spesso (errore 429 → nessun risultato). Con una
// chiave personale gratuita (VITE_GOOGLE_BOOKS_API_KEY) la quota è solo nostra.
const googleBooksKeyParam = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY
  return apiKey ? `&key=${encodeURIComponent(apiKey)}` : ''
}

const searchGoogleBooksOnce = async (query: string, lang: string): Promise<MediaSearchResult[]> => {
  try {
    const url = `${GOOGLE_BOOKS_ENDPOINT}?q=${encodeURIComponent(query)}&maxResults=40&langRestrict=${lang}${googleBooksKeyParam()}`
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

// La ricerca libera di Google Books mette spesso davanti libri che citano la parola solo
// nel testo ("Агасфер" → "Евангелие от Агасфера", saggi...). In parallelo cerchiamo
// anche solo nei titoli (intitle:) e mettiamo quei risultati per primi.
const searchGoogleBooks = async (query: string, locale: string): Promise<MediaSearchResult[]> => {
  const lang = detectQueryLanguage(query, locale)
  const [titleResults, googleResults, openLibraryResults] = await Promise.all([
    searchGoogleBooksOnce(`intitle:${query}`, lang),
    searchGoogleBooksOnce(query, lang),
    searchOpenLibraryOnce(query),
  ])
  return dedupeByTitle([...titleResults, ...googleResults, ...openLibraryResults])
}

// Non esiste una fonte gratuita e senza CORS per i fumetti occidentali con dati "da fumetteria"
// dedicati (ComicVine, MangaDex e Giant Bomb bloccano tutte le richieste dal browser; Marvel
// richiede una firma HMAC lato server) — Google Books e Open Library indicizzano comunque bene
// i fumetti/graphic novel occidentali come libri con ISBN, quindi li usiamo insieme come
// "fonte comics" filtrando per soggetto.
const searchGoogleBooksComicsOnce = async (query: string, lang: string): Promise<MediaSearchResult[]> => {
  try {
    const url = `${GOOGLE_BOOKS_ENDPOINT}?q=${encodeURIComponent(query)}+subject:comics&maxResults=40&langRestrict=${lang}${googleBooksKeyParam()}`
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
    const isTranslatedQuery = q !== query
    // Light novel e volumi singoli (es. "Naruto: Kakashi's Story") su Google Books sono
    // libri normali, non "comics": li cerchiamo anche lì. Sulla query tradotta in inglese
    // la lingua va lasciata all'inglese, altrimenti langRestrict=ru la svuota.
    const [aniListMedia, shikimoriResults, shikimoriRanobeResults, comicsResults, openLibraryComicsResults, novelResults] = await Promise.all([
      searchAniListOnce(q, 'MANGA'),
      sourceLang === 'ru' ? searchShikimoriOnce(query, 'mangas') : Promise.resolve([]),
      sourceLang === 'ru' ? searchShikimoriOnce(query, 'ranobe') : Promise.resolve([]),
      searchGoogleBooksComicsOnce(q, sourceLang),
      searchOpenLibraryComicsOnce(q),
      searchGoogleBooksOnce(q, isTranslatedQuery ? 'en' : sourceLang),
    ])

    // Solo i titoli di AniList sono in inglese/romaji e vanno tradotti: quelli di Shikimori
    // sono già in russo vero, quelli di Google Books sono già nella lingua del catalogo.
    let aniListResults = mapAniListMedia(aniListMedia, locale)
    if (!ANILIST_NATIVE_LOCALES.includes(locale)) {
      aniListResults = await translateTitles(aniListResults, locale)
    }

    return dedupeByTitle([...shikimoriResults, ...shikimoriRanobeResults, ...aniListResults, ...comicsResults, ...openLibraryComicsResults, ...novelResults])
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
    .map((item: { id?: number; media_type?: string; title?: string; name?: string; original_title?: string; original_name?: string; release_date?: string; first_air_date?: string; poster_path?: string | null }) => ({
      title: item.title || item.name || '',
      ...otherTitles(item.title || item.name || '', [item.original_title, item.original_name]),
      ...(item.id ? { tmdbRef: { type: item.media_type === 'movie' ? ('movie' as const) : ('tv' as const), id: item.id } } : {}),
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
// client. In sviluppo locale la serve il middleware in vite.config.ts. Se non è
// configurata (niente chiavi Twitch) risponde con un array vuoto: nessun errore, si
// continua con le altre fonti.
const searchIgdbOnce = async (query: string): Promise<MediaSearchResult[]> => {
  try {
    const response = await fetch(`${IGDB_SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}`)
    if (!response.ok) return []
    const json = await response.json()
    if (!Array.isArray(json)) return []
    return json.map((item: { title?: string; year?: string; studio?: string; coverUrl?: string }) => ({
      title: item.title || '',
      year: item.year || '',
      studio: item.studio || '',
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

// Wikidata — catalogo quasi completo di tutti i videogiochi pubblicati (anche console,
// vecchi e fuori commercio), gratuito e senza chiave, con sviluppatore (P178) e data di
// uscita (P577). La copertina arriva dall'immagine principale della pagina Wikipedia
// inglese collegata (di solito la box art). Filtriamo per "istanza di" (P31) così una
// ricerca come "infamous" non restituisce anche film, album o la serie in sé.
const WIKIDATA_GAME_TYPES = new Set([
  'Q7889', // videogioco
  'Q60997816', // edizione di videogioco
  'Q65963104', // remaster
  'Q209163', // espansione
  'Q1066707', // DLC
  'Q21125433', // videogioco open source
])

interface WikidataEntity {
  labels?: Record<string, { value: string }>
  claims?: Record<string, { mainsnak?: { datavalue?: { value?: unknown } } }[]>
  sitelinks?: Record<string, { title: string }>
}

// Molti nomi propri (giochi, aziende) su Wikidata hanno solo l'etichetta "mul"
// (multilingua), non una "en" — quindi va usata come ripiego.
const wikidataLabel = (entity?: WikidataEntity) => entity?.labels?.en?.value || entity?.labels?.mul?.value || ''

// Nome reale nella lingua del sito se Wikidata ce l'ha (es. "Ведьмак 3: Дикая Охота"),
// altrimenti quello inglese/ufficiale — mai una traduzione automatica.
const wikidataLocalizedLabel = (entity: WikidataEntity, locale: string) =>
  entity.labels?.[locale]?.value || wikidataLabel(entity)

const wikidataClaimValues = (entity: WikidataEntity, property: string) =>
  (entity.claims?.[property] || []).map((claim) => claim.mainsnak?.datavalue?.value).filter(Boolean)

const fetchWikidataEntities = async (ids: string[], props: string, locale = 'en'): Promise<Record<string, WikidataEntity>> => {
  if (ids.length === 0) return {}
  const languages = [...new Set([locale, 'en', 'mul'])].join('|')
  const url = `${WIKIDATA_ENDPOINT}?action=wbgetentities&ids=${ids.join('|')}&props=${props}&languages=${languages}&sitefilter=enwiki&format=json&origin=*`
  const response = await fetch(url)
  if (!response.ok) return {}
  const json = await response.json()
  return json?.entities || {}
}

const fetchWikipediaCovers = async (titles: string[]): Promise<Record<string, string>> => {
  if (titles.length === 0) return {}
  const url = `${WIKIPEDIA_EN_ENDPOINT}?action=query&prop=pageimages&pithumbsize=300&pilicense=any&pilimit=50&titles=${encodeURIComponent(titles.join('|'))}&format=json&origin=*`
  const response = await fetch(url)
  if (!response.ok) return {}
  const json = await response.json()
  const covers: Record<string, string> = {}
  for (const page of Object.values(json?.query?.pages || {}) as { title?: string; thumbnail?: { source?: string } }[]) {
    if (page.title && page.thumbnail?.source) covers[page.title] = page.thumbnail.source.split('?')[0]
  }
  return covers
}

const searchWikidataGamesOnce = async (query: string, lang: string, locale: string): Promise<MediaSearchResult[]> => {
  try {
    const searchUrl = `${WIKIDATA_ENDPOINT}?action=wbsearchentities&search=${encodeURIComponent(query)}&language=${lang}&uselang=en&type=item&limit=50&format=json&origin=*`
    const searchResponse = await fetch(searchUrl)
    if (!searchResponse.ok) return []
    const searchJson = await searchResponse.json()
    const ids: string[] = (searchJson?.search || []).map((entry: { id: string }) => entry.id)

    const entities = await fetchWikidataEntities(ids, 'labels|claims|sitelinks', locale)
    const games = ids
      .map((id) => entities[id])
      .filter((entity): entity is WikidataEntity =>
        !!entity &&
        !!wikidataLabel(entity) &&
        wikidataClaimValues(entity, 'P31').some((value) => WIKIDATA_GAME_TYPES.has((value as { id?: string }).id || '')),
      )
      .slice(0, 20)

    const developerIdFor = (game: WikidataEntity) => (wikidataClaimValues(game, 'P178')[0] as { id?: string } | undefined)?.id
    const developerIds = [...new Set(games.map(developerIdFor).filter((id): id is string => !!id))]
    const wikiTitles = games.map((game) => game.sitelinks?.enwiki?.title).filter((title): title is string => !!title)
    const [developers, covers] = await Promise.all([
      fetchWikidataEntities(developerIds, 'labels').catch(() => ({}) as Record<string, WikidataEntity>),
      fetchWikipediaCovers(wikiTitles).catch(() => ({}) as Record<string, string>),
    ])

    return games.map((game) => {
      // P577 ha spesso più date (una per regione): teniamo l'anno della prima uscita.
      const years = wikidataClaimValues(game, 'P577')
        .map((value) => parseInt(String((value as { time?: string }).time || '').slice(1, 5), 10))
        .filter((year) => year > 0)
      const developerId = developerIdFor(game)
      const wikiTitle = game.sitelinks?.enwiki?.title
      // Ripiego se la pagina Wikipedia inglese non c'è o non ha immagine: l'immagine
      // principale dell'elemento Wikidata (P18, su Wikimedia Commons).
      const commonsImage = wikidataClaimValues(game, 'P18')[0]
      const commonsCover = typeof commonsImage === 'string'
        ? `${WIKIMEDIA_COMMONS_FILE_BASE}/${encodeURIComponent(commonsImage)}?width=300`
        : undefined
      const title = wikidataLocalizedLabel(game, locale)
      const englishTitle = wikidataLabel(game)
      return {
        title,
        ...(englishTitle && englishTitle !== title ? { originalTitle: englishTitle } : {}),
        ...otherTitles(title, Object.values(game.labels || {}).map((label) => label.value)),
        year: years.length ? String(Math.min(...years)) : '',
        studio: developerId ? wikidataLabel(developers[developerId]) : '',
        author: '',
        coverUrl: (wikiTitle ? covers[wikiTitle] : undefined) || commonsCover,
      }
    })
  } catch {
    return []
  }
}

// Cinque fonti in parallelo: Wikidata (catalogo quasi completo, senza chiave, con i nomi
// localizzati veri — per questo è prima: nei doppioni vince il suo titolo) + IGDB (se
// configurato) + RAWG (se c'è la chiave) + FreeToGame + CheapShark come reti di sicurezza.
// dedupeByTitle unisce i doppioni riempiendo i campi mancanti (copertina, anno, studio).
const searchGamesOnce = async (query: string): Promise<MediaSearchResult[]> => {
  const rawgKey = import.meta.env.VITE_RAWG_API_KEY
  const [igdbResults, rawgResults, freeToGameResults, cheapSharkResults] = await Promise.all([
    searchIgdbOnce(query).catch(() => []),
    rawgKey ? searchRawgOnce(query).catch(() => []) : Promise.resolve([]),
    searchFreeToGameOnce(query).catch(() => []),
    searchCheapSharkOnce(query).catch(() => []),
  ])
  return [...igdbResults, ...rawgResults, ...freeToGameResults, ...cheapSharkResults]
}

// Niente traduzione automatica dei titoli per i giochi: i nomi dei giochi quasi mai
// cambiano tra le lingue e la traduzione letterale li storpiava ("Hollow Knight" →
// "Cavaliere cavo"). Il nome localizzato arriva solo da Wikidata, quando esiste davvero.
//
// Wikidata cerca già in tutte le lingue, quindi va chiamata una sola volta con la query
// originale (lingua dedotta dall'alfabeto, inglese per il latino); le altre fonti sono
// solo in inglese e ricevono anche la query tradotta. Meno chiamate = meno rischio di
// finire nel limite di richieste di Wikimedia.
const searchGames = async (query: string, locale: string): Promise<MediaSearchResult[]> => {
  const [wikidataResults, otherResults] = await Promise.all([
    searchWikidataGamesOnce(query, detectQueryLanguage(query, 'en'), locale).catch(() => []),
    searchWithTranslatedQuery(query, locale, (q) => searchGamesOnce(q)).catch(() => []),
  ])
  return dedupeByTitle([...wikidataResults, ...otherResults])
}

// Dettagli che la ricerca non fornisce, chiesti solo quando l'utente sceglie un risultato
// (una chiamata, non ad ogni ricerca):
// - altTitles: tutti i titoli con cui potrebbe già essere in collezione (es. un film
//   salvato mesi fa col titolo russo e ora trovato con quello italiano);
// - studio: TMDB /search non restituisce le case di produzione, /movie|tv/{id} sì.
export const fetchResultDetails = async (result: MediaSearchResult): Promise<{ altTitles: string[]; studio: string }> => {
  const titles = new Set([result.originalTitle, ...(result.altTitles || [])].filter((title): title is string => !!title))
  let studio = ''
  const apiKey = import.meta.env.VITE_TMDB_API_KEY
  if (result.tmdbRef && apiKey) {
    try {
      const url = `https://api.themoviedb.org/3/${result.tmdbRef.type}/${result.tmdbRef.id}?api_key=${apiKey}&append_to_response=translations`
      const response = await fetch(url)
      if (response.ok) {
        const json = await response.json()
        for (const translation of json?.translations?.translations || []) {
          const title = translation?.data?.title || translation?.data?.name
          if (title) titles.add(title)
        }
        const companies: { name?: string }[] = json?.production_companies?.length ? json.production_companies : json?.networks || []
        studio = companies
          .map((company) => company.name)
          .filter(Boolean)
          .slice(0, 2)
          .join(' / ')
      }
    } catch {
      // Senza dettagli: il controllo doppioni usa titolo e titolo originale, lo studio resta vuoto/modificabile.
    }
  }
  titles.delete(result.title)
  return { altTitles: [...titles], studio }
}

const normalizeForMatch = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

// Quanto un risultato somiglia a ciò che l'utente ha scritto: titolo identico > inizia con
// la ricerca > la contiene > tutte le parole presenti (anche nell'autore/studio, così
// "Агасфер Сю" funziona) > solo alcune. Considera anche il titolo originale, per i titoli
// tradotti automaticamente.
const relevanceScore = (result: MediaSearchResult, query: string) => {
  const q = normalizeForMatch(query)
  // Parole brevissime ("в", "и", "of") non dicono nulla sulla somiglianza.
  const queryTokens = q.split(' ').filter((token) => token.length >= 3)
  const titles = [result.title, result.originalTitle || ''].map(normalizeForMatch).filter(Boolean)
  const haystack = normalizeForMatch([...titles, result.author, result.studio].join(' '))

  let score = 0
  for (const title of titles) {
    if (title === q) score = Math.max(score, 100)
    else if (title.startsWith(`${q} `)) score = Math.max(score, 80)
    else if (` ${title} `.includes(` ${q} `)) score = Math.max(score, 60)
  }
  if (score > 0 || queryTokens.length === 0) return score

  const haystackTokens = new Set(haystack.split(' '))
  // Parola intera, oppure contenuta (solo se lunga: "какаш" in "какаши", non "в" ovunque).
  const matched = queryTokens.filter((token) => haystackTokens.has(token) || (token.length >= 4 && haystack.includes(token))).length
  if (matched === queryTokens.length) return 40
  return Math.round((20 * matched) / queryTokens.length)
}

// Ordinamento stabile: a parità di punteggio resta l'ordine della fonte (che ha già la
// sua rilevanza e l'ordine di priorità tra fonti).
const rankByRelevance = (results: MediaSearchResult[], queries: string[]) =>
  results
    .map((result, index) => ({ result, index, score: Math.max(...queries.map((query) => relevanceScore(result, query))) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ result }) => result)

const searchByType = (mediaType: MediaType, query: string, locale: string): Promise<MediaSearchResult[]> => {
  switch (mediaType) {
    case 'video':
      return searchVideo(query, locale)
    case 'manga':
      return searchMangaAndComics(query, locale)
    case 'book':
    case 'audiobook':
      return searchGoogleBooks(query, locale)
    case 'game':
      return searchGames(query, locale)
    default:
      return Promise.resolve([])
  }
}

export const searchMedia = async (mediaType: MediaType, query: string, locale: string): Promise<MediaSearchResult[]> => {
  const trimmed = query.trim()
  if (!trimmed) return []

  // I titoli arrivano nella lingua in cui l'utente scrive (riconosciuta dall'alfabeto),
  // non in quella del Paese del profilo: cercando "Война" con il Paese Italia prima
  // arrivava "Rogue - Il solitario" (titolo italiano) e il film sembrava non esserci.
  // Con l'alfabeto latino non si può distinguere la lingua, quindi resta quella del Paese.
  const displayLocale = detectQueryLanguage(trimmed, locale)

  try {
    // Si confronta anche con la traduzione inglese della ricerca: molti risultati (volumi
    // ufficiali, giochi) esistono solo in inglese e con la sola query russa sembrerebbero
    // non somigliare a niente.
    const [results, englishQuery] = await Promise.all([
      searchByType(mediaType, trimmed, displayLocale),
      detectQueryLanguage(trimmed, 'en') === 'en' ? Promise.resolve(trimmed) : translateText(trimmed, displayLocale, 'en'),
    ])
    return rankByRelevance(results, [...new Set([trimmed, englishQuery])])
  } catch {
    return []
  }
}
