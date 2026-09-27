import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ImageIcon, XIcon } from '@/components/ui/icons'
import { useTranslation } from '@/hooks/useTranslation'
import { largerCoverUrl } from '@/lib/cover'

interface CoverImageProps {
  src?: string | null
  className: string
  // Cosa mostrare quando non c'è immagine o non si carica. Di default un riquadro
  // neutro con l'icona immagine; `null` per non mostrare niente (righe della lista).
  fallback?: ReactNode
  onBrokenChange?: (isBroken: boolean) => void
  // Clic sull'immagine → vista ingrandita a tutto schermo. Non usarlo dove il clic
  // ha già un altro significato (es. scegliere un risultato di ricerca).
  zoomable?: boolean
  alt?: string
}

const CoverLightbox = ({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) => {
  const { t } = useTranslation()
  const [displaySrc, setDisplaySrc] = useState(() => largerCoverUrl(src))

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[60] flex cursor-zoom-out items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={(event) => {
        event.stopPropagation()
        onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t('common.cancel')}
        className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top,0px))] flex size-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/80 hover:text-white"
      >
        <XIcon className="size-5" />
      </button>
      <figure className="flex max-h-full flex-col items-center gap-3">
        <img
          src={displaySrc}
          alt={alt}
          referrerPolicy="no-referrer"
          className="max-h-[80vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
          onError={() => {
            if (displaySrc !== src) setDisplaySrc(src)
          }}
        />
        {alt && <figcaption className="max-w-[90vw] truncate text-center text-sm text-white/80">{alt}</figcaption>}
      </figure>
    </div>
  )
}

// Copertine da fonti esterne (Wikipedia, CheapShark, Google Books...): possono sparire o
// bloccare l'hotlink. no-referrer evita i blocchi basati sul sito di provenienza; se
// l'immagine fallisce comunque, mostriamo il ripiego invece dell'icona "immagine rotta".
export const CoverImage = ({ src, className, fallback, onBrokenChange, zoomable = false, alt = '' }: CoverImageProps) => {
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null)
  const [isZoomed, setIsZoomed] = useState(false)
  const isBroken = !!src && brokenSrc === src

  if (!src || isBroken) {
    if (fallback !== undefined) return <>{fallback}</>
    return (
      <span className={`${className} flex items-center justify-center bg-(--color-ink-20) text-(--color-ink-40)`} aria-hidden="true">
        <ImageIcon className="size-1/2 max-h-5 max-w-5" />
      </span>
    )
  }

  const image = (
    <img
      src={src}
      alt=""
      referrerPolicy="no-referrer"
      loading="lazy"
      className={zoomable ? `${className} cursor-zoom-in transition hover:brightness-110` : className}
      onLoad={() => onBrokenChange?.(false)}
      onError={() => {
        setBrokenSrc(src)
        onBrokenChange?.(true)
      }}
    />
  )

  if (!zoomable) return image

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          setIsZoomed(true)
        }}
        aria-label={alt}
        className="flex-none rounded"
      >
        {image}
      </button>
      {isZoomed && createPortal(<CoverLightbox src={src} alt={alt} onClose={() => setIsZoomed(false)} />, document.body)}
    </>
  )
}
