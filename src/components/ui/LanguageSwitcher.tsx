import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from '@/hooks/useTranslation'
import { LOCALE_LABELS, LOCALE_FLAGS, type Locale } from '@/i18n'
import { ChevronRightIcon } from './icons'

export const LanguageSwitcher = () => {
  const { locale, setLocale } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

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
      const menuHeight = 320
      const menuWidth = 180
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
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-(--color-border) px-2.5 text-sm font-semibold text-(--color-parchment-muted) hover:border-(--color-accent) hover:text-(--color-accent)"
      >
        <span>{LOCALE_FLAGS[locale]}</span>
        <span className="uppercase">{locale}</span>
        <ChevronRightIcon className="size-2.5 rotate-90 text-(--color-ink-40)" />
      </button>

      {isOpen && createPortal(
        <ul
          ref={menuRef}
          role="listbox"
          style={{ position: 'fixed', top: menuPosition.top, left: menuPosition.left }}
          className="z-50 max-h-80 w-45 overflow-y-auto rounded-xl border border-(--color-border) bg-(--color-surface) p-1.5 shadow-xl"
        >
          {Object.entries(LOCALE_LABELS).map(([code, label]) => (
            <li key={code} role="presentation">
              <button
                type="button"
                role="option"
                onClick={() => { setLocale(code as Locale); setIsOpen(false) }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-(--color-surface-muted) ${
                  code === locale ? 'bg-(--color-surface-muted) text-(--color-accent)' : 'text-(--color-parchment-muted)'
                }`}
              >
                <span>{LOCALE_FLAGS[code as Locale]}</span>
                <span>{label}</span>
              </button>
            </li>
          ))}
        </ul>,
        document.body,
      )}
    </div>
  )
}
