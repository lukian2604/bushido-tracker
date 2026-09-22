import type { ReactNode } from 'react'
import { ArrowUpIcon, ArrowDownIcon } from '@/components/ui/icons'

type StatTrend = 'good' | 'bad' | 'neutral'

interface StatCardProps {
  icon: ReactNode
  iconColor: string
  label: string
  value: ReactNode
  unit?: string
  delta?: ReactNode
  trend?: StatTrend
}

const TREND_COLOR: Record<StatTrend, string> = {
  good: 'var(--color-accent-green)',
  bad: 'var(--color-accent)',
  neutral: 'var(--color-parchment-muted)',
}

export const StatCard = ({ icon, iconColor, label, value, unit, delta, trend = 'neutral' }: StatCardProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-ink-10) py-4 pl-5.5 pr-5">
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ backgroundColor: iconColor }} />
      <div className="flex items-center justify-between">
        <span className="text-sm text-(--color-parchment-muted)">{label}</span>
        <span
          className="flex size-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${iconColor}26`, color: iconColor }}
        >
          {icon}
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-accent text-3xl font-bold text-(--color-parchment)">{value}</span>
        {unit && <span className="text-sm text-(--color-ink-40)">{unit}</span>}
      </div>
      {delta && (
        <p className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: TREND_COLOR[trend] }}>
          {trend === 'good' && <ArrowUpIcon className="size-2.5" />}
          {trend === 'bad' && <ArrowDownIcon className="size-2.5" />}
          {delta}
        </p>
      )}
    </div>
  )
}
