import { useState } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { Button } from '@/components/ui/Button'
import { XIcon } from '@/components/ui/icons'
import { todayDateKey } from '@/lib/date-utils'
import type { Challenge } from '@/lib/types'

interface ChallengeEditDayModalProps {
  challenge: Challenge
  onToggleDay: (dateKey: string, isCompleted: boolean) => void
  onToggleFailed: (dateKey: string, isFailed: boolean) => void
  onClose: () => void
}

// Modifica lo stato di un giorno passato scegliendo la data dal selettore nativo del
// browser, invece di cercarla nella griglia colorata di ChallengeCalendarModal (solo
// visualizzazione).
export const ChallengeEditDayModal = ({ challenge, onToggleDay, onToggleFailed, onClose }: ChallengeEditDayModalProps) => {
  const { t } = useTranslation()
  const today = todayDateKey()
  const maxDate = challenge.endDate < today ? challenge.endDate : today
  const [dateKey, setDateKey] = useState(maxDate)
  const isAuto = challenge.mode === 'auto'

  const markDone = () => {
    if (isAuto) onToggleFailed(dateKey, false)
    else onToggleDay(dateKey, true)
  }
  const markSkipped = () => {
    if (isAuto) onToggleFailed(dateKey, true)
    else onToggleDay(dateKey, false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-accent text-lg font-semibold text-(--color-parchment)">{t('challenge.editDayTitle')}</h3>
            <p className="mt-0.5 text-xs text-(--color-parchment-muted)">{challenge.name}</p>
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

        <input
          type="date"
          value={dateKey}
          min={challenge.startDate}
          max={maxDate}
          onChange={(event) => event.target.value && setDateKey(event.target.value)}
          className="w-full rounded-lg border border-(--color-border) bg-(--color-ink) px-3.5 py-2.5 text-(--color-parchment) outline-none focus:border-(--color-gold)"
        />

        <div className="mt-4 flex gap-2">
          <Button type="button" variant="ghost" onClick={markDone} className="flex-1">
            {t('challenge.calendarMarkDone')}
          </Button>
          <Button type="button" variant="ghost" onClick={markSkipped} className="flex-1">
            {t('challenge.calendarMarkSkipped')}
          </Button>
        </div>
      </div>
    </div>
  )
}
