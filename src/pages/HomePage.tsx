import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '@/hooks/useTranslation'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { PaletteSwitcher } from '@/components/ui/PaletteSwitcher'
import { Button } from '@/components/ui/Button'
import {
  ChallengeIcon,
  HabitGridIcon,
  WatchlistIcon,
  CheckCircleIcon,
  FireIcon,
  RankSamuraiIcon,
} from '@/components/ui/icons'

const setMeta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attr, name)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

// Filigrana in kanji dietro le sezioni chiave — stessa tecnica già usata nel modal di
// level-up (opacità bassissima, font accent enorme), per dare coerenza visiva col resto
// dell'app invece di inventare un nuovo linguaggio decorativo solo per la homepage.
const KanjiWatermark = ({ kanji, className = '' }: { kanji: string; className?: string }) => (
  <span
    aria-hidden="true"
    className={`font-accent pointer-events-none absolute select-none font-bold leading-none text-(--color-gold) opacity-[0.05] ${className}`}
  >
    {kanji}
  </span>
)

const GlowBlob = ({ className = '' }: { className?: string }) => (
  <div aria-hidden="true" className={`pointer-events-none absolute rounded-full bg-(--color-gold) opacity-20 blur-[90px] ${className}`} />
)

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
    <div className="min-h-screen overflow-x-hidden bg-(--color-ink)">
      <header className="sticky top-0 z-30 border-b border-(--color-border) bg-(--color-ink)/85 backdrop-blur">
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
            <PaletteSwitcher />
            <ThemeToggle />
            <Link to="/login">
              <Button>{t('nav.signIn')}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-6 pb-20 pt-20 md:pt-28">
          <KanjiWatermark kanji="武士道" className="-top-10 left-1/2 -translate-x-1/2 text-[clamp(9rem,28vw,22rem)] md:-top-16" />
          <GlowBlob className="-right-40 top-10 size-96" />
          <GlowBlob className="-left-32 top-60 size-72 bg-(--color-accent) opacity-15" />

          <div className="relative mx-auto grid max-w-300 items-center gap-14 md:grid-cols-2">
            <div className="text-center md:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-(--color-gold)/40 bg-(--color-ink-10) px-4 py-1.5 font-accent text-sm font-semibold uppercase tracking-[0.2em] text-(--color-gold)">
                {t('home.eyebrow')}
              </span>
              <h1 className="font-accent mx-auto mt-6 max-w-160 text-4xl font-semibold leading-[1.1] text-(--color-parchment) md:mx-0 md:text-6xl">
                {t('home.heading')}
              </h1>
              <p className="mx-auto mt-5 max-w-125 text-lg text-(--color-parchment-muted) md:mx-0">{t('home.subtitle')}</p>

              <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:justify-center md:justify-start">
                <Link to="/login">
                  <Button className="px-6 py-3.5 text-base shadow-[0_10px_35px_-10px_var(--color-accent)]">{t('home.ctaBegin')}</Button>
                </Link>
                <a href="#how-it-works"><Button variant="ghost" className="px-6 py-3.5 text-base">{t('home.ctaLearn')}</Button></a>
              </div>

              <ul className="mt-9 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-(--color-parchment-muted) md:justify-start">
                {(['home.badgeFree', 'home.badgeLanguages', 'home.badgeThemes'] as const).map((key) => (
                  <li key={key} className="flex items-center gap-1.5">
                    <CheckCircleIcon className="size-4 text-(--color-accent-green)" />
                    {t(key)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative mx-auto h-80 w-full max-w-100 md:h-96">
              <div className="absolute right-2 top-2 w-64 -rotate-6 rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-4 shadow-2xl">
                <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-(--color-ink-40)">{t('home.feature2.title')}</p>
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: 21 }, (_, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-sm"
                      style={{ backgroundColor: [3, 4, 5, 9, 10, 11, 12, 16, 17, 18].includes(index) ? 'var(--color-accent-green)' : 'var(--color-ink-15)' }}
                    />
                  ))}
                </div>
              </div>

              <div className="absolute bottom-2 left-2 w-64 rotate-3 rounded-2xl border border-(--color-gold)/50 bg-(--color-ink-10) p-5 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 flex-none items-center justify-center rounded-full border-2 border-(--color-gold) text-(--color-gold)">
                    <RankSamuraiIcon className="size-6" />
                  </div>
                  <div>
                    <p className="font-accent text-sm font-semibold text-(--color-parchment)">Samurai</p>
                    <p className="text-xs text-(--color-parchment-muted)">42 day streak</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-(--color-ink) px-3 py-2">
                  <FireIcon className="size-4 text-(--color-accent)" />
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-(--color-ink-15)">
                    <div className="h-full w-[70%] rounded-full bg-(--color-accent)" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="relative px-6 py-20">
          <div className="mx-auto max-w-300">
            <div className="mx-auto max-w-160 text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-(--color-gold)">{t('home.featuresEyebrow')}</span>
              <h2 className="font-accent mt-2 text-3xl font-semibold text-(--color-parchment)">{t('home.featuresHeading')}</h2>
              <p className="mt-3 text-(--color-parchment-muted)">{t('home.featuresSubtitle')}</p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <article className="group rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6 transition-transform duration-300 hover:-translate-y-1.5 hover:border-(--color-accent)/60">
                <div className="flex size-12 items-center justify-center rounded-xl bg-(--color-accent)/15 text-(--color-accent)">
                  <ChallengeIcon className="size-6" />
                </div>
                <h3 className="font-accent mt-4 text-lg font-semibold text-(--color-parchment)">{t('home.feature1.title')}</h3>
                <p className="mt-2 text-sm text-(--color-parchment-muted)">{t('home.feature1.desc')}</p>
                <div className="mt-5 rounded-xl border border-(--color-border) bg-(--color-ink) p-4">
                  <p className="mb-2 text-xs text-(--color-ink-40)">75 Hard — 42/75 days</p>
                  <div className="flex h-2 overflow-hidden rounded-full bg-(--color-ink-15)">
                    <div className="h-full w-[56%] rounded-full bg-(--color-gold)" />
                  </div>
                </div>
              </article>

              <article className="group rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6 transition-transform duration-300 hover:-translate-y-1.5 hover:border-(--color-accent-green)/60">
                <div className="flex size-12 items-center justify-center rounded-xl bg-(--color-accent-green)/15 text-(--color-accent-green)">
                  <HabitGridIcon className="size-6" />
                </div>
                <h3 className="font-accent mt-4 text-lg font-semibold text-(--color-parchment)">{t('home.feature2.title')}</h3>
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

              <article className="group rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6 transition-transform duration-300 hover:-translate-y-1.5 hover:border-(--color-accent-blue)/60">
                <div className="flex size-12 items-center justify-center rounded-xl bg-(--color-accent-blue)/15 text-(--color-accent-blue)">
                  <WatchlistIcon className="size-6" />
                </div>
                <h3 className="font-accent mt-4 text-lg font-semibold text-(--color-parchment)">{t('home.feature3.title')}</h3>
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

        <section id="how-it-works" className="relative px-6 py-20">
          <div className="mx-auto max-w-300">
            <div className="mx-auto max-w-160 text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-(--color-gold)">{t('home.pathEyebrow')}</span>
              <h2 className="font-accent mt-2 text-3xl font-semibold text-(--color-parchment)">{t('home.pathHeading')}</h2>
            </div>

            <div className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-6">
              <div
                aria-hidden="true"
                className="absolute top-6 left-[16.5%] right-[16.5%] hidden border-t border-dashed border-(--color-border) md:block"
              />
              {(['step1', 'step2', 'step3'] as const).map((step, index) => (
                <div key={step} className="relative text-center">
                  <span className="font-accent relative z-10 mx-auto flex size-12 items-center justify-center rounded-full border-2 border-(--color-gold) bg-(--color-ink) text-lg font-bold text-(--color-gold)">
                    {index + 1}
                  </span>
                  <h3 className="font-accent mt-4 text-lg font-semibold text-(--color-parchment)">{t(`home.${step}.title`)}</h3>
                  <p className="mx-auto mt-2 max-w-70 text-sm text-(--color-parchment-muted)">{t(`home.${step}.desc`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative px-6 py-20">
          <div className="relative mx-auto max-w-180 overflow-hidden rounded-2xl border border-(--color-gold)/40 bg-(--color-ink-10) p-10 text-center">
            <KanjiWatermark kanji="道" className="-right-6 -top-10 text-[14rem]" />
            <div className="relative">
              <h2 className="font-accent text-2xl font-semibold text-(--color-parchment) md:text-3xl">{t('home.ctaBannerHeading')}</h2>
              <p className="mt-2 text-(--color-parchment-muted)">{t('home.ctaBannerText')}</p>
              <Link to="/login" className="mt-6 inline-block">
                <Button className="px-6 py-3.5 text-base shadow-[0_10px_35px_-10px_var(--color-accent)]">{t('home.ctaBegin')}</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-(--color-border) px-6 py-8">
        <div className="mx-auto flex max-w-300 flex-col items-center gap-4 text-sm text-(--color-ink-40) md:flex-row md:justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/icons/logo-mark.svg" alt="" width={20} height={20} className="opacity-70" />
            <span>{t('footer.copyright')}</span>
          </div>
          <a href="#features" className="hover:text-(--color-parchment-muted)">{t('nav.features')}</a>
        </div>
      </footer>
    </div>
  )
}
