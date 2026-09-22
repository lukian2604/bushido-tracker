import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from '@/hooks/useTranslation'
import { PalettePicker } from '@/components/ui/PalettePicker'

// Attivatore compatto per header/sidebar — apre lo stesso PalettePicker della card
// "Aspetto" del Profilo dentro un popover, così il tema si può cambiare da ovunque.
export const PaletteSwitcher = () => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const onOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(event.target as Node) &&
        menuRef.current && !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('click', onOutsideClick)
    return () => document.removeEventListener('click', onOutsideClick)
  }, [isOpen])

  const onTriggerClick = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const menuWidth = 220
      const menuHeight = 140
      const opensUpward = rect.bottom + menuHeight > window.innerHeight
      setMenuPosition({
        top: opensUpward ? rect.top - 8 - menuHeight : rect.bottom + 8,
        left: Math.min(Math.max(rect.left, 8), window.innerWidth - menuWidth - 8),
      })
    }
    setIsOpen((current) => !current)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={onTriggerClick}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={t('profile.appearanceTitle')}
        className="flex size-9 items-center justify-center rounded-lg border border-(--color-border) text-(--color-parchment-muted) hover:border-(--color-accent) hover:text-(--color-accent)"
      >
        <span className="size-3.5 rounded-full" style={{ background: 'linear-gradient(135deg, var(--color-accent) 50%, var(--color-gold) 50%)' }} />
      </button>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: menuPosition.top, left: menuPosition.left, width: 220 }}
          className="z-50 rounded-xl border border-(--color-border) bg-(--color-surface) p-3 shadow-xl"
        >
          <PalettePicker />
        </div>,
        document.body,
      )}
    </div>
  )
}
