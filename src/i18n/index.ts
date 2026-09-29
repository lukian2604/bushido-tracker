import en from './locales/en'
import it from './locales/it'
import ru from './locales/ru'
import es from './locales/es'
import fr from './locales/fr'
import de from './locales/de'
import ja from './locales/ja'
import zh from './locales/zh'
import pt from './locales/pt'
import ptPT from './locales/pt-PT'

export const LOCALES = { en, it, ru, es, fr, de, ja, zh, pt, 'pt-PT': ptPT } as Record<string, Record<string, string>>

export type Locale = keyof typeof LOCALES

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  it: 'Italiano',
  ru: 'Русский',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  zh: '中文',
  pt: 'Português (Brasil)',
  'pt-PT': 'Português (Portugal)',
}

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: '🇬🇧',
  it: '🇮🇹',
  ru: '🇷🇺',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  ja: '🇯🇵',
  zh: '🇨🇳',
  pt: '🇧🇷',
  'pt-PT': '🇵🇹',
}

export const DEFAULT_LOCALE: Locale = 'en'

export const detectLocale = (): Locale => {
  const fullLanguage = navigator.language || 'en'
  const browserLanguage = fullLanguage.slice(0, 2)
  // Portoghese: brasiliano per pt-BR (e "pt" senza paese), europeo per tutte le altre
  // varianti (pt-PT, pt-AO, pt-MZ… seguono la norma europea).
  if (browserLanguage === 'pt') return /^pt-BR$/i.test(fullLanguage) || fullLanguage === 'pt' ? 'pt' : 'pt-PT'
  return browserLanguage in LOCALES ? (browserLanguage as Locale) : DEFAULT_LOCALE
}

export const translate = (locale: Locale, key: string): string => {
  return LOCALES[locale]?.[key] || LOCALES[DEFAULT_LOCALE][key] || key
}

// Plurali: la forma giusta per il numero secondo le regole della lingua (Intl.PluralRules:
// 1 day / 2 days, 1 день / 2 дня / 5 дней). Le varianti stanno in `${key}.one`,
// `${key}.few`, `${key}.many`; la chiave base è la forma generale ("other"), usata quando
// la lingua non ha una variante specifica (giapponese/cinese non ne hanno). Mai ripiego
// sull'inglese se la lingua ha la chiave base: sarebbe una parola nella lingua sbagliata.
export const translatePlural = (locale: Locale, key: string, count: number): string => {
  const pick = (candidate: Locale) => {
    const strings = LOCALES[candidate]
    if (!strings?.[key]) return undefined
    const category = new Intl.PluralRules(candidate).select(count)
    return strings[`${key}.${category}`] || strings[key]
  }
  return (pick(locale) || pick(DEFAULT_LOCALE) || key).replace(/\{count\}/g, String(count))
}
