import { useState } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { Button } from '@/components/ui/Button'
import { DeleteIcon } from '@/components/ui/icons'
import { HabitColorPicker } from '@/components/ui/HabitColorPicker'
import { HABIT_COLOR_PRESETS } from '@/lib/habit-colors'
import type { Habit } from '@/lib/types'

interface HabitEditorModalProps {
  habit: Habit
  otherHabits: Habit[]
  onSave: (name: string, color: string) => void
  onDelete: () => void
  onClose: () => void
}

export const HabitEditorModal = ({ habit, otherHabits, onSave, onDelete, onClose }: HabitEditorModalProps) => {
  const { t } = useTranslation()
  const [name, setName] = useState(habit.name)
  const [color, setColor] = useState(habit.color || HABIT_COLOR_PRESETS[0])

  const conflict = otherHabits.find((other) => (other.color || '').toLowerCase() === color.toLowerCase())

  const onSubmit = () => {
    const trimmedName = name.trim()
    if (!trimmedName) return
    onSave(trimmedName, color)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="font-accent text-lg font-semibold text-(--color-parchment)">{t('habitGrid.editHabitTitle')}</h3>
        <p className="mt-1 text-xs text-(--color-parchment-muted)">{t('habitGrid.editHabitSubtitle')}</p>

        <input
          autoFocus
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-4 w-full rounded-lg border border-(--color-border) bg-(--color-ink) px-3.5 py-2.5 text-(--color-parchment) outline-none focus:border-(--color-gold)"
        />

        <HabitColorPicker color={color} onChange={setColor} conflictName={conflict?.name} />

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-1.5 text-xs font-medium text-(--color-parchment-muted) hover:text-(--color-accent)"
          >
            <DeleteIcon className="size-3.5" />
            {t('common.delete')}
          </button>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="button" onClick={onSubmit}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
