interface DonutSlice {
  label: string
  value: number
  color: string
}

const RADIUS = 36
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export const DonutChart = ({ slices, centerValue, centerLabel }: { slices: DonutSlice[]; centerValue: string; centerLabel: string }) => {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  let offsetSoFar = 0

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 90 90" className="size-32">
        <circle cx="45" cy="45" r={RADIUS} fill="none" stroke="var(--color-ink-15)" strokeWidth={10} />
        {total > 0 && slices.map((slice) => {
          const fraction = slice.value / total
          const dash = fraction * CIRCUMFERENCE
          const offset = offsetSoFar
          offsetSoFar += dash

          return (
            <circle
              key={slice.label}
              cx="45"
              cy="45"
              r={RADIUS}
              fill="none"
              stroke={slice.color}
              strokeWidth={10}
              strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 45 45)"
            />
          )
        })}
        <text x="45" y="42" textAnchor="middle" className="fill-(--color-parchment) font-accent text-[18px] font-bold">
          {centerValue}
        </text>
        <text x="45" y="56" textAnchor="middle" className="fill-(--color-ink-40) text-[8px]">
          {centerLabel}
        </text>
      </svg>
      <div className="mt-4 flex w-full flex-col gap-2">
        {slices.map((slice) => (
          <div key={slice.label} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-(--color-parchment-muted)">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
              {slice.label}
            </span>
            <span className="text-(--color-ink-40)">{total > 0 ? Math.round((slice.value / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
