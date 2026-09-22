import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCurrentStreakWithLoadState } from '@/hooks/useCurrentStreak'
import { logActivityEvent } from '@/services/friend-service'
import { RANKS, rankForStreak, type RankDef } from '@/lib/ranks'

const storageKeyFor = (uid: string) => `bushido-last-rank-${uid}`

export const useLevelUpWatcher = () => {
  const { user } = useAuth()
  const { streak, hasLoaded } = useCurrentStreakWithLoadState(user?.uid)
  const [levelUpRank, setLevelUpRank] = useState<RankDef | null>(null)

  useEffect(() => {
    if (!user || !hasLoaded) return

    const rank = rankForStreak(streak)
    const storageKey = storageKeyFor(user.uid)
    const lastRankId = localStorage.getItem(storageKey)

    if (lastRankId === null) {
      localStorage.setItem(storageKey, rank.id)
      return
    }

    if (lastRankId !== rank.id) {
      const lastIndex = RANKS.findIndex((candidate) => candidate.id === lastRankId)
      const currentIndex = RANKS.findIndex((candidate) => candidate.id === rank.id)
      if (currentIndex > lastIndex) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off reaction to a rank change detected from freshly loaded streak data, not a render-loop
        setLevelUpRank(rank)
        logActivityEvent(user.uid, 'rankUp', { rankId: rank.id })
      }
      localStorage.setItem(storageKey, rank.id)
    }
  }, [user, streak, hasLoaded])

  const dismiss = () => setLevelUpRank(null)

  return { levelUpRank, dismiss }
}
