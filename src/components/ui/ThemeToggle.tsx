import { useTheme } from '@/hooks/useTheme'
import { SunIcon, MoonIcon } from './icons'

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="flex size-9 items-center justify-center rounded-lg border border-(--color-border) text-(--color-parchment-muted) hover:border-(--color-accent) hover:text-(--color-accent)"
    >
      {theme === 'dark' ? <SunIcon className="size-4.5" /> : <MoonIcon className="size-4.5" />}
    </button>
  )
}
