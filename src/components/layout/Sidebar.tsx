import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from '@/hooks/useTranslation'
import { useAuth } from '@/hooks/useAuth'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { DashboardIcon, ChallengeIcon, HabitGridIcon, WatchlistIcon, ProfileIcon, SignOutIcon, XIcon } from '@/components/ui/icons'
import { colorForUid, initialFor } from '@/lib/avatar'
import { subscribeToHabits, subscribeToMonth } from '@/services/habit-grid-service'

const navItems = [
  { to: '/dashboard', labelKey: 'nav.dashboard', Icon: DashboardIcon },
  { to: '/challenge', labelKey: 'nav.challenge', Icon: ChallengeIcon },
  { to: '/habit-grid', labelKey: 'nav.habitGrid', Icon: HabitGridIcon },
  { to: '/watchlist', labelKey: 'nav.watchlist', Icon: WatchlistIcon },
  { to: '/profile', labelKey: 'nav.profile', Icon: ProfileIcon },
]

const weekDates = () => {
  const now = new Date()
  const isoDayOfWeek = (now.getDay() + 6) % 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - isoDayOfWeek)
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    return date
  })
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const [habitCount, setHabitCount] = useState(0)
  const [monthDays, setMonthDays] = useState<Record<string, Record<string, Record<string, boolean>>>>({})

  const dates = useState(weekDates)[0]
  const yearMonths = useState(() => [...new Set(dates.map((date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`))])[0]

  useEffect(() => {
    if (!user) return
    return subscribeToHabits(user.uid, (habits) => setHabitCount(habits.length))
  }, [user])

  useEffect(() => {
    if (!user) return
    const unsubscribes = yearMonths.map((yearMonth) =>
      subscribeToMonth(user.uid, yearMonth, (data) => {
        setMonthDays((current) => ({ ...current, [yearMonth]: data.days || {} }))
      }),
    )
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe())
  }, [user, yearMonths])

  const displayName = user?.displayName || user?.email || ''

  const weeklyGoal = dates.reduce((acc, date) => {
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const dayData = monthDays[yearMonth]?.[String(date.getDate())] || {}
    return {
      done: acc.done + Object.values(dayData).filter(Boolean).length,
      total: acc.total + habitCount,
    }
  }, { done: 0, total: 0 })
  const weeklyGoalPercent = weeklyGoal.total > 0 ? Math.round((weeklyGoal.done / weeklyGoal.total) * 100) : 0

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

      {weeklyGoal.total > 0 && (
        <div className="mb-4 rounded-xl border border-(--color-border) p-3.5">
          <span className="text-sm font-semibold text-(--color-parchment)">{t('dashboard.weeklyGoalTitle')}</span>
          <p className="mt-0.5 text-xs text-(--color-ink-40)">
            {weeklyGoal.done} {t('dashboard.weeklyGoalOf')} {weeklyGoal.total} {t('dashboard.weeklyGoalCheckIns')}
          </p>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-(--color-ink-15)">
            <div
              className="h-full rounded-full bg-(--color-accent-green)"
              style={{ width: `${weeklyGoalPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-(--color-border) pt-4">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-(--color-border) p-3">
        <div
          className="flex size-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: colorForUid(user?.uid || '') }}
        >
          {initialFor(displayName)}
        </div>
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
