import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/hooks/useTranslation'
import { useModal } from '@/hooks/useModal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { EditIcon, DeleteIcon, HabitGridIcon, PlusIcon } from '@/components/ui/icons'
import { ChallengeCalendarModal } from '@/components/ui/ChallengeCalendarModal'
import { ChallengeEditDayModal } from '@/components/ui/ChallengeEditDayModal'
import {
  subscribeToChallenges,
  createChallenge,
  toggleDayManual,
  toggleDayFailed,
  deleteChallenge,
  updateChallenge,
} from '@/services/challenge-service'
import { todayDateKey } from '@/lib/date-utils'
import { computeChallengeProgress } from '@/lib/challenge-progress'
import type { Challenge, ChallengeMode } from '@/lib/types'

const EMPTY_FORM = { name: '', startDate: '', endDate: '', mode: 'manual' as ChallengeMode }
const MODES: ChallengeMode[] = ['manual', 'auto']

export const ChallengePage = () => {
  const { user } = useAuth()
  const { t } = useTranslation()
  const { confirmDialog } = useModal()

  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingChallengeId, setEditingChallengeId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [calendarChallenge, setCalendarChallenge] = useState<Challenge | null>(null)
  const [editDayChallenge, setEditDayChallenge] = useState<Challenge | null>(null)

  useEffect(() => {
    if (!user) return
    return subscribeToChallenges(user.uid, setChallenges)
  }, [user])

  useEffect(() => {
    if (!calendarChallenge) return
    const updated = challenges.find((challenge) => challenge.id === calendarChallenge.id)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- keeps the open calendar modal in sync with live challenge updates, closes it if the challenge was deleted
    setCalendarChallenge(updated ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenges])

  useEffect(() => {
    if (!editDayChallenge) return
    const updated = challenges.find((challenge) => challenge.id === editDayChallenge.id)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- keeps the open edit-day modal in sync with live challenge updates, closes it if the challenge was deleted
    setEditDayChallenge(updated ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenges])

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingChallengeId(null)
    setErrorMessage('')
    setIsFormOpen(false)
  }

  const onOpenAdd = () => {
    setForm(EMPTY_FORM)
    setEditingChallengeId(null)
    setErrorMessage('')
    setIsFormOpen(true)
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return

    if (!form.startDate || !form.endDate || form.startDate > form.endDate) {
      setErrorMessage(t('challenge.errorDates'))
      return
    }

    setErrorMessage('')
    setIsSubmitting(true)

    try {
      if (editingChallengeId) {
        await updateChallenge(user.uid, editingChallengeId, form)
      } else {
        await createChallenge(user.uid, form)
      }
      resetForm()
    } catch {
      setErrorMessage(t('challenge.errorGeneric'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const onEdit = (challenge: Challenge) => {
    setForm({
      name: challenge.name,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      mode: challenge.mode,
    })
    setEditingChallengeId(challenge.id)
    setErrorMessage('')
    setIsFormOpen(true)
  }

  const onDelete = async (challengeId: string) => {
    if (!user) return
    if (await confirmDialog(t('challenge.confirmDelete'))) {
      await deleteChallenge(user.uid, challengeId)
    }
  }

  const today = todayDateKey()

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <PageHeader title={t('challenge.heading')} subtitle={t('challenge.subtitle')} />
        <Button onClick={onOpenAdd} className="flex-none">
          <PlusIcon className="size-4" />
          {t('challenge.beginButton')}
        </Button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={resetForm}>
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="mb-4 font-accent text-lg font-semibold text-(--color-parchment)">
              {editingChallengeId ? t('challenge.editTitle') : t('challenge.beginTitle')}
            </h2>
            <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t('challenge.nameLabel')}
                placeholder={t('challenge.namePlaceholder')}
                required
                containerClassName="sm:col-span-2"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
              <Field
                label={t('challenge.startLabel')}
                type="date"
                required
                value={form.startDate}
                onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
              />
              <Field
                label={t('challenge.endLabel')}
                type="date"
                required
                value={form.endDate}
                onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
              />

              <div className="sm:col-span-2">
                <span className="mb-1.5 block text-sm text-(--color-parchment-muted)">{t('challenge.modeLabel')}</span>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {MODES.map((mode) => {
                    const isSelected = form.mode === mode
                    const color = mode === 'auto' ? 'var(--color-accent-blue)' : 'var(--color-gold)'
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, mode }))}
                        style={{ borderColor: isSelected ? color : undefined }}
                        className={`rounded-xl border p-3.5 text-left transition-colors ${
                          isSelected ? '' : 'border-(--color-border) hover:border-(--color-ink-20)'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="size-2 flex-none rounded-full" style={{ backgroundColor: color }} />
                          <span className="text-sm font-semibold text-(--color-parchment)">
                            {mode === 'auto' ? t('challenge.modeAutoBadge') : t('challenge.modeManualBadge')}
                          </span>
                        </span>
                        <span className="mt-1 block pl-4 text-xs text-(--color-parchment-muted)">
                          {mode === 'auto' ? t('challenge.modeAuto') : t('challenge.modeManual')}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {errorMessage && <p className="text-sm text-(--color-accent) sm:col-span-2">{errorMessage}</p>}

              <div className="flex gap-3 sm:col-span-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? t('challenge.creatingButton')
                    : editingChallengeId ? t('challenge.updateButton') : t('challenge.beginButton')}
                </Button>
                <Button type="button" variant="ghost" onClick={resetForm}>
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {challenges.length === 0 ? (
        <p className="py-6 text-center text-sm text-(--color-ink-40)">{t('challenge.empty')}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {challenges.map((challenge) => {
            const isAuto = challenge.mode === 'auto'
            const { completedCount, totalCount, percent } = computeChallengeProgress(challenge, today)
            const modeColor = isAuto ? 'var(--color-accent-blue)' : 'var(--color-gold)'

            return (
              <article key={challenge.id} className="rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6">
                <div className="mb-1 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="font-accent text-lg font-semibold text-(--color-parchment)">{challenge.name}</h3>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: `color-mix(in srgb, ${modeColor} 16%, var(--color-ink-10))`, color: modeColor }}
                      >
                        <span className="size-1.5 flex-none rounded-full" style={{ backgroundColor: modeColor }} />
                        {isAuto ? t('challenge.modeAutoBadge') : t('challenge.modeManualBadge')}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-(--color-ink-40)">
                      {challenge.startDate} → {challenge.endDate}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 gap-1">
                    <IconButton variant="edit" onClick={() => onEdit(challenge)} aria-label={t('common.edit')}>
                      <EditIcon className="size-4" />
                    </IconButton>
                    <IconButton variant="delete" onClick={() => onDelete(challenge.id)} aria-label={t('common.delete')}>
                      <DeleteIcon className="size-4" />
                    </IconButton>
                  </div>
                </div>

                <div className="mb-1.5 mt-4 flex items-baseline justify-between">
                  <span className="font-accent text-xl font-bold" style={{ color: modeColor }}>
                    {percent}%
                  </span>
                  <span className="text-xs tabular-nums text-(--color-parchment-muted)">
                    {completedCount} / {totalCount} {t('challenge.daysSuffix')}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-(--color-ink-15)">
                  <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, backgroundColor: modeColor }} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCalendarChallenge(challenge)}
                    className="inline-flex items-center gap-2 rounded-lg border border-(--color-border) px-3 py-1.5 text-xs text-(--color-parchment-muted) hover:border-(--color-ink-20) hover:text-(--color-parchment)"
                  >
                    <HabitGridIcon className="size-3.5" />
                    {t('challenge.calendarButton')}
                  </button>
                  <button
                    type="button"
                    onClick={() => user && (isAuto ? toggleDayFailed(user.uid, challenge.id, today, false) : toggleDayManual(user.uid, challenge.id, today, true))}
                    className="inline-flex items-center gap-2 rounded-lg border border-(--color-border) px-3 py-1.5 text-xs text-(--color-parchment-muted) hover:border-(--color-ink-20) hover:text-(--color-parchment)"
                  >
                    {t('challenge.calendarMarkDoneToday')}
                  </button>
                  <button
                    type="button"
                    onClick={() => user && (isAuto ? toggleDayFailed(user.uid, challenge.id, today, true) : toggleDayManual(user.uid, challenge.id, today, false))}
                    className="inline-flex items-center gap-2 rounded-lg border border-(--color-border) px-3 py-1.5 text-xs text-(--color-parchment-muted) hover:border-(--color-ink-20) hover:text-(--color-parchment)"
                  >
                    {t('challenge.calendarMarkSkippedToday')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDayChallenge(challenge)}
                    className="inline-flex items-center gap-2 rounded-lg border border-(--color-border) px-3 py-1.5 text-xs text-(--color-parchment-muted) hover:border-(--color-ink-20) hover:text-(--color-parchment)"
                  >
                    {t('challenge.editDayButton')}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {calendarChallenge && (
        <ChallengeCalendarModal
          challenge={calendarChallenge}
          completedCount={computeChallengeProgress(calendarChallenge, today).completedCount}
          onClose={() => setCalendarChallenge(null)}
        />
      )}

      {editDayChallenge && (
        <ChallengeEditDayModal
          challenge={editDayChallenge}
          onToggleDay={(dateKey, isCompleted) => user && toggleDayManual(user.uid, editDayChallenge.id, dateKey, isCompleted)}
          onToggleFailed={(dateKey, isFailed) => user && toggleDayFailed(user.uid, editDayChallenge.id, dateKey, isFailed)}
          onClose={() => setEditDayChallenge(null)}
        />
      )}
    </div>
  )
}
