import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/hooks/useTranslation'
import { useModal } from '@/hooks/useModal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { CustomSelect } from '@/components/ui/CustomSelect'
import { IconButton } from '@/components/ui/IconButton'
import { EditIcon, DeleteIcon } from '@/components/ui/icons'
import {
  subscribeToChallenges,
  createChallenge,
  toggleDayManual,
  deleteChallenge,
  updateChallenge,
} from '@/services/challenge-service'
import { enumerateDateKeys, todayDateKey } from '@/lib/date-utils'
import type { Challenge, ChallengeMode } from '@/lib/types'

const EMPTY_FORM = { name: '', startDate: '', endDate: '', mode: 'manual' as ChallengeMode }

export const ChallengePage = () => {
  const { user } = useAuth()
  const { t } = useTranslation()
  const { confirmDialog } = useModal()

  const formRef = useRef<HTMLDivElement>(null)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingChallengeId, setEditingChallengeId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!user) return
    return subscribeToChallenges(user.uid, setChallenges)
  }, [user])

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingChallengeId(null)
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
    setForm({ name: challenge.name, startDate: challenge.startDate, endDate: challenge.endDate, mode: challenge.mode })
    setEditingChallengeId(challenge.id)
    setErrorMessage('')
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
      <PageHeader title={t('challenge.heading')} subtitle={t('challenge.subtitle')} />

      <div ref={formRef} className="mb-6 rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6">
        <h2 className="mb-4 font-accent text-lg font-semibold text-(--color-parchment)">
          {editingChallengeId ? t('challenge.editTitle') : t('challenge.beginTitle')}
        </h2>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t('challenge.nameLabel')}
            placeholder={t('challenge.namePlaceholder')}
            required
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
          <CustomSelect
            label={t('challenge.modeLabel')}
            value={form.mode}
            onChange={(value) => setForm((current) => ({ ...current, mode: value as ChallengeMode }))}
            options={[
              { value: 'manual', label: t('challenge.modeManual') },
              { value: 'auto', label: t('challenge.modeAuto') },
            ]}
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

          {errorMessage && <p className="text-sm text-(--color-accent) sm:col-span-2">{errorMessage}</p>}

          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? t('challenge.creatingButton')
                : editingChallengeId ? t('challenge.updateButton') : t('challenge.beginButton')}
            </Button>
            {editingChallengeId && (
              <Button type="button" variant="ghost" onClick={resetForm}>
                {t('common.cancel')}
              </Button>
            )}
          </div>
        </form>
      </div>

      {challenges.length === 0 ? (
        <p className="py-6 text-center text-sm text-(--color-ink-40)">{t('challenge.empty')}</p>
      ) : (
        <div className="flex flex-col gap-5">
          {challenges.map((challenge) => {
            const dateKeys = enumerateDateKeys(challenge.startDate, challenge.endDate)
            const completedSet = new Set(challenge.completedDates || [])
            const isAuto = challenge.mode === 'auto'
            const completedCount = isAuto
              ? dateKeys.filter((dateKey) => dateKey <= today).length
              : completedSet.size

            return (
              <article key={challenge.id} className="rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-accent text-lg font-semibold text-(--color-parchment)">{challenge.name}</h3>
                    <p className="mt-1 text-sm text-(--color-ink-40)">
                      {challenge.startDate} → {challenge.endDate} · {isAuto ? t('challenge.modeAutoBadge') : t('challenge.modeManualBadge')} ·{' '}
                      {completedCount}/{dateKeys.length} {t('challenge.daysSuffix')}
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
                <div className="flex flex-wrap gap-1.5">
                  {dateKeys.map((dateKey) => {
                    const isCompleted = isAuto ? dateKey <= today : completedSet.has(dateKey)
                    const isToday = dateKey === today

                    return (
                      <button
                        key={dateKey}
                        type="button"
                        disabled={isAuto}
                        title={dateKey}
                        onClick={() => toggleDayManual(user!.uid, challenge.id, dateKey, !isCompleted)}
                        className={`size-4 rounded-[4px] border ${
                          isCompleted ? 'border-(--color-gold) bg-(--color-gold)' : 'border-(--color-border) bg-(--color-ink)'
                        } ${isToday ? 'border-2 border-(--color-accent)' : ''} ${!isAuto ? 'cursor-pointer' : ''}`}
                      />
                    )
                  })}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
