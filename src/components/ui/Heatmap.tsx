import type { WeeklyActivityDay } from '@/lib/types'

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const MAX_CELL_SIZE = 20

const intensityColor = (checked: number, total: number) => {
  if (total === 0 || checked === 0) return 'var(--color-ink-15)'
  const ratio = checked / total
  if (ratio >= 0.75) return 'var(--color-accent-green)'
  if (ratio >= 0.5) return 'color-mix(in srgb, var(--color-accent-green) 70%, var(--color-ink-15))'
  if (ratio >= 0.25) return 'color-mix(in srgb, var(--color-accent-green) 45%, var(--color-ink-15))'
  return 'color-mix(in srgb, var(--color-accent-green) 25%, var(--color-ink-15))'
}

export const Heatmap = ({ days, weeksCount }: { days: WeeklyActivityDay[]; weeksCount: number }) => {
  return (
    <div className="flex w-full gap-1.5">
      <div className="flex flex-shrink-0 flex-col gap-1.5">
        {WEEKDAY_LABELS.map((label, index) => (
          <span
            key={index}
            style={{ height: MAX_CELL_SIZE }}
            className="flex w-4 items-center text-[11px] text-(--color-ink-40)"
          >
            {label}
          </span>
        ))}
      </div>
      <div className="min-w-0 flex-grow">
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${weeksCount}, minmax(0, 1fr))`, maxWidth: weeksCount * (MAX_CELL_SIZE + 6) }}
        >
          {Array.from({ length: weeksCount }, (_, weekIndex) => (
            <div key={weekIndex} className="grid gap-1.5" style={{ gridTemplateRows: 'repeat(7, 1fr)' }}>
              {Array.from({ length: 7 }, (_, dayIndex) => {
                const index = weekIndex * 7 + dayIndex
                const day = days[index]
                if (!day) return <div key={dayIndex} className="aspect-square w-full" />
                return (
                  <div
                    key={dayIndex}
                    title={`${day.date.toDateString()}: ${day.checked}/${day.total}`}
                    style={{ backgroundColor: intensityColor(day.checked, day.total) }}
                    className="aspect-square w-full rounded-[4px]"
                  />
                )
              })}
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-end gap-1.5 text-xs text-(--color-ink-40)">
          <span>Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <div
              key={ratio}
              style={{ width: MAX_CELL_SIZE * 0.7, height: MAX_CELL_SIZE * 0.7, backgroundColor: intensityColor(ratio === 0 ? 0 : ratio, 1) }}
              className="rounded-[4px]"
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  )
}
