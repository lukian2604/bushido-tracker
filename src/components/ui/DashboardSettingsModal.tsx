import { useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { Button } from '@/components/ui/Button'
import { DragHandleIcon, EyeIcon, EyeOffIcon } from '@/components/ui/icons'
import { WIDGET_TITLE_KEYS } from '@/lib/dashboard-widgets'
import type { DashboardWidgetConfig } from '@/lib/types'

interface DashboardSettingsModalProps {
  config: DashboardWidgetConfig[]
  onSave: (config: DashboardWidgetConfig[]) => void
  onClose: () => void
}

export const DashboardSettingsModal = ({ config, onSave, onClose }: DashboardSettingsModalProps) => {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<DashboardWidgetConfig[]>(config)
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const toggleVisible = (id: string) => {
    setDraft((current) => current.map((widget) => (widget.id === id ? { ...widget, visible: !widget.visible } : widget)))
  }

  const onGripPointerDown = (id: string) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    setDraggedId(id)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onGripPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!draggedId) return
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-widget-id]')
    const overId = target?.dataset.widgetId
    if (!overId || overId === draggedId) return
    setDraft((current) => {
      const fromIndex = current.findIndex((widget) => widget.id === draggedId)
      const toIndex = current.findIndex((widget) => widget.id === overId)
      if (fromIndex === -1 || toIndex === -1) return current
      const next = [...current]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }

  const onGripPointerUp = () => setDraggedId(null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="font-accent text-lg font-semibold text-(--color-parchment)">{t('dashboard.settingsTitle')}</h3>
        <p className="mt-1 text-xs text-(--color-parchment-muted)">{t('dashboard.settingsSubtitle')}</p>

        <div className="mt-4 flex flex-col gap-2">
          {draft.map((widget) => (
            <div
              key={widget.id}
              data-widget-id={widget.id}
              className={`flex items-center justify-between gap-3 rounded-xl border border-(--color-border) bg-(--color-ink) px-3.5 py-2.5 ${
                draggedId === widget.id ? 'opacity-50' : ''
              }`}
            >
              <span className={`truncate text-sm font-medium ${widget.visible ? 'text-(--color-parchment)' : 'text-(--color-ink-40)'}`}>
                {t(WIDGET_TITLE_KEYS[widget.id])}
              </span>
              <div className="flex flex-none items-center gap-1.5">
                <button
                  type="button"
                  onPointerDown={onGripPointerDown(widget.id)}
                  onPointerMove={onGripPointerMove}
                  onPointerUp={onGripPointerUp}
                  aria-label={t('dashboard.settingsDragHandle')}
                  style={{ touchAction: 'none' }}
                  className="flex size-7 cursor-grab items-center justify-center rounded-lg text-(--color-parchment-muted) hover:text-(--color-parchment) active:cursor-grabbing"
                >
                  <DragHandleIcon className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleVisible(widget.id)}
                  aria-label={widget.visible ? t('dashboard.settingsHide') : t('dashboard.settingsShow')}
                  aria-pressed={widget.visible}
                  className="flex size-7 items-center justify-center rounded-lg text-(--color-parchment-muted) hover:text-(--color-gold)"
                >
                  {widget.visible ? <EyeIcon className="size-4" /> : <EyeOffIcon className="size-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={() => onSave(draft)}>
            {t('common.save')}
          </Button>
        </div>
      </div>
    </div>
  )
}
