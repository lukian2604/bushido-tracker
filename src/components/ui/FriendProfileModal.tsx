import { useEffect } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { AvatarFrame } from '@/components/ui/AvatarFrame'
import { XIcon } from '@/components/ui/icons'
import { rankForStreak, nextRank, rankProgress, daysUntilNextRank } from '@/lib/ranks'
import type { PublicProfile } from '@/lib/types'

interface FriendProfileModalProps {
  profile: PublicProfile & { uid: string }
  onClose: () => void
}

// Vista in sola lettura del profilo di un altro utente: stessa card rango del
// Profilo, ma solo con i dati di publicProfiles (nome, username, foto, streak).
// Niente check-in totali/email/abitudini: non fanno parte dei dati condivisi.
export const FriendProfileModal = ({ profile, onClose }: FriendProfileModalProps) => {
  const { t, tp } = useTranslation()
  const streak = profile.currentStreak || 0
  const rank = rankForStreak(streak)
  const next = nextRank(rank)
  const progress = rankProgress(streak, rank)
  const daysToNext = daysUntilNextRank(streak, rank)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <article
        role="dialog"
        aria-modal="true"
        aria-label={profile.displayName}
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <span
          aria-hidden="true"
          className="font-accent pointer-events-none absolute -right-4 -top-6 select-none text-[180px] font-bold leading-none opacity-[0.06]"
          style={{ color: `var(--color-rank-${rank.id})` }}
        >
          {rank.kanji}
        </span>

        <div className="relative flex items-start justify-between gap-3">
          <h2 className="font-accent text-lg font-semibold text-(--color-parchment)">{t('friends.profileRankTitle')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.cancel')}
            className="flex size-8 flex-none items-center justify-center rounded-lg border border-(--color-border) text-(--color-parchment-muted) hover:border-(--color-ink-20) hover:text-(--color-parchment)"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <div className="relative mt-4 flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          <AvatarFrame streak={streak} uid={profile.uid} displayName={profile.displayName} photoUrl={profile.photoURL} size={112} interactive />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-baseline justify-center gap-2 sm:justify-start">
              <span
                className="font-accent text-sm font-extrabold uppercase tracking-wider"
                style={{ color: `var(--color-rank-${rank.id})` }}
              >
                {rank.name}
              </span>
              <span className="text-xs text-(--color-parchment-muted)">{t(`ranks.${rank.id}.range`)}</span>
            </div>
            <h3 className="font-accent mt-1 truncate text-2xl font-semibold text-(--color-parchment)">{profile.displayName}</h3>
            {profile.username && <p className="truncate text-sm text-(--color-parchment-muted)">@{profile.username}</p>}
            <p className="mt-2 max-w-prose text-sm text-(--color-parchment-muted)">{t(`ranks.${rank.id}.flavor`)}</p>
            <div className="mt-3">
              <span className="text-lg font-bold text-(--color-parchment)">{streak}</span>{' '}
              <span className="text-xs uppercase tracking-wide text-(--color-parchment-muted)">{t('ranks.streakLabel')}</span>
            </div>
            {next ? (
              <div className="mt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-(--color-ink-20)">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.round(progress * 100)}%`, backgroundColor: `var(--color-rank-${rank.id})` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-(--color-ink-40)">
                  {tp('ranks.nextRankIn', daysToNext ?? 0).replace('{days}', String(daysToNext))}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs font-semibold text-(--color-gold)">{t('ranks.maxRank')}</p>
            )}
          </div>
        </div>
      </article>
    </div>
  )
}
