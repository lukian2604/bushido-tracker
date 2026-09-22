export type RankId = 'ronin' | 'ashigaru' | 'samurai' | 'daimyo' | 'shogun'

export interface RankDef {
  id: RankId
  name: string
  kanji: string
  minStreak: number
  maxStreak: number | null
}

export const RANKS: RankDef[] = [
  { id: 'ronin', name: 'Rōnin', kanji: '浪人', minStreak: 0, maxStreak: 6 },
  { id: 'ashigaru', name: 'Ashigaru', kanji: '足軽', minStreak: 7, maxStreak: 29 },
  { id: 'samurai', name: 'Samurai', kanji: '侍', minStreak: 30, maxStreak: 89 },
  { id: 'daimyo', name: 'Daimyō', kanji: '大名', minStreak: 90, maxStreak: 179 },
  { id: 'shogun', name: 'Shōgun', kanji: '将軍', minStreak: 180, maxStreak: null },
]

export const rankForStreak = (streak: number): RankDef => {
  return RANKS.find((rank) => streak >= rank.minStreak && (rank.maxStreak === null || streak <= rank.maxStreak)) ?? RANKS[0]
}

export const nextRank = (rank: RankDef): RankDef | null => {
  const index = RANKS.findIndex((candidate) => candidate.id === rank.id)
  return RANKS[index + 1] ?? null
}

export const rankProgress = (streak: number, rank: RankDef): number => {
  const next = nextRank(rank)
  if (!next) return 1
  const span = next.minStreak - rank.minStreak
  return span > 0 ? Math.min(1, Math.max(0, (streak - rank.minStreak) / span)) : 1
}

export const daysUntilNextRank = (streak: number, rank: RankDef): number | null => {
  const next = nextRank(rank)
  return next ? Math.max(0, next.minStreak - streak) : null
}
