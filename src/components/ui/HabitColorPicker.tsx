import { useState } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { CheckIcon } from '@/components/ui/icons'
import { HABIT_COLOR_PRESETS } from '@/lib/habit-colors'

const HEX_REGEX = /^#[0-9a-f]{6}$/i

// s/l fissi per ottenere colori vivaci ma coerenti con la palette dell'app,
// facendo variare solo la tonalità (hue) lungo lo slider.
const hueToHex = (hue: number) => {
  const s = 0.7
  const l = 0.55
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = l - c / 2
  let r: number, g: number, b: number
  if (hue < 60) [r, g, b] = [c, x, 0]
  else if (hue < 120) [r, g, b] = [x, c, 0]
  else if (hue < 180) [r, g, b] = [0, c, x]
  else if (hue < 240) [r, g, b] = [0, x, c]
  else if (hue < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

interface HabitColorPickerProps {
  color: string
  onChange: (color: string) => void
  conflictName?: string
}

export const HabitColorPicker = ({ color, onChange, conflictName }: HabitColorPickerProps) => {
  const { t } = useTranslation()
  const [hexInput, setHexInput] = useState(color)

  const isPreset = HABIT_COLOR_PRESETS.some((preset) => preset.toLowerCase() === color.toLowerCase())

  const setCustomColor = (next: string) => {
    onChange(next)
    setHexInput(next)
  }

  const onHexInputChange = (value: string) => {
    setHexInput(value)
    if (HEX_REGEX.test(value)) onChange(value)
  }

  return (
    <div>
      <span className="mb-2 mt-4 block text-xs font-semibold uppercase tracking-wide text-(--color-parchment-muted)">
        {t('habitGrid.colorLabel')}
      </span>
      <div className="flex flex-wrap gap-2.5">
        {HABIT_COLOR_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            aria-pressed={color.toLowerCase() === preset.toLowerCase()}
            style={{ backgroundColor: preset, borderColor: color.toLowerCase() === preset.toLowerCase() ? 'var(--color-parchment)' : 'transparent' }}
            className="flex size-8 items-center justify-center rounded-full border-2 text-(--color-ink) transition-transform hover:scale-110"
          >
            {color.toLowerCase() === preset.toLowerCase() && <CheckIcon className="size-3.5" />}
          </button>
        ))}
        <label
          style={{ backgroundColor: !isPreset ? color : undefined, borderColor: !isPreset ? 'var(--color-parchment)' : 'transparent' }}
          className={`relative flex size-8 cursor-pointer items-center justify-center rounded-full border-2 ${!isPreset ? '' : 'bg-(--color-ink-20)'}`}
        >
          {!isPreset && <CheckIcon className="size-3.5 text-(--color-ink)" />}
          <input
            type="color"
            value={color}
            onChange={(event) => setCustomColor(event.target.value)}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
            aria-label={t('habitGrid.customColorLabel')}
          />
        </label>
      </div>

      <input
        type="range"
        min={0}
        max={360}
        step={1}
        onChange={(event) => setCustomColor(hueToHex(Number(event.target.value)))}
        aria-label={t('habitGrid.hueSliderLabel')}
        style={{ background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' }}
        className="mt-3 h-2.5 w-full cursor-pointer appearance-none rounded-full outline-none"
      />

      {!isPreset && (
        <div className="mt-3 flex items-center gap-2">
          <span className="size-5.5 flex-none rounded-full border border-(--color-border)" style={{ backgroundColor: HEX_REGEX.test(hexInput) ? hexInput : 'transparent' }} />
          <input
            type="text"
            value={hexInput}
            onChange={(event) => onHexInputChange(event.target.value)}
            placeholder="#c9a24b"
            maxLength={7}
            className="w-28 rounded-lg border border-(--color-border) bg-(--color-ink) px-2.5 py-1.5 text-sm uppercase text-(--color-parchment) outline-none focus:border-(--color-gold)"
          />
          <span className="text-[11px] text-(--color-ink-40)">{t('habitGrid.hexHint')}</span>
        </div>
      )}

      {conflictName && (
        <p className="mt-3 text-xs text-(--color-gold)">{t('habitGrid.colorConflict').replace('{name}', conflictName)}</p>
      )}
    </div>
  )
}
