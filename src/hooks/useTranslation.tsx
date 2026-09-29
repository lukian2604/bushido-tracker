import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { detectLocale, translate, translatePlural, type Locale } from '@/i18n'

const STORAGE_KEY = 'locale'

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
  tp: (key: string, count: number) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
    return stored || detectLocale()
  })

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale)
    localStorage.setItem(STORAGE_KEY, nextLocale)
  }, [])

  const t = useCallback((key: string) => translate(locale, key), [locale])
  const tp = useCallback((key: string, count: number) => translatePlural(locale, key, count), [locale])

  const value = useMemo(() => ({ locale, setLocale, t, tp }), [locale, setLocale, t, tp])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export const useTranslation = () => {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useTranslation must be used within a LocaleProvider')
  }
  return context
}
