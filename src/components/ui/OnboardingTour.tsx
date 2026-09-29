import { useState, type ComponentType, type SVGProps } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '@/hooks/useTranslation'
import { Button } from '@/components/ui/Button'
import { ChallengeIcon, HabitGridIcon, WatchlistIcon, FriendsIcon, RankShogunIcon, FireIcon, DashboardIcon } from '@/components/ui/icons'

interface OnboardingStep {
  kanji: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  color: string
  titleKey: string
  bodyKey: string
}

// Un passo per ogni sezione principale, nell'ordine in cui conviene iniziare a usarle.
const STEPS: OnboardingStep[] = [
  { kanji: '道', Icon: FireIcon, color: 'var(--color-gold)', titleKey: 'onboarding.welcomeTitle', bodyKey: 'onboarding.welcomeBody' },
  { kanji: '習', Icon: HabitGridIcon, color: 'var(--color-accent-green)', titleKey: 'nav.habitGrid', bodyKey: 'onboarding.habitsBody' },
  { kanji: '挑', Icon: ChallengeIcon, color: 'var(--color-accent)', titleKey: 'nav.challenge', bodyKey: 'onboarding.challengesBody' },
  { kanji: '蔵', Icon: WatchlistIcon, color: 'var(--color-accent-blue)', titleKey: 'nav.watchlist', bodyKey: 'onboarding.watchlistBody' },
  { kanji: '侍', Icon: RankShogunIcon, color: 'var(--color-rank-shogun)', titleKey: 'onboarding.rankTitle', bodyKey: 'onboarding.rankBody' },
  { kanji: '友', Icon: FriendsIcon, color: 'var(--color-rank-ashigaru)', titleKey: 'nav.friends', bodyKey: 'onboarding.friendsBody' },
  { kanji: '始', Icon: DashboardIcon, color: 'var(--color-gold)', titleKey: 'onboarding.finishTitle', bodyKey: 'onboarding.finishBody' },
]

interface OnboardingTourProps {
  displayName: string
  onFinish: () => void
}

export const OnboardingTour = ({ displayName, onFinish }: OnboardingTourProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)
  const step = STEPS[stepIndex]
  const isFirst = stepIndex === 0
  const isLast = stepIndex === STEPS.length - 1

  const finish = (path?: string) => {
    onFinish()
    if (path) navigate(path)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={t('onboarding.ariaLabel')}>
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-7 text-center">
        <span
          aria-hidden="true"
          className="font-accent pointer-events-none absolute -right-6 -top-8 select-none text-[170px] font-bold leading-none opacity-[0.07]"
          style={{ color: step.color }}
        >
          {step.kanji}
        </span>

        {!isLast && (
          <button
            type="button"
            onClick={() => finish()}
            className="absolute right-4 top-4 text-xs text-(--color-ink-40) hover:text-(--color-parchment)"
          >
            {t('onboarding.skip')}
          </button>
        )}

        <div className="relative">
          <div
            key={stepIndex}
            className="onboarding-step-in mx-auto flex size-16 items-center justify-center rounded-full border-2"
            style={{ borderColor: step.color, color: step.color }}
          >
            <step.Icon className="size-7" />
          </div>

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-(--color-ink-40)">
            {t('onboarding.stepOf').replace('{current}', String(stepIndex + 1)).replace('{total}', String(STEPS.length))}
          </p>
          <h2 className="font-accent mt-1.5 text-2xl font-semibold text-(--color-parchment)">
            {t(step.titleKey).replace('{name}', displayName)}
          </h2>
          <p className="mx-auto mt-3 min-h-[4.5rem] max-w-sm text-sm leading-relaxed text-(--color-parchment-muted)">{t(step.bodyKey)}</p>

          <div className="mt-5 flex justify-center gap-1.5" aria-hidden="true">
            {STEPS.map((_, index) => (
              <span
                key={index}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: index === stepIndex ? 20 : 6,
                  backgroundColor: index <= stepIndex ? step.color : 'var(--color-ink-20)',
                }}
              />
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {!isFirst && (
              <Button type="button" variant="ghost" onClick={() => setStepIndex((index) => index - 1)}>
                {t('onboarding.back')}
              </Button>
            )}
            {isLast ? (
              <>
                <Button type="button" variant="ghost" onClick={() => finish('/dashboard')}>
                  {t('onboarding.goDashboard')}
                </Button>
                <Button type="button" onClick={() => finish('/habit-grid')}>
                  {t('onboarding.startHabits')}
                </Button>
              </>
            ) : (
              <Button type="button" onClick={() => setStepIndex((index) => index + 1)} autoFocus>
                {isFirst ? t('onboarding.begin') : t('onboarding.next')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
