import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'palette'

export const PALETTES = [
  'crimson',
  'vermilion',
  'ember',
  'amber',
  'citrine',
  'moss',
  'jade',
  'teal',
  'azure',
  'sapphire',
  'indigo',
  'violet',
  'amethyst',
  'magenta',
  'fuchsia',
  'sakura',
  'ash',
  'onyx',
  'night-tokyo',
] as const

export type Palette = (typeof PALETTES)[number]

interface PaletteContextValue {
  palette: Palette
  setPalette: (palette: Palette) => void
}

const PaletteContext = createContext<PaletteContextValue | null>(null)

export const PaletteProvider = ({ children }: { children: ReactNode }) => {
  const [palette, setPaletteState] = useState<Palette>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Palette | null
    return stored && PALETTES.includes(stored) ? stored : 'crimson'
  })

  useEffect(() => {
    document.documentElement.dataset.palette = palette
    localStorage.setItem(STORAGE_KEY, palette)
  }, [palette])

  const setPalette = useCallback((next: Palette) => {
    setPaletteState(next)
  }, [])

  const value = useMemo(() => ({ palette, setPalette }), [palette, setPalette])

  return <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>
}

export const usePalette = () => {
  const context = useContext(PaletteContext)
  if (!context) {
    throw new Error('usePalette must be used within a PaletteProvider')
  }
  return context
}
