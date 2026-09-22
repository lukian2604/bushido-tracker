import { useState } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { enumerateDateKeys, todayDateKey, BCP47_LOCALES } from '@/lib/date-utils'
import { XIcon } from '@/components/ui/icons'
import type { Challenge } from '@/lib/types'

const DAY_LABELS = ['L', 'M', 'M', 'G', 'V', 'S', 'D']

interface ChallengeCalendarModalProps {
  challenge: Challenge
  completedCount: number
  onClose: () => void
}

// Solo visualizzazione — per modificare lo stato di un giorno passato si usa
// ChallengeEditDayModal (pulsante "Modifica altri giorni" separato).
export const ChallengeCalendarModal = ({ challenge, completedCount, onClose }: ChallengeCalendarModalProps) => {
  const { t, locale } = useTranslation()
  const localeTag = BCP47_LOCALES[locale] || 'en-US'
  const [activeDateKey, setActiveDateKey] = useState<string | null>(null)
  const isAuto = challenge.mode === 'auto'
  const modeColor = isAuto ? 'var(--color-accent-blue)' : 'var(--color-gold)'

  const dateKeys = enumerateDateKeys(challenge.startDate, challenge.endDate)
  const today = todayDateKey()
  const completedSet = new Set(challenge.completedDates || [])
  const failedSet = new Set(challenge.failedDates || [])

  const columns: string[][] = []
  dateKeys.forEach((dateKey, index) => {
    if (index % 7 === 0) columns.push([])
    columns[columns.length - 1].push(dateKey)
  })

  const formatDate = (dateKey: string) =>
    new Date(`${dateKey}T00:00:00`).toLocaleDateString(localeTag, { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-xl rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-accent text-lg font-semibold text-(--color-parchment)">{challenge.name}</h3>
            <p className="mt-0.5 text-xs text-(--color-parchment-muted)">
              {challenge.startDate} → {challenge.endDate} · {completedCount}/{dateKeys.length} {t('challenge.daysSuffix')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.cancel')}
            className="flex size-8 flex-none items-center justify-center rounded-lg border border-(--color-border) text-(--color-parchment-muted) hover:border-(--color-ink-20) hover:text-(--color-parchment)"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-(--color-parchment-muted)">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px] bg-(--color-ink-15)" />
            {t('challenge.calendarLegendTodo')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: modeColor }} />
            {t('challenge.calendarLegendDone')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px] bg-(--color-accent)" />
            {t('challenge.calendarLegendMissed')}
          </span>
          <span className="sm:ml-auto tabular-nums">{activeDateKey ? formatDate(activeDateKey) : t('challenge.calendarHint')}</span>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <div className="grid flex-none gap-1.5" style={{ gridTemplateRows: 'repeat(7, 1fr)' }}>
            {DAY_LABELS.map((label, index) => (
              <span key={index} className="flex h-4.5 items-center justify-end text-[10px] text-(--color-ink-40)">
                {label}
              </span>
            ))}
          </div>
          <div className="grid flex-none gap-1.5" style={{ gridAutoFlow: 'column', gridAutoColumns: '18px' }}>
            {columns.map((column, columnIndex) => (
              <div key={columnIndex} className="grid gap-1.5" style={{ gridTemplateRows: 'repeat(7, 1fr)' }}>
                {column.map((dateKey) => {
                  const isFuture = dateKey > today
                  const isToday = dateKey === today
                  const failed = failedSet.has(dateKey)
                  const done = isAuto ? dateKey <= today && !failed : completedSet.has(dateKey)
                  const missed = isAuto ? dateKey <= today && failed : !done && dateKey < today

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      title={formatDate(dateKey)}
                      onMouseEnter={() => setActiveDateKey(dateKey)}
                      onMouseLeave={() => setActiveDateKey(null)}
                      onFocus={() => setActiveDateKey(dateKey)}
                      onBlur={() => setActiveDateKey(null)}
                      onClick={() => setActiveDateKey(dateKey)}
                      style={{
                        backgroundColor: done ? modeColor : missed ? 'var(--color-accent)' : 'var(--color-ink-15)',
                        boxShadow: isToday ? 'inset 0 0 0 2px var(--color-parchment)' : undefined,
                        opacity: isFuture ? 0.5 : 1,
                      }}
                      className="size-4.5 cursor-pointer rounded-[4px]"
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
