import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCurrentStreakWithLoadState } from '@/hooks/useCurrentStreak'
import { subscribeToUser } from '@/services/user-service'
import { syncPublicProfile } from '@/services/friend-service'
import type { UserDoc } from '@/lib/types'

export const usePublicProfileSync = () => {
  const { user } = useAuth()
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null)
  const { streak, hasLoaded } = useCurrentStreakWithLoadState(user?.uid)

  useEffect(() => {
    if (!user) return
    return subscribeToUser(user.uid, setUserDoc)
  }, [user])

  useEffect(() => {
    if (!user || !userDoc || !hasLoaded) return
    syncPublicProfile(user.uid, {
      displayName: userDoc.displayName,
      username: userDoc.username,
      photoURL: userDoc.photoURL,
      currentStreak: streak,
    }).catch(() => {})
  }, [user, userDoc, streak, hasLoaded])
}
