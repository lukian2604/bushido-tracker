import type { WatchlistItem } from '@/lib/types'

// "Агасфер. Том 1" e "агасфер  том 1" sono lo stesso titolo: confronto senza maiuscole,
// punteggiatura e spazi multipli (\p{L}/\p{N} per non perdere cirillico, kanji, ecc.).
export const normalizeTitle = (title: string) =>
  title
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

// Doppione = stesso titolo e stesso anno. Se uno dei due non ha l'anno contiamo solo il
// titolo; con anni diversi invece è un'opera diversa (remake, nuova edizione) e va bene.
// `altTitles`: lo stesso titolo in altre lingue/grafie (dal risultato di ricerca scelto),
// così "Blade Runner 2049" riconosce "Бегущий по лезвию 2049" già in collezione.
export const findDuplicateItem = (
  items: Pick<WatchlistItem, 'id' | 'title' | 'year'>[],
  candidate: { title: string; year: string; altTitles?: string[] },
  excludeId?: string | null,
) => {
  const titles = new Set([candidate.title, ...(candidate.altTitles || [])].map(normalizeTitle).filter(Boolean))
  if (!normalizeTitle(candidate.title)) return undefined
  const year = candidate.year.trim()
  return items.find(
    (item) =>
      item.id !== excludeId &&
      titles.has(normalizeTitle(item.title)) &&
      (!year || !item.year?.trim() || item.year.trim() === year),
  )
}
