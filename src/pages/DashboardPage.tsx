import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/hooks/useTranslation'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useDashboardConfig } from '@/hooks/useDashboardConfig'
import { Button } from '@/components/ui/Button'
import { StatCard } from '@/components/ui/StatCard'
import { Heatmap } from '@/components/ui/Heatmap'
import { AreaChart, type ChartRange } from '@/components/ui/AreaChart'
import { DonutChart } from '@/components/ui/DonutChart'
import { StatRing } from '@/components/ui/StatRing'
import { AvatarFrame } from '@/components/ui/AvatarFrame'
import { DashboardSettingsModal } from '@/components/ui/DashboardSettingsModal'
import { DashboardGrid } from '@/components/ui/DashboardGrid'
import {
  FireIcon,
  TargetIcon,
  TrophyIcon,
  CheckCircleIcon,
  XIcon,
  SettingsIcon,
  LayoutEditIcon,
  DragHandleIcon,
} from '@/components/ui/icons'
import { DEFAULT_DASHBOARD_LAYOUT } from '@/lib/dashboard-widgets'
import { getChallengesOnce } from '@/services/challenge-service'
import { getConsistencyMap, getHabitActivitySeries } from '@/services/habit-grid-service'
import { getAllCategoriesWithProgress } from '@/services/watchlist-service'
import { computeCurrentStreak } from '@/lib/streak'
import { todayDateKey, BCP47_LOCALES } from '@/lib/date-utils'
import { computeChallengeProgress } from '@/lib/challenge-progress'
import { isKnowledgeMediaType } from '@/lib/watchlist-balance'
import type { Challenge, DashboardWidgetConfig, DashboardWidgetId, DashboardWidgetLayout, WatchlistCategoryWithProgress, WeeklyActivityDay } from '@/lib/types'

const RANGE_DAYS: Record<ChartRange, number> = { '30d': 30, '90d': 90, '1y': 365 }

const CATEGORY_COLORS = ['var(--color-accent-green)', 'var(--color-accent-blue)', 'var(--color-accent)', 'var(--color-gold)', '#8C4C7A']

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

