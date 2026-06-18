export const todayDateKey = (date: Date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const enumerateDateKeys = (startKey: string, endKey: string) => {
  const dateKeys: string[] = []
  let current = new Date(`${startKey}T00:00:00`)
  const end = new Date(`${endKey}T00:00:00`)

  while (current <= end) {
    dateKeys.push(todayDateKey(current))
    current = new Date(current.getTime() + 24 * 60 * 60 * 1000)
  }

  return dateKeys
}

export const daysInMonth = (year: number, monthIndex: number) => new Date(year, monthIndex + 1, 0).getDate()

export const BCP47_LOCALES: Record<string, string> = {
  en: 'en-US', it: 'it-IT', ru: 'ru-RU', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', ja: 'ja-JP', zh: 'zh-CN', pt: 'pt-PT',
}
