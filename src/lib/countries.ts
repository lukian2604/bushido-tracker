export const COUNTRIES: { code: string; name: string }[] = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IE', name: 'Ireland' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'MX', name: 'Mexico' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CL', name: 'Chile' },
  { code: 'FR', name: 'France' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'DE', name: 'Germany' },
  { code: 'AT', name: 'Austria' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'PT', name: 'Portugal' },
  { code: 'BR', name: 'Brazil' },
  { code: 'RU', name: 'Russia' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'PL', name: 'Poland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'GR', name: 'Greece' },
  { code: 'TR', name: 'Turkey' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'KR', name: 'South Korea' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'TH', name: 'Thailand' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'IL', name: 'Israel' },
  { code: 'EG', name: 'Egypt' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
]

const LOCALE_DEFAULT_COUNTRY: Record<string, string> = {
  en: 'US', it: 'IT', ru: 'RU', es: 'ES', fr: 'FR', de: 'DE', ja: 'JP', zh: 'CN', pt: 'PT',
}

export const detectCountry = (): string => {
  const browserLanguage = navigator.language || 'en'

  try {
    const region = new Intl.Locale(browserLanguage).maximize().region
    if (region && COUNTRIES.some((country) => country.code === region)) {
      return region
    }
  } catch {
    // Intl.Locale not supported or the tag couldn't be parsed — fall through to the language-based default
  }

  const lang = browserLanguage.slice(0, 2)
  return LOCALE_DEFAULT_COUNTRY[lang] || 'US'
}

export const countryName = (code: string): string => COUNTRIES.find((country) => country.code === code)?.name || code

// Lingua prevalente per paese — usata per orientare la lingua dei risultati di ricerca
// (Watchlist), indipendentemente dalla lingua dell'interfaccia scelta dall'utente.
const LANGUAGE_FOR_COUNTRY: Record<string, string> = {
  US: 'en', GB: 'en', IE: 'en', CA: 'en', AU: 'en', NZ: 'en', IN: 'en', PH: 'en', ZA: 'en', NG: 'en',
  IT: 'it',
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es',
  FR: 'fr', BE: 'fr',
  DE: 'de', AT: 'de', CH: 'de',
  NL: 'nl',
  PT: 'pt', BR: 'pt',
  RU: 'ru',
  UA: 'uk',
  PL: 'pl',
  SE: 'sv',
  NO: 'no',
  DK: 'da',
  FI: 'fi',
  GR: 'el',
  TR: 'tr',
  JP: 'ja',
  CN: 'zh', TW: 'zh', HK: 'zh',
  KR: 'ko',
  ID: 'id',
  VN: 'vi',
  TH: 'th',
  SA: 'ar', AE: 'ar', EG: 'ar',
  IL: 'he',
}

export const languageForCountry = (countryCode: string): string => LANGUAGE_FOR_COUNTRY[countryCode] || 'en'