export const DashboardPage = () => {
  const { user } = useAuth()
  const { t, locale } = useTranslation()
  const localeTag = BCP47_LOCALES[locale] || 'en-US'
  const isMobile = useIsMobile()
  const isDesktop = !useIsMobile(1024)

  const [trendSeries, setTrendSeries] = useState<WeeklyActivityDay[]>([])
  const [consistencyMap, setConsistencyMap] = useState<WeeklyActivityDay[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [watchlistCategories, setWatchlistCategories] = useState<WatchlistCategoryWithProgress[]>([])
  const [range, setRange] = useState<ChartRange>('30d')
  const [isChallengesModalOpen, setIsChallengesModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isEditingLayout, setIsEditingLayout] = useState(false)
  const { config: widgetConfig, updateConfig: updateWidgetConfig, layout: widgetLayout, updateLayout: updateWidgetLayout } = useDashboardConfig()
  const [draftLayout, setDraftLayout] = useState<DashboardWidgetLayout[]>(widgetLayout)

  const startEditingLayout = () => {
    setDraftLayout(widgetLayout)
    setIsEditingLayout(true)
  }
  const saveLayout = () => {
    updateWidgetLayout(draftLayout)
    // L'ordine (usato dalla lista semplice su mobile) segue la posizione sulla griglia
    // desktop — lettura per riga poi colonna — così il riordino via trascinamento
    // resta l'unico modo per riordinare, senza bisogno di frecce separate.
    const byPosition = [...draftLayout].sort((a, b) => a.y - b.y || a.x - b.x)
    const reordered = byPosition
      .map((entry) => widgetConfig.find((widget) => widget.id === entry.id))
      .filter((widget): widget is DashboardWidgetConfig => Boolean(widget))
    const hidden = widgetConfig.filter((widget) => !widget.visible)
    updateWidgetConfig([...reordered, ...hidden])
    setIsEditingLayout(false)
  }
  const cancelEditingLayout = () => {
    setIsEditingLayout(false)
  }
  const resetLayout = () => {
    setDraftLayout(DEFAULT_DASHBOARD_LAYOUT)
  }

  // Dimensioni dei contenuti derivate dalla griglia: ogni widget adatta quanto mostra
  // alla propria dimensione attuale invece di restare fisso quando lo ridimensioni.
  const activeLayout = isEditingLayout ? draftLayout : widgetLayout
  const getLayout = (id: DashboardWidgetId) => activeLayout.find((entry) => entry.id === id)
  // La mappa di costanza determina anche quanti dati caricare da Firestore: si aggiorna
  // solo con la disposizione salvata (non durante il trascinamento live) per non rifare
  // query ad ogni pixel di ridimensionamento.
  const savedConsistencyWidth = widgetLayout.find((entry) => entry.id === 'consistencyMap')?.w ?? 7
  const weeksCount = isMobile ? 9 : Math.round(savedConsistencyWidth * 2.57)

  const todayProgressLayout = getLayout('todayProgress')
  const ringSize = isMobile
    ? 110
    : clamp(Math.min((todayProgressLayout?.h ?? 4) * 37.5, (todayProgressLayout?.w ?? 5) * 30), 90, 220)

  const byCategoryLayout = getLayout('byCategory')
  const donutSize = isMobile ? 128 : clamp(Math.min(byCategoryLayout?.w ?? 5, byCategoryLayout?.h ?? 5) * 26, 90, 220)
  // Rivelazione progressiva in base allo spazio: prima solo il cerchio, poi il blocco
  // studio/svago quando c'è posto, poi le righe categoria man mano che allunghi ancora.
  const afterDonutBudget = 84 * (byCategoryLayout?.h ?? 6) - 14 - 48 - 68 - donutSize
  const showBalanceBlock = isMobile || afterDonutBudget >= 112
  const categoryListBudget = showBalanceBlock ? afterDonutBudget - 112 - 16 : 0
  const categoryRowCount = Math.max(0, Math.floor(categoryListBudget / 22) - 1)
  // Mai mostrare una sola riga isolata: o niente (solo cerchio + statistica) o almeno due.
  const categoryVisibleCount = isMobile ? Infinity : categoryRowCount === 1 ? 0 : categoryRowCount

  const trendLayout = getLayout('trend')
  const trendHeight = isMobile ? 180 : clamp((trendLayout?.h ?? 4) * 45, 120, 320)

  const activeChallengesLayout = getLayout('activeChallenges')
  const challengesVisibleCount = isMobile
    ? 2
    : Math.max(2, Math.floor((84 * (activeChallengesLayout?.h ?? 4) - 146) / 48))

  useEffect(() => {
    if (!user) return
    getHabitActivitySeries(user.uid, 365).then(setTrendSeries).catch(() => {})
    getChallengesOnce(user.uid).then(setChallenges).catch(() => {})
    getAllCategoriesWithProgress(user.uid).then(setWatchlistCategories).catch(() => {})
  }, [user])

  useEffect(() => {
    if (!user) return
    getConsistencyMap(user.uid, weeksCount).then(setConsistencyMap).catch(() => {})
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
  const challengesWithProgress = useMemo(() => {
    return activeChallenges
      .map((challenge) => ({ challenge, percent: computeChallengeProgress(challenge, today).percent / 100 }))
      .sort((a, b) => b.percent - a.percent)
  }, [activeChallenges, today])
  const bestChallenge = challengesWithProgress[0]

  const totalCheckIns = trendSeries.reduce((sum, day) => sum + day.checked, 0)
  const last7Days = trendSeries.slice(-7)
  const thisWeekCheckIns = last7Days.reduce((sum, day) => sum + day.checked, 0)
  const thisWeekTotal = last7Days.reduce((sum, day) => sum + day.total, 0)
  const thisWeekPercent = thisWeekTotal > 0 ? Math.round((thisWeekCheckIns / thisWeekTotal) * 100) : 0
  const habitCount = todayEntry?.total || 0

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

  const knowledgePoints = watchlistCategories.reduce((sum, category) => sum + category.watched, 0)
  const studyWatched = watchlistCategories
    .filter((category) => isKnowledgeMediaType(category.mediaType || 'video'))
    .reduce((sum, category) => sum + category.watched, 0)
  const studyPercent = knowledgePoints > 0 ? Math.round((studyWatched / knowledgePoints) * 100) : 0
  const leisurePercent = knowledgePoints > 0 ? 100 - studyPercent : 0
  const balanceInsightKey =
    studyPercent >= 60 ? 'dashboard.balanceInsightStudy' : studyPercent <= 40 ? 'dashboard.balanceInsightLeisure' : 'dashboard.balanceInsightBalanced'

  const cardClass = 'rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6'

  const WIDGET_CONTENT: Record<DashboardWidgetId, ReactNode> = {
    consistencyMap: (
      <>
        <h2 className="font-accent text-lg font-semibold text-(--color-parchment)">{t('dashboard.consistencyMapTitle')}</h2>
        <p className="mb-4 mt-1 text-sm text-(--color-ink-40)">
          {t('dashboard.consistencyMapSubtitle').replace('{weeks}', String(weeksCount))}
        </p>
        {consistencyMap.length > 0 ? (
          <Heatmap days={consistencyMap} weeksCount={weeksCount} />
        ) : (
          <p className="py-10 text-center text-sm text-(--color-ink-40)">{t('dashboard.habitGridProgressEmpty')}</p>
        )}
      </>
    ),
    trend: (
      <>
        <h2 className="font-accent text-lg font-semibold text-(--color-parchment)">{t('dashboard.trendTitle')}</h2>
        <p className="mb-4 mt-1 text-sm text-(--color-ink-40)">{t('dashboard.trendSubtitle')}</p>
        <AreaChart data={rangeData} range={range} onRangeChange={setRange} height={trendHeight} />
      </>
    ),
    weeklyGoal: (
      <>
        <h2 className="font-accent text-lg font-semibold text-(--color-parchment)">{t('dashboard.weeklyGoalTitle')}</h2>
        <p className="mb-4 mt-1 text-sm text-(--color-ink-40)">{t('dashboard.weeklyGoalSubtitle')}</p>
        {habitCount > 0 ? (
          <>
            <div className="flex items-baseline gap-1.5">
              <span className="font-accent text-2xl font-bold text-(--color-parchment)">{thisWeekCheckIns}</span>
              <span className="text-sm text-(--color-parchment-muted)">
                {t('dashboard.weeklyGoalOf')} {thisWeekTotal} {t('dashboard.weeklyGoalCheckIns')}
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-(--color-ink-20)">
              <div className="h-full rounded-full bg-(--color-accent-green)" style={{ width: `${thisWeekPercent}%` }} />
            </div>
            <p className="mt-2 text-xs text-(--color-ink-40)">
              {t('dashboard.weeklyGoalHint').replace('{percent}', String(thisWeekPercent)).replace('{habits}', String(habitCount))}
            </p>
          </>
        ) : (
          <p className="py-6 text-center text-sm text-(--color-ink-40)">{t('dashboard.habitGridProgressEmpty')}</p>
        )}
      </>
    ),
    todayProgress: (
      <>
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
      </>
    ),
    byCategory: (
      <>
        <div className="mb-4">
          <h2 className="font-accent text-lg font-semibold text-(--color-parchment)">{t('dashboard.byCategoryTitle')}</h2>
          <p className="mt-1 text-sm text-(--color-ink-40)">{t('dashboard.byCategorySubtitle')}</p>
        </div>
        {categorySlices.length > 0 ? (
          <>
            <DonutChart
              slices={categorySlices}
              centerValue={String(totalWatchlistItems)}
              centerLabel={t('dashboard.byCategoryItems')}
              showLegend={false}
              size={donutSize}
            />
            {categoryVisibleCount > 0 && (
              <div className="mt-4 flex flex-col gap-1.5">
                {categorySlices.slice(0, categoryVisibleCount).map((slice) => (
                  <div key={slice.label} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex min-w-0 items-center gap-1.5 text-(--color-parchment-muted)">
                      <span className="size-2 flex-none rounded-full" style={{ backgroundColor: slice.color }} />
                      <span className="truncate">{slice.label}</span>
                    </span>
                    <span className="flex-none tabular-nums text-(--color-ink-40)">
                      {totalWatchlistItems > 0 ? Math.round((slice.value / totalWatchlistItems) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            )}
            {showBalanceBlock &&
              (knowledgePoints > 0 ? (
                <div className="mt-4 rounded-xl bg-(--color-ink) p-3.5">
                  <div className="flex items-center justify-between text-xs tabular-nums text-(--color-parchment-muted)">
                    <span>{studyPercent}% {t('dashboard.balanceStudyLabel')}</span>
                    <span>{leisurePercent}% {t('dashboard.balanceLeisureLabel')}</span>
                  </div>
                  <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full">
                    <div className="h-full bg-(--color-gold)" style={{ width: `${studyPercent}%` }} />
                    <div className="h-full bg-(--color-accent-blue)" style={{ width: `${leisurePercent}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-(--color-ink-40)">{t(balanceInsightKey)}</p>
                </div>
              ) : (
                <p className="mt-4 text-center text-xs text-(--color-ink-40)">{t('dashboard.balanceInsightEmpty')}</p>
              ))}
          </>
        ) : (
          <p className="py-10 text-center text-sm text-(--color-ink-40)">{t('dashboard.watchlistProgressEmpty')}</p>
        )}
      </>
    ),
    activeChallenges: (
      <>
        <h2 className="font-accent text-lg font-semibold text-(--color-parchment)">{t('dashboard.activeChallengesTitle')}</h2>
        <p className="mb-4 mt-1 text-sm text-(--color-ink-40)">{t('dashboard.activeChallengesSubtitle')}</p>
        {challengesWithProgress.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-(--color-accent)/15 text-(--color-accent)">
              <TrophyIcon className="size-5" />
            </span>
            <p className="text-sm font-semibold text-(--color-parchment)">{t('dashboard.noActiveChallengesTitle')}</p>
            <p className="mt-1 text-xs text-(--color-ink-40)">{t('dashboard.noActiveChallengesSub')}</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              {challengesWithProgress.slice(0, challengesVisibleCount).map(({ challenge, percent }) => (
                <div key={challenge.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-(--color-parchment)">{challenge.name}</span>
                    <span className="flex-none text-sm tabular-nums text-(--color-parchment-muted)">{Math.round(percent * 100)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-(--color-ink-20)">
                    <div className="h-full rounded-full bg-(--color-accent)" style={{ width: `${Math.round(percent * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
            {challengesWithProgress.length > challengesVisibleCount && (
              <button
                type="button"
                onClick={() => setIsChallengesModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-(--color-parchment-muted) hover:text-(--color-gold)"
              >
                {t('dashboard.viewAllChallenges')}
              </button>
            )}
          </>
        )}
      </>
    ),
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {user && <AvatarFrame streak={currentStreak} uid={user.uid} displayName={displayName} size={56} showSeal={false} />}
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
        </div>
        <div className="flex flex-none items-center gap-2">
          {isEditingLayout ? (
            <>
              <button type="button" onClick={resetLayout} className="text-xs font-medium text-(--color-parchment-muted) hover:text-(--color-parchment)">
                {t('dashboard.editLayoutReset')}
              </button>
              <button type="button" onClick={cancelEditingLayout} className="text-xs font-medium text-(--color-parchment-muted) hover:text-(--color-parchment)">
                {t('common.cancel')}
              </button>
              <Button type="button" onClick={saveLayout}>
                {t('dashboard.editLayoutDone')}
              </Button>
            </>
          ) : (
            <>
              {isDesktop && (
                <button
                  type="button"
                  onClick={startEditingLayout}
                  aria-label={t('dashboard.editLayoutButton')}
                  className="flex size-9 items-center justify-center rounded-lg border border-(--color-border) text-(--color-parchment-muted) hover:border-(--color-accent) hover:text-(--color-accent)"
                >
                  <LayoutEditIcon className="size-4.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(true)}
                aria-label={t('dashboard.settingsTitle')}
                className="flex size-9 items-center justify-center rounded-lg border border-(--color-border) text-(--color-parchment-muted) hover:border-(--color-accent) hover:text-(--color-accent)"
              >
                <SettingsIcon className="size-4.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {isEditingLayout && (
        <p className="mb-3.5 text-xs text-(--color-ink-40)">{t('dashboard.editLayoutHint')}</p>
      )}

      <div className="mb-3.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<FireIcon className="size-3.5" />}
          iconColor="var(--color-gold)"
          label={t('dashboard.statCurrentStreak')}
          value={currentStreak}
          unit={t('common.days')}
          delta={`${currentStreak - lastWeekStreak >= 0 ? '+' : ''}${currentStreak - lastWeekStreak} ${t('dashboard.statVsLastWeek')}`}
          trend={currentStreak === lastWeekStreak ? 'neutral' : currentStreak > lastWeekStreak ? 'good' : 'bad'}
        />
        <StatCard
          icon={<TargetIcon className="size-3.5" />}
          iconColor="var(--color-accent-green)"
          label={t('dashboard.statCompletionRate')}
          value={thisMonthRate}
          unit="%"
          delta={`${thisMonthRate - lastMonthRate >= 0 ? '+' : ''}${thisMonthRate - lastMonthRate}% ${t('dashboard.statVsLastMonth')}`}
          trend={thisMonthRate === lastMonthRate ? 'neutral' : thisMonthRate > lastMonthRate ? 'good' : 'bad'}
        />
        <StatCard
          icon={<TrophyIcon className="size-3.5" />}
          iconColor="var(--color-accent)"
          label={t('dashboard.statActiveChallenges')}
          value={activeChallenges.length}
          delta={bestChallenge ? `${bestChallenge.challenge.name} — ${Math.round(bestChallenge.percent * 100)}%` : t('dashboard.statNoChallenges')}
          trend="neutral"
        />
        <StatCard
          icon={<CheckCircleIcon className="size-3.5" />}
          iconColor="var(--color-accent-blue)"
          label={t('dashboard.statTotalCheckIns')}
          value={totalCheckIns}
          delta={`+${thisWeekCheckIns} ${t('dashboard.statThisWeek')}`}
          trend="good"
        />
      </div>

      {isDesktop ? (
        <DashboardGrid
          key={isEditingLayout ? 'editing' : 'viewing'}
          layout={(isEditingLayout ? draftLayout : widgetLayout).filter((entry) =>
            widgetConfig.some((widget) => widget.id === entry.id && widget.visible),
          )}
          editable={isEditingLayout}
          onLayoutChange={setDraftLayout}
        >
          {widgetConfig
            .filter((widget) => widget.visible)
            .map((widget) => (
              <div key={widget.id} className={`${cardClass} relative`}>
                {isEditingLayout && (
                  <div className="widget-drag-handle absolute right-3 top-3 z-10 flex size-7 cursor-grab items-center justify-center rounded-md bg-(--color-ink) text-(--color-parchment-muted) active:cursor-grabbing">
                    <DragHandleIcon className="size-4" />
                  </div>
                )}
                <div className="size-full overflow-hidden">{WIDGET_CONTENT[widget.id]}</div>
              </div>
            ))}
        </DashboardGrid>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {widgetConfig
            .filter((widget) => widget.visible)
            .map((widget, index) => (
              <div key={widget.id} className={cardClass} style={{ order: index }}>
                {WIDGET_CONTENT[widget.id]}
              </div>
            ))}
        </div>
      )}

      {isSettingsModalOpen && (
        <DashboardSettingsModal
          config={widgetConfig}
          onClose={() => setIsSettingsModalOpen(false)}
          onSave={(next) => {
            updateWidgetConfig(next)
            setIsSettingsModalOpen(false)
          }}
        />
      )}

      {isChallengesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setIsChallengesModalOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-accent text-lg font-semibold text-(--color-parchment)">{t('dashboard.activeChallengesTitle')}</h3>
              <button
                type="button"
                onClick={() => setIsChallengesModalOpen(false)}
                aria-label={t('common.cancel')}
                className="flex size-8 items-center justify-center rounded-lg border border-(--color-border) text-(--color-parchment-muted) hover:border-(--color-ink-20) hover:text-(--color-parchment)"
              >
                <XIcon className="size-4" />
              </button>
            </div>
            <div className="flex max-h-96 flex-col gap-4 overflow-y-auto">
              {challengesWithProgress.map(({ challenge, percent }) => (
                <div key={challenge.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-(--color-parchment)">{challenge.name}</span>
                    <span className="flex-none text-sm tabular-nums text-(--color-parchment-muted)">{Math.round(percent * 100)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-(--color-ink-20)">
                    <div className="h-full rounded-full bg-(--color-accent)" style={{ width: `${Math.round(percent * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
