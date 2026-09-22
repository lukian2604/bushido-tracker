import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCurrentStreakWithLoadState } from '@/hooks/useCurrentStreak'
import { logActivityEvent } from '@/services/friend-service'

const MILESTONES = [7, 14, 30, 60, 90, 180, 365]
const storageKeyFor = (uid: string) => `bushido-streak-milestones-${uid}`

export const useStreakMilestoneWatcher = () => {
  const { user } = useAuth()
  const { streak, hasLoaded } = useCurrentStreakWithLoadState(user?.uid)

  useEffect(() => {
    if (!user || !hasLoaded) return

    const storageKey = storageKeyFor(user.uid)
    const seen = new Set(JSON.parse(localStorage.getItem(storageKey) || '[]') as number[])
    const reached = MILESTONES.filter((milestone) => streak >= milestone && !seen.has(milestone))

    if (reached.length === 0) return

    reached.forEach((milestone) => {
      seen.add(milestone)
      logActivityEvent(user.uid, 'streakMilestone', { streak: milestone })
    })
    localStorage.setItem(storageKey, JSON.stringify([...seen]))
  }, [user, streak, hasLoaded])
}
