import { NavLink } from 'react-router-dom'
import { useTranslation } from '@/hooks/useTranslation'
import { useAuth } from '@/hooks/useAuth'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { PaletteSwitcher } from '@/components/ui/PaletteSwitcher'
import { DashboardIcon, ChallengeIcon, HabitGridIcon, WatchlistIcon, FriendsIcon, ProfileIcon, SignOutIcon, XIcon } from '@/components/ui/icons'
import { AvatarFrame } from '@/components/ui/AvatarFrame'
import { useCurrentStreak } from '@/hooks/useCurrentStreak'

const navItems = [
  { to: '/dashboard', labelKey: 'nav.dashboard', Icon: DashboardIcon },
  { to: '/challenge', labelKey: 'nav.challenge', Icon: ChallengeIcon },
  { to: '/habit-grid', labelKey: 'nav.habitGrid', Icon: HabitGridIcon },
  { to: '/watchlist', labelKey: 'nav.watchlist', Icon: WatchlistIcon },
  { to: '/friends', labelKey: 'nav.friends', Icon: FriendsIcon },
  { to: '/profile', labelKey: 'nav.profile', Icon: ProfileIcon },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const streak = useCurrentStreak(user?.uid)
  const displayName = user?.displayName || user?.email || ''

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col overflow-y-auto border-r border-(--color-border) bg-(--color-ink-10) px-4 py-6 transition-transform duration-200 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
      <div className="mb-8 flex items-center justify-between px-1">
        <NavLink to="/dashboard" onClick={onClose} className="flex items-center gap-2.5">
          <img src="/icons/logo-mark.svg" alt="" width={28} height={28} />
          <span className="font-accent text-lg font-semibold text-(--color-parchment)">Bushido Tracker</span>
        </NavLink>
        <button type="button" onClick={onClose} aria-label="Close menu" className="text-(--color-ink-40) md:hidden">
          <XIcon className="size-5" />
        </button>
      </div>

      <span className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-(--color-ink-40)">
        Menu
      </span>

      <nav className="flex flex-col gap-1">
        {navItems.map(({ to, labelKey, Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-(--color-accent)/15 text-(--color-accent)'
                  : 'text-(--color-parchment-muted) hover:bg-(--color-surface-muted) hover:text-(--color-parchment)'
              }`
            }
          >
            <Icon className="size-4.5" />
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>

      <div className="flex-grow" />

      <div className="flex items-center justify-between gap-2 border-t border-(--color-border) pt-4">
        <LanguageSwitcher />
        <div className="flex items-center gap-2">
          <PaletteSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-(--color-border) p-3">
        <AvatarFrame streak={streak} uid={user?.uid || ''} displayName={displayName} size={40} showSeal={false} />
        <span className="flex-grow truncate text-sm text-(--color-parchment)">{displayName}</span>
        <button
          type="button"
          onClick={() => signOut()}
          aria-label={t('nav.signOut')}
          className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg text-(--color-ink-40) hover:bg-(--color-surface-muted) hover:text-(--color-accent)"
        >
          <SignOutIcon className="size-4" />
        </button>
      </div>
      </aside>
    </>
  )
}
