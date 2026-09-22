import { useEffect, useState } from 'react'
import { getHabitActivitySeries } from '@/services/habit-grid-service'
import { computeCurrentStreak } from '@/lib/streak'

export const useCurrentStreak = (uid: string | undefined) => {
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (!uid) return
    getHabitActivitySeries(uid, 365).then((series) => setStreak(computeCurrentStreak(series))).catch(() => {})
  }, [uid])

  return streak
}

export const useCurrentStreakWithLoadState = (uid: string | undefined) => {
  const [streak, setStreak] = useState(0)
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    if (!uid) return
    getHabitActivitySeries(uid, 365)
      .then((series) => {
        setStreak(computeCurrentStreak(series))
        setHasLoaded(true)
      })
      .catch(() => setHasLoaded(true))
  }, [uid])

  return { streak, hasLoaded }
}

export const useProfileStats = (uid: string | undefined) => {
  const [streak, setStreak] = useState(0)
  const [totalCheckIns, setTotalCheckIns] = useState(0)

  useEffect(() => {
    if (!uid) return
    getHabitActivitySeries(uid, 365).then((series) => {
      setStreak(computeCurrentStreak(series))
      setTotalCheckIns(series.reduce((sum, day) => sum + day.checked, 0))
    }).catch(() => {})
  }, [uid])

  return { streak, totalCheckIns }
}
