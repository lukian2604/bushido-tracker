import en from './locales/en'
import it from './locales/it'
import ru from './locales/ru'
import es from './locales/es'
import fr from './locales/fr'
import de from './locales/de'
import ja from './locales/ja'
import zh from './locales/zh'
import pt from './locales/pt'

export const LOCALES = { en, it, ru, es, fr, de, ja, zh, pt } as Record<string, Record<string, string>>

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
  pt: 'Português',
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
  pt: '🇵🇹',
}

export const DEFAULT_LOCALE: Locale = 'en'

export const detectLocale = (): Locale => {
  const browserLanguage = (navigator.language || 'en').slice(0, 2)
  return browserLanguage in LOCALES ? (browserLanguage as Locale) : DEFAULT_LOCALE
}

export const translate = (locale: Locale, key: string): string => {
  return LOCALES[locale]?.[key] || LOCALES[DEFAULT_LOCALE][key] || key
}
