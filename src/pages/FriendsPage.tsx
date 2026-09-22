import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/hooks/useTranslation'
import { useModal } from '@/hooks/useModal'
import { useToast } from '@/hooks/useToast'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { AvatarFrame } from '@/components/ui/AvatarFrame'
import { SearchIcon, CheckIcon, XIcon, FireIcon, TrophyIcon, WatchlistIcon } from '@/components/ui/icons'
import { subscribeToUser } from '@/services/user-service'
import {
  searchUsersByUsername,
  getPublicProfile,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriendship,
  subscribeToFriendships,
  getActivityFeed,
} from '@/services/friend-service'
import { normalizeUsername } from '@/lib/username'
import { rankForStreak, RANKS } from '@/lib/ranks'
import { formatRelativeTime, BCP47_LOCALES } from '@/lib/date-utils'
import type { ActivityEvent, Friendship, PublicProfile, UserDoc } from '@/lib/types'

type ProfileEntry = PublicProfile & { uid: string }

const LEADERBOARD_RANK_COLORS = ['var(--color-rank-shogun)', 'var(--color-parchment)', 'var(--color-rank-ashigaru)']

export const FriendsPage = () => {
  const { user } = useAuth()
  const { t, locale } = useTranslation()
  const localeTag = BCP47_LOCALES[locale] || 'en-US'
  const { confirmDialog } = useModal()
  const { showToast } = useToast()

  const [userDoc, setUserDoc] = useState<UserDoc | null>(null)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProfileEntry[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [pendingUids, setPendingUids] = useState<Set<string>>(new Set())

  const [friendships, setFriendships] = useState<Friendship[]>([])
  const [profiles, setProfiles] = useState<Record<string, ProfileEntry>>({})
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([])

  useEffect(() => {
    if (!user) return
    return subscribeToUser(user.uid, setUserDoc)
  }, [user])

  useEffect(() => {
    if (!user) return
    return subscribeToFriendships(user.uid, setFriendships)
  }, [user])

  useEffect(() => {
    if (!user || !query.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears stale results when the query is emptied
      setResults([])
      return
    }
    setIsSearching(true)
    const timeout = setTimeout(() => {
      searchUsersByUsername(normalizeUsername(query), user.uid).then((found) => {
        setResults(found)
        setIsSearching(false)
      })
    }, 400)
    return () => clearTimeout(timeout)
  }, [query, user])

  useEffect(() => {
    if (!user) return
    const otherUids = friendships.map((f) => (f.uidA === user.uid ? f.uidB : f.uidA))
    const missing = otherUids.filter((uid) => !profiles[uid])
    if (missing.length === 0) return

    Promise.all(missing.map(async (uid) => {
      const profile = await getPublicProfile(uid)
      return profile ? { uid, ...profile } : null
    })).then((fetched) => {
      setProfiles((current) => {
        const next = { ...current }
        fetched.forEach((entry) => { if (entry) next[entry.uid] = entry })
        return next
      })
    })
  }, [friendships, profiles, user])

  useEffect(() => {
    if (!user) return
    const acceptedUids = friendships
      .filter((f) => f.status === 'accepted')
      .map((f) => (f.uidA === user.uid ? f.uidB : f.uidA))
    getActivityFeed([user.uid, ...acceptedUids]).then(setActivityFeed).catch(() => {})
  }, [user, friendships])

  if (!user) return null

  const onSendRequest = async (otherUid: string) => {
    setPendingUids((current) => new Set(current).add(otherUid))
    try {
      await sendFriendRequest(user.uid, otherUid)
    } catch {
      setPendingUids((current) => {
        const next = new Set(current)
        next.delete(otherUid)
        return next
      })
      showToast(t('error.generic'))
    }
  }

  const onAccept = async (otherUid: string) => {
    try {
      await acceptFriendRequest(user.uid, otherUid)
    } catch {
      showToast(t('error.generic'))
    }
  }

  const onDecline = async (otherUid: string) => {
    try {
      await removeFriendship(user.uid, otherUid)
    } catch {
      showToast(t('error.generic'))
    }
  }

  const onRemoveFriend = async (otherUid: string) => {
    if (await confirmDialog(t('friends.removeFriendConfirm'))) {
      try {
        await removeFriendship(user.uid, otherUid)
      } catch {
        showToast(t('error.generic'))
      }
    }
  }

  const friendshipUids = new Set(friendships.map((f) => (f.uidA === user.uid ? f.uidB : f.uidA)))
  const incoming = friendships.filter((f) => f.status === 'pending' && f.requesterUid !== user.uid)
  const outgoing = friendships.filter((f) => f.status === 'pending' && f.requesterUid === user.uid)
  const accepted = friendships
    .filter((f) => f.status === 'accepted')
    .map((f) => (f.uidA === user.uid ? f.uidB : f.uidA))
    .map((uid) => profiles[uid])
    .filter((entry): entry is ProfileEntry => !!entry)
    .sort((a, b) => b.currentStreak - a.currentStreak)

  const otherUidFor = (f: Friendship) => (f.uidA === user.uid ? f.uidB : f.uidA)
  const nameFor = (uid: string) => (uid === user.uid ? userDoc?.displayName || t('friends.you') : profiles[uid]?.displayName) || '…'

  return (
    <div>
      <PageHeader title={t('friends.heading')} subtitle={t('friends.subtitle')} />

      {!userDoc?.username && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-(--color-gold)/30 bg-(--color-ink-10) p-4">
          <p className="text-sm text-(--color-parchment-muted)">{t('friends.usernameMissingNotice')}</p>
          <Link to="/profile" className="flex-none text-sm font-semibold text-(--color-gold) hover:underline">
            {t('friends.usernameMissingLink')}
          </Link>
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-(--color-ink-40)" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('friends.searchPlaceholder')}
            className="w-full rounded-lg border border-(--color-border) bg-(--color-ink) py-2.5 pl-10 pr-3.5 text-sm text-(--color-parchment) outline-none placeholder:text-(--color-ink-40) focus:border-(--color-gold)"
          />
        </div>

        {isSearching && <p className="mt-3 text-xs text-(--color-ink-40)">{t('watchlist.searchLoading')}</p>}

        {!isSearching && query.trim() && (
          results.length === 0 ? (
            <p className="mt-3 text-xs text-(--color-ink-40)">{t('friends.searchNoResults')}</p>
          ) : (
            <div className="mt-3 flex flex-col gap-1">
              {results.map((result) => {
                const isFriend = friendshipUids.has(result.uid)
                const isPending = pendingUids.has(result.uid) || friendships.some((f) => otherUidFor(f) === result.uid && f.status === 'pending')
                return (
                  <div key={result.uid} className="flex items-center gap-3 rounded-lg p-2 hover:bg-(--color-ink)">
                    <AvatarFrame streak={result.currentStreak} uid={result.uid} displayName={result.displayName} photoUrl={result.photoURL} size={36} showSeal={false} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-(--color-parchment)">{result.displayName}</p>
                      <p className="truncate text-xs text-(--color-parchment-muted)">@{result.username}</p>
                    </div>
                    {isFriend ? (
                      <span className="flex-none text-xs text-(--color-ink-40)">{t('friends.alreadyFriends')}</span>
                    ) : isPending ? (
                      <span className="flex-none text-xs text-(--color-ink-40)">{t('friends.requestPending')}</span>
                    ) : (
                      <Button onClick={() => onSendRequest(result.uid)} className="flex-none px-3 py-1.5 text-xs">
                        {t('friends.sendRequestButton')}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>

      {incoming.length > 0 && (
        <div className="mb-6 rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6">
          <h2 className="mb-4 font-accent text-lg font-semibold text-(--color-parchment)">{t('friends.requestsTitle')}</h2>
          <div className="flex flex-col gap-2">
            {incoming.map((request) => {
              const otherUid = otherUidFor(request)
              const profile = profiles[otherUid]
              return (
                <div key={request.id} className="flex items-center gap-3 rounded-lg p-2">
                  <AvatarFrame streak={profile?.currentStreak || 0} uid={otherUid} displayName={profile?.displayName || '?'} photoUrl={profile?.photoURL} size={36} showSeal={false} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-(--color-parchment)">
                      <span className="font-semibold">{profile?.displayName || '…'}</span> {t('friends.incomingFrom')}
                    </p>
                  </div>
                  <div className="flex flex-none gap-1.5">
                    <button
                      type="button"
                      onClick={() => onAccept(otherUid)}
                      aria-label={t('friends.acceptButton')}
                      className="flex size-8 items-center justify-center rounded-lg border border-(--color-border) text-(--color-accent-green) hover:border-(--color-accent-green)"
                    >
                      <CheckIcon className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDecline(otherUid)}
                      aria-label={t('friends.declineButton')}
                      className="flex size-8 items-center justify-center rounded-lg border border-(--color-border) text-(--color-accent) hover:border-(--color-accent)"
                    >
                      <XIcon className="size-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {outgoing.length > 0 && (
        <div className="mb-6 rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6">
          <h2 className="mb-4 font-accent text-lg font-semibold text-(--color-parchment)">{t('friends.outgoingTitle')}</h2>
          <div className="flex flex-col gap-2">
            {outgoing.map((request) => {
              const otherUid = otherUidFor(request)
              const profile = profiles[otherUid]
              return (
                <div key={request.id} className="flex items-center gap-3 rounded-lg p-2">
                  <AvatarFrame streak={profile?.currentStreak || 0} uid={otherUid} displayName={profile?.displayName || '?'} photoUrl={profile?.photoURL} size={36} showSeal={false} />
                  <p className="min-w-0 flex-1 truncate text-sm text-(--color-parchment)">{profile?.displayName || '…'}</p>
                  <span className="flex-none text-xs text-(--color-ink-40)">{t('friends.outgoingTo')}</span>
                  <button
                    type="button"
                    onClick={() => onDecline(otherUid)}
                    className="flex-none text-xs text-(--color-parchment-muted) hover:text-(--color-accent)"
                  >
                    {t('friends.cancelRequestButton')}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-accent text-lg font-semibold text-(--color-parchment)">{t('friends.friendsTitle')}</h2>
          {accepted.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs text-(--color-ink-40)">
              <TrophyIcon className="size-3.5" />
              {t('friends.leaderboardHint')}
            </span>
          )}
        </div>

        {accepted.length === 0 ? (
          <p className="py-6 text-center text-sm text-(--color-ink-40)">{t('friends.friendsEmpty')}</p>
        ) : (
          <div className="flex flex-col gap-1">
            {accepted.map((friend, index) => {
              const rank = rankForStreak(friend.currentStreak)
              return (
                <div key={friend.uid} className="flex items-center gap-3 rounded-lg p-2 hover:bg-(--color-ink)">
                  <span
                    className="font-accent w-5 flex-none text-center text-sm font-bold"
                    style={{ color: LEADERBOARD_RANK_COLORS[index] || 'var(--color-parchment-muted)' }}
                  >
                    {index + 1}
                  </span>
                  <AvatarFrame streak={friend.currentStreak} uid={friend.uid} displayName={friend.displayName} photoUrl={friend.photoURL} size={40} showSeal={false} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-(--color-parchment)">{friend.displayName}</p>
                    <p className="text-xs font-semibold" style={{ color: `var(--color-rank-${rank.id})` }}>{rank.name}</p>
                  </div>
                  <span className="flex flex-none items-center gap-1 text-sm font-semibold tabular-nums text-(--color-parchment)">
                    <FireIcon className="size-3.5 text-(--color-gold)" />
                    {friend.currentStreak}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveFriend(friend.uid)}
                    aria-label={t('common.delete')}
                    className="flex-none text-(--color-ink-40) hover:text-(--color-accent)"
                  >
                    <XIcon className="size-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {activityFeed.length > 0 && (
        <div className="mt-6 rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-6">
          <h2 className="mb-4 font-accent text-lg font-semibold text-(--color-parchment)">{t('friends.activityTitle')}</h2>
          <div className="flex flex-col gap-3.5">
            {activityFeed.map((event) => {
              const icon =
                event.type === 'rankUp' ? (
                  <FireIcon className="size-3.5" />
                ) : event.type === 'streakMilestone' ? (
                  <FireIcon className="size-3.5" />
                ) : (
                  <WatchlistIcon className="size-3.5" />
                )
              const iconColor =
                event.type === 'rankUp'
                  ? `var(--color-rank-${event.rankId || 'ronin'})`
                  : event.type === 'streakMilestone'
                    ? 'var(--color-accent-green)'
                    : 'var(--color-accent-blue)'
              const suffix =
                event.type === 'rankUp'
                  ? t('friends.activityRankUpSuffix').replace('{rank}', RANKS.find((r) => r.id === event.rankId)?.name || '')
                  : event.type === 'streakMilestone'
                    ? t('friends.activityStreakSuffix').replace('{days}', String(event.streak || 0))
                    : t('friends.activityWatchlistSuffix')

              return (
                <div key={event.id} className="flex items-start gap-2.5">
                  <span
                    className="flex size-6.5 flex-none items-center justify-center rounded-full"
                    style={{ backgroundColor: `color-mix(in srgb, ${iconColor} 18%, var(--color-ink-10))`, color: iconColor }}
                  >
                    {icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-(--color-parchment-muted)">
                      <span className="font-semibold text-(--color-parchment)">{nameFor(event.uid)}</span> {suffix}
                    </p>
                    {event.createdAt && (
                      <p className="mt-0.5 text-xs text-(--color-ink-40)">{formatRelativeTime(event.createdAt.toDate(), localeTag)}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
