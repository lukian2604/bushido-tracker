import type { ReactNode } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from './icons'

interface PageNavProps {
  label: ReactNode
  onPrev: () => void
  onNext: () => void
  nextDisabled?: boolean
}

export const PageNav = ({ label, onPrev, onNext, nextDisabled = false }: PageNavProps) => {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="font-accent font-semibold text-(--color-parchment)">{label}</h2>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous"
          className="flex size-8 items-center justify-center rounded-lg border border-(--color-border) bg-(--color-ink) text-(--color-parchment-muted) hover:border-(--color-accent) hover:text-(--color-accent)"
        >
          <ChevronLeftIcon className="size-4" />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          aria-label="Next"
          className="flex size-8 items-center justify-center rounded-lg border border-(--color-border) bg-(--color-ink) text-(--color-parchment-muted) hover:border-(--color-accent) hover:text-(--color-accent) disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-(--color-border) disabled:hover:text-(--color-parchment-muted)"
        >
          <ChevronRightIcon className="size-4" />
        </button>
      </div>
    </div>
  )
}
