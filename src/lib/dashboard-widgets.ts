import type { DashboardWidgetConfig, DashboardWidgetId, DashboardWidgetLayout } from './types'

export const DASHBOARD_WIDGET_IDS: DashboardWidgetId[] = [
  'consistencyMap',
  'trend',
  'weeklyGoal',
  'todayProgress',
  'byCategory',
  'activeChallenges',
]

export const DEFAULT_DASHBOARD_CONFIG: DashboardWidgetConfig[] = DASHBOARD_WIDGET_IDS.map((id) => ({ id, visible: true }))

export const WIDGET_TITLE_KEYS: Record<DashboardWidgetId, string> = {
  consistencyMap: 'dashboard.consistencyMapTitle',
  trend: 'dashboard.trendTitle',
  weeklyGoal: 'dashboard.weeklyGoalTitle',
  todayProgress: 'dashboard.todaysProgressTitle',
  byCategory: 'dashboard.byCategoryTitle',
  activeChallenges: 'dashboard.activeChallengesTitle',
}

export const mergeDashboardConfig = (saved: DashboardWidgetConfig[] | undefined): DashboardWidgetConfig[] => {
  if (!saved || saved.length === 0) return DEFAULT_DASHBOARD_CONFIG

  const known = saved.filter((entry) => DASHBOARD_WIDGET_IDS.includes(entry.id))
  const missing = DASHBOARD_WIDGET_IDS.filter((id) => !known.some((entry) => entry.id === id)).map((id) => ({ id, visible: true }))

  return [...known, ...missing]
}

// Griglia a 12 colonne — posizioni di default che ricalcano la disposizione a 2 colonne
// esistente (sinistra più larga: consistencyMap/trend/weeklyGoal, destra: le altre 3).
// Altezze calibrate sull'altezza reale del contenuto di ogni card (rowHeight 70px,
// margin 14px, padding card 48px verticali — vedi REVIEW_LOG per i conti) così che
// anche alla dimensione di default non ci sia nulla tagliato.
export const DEFAULT_DASHBOARD_LAYOUT: DashboardWidgetLayout[] = [
  { id: 'consistencyMap', x: 0, y: 0, w: 7, h: 5 },
  { id: 'trend', x: 0, y: 5, w: 7, h: 6 },
  { id: 'weeklyGoal', x: 0, y: 11, w: 7, h: 3 },
  { id: 'todayProgress', x: 7, y: 0, w: 5, h: 5 },
  { id: 'byCategory', x: 7, y: 5, w: 5, h: 6 },
  { id: 'activeChallenges', x: 7, y: 11, w: 5, h: 4 },
]

// Ogni widget ha un range di ridimensionamento proporzionato a quanto il suo contenuto
// riesce davvero a sfruttare lo spazio in più: "Sfide Attive" e "Andamento" mostrano
// più roba se li allarghi, quindi hanno un range ampio. "Mappa di costanza", "Progresso
// di oggi" e "Per categoria" hanno contenuto che non si adatta oltre un certo punto
// (griglia/anello/ciambella a dimensione quasi fissa), quindi il range è volutamente
// stretto per non lasciare solo spazio vuoto o rompere il contenuto interno.
export const WIDGET_MIN_SIZE: Record<DashboardWidgetId, { minW: number; minH: number }> = {
  consistencyMap: { minW: 5, minH: 5 },
  trend: { minW: 5, minH: 6 },
  weeklyGoal: { minW: 3, minH: 3 },
  todayProgress: { minW: 3, minH: 4 },
  byCategory: { minW: 4, minH: 3 },
  activeChallenges: { minW: 3, minH: 4 },
}

export const WIDGET_MAX_SIZE: Record<DashboardWidgetId, { maxW: number; maxH: number }> = {
  consistencyMap: { maxW: 12, maxH: 5 },
  trend: { maxW: 12, maxH: 8 },
  weeklyGoal: { maxW: 12, maxH: 5 },
  todayProgress: { maxW: 12, maxH: 6 },
  byCategory: { maxW: 12, maxH: 7 },
  activeChallenges: { maxW: 12, maxH: 10 },
}

// Assi di ridimensionamento consentiti per card: 'se' = angolo (larghezza e altezza),
// 'e' = solo il bordo destro (solo larghezza). La Mappa di costanza non guadagna nulla
// in altezza (la griglia delle settimane ha una dimensione fissa), quindi si ridimensiona
// solo in larghezza — niente angolo da trascinare in verticale su quella card.
export const WIDGET_RESIZE_HANDLES: Record<DashboardWidgetId, ('s' | 'w' | 'e' | 'n' | 'sw' | 'nw' | 'se' | 'ne')[]> = {
  consistencyMap: ['e'],
  trend: ['se'],
  weeklyGoal: ['se'],
  todayProgress: ['se'],
  byCategory: ['se'],
  activeChallenges: ['se'],
}

export const mergeDashboardLayout = (saved: DashboardWidgetLayout[] | undefined): DashboardWidgetLayout[] => {
  if (!saved || saved.length === 0) return DEFAULT_DASHBOARD_LAYOUT

  // Riporta entro i limiti correnti (min E max) eventuali dimensioni salvate in
  // precedenza con vincoli diversi — es. se WIDGET_MIN_SIZE/WIDGET_MAX_SIZE sono
  // cambiati dopo che l'utente aveva già salvato una disposizione fuori dai nuovi limiti.
  const known = saved
    .filter((entry) => DASHBOARD_WIDGET_IDS.includes(entry.id))
    .map((entry) => {
      const min = WIDGET_MIN_SIZE[entry.id]
      const max = WIDGET_MAX_SIZE[entry.id]
      return {
        ...entry,
        w: Math.min(Math.max(entry.w, min.minW), max.maxW),
        h: Math.min(Math.max(entry.h, min.minH), max.maxH),
      }
    })
  const missing = DEFAULT_DASHBOARD_LAYOUT.filter((entry) => !known.some((saved) => saved.id === entry.id))

  return [...known, ...missing]
}
