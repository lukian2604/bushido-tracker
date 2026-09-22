import type { CSSProperties } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { Button } from '@/components/ui/Button'
import { RankRoninIcon, RankAshigaruIcon, RankSamuraiIcon, RankDaimyoIcon, RankShogunIcon, ProfileIcon } from '@/components/ui/icons'
import type { RankDef, RankId } from '@/lib/ranks'

const SEAL_ICONS: Record<RankId, typeof ProfileIcon> = {
  ronin: RankRoninIcon,
  ashigaru: RankAshigaruIcon,
  samurai: RankSamuraiIcon,
  daimyo: RankDaimyoIcon,
  shogun: RankShogunIcon,
}

interface LevelUpModalProps {
  rank: RankDef
  onClose: () => void
}

export const LevelUpModal = ({ rank, onClose }: LevelUpModalProps) => {
  const { t } = useTranslation()
  const SealIcon = SEAL_ICONS[rank.id]
  const rankColor = `var(--color-rank-${rank.id})`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('levelup.title')}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border p-8 text-center"
        style={{ borderColor: rankColor, backgroundColor: 'var(--color-ink-10)' }}
        onClick={(event) => event.stopPropagation()}
      >
        <span className="font-accent pointer-events-none absolute inset-0 flex items-center justify-center text-[160px] font-bold opacity-[0.06]">
          {rank.kanji}
        </span>

        <div className="relative">
          <div
            className="mx-auto flex size-20 items-center justify-center rounded-full border-2"
            style={{ borderColor: rankColor, color: rankColor }}
          >
            <SealIcon className="size-9" />
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-(--color-parchment-muted)">
            {t('levelup.title')}
          </p>
          <p className="mt-2 text-sm text-(--color-parchment-muted)">{t('levelup.subtitle')}</p>
          <h2
            className="rank-name-shimmer font-accent mt-1 text-3xl font-extrabold uppercase tracking-wide"
            style={{ '--rank-color': rankColor } as CSSProperties}
          >
            {rank.name}
          </h2>
          <p className="mt-4 text-sm text-(--color-parchment-muted)">{t(`ranks.${rank.id}.flavor`)}</p>

          <Button onClick={onClose} className="mt-6 w-full justify-center">
            {t('levelup.continueButton')}
          </Button>
        </div>
      </div>
    </div>
  )
}
