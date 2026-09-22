import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/hooks/useTranslation'
import { useModal } from '@/hooks/useModal'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageNav } from '@/components/ui/PageNav'
import { Button } from '@/components/ui/Button'
import { FireIcon, CheckIcon, PlusIcon } from '@/components/ui/icons'
import { HabitEditorModal } from '@/components/ui/HabitEditorModal'
import { AddHabitModal } from '@/components/ui/AddHabitModal'
import { colorForHabitIndex } from '@/lib/habit-colors'
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
  const { confirmDialog } = useModal()
  const localeTag = BCP47_LOCALES[locale] || 'en-US'

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [monthIndex, setMonthIndex] = useState(now.getMonth())
  const [habits, setHabits] = useState<Habit[]>([])
  const [days, setDays] = useState<HabitMonthDoc['days']>({})
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState(now.getDate())

  const yearMonth = `${year}-${String(monthIndex + 1).padStart(2, '0')}`
  const isCurrentMonth = year === now.getFullYear() && monthIndex === now.getMonth()

  useEffect(() => {
    if (!user) return
    return subscribeToHabits(user.uid, setHabits)
  }, [user])

  useEffect(() => {
    if (!user) return
    return subscribeToMonth(user.uid, yearMonth, (data) => setDays(data.days || {}))
  }, [user, yearMonth])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the mobile day picker whenever the visible month changes
    setSelectedDay(isCurrentMonth ? now.getDate() : 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearMonth])

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

  const onSaveHabit = async (name: string, color: string) => {
    if (!user || !editingHabit) return
    await updateHabit(user.uid, editingHabit.id, name, color)
    setEditingHabit(null)
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

  const habitColor = (habit: Habit, index: number) => habit.color || colorForHabitIndex(index)

  const habitStreak = (habitId: string) => {
    const referenceDay = isCurrentMonth ? now.getDate() : totalDays
    let streak = 0
    for (let day = referenceDay; day >= 1; day -= 1) {
      if (days[String(day)]?.[habitId]) streak += 1
      else break
    }
    return streak
  }

  const dayList = Array.from({ length: totalDays }, (_, index) => index + 1)

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <PageHeader title={t('habitGrid.heading')} subtitle={t('habitGrid.subtitle')} />
        <Button type="button" onClick={() => setIsAddHabitModalOpen(true)} className="flex-none">
          <PlusIcon className="size-4" />
          {t('habitGrid.addHabitButton')}
        </Button>
      </div>

      <div className="rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6">
        <PageNav label={heading} onPrev={goToPrevMonth} onNext={goToNextMonth} />

        {habits.length === 0 && <p className="py-6 text-center text-sm text-(--color-ink-40)">{t('habitGrid.emptyHabits')}</p>}

        {habits.length > 0 && (
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="whitespace-nowrap p-2.5 text-left text-xs uppercase tracking-wide text-(--color-ink-40)">
                    {t('habitGrid.dayColumn')}
                  </th>
                  {habits.map((habit, index) => {
                    const color = habitColor(habit, index)
                    const streak = habitStreak(habit.id)
                    return (
                      <th key={habit.id} className="p-2 text-center align-bottom">
                        <button
                          type="button"
                          onClick={() => setEditingHabit(habit)}
                          className="group inline-flex flex-col items-center gap-1 whitespace-nowrap"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <span className="size-1.5 flex-none rounded-full transition-transform group-hover:scale-125" style={{ backgroundColor: color }} />
                            <span className="max-w-24 truncate text-xs font-semibold text-(--color-parchment-muted) group-hover:text-(--color-parchment)">
                              {habit.name}
                            </span>
                          </span>
                          <span
                            className="inline-flex items-center gap-1 text-[10px] tabular-nums"
                            style={{ color: streak >= 5 ? color : 'var(--color-ink-40)' }}
                          >
                            {streak > 0 && <FireIcon className="size-2.5" />}
                            {streak > 0 ? `${streak} ${t('common.days')}` : '—'}
                          </span>
                        </button>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {dayList.map((day) => {
                  const date = new Date(year, monthIndex, day)
                  const weekday = date.toLocaleDateString(localeTag, { weekday: 'short' })

                  return (
                    <tr key={day} className="border-t border-(--color-border)">
                      <td className="whitespace-nowrap p-2.5 text-sm text-(--color-parchment-muted)">
                        {day} <span className="text-(--color-ink-40)">{weekday}</span>
                      </td>
                      {habits.map((habit, index) => {
                        const isChecked = !!days[String(day)]?.[habit.id]
                        const color = habitColor(habit, index)
                        return (
                          <td key={habit.id} className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => onToggleCell(day, habit.id, isChecked)}
                              title={habit.name}
                              aria-label={`${habit.name} — ${day}`}
                              style={isChecked ? { borderColor: color, backgroundColor: color } : undefined}
                              className="inline-flex size-6 items-center justify-center rounded-md border border-(--color-border) bg-(--color-ink) text-(--color-ink) transition-colors hover:border-(--color-parchment-muted)"
                            >
                              {isChecked && <CheckIcon className="size-3.5" />}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {habits.length > 0 && (
          <div className="sm:hidden">
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {dayList.map((day) => {
                const date = new Date(year, monthIndex, day)
                const weekday = date.toLocaleDateString(localeTag, { weekday: 'short' })
                const isToday = isCurrentMonth && day === now.getDate()
                const isSelected = day === selectedDay
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    style={isSelected ? { backgroundColor: 'var(--color-gold)', borderColor: 'var(--color-gold)' } : undefined}
                    className={`flex size-13 flex-none flex-col items-center justify-center gap-0.5 rounded-xl border ${
                      isSelected
                        ? 'text-(--color-ink)'
                        : isToday
                          ? 'border-(--color-gold) text-(--color-gold)'
                          : 'border-(--color-border) text-(--color-parchment-muted)'
                    }`}
                  >
                    <span className="font-accent text-base font-semibold">{day}</span>
                    <span className="text-[10px] uppercase tracking-wide">{weekday}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex flex-col divide-y divide-(--color-border) border-t border-(--color-border)">
              {habits.map((habit, index) => {
                const color = habitColor(habit, index)
                const streak = habitStreak(habit.id)
                const isChecked = !!days[String(selectedDay)]?.[habit.id]
                return (
                  <div key={habit.id} className="flex items-center gap-3 py-3">
                    <button type="button" onClick={() => setEditingHabit(habit)} className="min-w-0 flex-1 text-left">
                      <p className="flex items-center gap-2 truncate text-sm font-semibold text-(--color-parchment)">
                        <span className="size-2 flex-none rounded-full" style={{ backgroundColor: color }} />
                        {habit.name}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-(--color-ink-40)" style={streak >= 5 ? { color } : undefined}>
                        {streak > 0 && <FireIcon className="size-3" />}
                        {streak > 0 ? `${streak} ${t('common.days')}` : t('habitGrid.noStreak')}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleCell(selectedDay, habit.id, isChecked)}
                      aria-label={`${habit.name} — ${selectedDay}`}
                      style={isChecked ? { borderColor: color, backgroundColor: color } : undefined}
                      className="flex size-9 flex-none items-center justify-center rounded-full border border-(--color-border) text-(--color-ink)"
                    >
                      {isChecked && <CheckIcon className="size-4" />}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {editingHabit && (
        <HabitEditorModal
          habit={editingHabit}
          otherHabits={habits.filter((habit) => habit.id !== editingHabit.id)}
          onSave={onSaveHabit}
          onDelete={() => {
            onDeleteHabit(editingHabit.id)
            setEditingHabit(null)
          }}
          onClose={() => setEditingHabit(null)}
        />
      )}

      {isAddHabitModalOpen && (
        <AddHabitModal
          otherHabits={habits}
          defaultColor={colorForHabitIndex(habits.length)}
          onAdd={(name, color) => user && addHabit(user.uid, name, color)}
          onClose={() => setIsAddHabitModalOpen(false)}
        />
      )}
    </div>
  )
}
