import { useState, type FormEvent } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { Button } from '@/components/ui/Button'
import { HabitColorPicker } from '@/components/ui/HabitColorPicker'
import { HABIT_COLOR_PRESETS } from '@/lib/habit-colors'
import type { Habit } from '@/lib/types'

interface AddHabitModalProps {
  otherHabits: Habit[]
  defaultColor: string
  onAdd: (name: string, color: string) => void
  onClose: () => void
}

export const AddHabitModal = ({ otherHabits, defaultColor, onAdd, onClose }: AddHabitModalProps) => {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [color, setColor] = useState(defaultColor || HABIT_COLOR_PRESETS[0])

  const conflict = otherHabits.find((other) => (other.color || '').toLowerCase() === color.toLowerCase())

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    onAdd(trimmedName, color)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <form
        onSubmit={onSubmit}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="font-accent text-lg font-semibold text-(--color-parchment)">{t('habitGrid.addHabitButton')}</h3>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t('habitGrid.newHabitPlaceholder')}
          required
          className="mt-4 w-full rounded-lg border border-(--color-border) bg-(--color-ink) px-3.5 py-2.5 text-(--color-parchment) outline-none focus:border-(--color-gold)"
        />

        <HabitColorPicker color={color} onChange={setColor} conflictName={conflict?.name} />

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit">{t('common.save')}</Button>
        </div>
      </form>
    </div>
  )
}
