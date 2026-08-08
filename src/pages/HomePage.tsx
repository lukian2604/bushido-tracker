import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '@/hooks/useTranslation'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Button } from '@/components/ui/Button'
import { ChallengeIcon, HabitGridIcon, WatchlistIcon } from '@/components/ui/icons'

const setMeta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attr, name)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

export const HomePage = () => {
  const { t } = useTranslation()

  useEffect(() => {
    document.title = 'Bushido Tracker — Track Challenges, Habits & Watchlists'
    setMeta('description', 'Bushido Tracker helps you run challenges, build your own habit grid, and keep a watchlist — all in one place.')
    setMeta('og:title', 'Bushido Tracker', 'property')
    setMeta('og:description', 'Run challenges, build your own habit grid, and keep a watchlist — all in one place.', 'property')
    setMeta('og:type', 'website', 'property')
  }, [])

  return (
    <div className="min-h-screen bg-(--color-ink)">
      <header className="border-b border-(--color-border)">
        <div className="mx-auto flex max-w-300 items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/icons/logo-mark.svg" alt="" width={28} height={28} />
            <span className="font-accent text-lg font-semibold text-(--color-parchment)">Bushido Tracker</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-(--color-parchment-muted) md:flex">
            <a href="#features" className="hover:text-(--color-parchment)">{t('nav.features')}</a>
            <a href="#how-it-works" className="hover:text-(--color-parchment)">{t('nav.howItWorks')}</a>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <Link to="/login">
              <Button>{t('nav.signIn')}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="px-6 py-24 text-center">
          <span className="font-accent text-sm font-semibold uppercase tracking-[0.2em] text-(--color-gold)">
            {t('home.eyebrow')}
          </span>
          <h1 className="mx-auto mt-4 max-w-180 text-5xl font-semibold leading-tight text-(--color-parchment)">
            {t('home.heading')}
          </h1>
          <p className="mx-auto mt-5 max-w-130 text-(--color-parchment-muted)">{t('home.subtitle')}</p>
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/login"><Button>{t('home.ctaBegin')}</Button></Link>
            <a href="#how-it-works"><Button variant="ghost">{t('home.ctaLearn')}</Button></a>
          </div>
        </section>

        <section id="features" className="px-6 py-20">
          <div className="mx-auto max-w-300">
            <div className="mx-auto max-w-160 text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-(--color-gold)">{t('home.featuresEyebrow')}</span>
              <h2 className="mt-2 text-3xl font-semibold text-(--color-parchment)">{t('home.featuresHeading')}</h2>
              <p className="mt-3 text-(--color-parchment-muted)">{t('home.featuresSubtitle')}</p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <article className="rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6">
                <ChallengeIcon className="size-7 text-(--color-accent)" />
                <h3 className="mt-4 font-accent text-lg font-semibold text-(--color-parchment)">{t('home.feature1.title')}</h3>
                <p className="mt-2 text-sm text-(--color-parchment-muted)">{t('home.feature1.desc')}</p>
                <div className="mt-5 rounded-xl border border-(--color-border) bg-(--color-ink) p-4">
                  <p className="mb-2 text-xs text-(--color-ink-40)">75 Hard — 42/75 days</p>
                  <div className="flex h-2 overflow-hidden rounded-full bg-(--color-ink-15)">
                    <div className="h-full w-[56%] rounded-full bg-(--color-gold)" />
                  </div>
                </div>
              </article>

              <article className="rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6">
                <HabitGridIcon className="size-7 text-(--color-accent-green)" />
                <h3 className="mt-4 font-accent text-lg font-semibold text-(--color-parchment)">{t('home.feature2.title')}</h3>
                <p className="mt-2 text-sm text-(--color-parchment-muted)">{t('home.feature2.desc')}</p>
                <div className="mt-5 grid grid-cols-7 gap-1.5">
                  {Array.from({ length: 21 }, (_, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-sm"
                      style={{ backgroundColor: [3, 4, 5, 9, 10, 11, 12, 16, 17, 18].includes(index) ? 'var(--color-accent-green)' : 'var(--color-ink-15)' }}
                    />
                  ))}
                </div>
              </article>

              <article className="rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6">
                <WatchlistIcon className="size-7 text-(--color-accent-blue)" />
                <h3 className="mt-4 font-accent text-lg font-semibold text-(--color-parchment)">{t('home.feature3.title')}</h3>
                <p className="mt-2 text-sm text-(--color-parchment-muted)">{t('home.feature3.desc')}</p>
                <div className="mt-5 flex flex-col gap-2">
                  {[
                    { title: 'Attack on Titan', status: 'Watching' },
                    { title: 'Naruto', status: 'Completed' },
                  ].map((row) => (
                    <div key={row.title} className="flex items-center justify-between rounded-lg bg-(--color-ink) px-3 py-2 text-sm">
                      <span className="text-(--color-parchment)">{row.title}</span>
                      <span className="text-xs text-(--color-accent-blue)">{row.status}</span>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="px-6 py-20">
          <div className="mx-auto max-w-300">
            <div className="mx-auto max-w-160 text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-(--color-gold)">{t('home.pathEyebrow')}</span>
              <h2 className="mt-2 text-3xl font-semibold text-(--color-parchment)">{t('home.pathHeading')}</h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {(['step1', 'step2', 'step3'] as const).map((step, index) => (
                <article key={step} className="rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6">
                  <span className="font-accent text-2xl font-bold text-(--color-gold)">{index + 1}</span>
                  <h3 className="mt-3 font-accent text-lg font-semibold text-(--color-parchment)">{t(`home.${step}.title`)}</h3>
                  <p className="mt-2 text-sm text-(--color-parchment-muted)">{t(`home.${step}.desc`)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto max-w-180 rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-10 text-center">
            <h2 className="font-accent text-2xl font-semibold text-(--color-parchment)">{t('home.ctaBannerHeading')}</h2>
            <p className="mt-2 text-(--color-parchment-muted)">{t('home.ctaBannerText')}</p>
            <Link to="/login" className="mt-6 inline-block"><Button>{t('home.ctaBegin')}</Button></Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-(--color-border) px-6 py-6">
        <div className="mx-auto flex max-w-300 items-center justify-between text-sm text-(--color-ink-40)">
          <span>{t('footer.copyright')}</span>
          <a href="#features" className="hover:text-(--color-parchment-muted)">{t('nav.features')}</a>
        </div>
      </footer>
    </div>
  )
}
