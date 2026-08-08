import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/hooks/useTranslation'
import { useModal } from '@/hooks/useModal'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageNav } from '@/components/ui/PageNav'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { EditIcon, DeleteIcon } from '@/components/ui/icons'
import {
  subscribeToHabits,
  addHabit,
  updateHabit,
  deleteHabit,
  subscribeToMonth,
  toggleCell,
} from '@/services/habit-grid-service'
import { daysInMonth, BCP47_LOCALES } from '@/lib/date-utils'
import type { Habit, HabitMonthDoc } from '@/lib/types'

export const HabitGridPage = () => {
  const { user } = useAuth()
  const { t, locale } = useTranslation()
  const { confirmDialog, promptDialog } = useModal()
  const localeTag = BCP47_LOCALES[locale] || 'en-US'

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [monthIndex, setMonthIndex] = useState(now.getMonth())
  const [habits, setHabits] = useState<Habit[]>([])
  const [days, setDays] = useState<HabitMonthDoc['days']>({})
  const [newHabitName, setNewHabitName] = useState('')

  const yearMonth = `${year}-${String(monthIndex + 1).padStart(2, '0')}`

  useEffect(() => {
    if (!user) return
    return subscribeToHabits(user.uid, setHabits)
  }, [user])

  useEffect(() => {
    if (!user) return
    return subscribeToMonth(user.uid, yearMonth, (data) => setDays(data.days || {}))
  }, [user, yearMonth])

  const heading = useMemo(
    () => new Date(year, monthIndex, 1).toLocaleDateString(localeTag, { month: 'long', year: 'numeric' }),
    [year, monthIndex, localeTag],
  )

  const goToPrevMonth = () => {
    if (monthIndex === 0) {
      setMonthIndex(11)
      setYear((current) => current - 1)
    } else {
      setMonthIndex((current) => current - 1)
    }
  }

  const goToNextMonth = () => {
    if (monthIndex === 11) {
      setMonthIndex(0)
      setYear((current) => current + 1)
    } else {
      setMonthIndex((current) => current + 1)
    }
  }

  const onAddHabit = async (event: FormEvent) => {
    event.preventDefault()
    const name = newHabitName.trim()
    if (!user || !name) return
    await addHabit(user.uid, name)
    setNewHabitName('')
  }

  const onEditHabit = async (habit: Habit) => {
    if (!user) return
    const newName = await promptDialog(t('habitGrid.renamePrompt'), { defaultValue: habit.name })
    if (newName) {
      await updateHabit(user.uid, habit.id, newName)
    }
  }

  const onDeleteHabit = async (habitId: string) => {
    if (!user) return
    if (await confirmDialog(t('habitGrid.confirmDeleteHabit'))) {
      await deleteHabit(user.uid, habitId)
    }
  }

  const onToggleCell = (day: number, habitId: string, isChecked: boolean) => {
    if (!user) return
    toggleCell(user.uid, yearMonth, day, habitId, !isChecked)
  }

  const totalDays = daysInMonth(year, monthIndex)

  return (
    <div>
      <PageHeader title={t('habitGrid.heading')} subtitle={t('habitGrid.subtitle')} />

      <div className="mb-6 rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6">
        <h2 className="mb-3 font-accent text-lg font-semibold text-(--color-parchment)">{t('habitGrid.manageTitle')}</h2>
        <form onSubmit={onAddHabit} className="mb-4 flex gap-3">
          <Field
            containerClassName="flex-grow"
            placeholder={t('habitGrid.newHabitPlaceholder')}
            value={newHabitName}
            onChange={(event) => setNewHabitName(event.target.value)}
            required
          />
          <Button type="submit">{t('habitGrid.addHabitButton')}</Button>
        </form>

        {habits.length === 0 ? (
          <p className="text-center text-sm text-(--color-ink-40)">{t('habitGrid.emptyHabits')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {habits.map((habit) => (
              <span key={habit.id} className="inline-flex items-center overflow-hidden rounded-full border border-(--color-border) bg-(--color-ink)">
                <span className="px-3.5 py-2 text-sm text-(--color-parchment-muted)">{habit.name}</span>
                <IconButton variant="edit" onClick={() => onEditHabit(habit)} aria-label={t('common.edit')}>
                  <EditIcon className="size-3.5" />
                </IconButton>
                <IconButton variant="delete" onClick={() => onDeleteHabit(habit.id)} aria-label={t('common.delete')} className="mr-1">
                  <DeleteIcon className="size-3.5" />
                </IconButton>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6">
        <PageNav label={heading} onPrev={goToPrevMonth} onNext={goToNextMonth} />

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="whitespace-nowrap p-2.5 text-left text-xs uppercase tracking-wide text-(--color-ink-40)">
                  {t('habitGrid.dayColumn')}
                </th>
                {habits.map((habit) => (
                  <th key={habit.id} className="p-2.5 text-center text-xs uppercase tracking-wide text-(--color-ink-40)">
                    {habit.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: totalDays }, (_, index) => index + 1).map((day) => {
                const date = new Date(year, monthIndex, day)
                const weekday = date.toLocaleDateString(localeTag, { weekday: 'short' })
                const dayData = days[String(day)] || {}

                return (
                  <tr key={day} className="border-t border-(--color-border)">
                    <td className="whitespace-nowrap p-2.5 text-sm text-(--color-parchment-muted)">
                      {day} <span className="text-(--color-ink-40)">{weekday}</span>
                    </td>
                    {habits.map((habit) => {
                      const isChecked = !!dayData[habit.id]
                      return (
                        <td key={habit.id} className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => onToggleCell(day, habit.id, isChecked)}
                            aria-label={`${habit.name} on day ${day}`}
                            className={`size-6 rounded-md border transition-colors ${
                              isChecked
                                ? 'border-(--color-gold) bg-(--color-gold)'
                                : 'border-(--color-border) bg-(--color-ink)'
                            }`}
                          />
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
