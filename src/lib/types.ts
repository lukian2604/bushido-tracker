import type { Timestamp } from 'firebase/firestore'
import type { RankId } from './ranks'

export type DashboardWidgetId =
  | 'consistencyMap'
  | 'trend'
  | 'weeklyGoal'
  | 'todayProgress'
  | 'byCategory'
  | 'activeChallenges'

export interface DashboardWidgetConfig {
  id: DashboardWidgetId
  visible: boolean
}

export interface DashboardWidgetLayout {
  id: DashboardWidgetId
  x: number
  y: number
  w: number
  h: number
}

export interface UserDoc {
  displayName: string
  email: string
  photoURL?: string
  country?: string
  username?: string
  dashboardConfig?: DashboardWidgetConfig[]
  dashboardLayout?: DashboardWidgetLayout[]
  createdAt: Timestamp | null
}

export interface PublicProfile {
  displayName: string
  username?: string
  photoURL?: string
  currentStreak: number
  updatedAt: Timestamp | null
}

export type FriendshipStatus = 'pending' | 'accepted'

export interface Friendship {
  id: string
  uidA: string
  uidB: string
  requesterUid: string
  status: FriendshipStatus
  createdAt: Timestamp | null
}

export type ActivityEventType = 'rankUp' | 'streakMilestone' | 'watchlistCompleted'

export interface ActivityEvent {
  id: string
  uid: string
  type: ActivityEventType
  rankId?: RankId
  streak?: number
  createdAt: Timestamp | null
}

export interface Habit {
  id: string
  name: string
  color?: string
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
  failedDates?: string[]
  createdAt: Timestamp | null
}

export type WatchlistStatus = 'planToWatch' | 'watching' | 'completed' | 'onHold' | 'dropped'

export type MediaType = 'video' | 'book' | 'manga' | 'audiobook' | 'game'

export interface WatchlistCategory {
  id: string
  name: string
  mediaType?: MediaType
  emoji?: string
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
  author?: string
  coverUrl?: string
  status: WatchlistStatus
  watchedAt: Timestamp | null
  createdAt: Timestamp | null
}

export interface MediaSearchResult {
  title: string
  year: string
  studio: string
  author: string
  coverUrl?: string
  // Titolo originale (inglese/romaji) prima della traduzione automatica — presente solo
  // quando il titolo mostrato non è una fonte ufficialmente localizzata (es. anime/giochi).
  originalTitle?: string
  // Tipo esatto del risultato (es. "manga", "novel", "comic", "movie", "tv", "ova") — una
  // chiave da tradurre con watchlist.searchFormat.<format>, per distinguere risultati che
  // altrimenti sembrerebbero identici (es. un manga da un light novel nella stessa lista).
  format?: string
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
