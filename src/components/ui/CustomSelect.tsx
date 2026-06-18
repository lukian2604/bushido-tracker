import { useEffect, useRef, useState } from 'react'
import { ChevronRightIcon } from './icons'

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  label?: string
}

export const CustomSelect = ({ value, onChange, options, label }: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const current = options.find((option) => option.value === value)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const onOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('click', onOutsideClick)
    return () => document.removeEventListener('click', onOutsideClick)
  }, [isOpen])

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-sm text-(--color-parchment-muted)">{label}</span>}
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className="flex h-11 w-full items-center justify-between rounded-lg border border-(--color-border) bg-(--color-ink) px-3.5 text-sm text-(--color-parchment) hover:border-(--color-accent)"
        >
          <span>{current?.label}</span>
          <ChevronRightIcon className="size-2.5 rotate-90 text-(--color-ink-40)" />
        </button>

        {isOpen && (
          <ul
            role="listbox"
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 max-h-60 overflow-y-auto rounded-xl border border-(--color-border) bg-(--color-surface) p-1.5 shadow-xl"
          >
            {options.map((option) => (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  onClick={() => { onChange(option.value); setIsOpen(false) }}
                  className={`block w-full rounded-lg px-2.5 py-2 text-left text-sm hover:bg-(--color-surface-muted) ${
                    option.value === value ? 'bg-(--color-surface-muted) text-(--color-accent)' : 'text-(--color-parchment-muted)'
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
