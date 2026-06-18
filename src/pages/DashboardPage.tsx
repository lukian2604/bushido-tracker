import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/hooks/useTranslation'
import { useIsMobile } from '@/hooks/useIsMobile'
import { StatCard } from '@/components/ui/StatCard'
import { Heatmap } from '@/components/ui/Heatmap'
import { AreaChart, type ChartRange } from '@/components/ui/AreaChart'
import { DonutChart } from '@/components/ui/DonutChart'
import { StatRing } from '@/components/ui/StatRing'
import { Button } from '@/components/ui/Button'
import { FireIcon, TargetIcon, TrophyIcon, CheckCircleIcon, PlusIcon } from '@/components/ui/icons'
import { getChallengesOnce } from '@/services/challenge-service'
import { getConsistencyMap, getHabitActivitySeries } from '@/services/habit-grid-service'
import { getAllCategoriesWithProgress } from '@/services/watchlist-service'
import { computeCurrentStreak } from '@/lib/streak'
import { enumerateDateKeys, todayDateKey, BCP47_LOCALES } from '@/lib/date-utils'
import type { Challenge, WatchlistCategoryWithProgress, WeeklyActivityDay } from '@/lib/types'

const RANGE_DAYS: Record<ChartRange, number> = { '30d': 30, '90d': 90, '1y': 365 }

const CATEGORY_COLORS = ['var(--color-accent-green)', 'var(--color-accent-blue)', 'var(--color-accent)', 'var(--color-gold)', '#8C4C7A']

