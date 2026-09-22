import { useEffect, useState } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { SearchIcon } from '@/components/ui/icons'
import { searchMedia } from '@/services/media-search'
import type { MediaSearchResult, MediaType } from '@/lib/types'

interface MediaSearchBoxProps {
  mediaType: MediaType
  onSelect: (result: MediaSearchResult) => void
  searchLanguage: string
}

export const MediaSearchBox = ({ mediaType, onSelect, searchLanguage }: MediaSearchBoxProps) => {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MediaSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the search box when the parent switches media type
    setQuery('')
    setResults([])
    setHasSearched(false)
  }, [mediaType])

  useEffect(() => {
    if (!query.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears stale results when the query is emptied
      setResults([])
      setHasSearched(false)
      return
    }

    setIsLoading(true)
    let isStale = false
    const timeout = setTimeout(() => {
      searchMedia(mediaType, query, searchLanguage).then((found) => {
        if (isStale) return
        setResults(found)
        setHasSearched(true)
        setIsLoading(false)
      })
    }, 400)

    return () => {
      isStale = true
      clearTimeout(timeout)
    }
  }, [query, mediaType, searchLanguage])

  return (
    <div className="mb-5">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-(--color-ink-40)" />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('watchlist.searchPlaceholder')}
          className="w-full rounded-lg border border-(--color-border) bg-(--color-ink) py-2.5 pl-10 pr-3.5 text-sm text-(--color-parchment) outline-none placeholder:text-(--color-ink-40) focus:border-(--color-gold)"
        />
      </div>

      {isLoading && <p className="mt-2 text-xs text-(--color-ink-40)">{t('watchlist.searchLoading')}</p>}

      {!isLoading && hasSearched && (
        results.length === 0 ? (
          <p className="mt-2 text-xs text-(--color-ink-40)">{t('watchlist.searchNoResults')}</p>
        ) : (
          <div className="mt-2 flex max-h-64 flex-col gap-1 overflow-y-auto rounded-lg border border-(--color-border) p-1.5">
            {results.map((result, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  onSelect(result)
                  setQuery('')
                  setResults([])
                  setHasSearched(false)
                }}
                className="flex items-center gap-3 rounded-lg p-2 text-left hover:bg-(--color-ink)"
              >
                {result.coverUrl ? (
                  <img src={result.coverUrl} alt="" className="h-12 w-9 flex-none rounded object-cover" />
                ) : (
                  <span className="h-12 w-9 flex-none rounded bg-(--color-ink-20)" />
                )}
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-(--color-parchment)">{result.title}</span>
                    {result.format && (
                      <span className="flex-none rounded-full bg-(--color-ink-20) px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-(--color-parchment-muted)">
                        {t(`watchlist.searchFormat.${result.format}`)}
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-xs text-(--color-parchment-muted)">
                    {[result.year, result.studio || result.author].filter(Boolean).join(' · ')}
                  </span>
                  {result.originalTitle && (
                    <span className="block truncate text-[11px] italic text-(--color-ink-40)">{result.originalTitle}</span>
                  )}
                </span>
              </button>
            ))}
          </div>
        )
      )}

      <p className="mt-2 text-[11px] text-(--color-ink-40)">{t('watchlist.searchEnglishHint')}</p>
      <p className="mt-1 text-[11px] text-(--color-ink-40)">{t('watchlist.searchManualHint')}</p>
    </div>
  )
}
