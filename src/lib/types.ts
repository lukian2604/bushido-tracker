import type { Timestamp } from 'firebase/firestore'

export interface UserDoc {
  displayName: string
  email: string
  createdAt: Timestamp | null
}

export interface Habit {
  id: string
  name: string
  createdAt: Timestamp | null
}

export interface HabitMonthDoc {
  days: Record<string, Record<string, boolean>>
}

export type ChallengeMode = 'manual' | 'auto'

export interface Challenge {
  id: string
  name: string
  startDate: string
  endDate: string
  mode: ChallengeMode
  completedDates: string[]
  createdAt: Timestamp | null
}

export type WatchlistStatus = 'planToWatch' | 'watching' | 'completed' | 'onHold' | 'dropped'

export interface WatchlistCategory {
  id: string
  name: string
  createdAt: Timestamp | null
}

export interface WatchlistCategoryWithProgress extends WatchlistCategory {
  total: number
  watched: number
}

export interface WatchlistItem {
  id: string
  title: string
  year: string
  studio: string
  status: WatchlistStatus
  watchedAt: Timestamp | null
  createdAt: Timestamp | null
}

export interface WeeklyActivityDay {
  date: Date
  checked: number
  total: number
}

export interface HabitGridMonthSummary {
  date: Date
  isCurrent: boolean
  checked: number
  total: number
}