export const DashboardPage = () => {
  const { user } = useAuth()
  const { t, locale } = useTranslation()
  const localeTag = BCP47_LOCALES[locale] || 'en-US'
  const isMobile = useIsMobile()
  const weeksCount = isMobile ? 9 : 18
  const ringSize = isMobile ? 110 : 150

  const [trendSeries, setTrendSeries] = useState<WeeklyActivityDay[]>([])
  const [consistencyMap, setConsistencyMap] = useState<WeeklyActivityDay[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [watchlistCategories, setWatchlistCategories] = useState<WatchlistCategoryWithProgress[]>([])
  const [range, setRange] = useState<ChartRange>('30d')

  useEffect(() => {
    if (!user) return
    getHabitActivitySeries(user.uid, 365).then(setTrendSeries)
    getChallengesOnce(user.uid).then(setChallenges)
    getAllCategoriesWithProgress(user.uid).then(setWatchlistCategories)
  }, [user])

  useEffect(() => {
    if (!user) return
    getConsistencyMap(user.uid, weeksCount).then(setConsistencyMap)
  }, [user, weeksCount])

  const today = todayDateKey()
  const todayEntry = trendSeries[trendSeries.length - 1]
  const currentStreak = computeCurrentStreak(trendSeries)
  const lastWeekStreak = computeCurrentStreak(trendSeries.slice(0, Math.max(0, trendSeries.length - 7)))

  const thisMonth = trendSeries.filter((day) => day.date.getMonth() === new Date().getMonth() && day.date.getFullYear() === new Date().getFullYear())
  const lastMonth = trendSeries.filter((day) => {
    const reference = new Date()
    reference.setMonth(reference.getMonth() - 1)
    return day.date.getMonth() === reference.getMonth() && day.date.getFullYear() === reference.getFullYear()
  })
  const completionRate = (series: WeeklyActivityDay[]) => {
    const totalPossible = series.reduce((sum, day) => sum + day.total, 0)
    const totalChecked = series.reduce((sum, day) => sum + day.checked, 0)
    return totalPossible > 0 ? Math.round((totalChecked / totalPossible) * 100) : 0
  }
  const thisMonthRate = completionRate(thisMonth)
  const lastMonthRate = completionRate(lastMonth)

  const activeChallenges = challenges.filter((challenge) => challenge.endDate >= today)
  const bestChallenge = useMemo(() => {
    return activeChallenges
      .map((challenge) => {
        const dateKeys = enumerateDateKeys(challenge.startDate, challenge.endDate)
        const completedSet = new Set(challenge.completedDates || [])
        const isAuto = challenge.mode === 'auto'
        const completedCount = isAuto ? dateKeys.filter((dateKey) => dateKey <= today).length : completedSet.size
        return { challenge, percent: dateKeys.length > 0 ? completedCount / dateKeys.length : 0 }
      })
      .sort((a, b) => b.percent - a.percent)[0]
  }, [activeChallenges, today])

  const totalCheckIns = trendSeries.reduce((sum, day) => sum + day.checked, 0)
  const thisWeekCheckIns = trendSeries.slice(-7).reduce((sum, day) => sum + day.checked, 0)

  const rangeData = trendSeries.slice(-RANGE_DAYS[range]).map((day) => ({
    date: day.date,
    value: day.total > 0 ? Math.round((day.checked / day.total) * 100) : 0,
  }))

  const greetingHour = new Date().getHours()
  const greetingKey = greetingHour < 12 ? 'dashboard.greetingMorning' : greetingHour < 18 ? 'dashboard.greetingAfternoon' : 'dashboard.greetingEvening'
  const displayName = user?.displayName || user?.email?.split('@')[0] || ''
  const todayLabel = new Date().toLocaleDateString(localeTag, { weekday: 'long', month: 'long', day: 'numeric' })

  const categorySlices = watchlistCategories.map((category, index) => ({
    label: category.name,
    value: category.total,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }))
  const totalWatchlistItems = watchlistCategories.reduce((sum, category) => sum + category.total, 0)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-(--color-parchment)">
            {t(greetingKey)}, {displayName} 👋
          </h1>
          <p className="mt-1 text-sm text-(--color-parchment-muted)">
            {todayLabel}
            {currentStreak > 0 && (
              <> — {t('dashboard.streakRollPrefix')} <span className="font-semibold text-(--color-gold)">{currentStreak} {t('dashboard.streakRollSuffix')}</span></>
            )}
          </p>
        </div>
        <Link to="/challenge">
          <Button>
            <PlusIcon className="size-4" />
            {t('dashboard.newChallengeButton')}
          </Button>
        </Link>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<FireIcon className="size-4" />}
          iconColor="var(--color-gold)"
          label={t('dashboard.statCurrentStreak')}
          value={currentStreak}
          unit={t('common.days')}
          subtext={`${currentStreak >= lastWeekStreak ? '+' : ''}${currentStreak - lastWeekStreak} ${t('dashboard.statVsLastWeek')}`}
          subtextColor="var(--color-accent-green)"
        />
        <StatCard
          icon={<TargetIcon className="size-4" />}
          iconColor="var(--color-accent-green)"
          label={t('dashboard.statCompletionRate')}
          value={thisMonthRate}
          unit="%"
          subtext={`${thisMonthRate >= lastMonthRate ? '+' : ''}${thisMonthRate - lastMonthRate}% ${t('dashboard.statVsLastMonth')}`}
          subtextColor="var(--color-accent-green)"
        />
        <StatCard
          icon={<TrophyIcon className="size-4" />}
          iconColor="var(--color-accent)"
          label={t('dashboard.statActiveChallenges')}
          value={activeChallenges.length}
          subtext={bestChallenge ? `${bestChallenge.challenge.name} — ${Math.round(bestChallenge.percent * 100)}%` : t('dashboard.statNoChallenges')}
        />
        <StatCard
          icon={<CheckCircleIcon className="size-4" />}
          iconColor="var(--color-accent-blue)"
          label={t('dashboard.statTotalCheckIns')}
          value={totalCheckIns}
          subtext={`+${thisWeekCheckIns} ${t('dashboard.statThisWeek')}`}
          subtextColor="var(--color-accent-green)"
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6 lg:col-span-2">
          <h2 className="font-accent text-lg font-semibold text-(--color-parchment)">{t('dashboard.consistencyMapTitle')}</h2>
          <p className="mb-4 mt-1 text-sm text-(--color-ink-40)">
            {t('dashboard.consistencyMapSubtitle').replace('{weeks}', String(weeksCount))}
          </p>
          {consistencyMap.length > 0 ? (
            <Heatmap days={consistencyMap} weeksCount={weeksCount} />
          ) : (
            <p className="py-10 text-center text-sm text-(--color-ink-40)">{t('dashboard.habitGridProgressEmpty')}</p>
          )}
        </div>

        <div className="rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6">
          <h2 className="font-accent text-lg font-semibold text-(--color-parchment)">{t('dashboard.todaysProgressTitle')}</h2>
          <p className="mb-4 mt-1 text-sm text-(--color-ink-40)">
            {todayEntry ? `${todayEntry.checked} ${t('dashboard.todaysProgressOf')} ${todayEntry.total} ${t('dashboard.todaysProgressDone')}` : ''}
          </p>
          <div className="flex justify-center">
            <StatRing
              value={todayEntry?.checked || 0}
              max={todayEntry?.total || 1}
              label={t('dashboard.todaysProgressComplete')}
              color="var(--color-accent-blue)"
              size={ringSize}
            />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-(--color-ink) p-3 text-center">
              <span className="text-lg font-bold text-(--color-accent-green)">{todayEntry?.checked || 0}</span>
              <p className="text-xs text-(--color-ink-40)">{t('dashboard.todaysProgressDoneLabel')}</p>
            </div>
            <div className="rounded-xl bg-(--color-ink) p-3 text-center">
              <span className="text-lg font-bold text-(--color-gold)">{Math.max(0, (todayEntry?.total || 0) - (todayEntry?.checked || 0))}</span>
              <p className="text-xs text-(--color-ink-40)">{t('dashboard.todaysProgressLeftLabel')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6 lg:col-span-2">
          <h2 className="font-accent text-lg font-semibold text-(--color-parchment)">{t('dashboard.trendTitle')}</h2>
          <p className="mb-4 mt-1 text-sm text-(--color-ink-40)">{t('dashboard.trendSubtitle')}</p>
          <AreaChart data={rangeData} range={range} onRangeChange={setRange} />
        </div>

        <div className="rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6">
          <h2 className="font-accent text-lg font-semibold text-(--color-parchment)">{t('dashboard.byCategoryTitle')}</h2>
          <p className="mb-4 mt-1 text-sm text-(--color-ink-40)">{t('dashboard.byCategorySubtitle')}</p>
          {categorySlices.length > 0 ? (
            <DonutChart slices={categorySlices} centerValue={String(totalWatchlistItems)} centerLabel={t('dashboard.byCategoryItems')} />
          ) : (
            <p className="py-10 text-center text-sm text-(--color-ink-40)">{t('dashboard.watchlistProgressEmpty')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
