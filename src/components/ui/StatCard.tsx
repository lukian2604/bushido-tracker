import type { ReactNode } from 'react'

interface StatCardProps {
  icon: ReactNode
  iconColor: string
  label: string
  value: ReactNode
  unit?: string
  subtext?: ReactNode
  subtextColor?: string
}

export const StatCard = ({ icon, iconColor, label, value, unit, subtext, subtextColor }: StatCardProps) => {
  return (
    <div className="rounded-2xl border border-(--color-border) bg-(--color-ink-10) p-5">
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
      {subtext && (
        <p className="mt-1.5 text-xs" style={{ color: subtextColor || 'var(--color-ink-40)' }}>
          {subtext}
        </p>
      )}
    </div>
  )
}
