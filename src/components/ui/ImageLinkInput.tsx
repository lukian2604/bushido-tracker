import { useState, type FormEvent } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { normalizeImageLink } from '@/lib/image-data'

interface ImageLinkInputProps {
  onApply: (url: string) => void | Promise<void>
  onCancel: () => void
}

// Alternativa al caricamento da file: incollare l'indirizzo di un'immagine su internet.
// Non è un <form> perché può stare dentro il modulo dell'elemento Watchlist (form
// annidati non sono validi): Invio viene gestito a mano.
export const ImageLinkInput = ({ onApply, onCancel }: ImageLinkInputProps) => {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  const apply = async (event?: FormEvent) => {
    event?.preventDefault()
    const url = normalizeImageLink(value)
    if (!url) {
      setError(t('image.linkInvalid'))
      return
    }
    await onApply(url)
  }

  return (
    <div className="flex w-full max-w-72 flex-col gap-1.5">
      <input
        type="url"
        inputMode="url"
        autoFocus
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
          setError('')
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') apply(event)
          if (event.key === 'Escape') onCancel()
        }}
        placeholder={t('image.linkPlaceholder')}
        className="w-full rounded-lg border border-(--color-border) bg-(--color-ink) px-3 py-2 text-xs text-(--color-parchment) outline-none placeholder:text-(--color-ink-40) focus:border-(--color-gold)"
      />
      <div className="flex gap-3">
        <button type="button" onClick={() => apply()} className="text-xs font-semibold text-(--color-gold) hover:underline">
          {t('image.linkApply')}
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-(--color-parchment-muted) hover:text-(--color-parchment)">
          {t('common.cancel')}
        </button>
      </div>
      {error && <p className="text-[11px] text-(--color-accent)">{error}</p>}
    </div>
  )
}
