export type ChartRange = '30d' | '90d' | '1y'

interface AreaChartPoint {
  date: Date
  value: number
}

interface AreaChartProps {
  data: AreaChartPoint[]
  range: ChartRange
  onRangeChange: (range: ChartRange) => void
  color?: string
}

const WIDTH = 600
const HEIGHT = 180

export const AreaChart = ({ data, range, onRangeChange, color = 'var(--color-accent-blue)' }: AreaChartProps) => {
  const max = Math.max(100, ...data.map((point) => point.value))
  const points = data.map((point, index) => {
    const x = data.length > 1 ? (index / (data.length - 1)) * WIDTH : WIDTH
    const y = HEIGHT - (point.value / max) * HEIGHT
    return { x, y }
  })

  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ')
  const areaPath = points.length > 0
    ? `${linePath} L${points[points.length - 1].x.toFixed(1)},${HEIGHT} L${points[0].x.toFixed(1)},${HEIGHT} Z`
    : ''

  const gradientId = 'area-chart-gradient'

  return (
    <div>
      <div className="mb-3 flex justify-end gap-1.5">
        {(['30d', '90d', '1y'] as ChartRange[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onRangeChange(option)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
              range === option ? 'bg-(--color-ink-15) text-(--color-parchment)' : 'text-(--color-ink-40) hover:text-(--color-parchment-muted)'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className="h-45 w-full">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
        {linePath && <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-(--color-ink-40)">
        {data.length > 0 && (
          <>
            <span>{data[0].date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            <span>{data[Math.floor((data.length - 1) / 2)].date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            <span>{data[data.length - 1].date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </>
        )}
      </div>
    </div>
  )
}
