import { useTranslation } from '@/hooks/useTranslation'
import { usePalette, PALETTES } from '@/hooks/usePalette'
import { CheckIcon } from '@/components/ui/icons'

// Colore di anteprima per ogni swatch — combinazione accent/gold in modalità scura,
// solo per farsi un'idea nel selettore (il tema vero si applica anche in chiaro).
const PREVIEW_COLORS: Record<(typeof PALETTES)[number], [string, string]> = {
  crimson: ['#b5332b', '#c9a24b'],
  vermilion: ['#af4f2c', '#cbb24d'],
  ember: ['#af692c', '#cbcb4d'],
  amber: ['#af812c', '#b4cb4d'],
  citrine: ['#afaf2c', '#88cb4d'],
  moss: ['#58af2c', '#4dcb66'],
  jade: ['#2caf72', '#4dc3cb'],
  teal: ['#2cafa4', '#4d93cb'],
  azure: ['#2c95af', '#4d6fcb'],
  sapphire: ['#2c72af', '#4d4dcb'],
  indigo: ['#2c37af', '#864dcb'],
  violet: ['#422caf', '#a54dcb'],
  amethyst: ['#632caf', '#c54dcb'],
  magenta: ['#af2caf', '#cb4d88'],
  fuchsia: ['#af2c84', '#cb4d5e'],
  sakura: ['#af2c58', '#cb664d'],
  ash: ['#817765', '#a19b91'],
  onyx: ['#67737e', '#93999f'],
  'night-tokyo': ['#ef399a', '#30d3e8'],
}

export const PalettePicker = () => {
  const { t } = useTranslation()
  const { palette, setPalette } = usePalette()

  return (
    <div className="flex flex-wrap gap-2.5">
      {PALETTES.map((id) => {
        const [primary, secondary] = PREVIEW_COLORS[id]
        const isActive = id === palette
        return (
          <button
            key={id}
            type="button"
            onClick={() => setPalette(id)}
            aria-pressed={isActive}
            aria-label={t(`palette.${id}`)}
            title={t(`palette.${id}`)}
            style={{ background: `linear-gradient(135deg, ${primary} 50%, ${secondary} 50%)`, borderColor: isActive ? 'var(--color-parchment)' : 'transparent' }}
            className="flex size-9 items-center justify-center rounded-full border-2 transition-transform hover:scale-110"
          >
            {isActive && <CheckIcon className="size-4 text-white drop-shadow" />}
          </button>
        )
      })}
    </div>
  )
}
