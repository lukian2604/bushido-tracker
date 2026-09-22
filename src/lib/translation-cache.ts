const STORAGE_KEY = 'bushido:title-translations'
const MAX_ENTRIES = 500

type Cache = Record<string, string>

// localStorage può non essere disponibile (private browsing, quota piena, ecc.):
// la cache è solo un'ottimizzazione, mai un requisito, quindi ogni accesso è "silenzioso".
const readCache = (): Cache => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const writeCache = (cache: Cache) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    // quota superata o storage non disponibile: va bene continuare senza cache persistente
  }
}

const cacheKey = (text: string, targetLang: string) => `${targetLang}:${text.toLowerCase().trim()}`

export const getCachedTitleTranslation = (text: string, targetLang: string): string | undefined =>
  readCache()[cacheKey(text, targetLang)]

export const setCachedTitleTranslation = (text: string, targetLang: string, translated: string) => {
  const cache = readCache()
  const key = cacheKey(text, targetLang)
  cache[key] = translated

  // Evita una crescita illimitata: se supera il limite, tiene solo le voci più recenti.
  const keys = Object.keys(cache)
  if (keys.length > MAX_ENTRIES) {
    for (const oldKey of keys.slice(0, keys.length - MAX_ENTRIES)) delete cache[oldKey]
  }

  writeCache(cache)
}
