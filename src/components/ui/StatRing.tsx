const RADIUS = 36
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface StatRingProps {
  value: number
  max: number
  label: string
  color?: string
  size?: number
}

export const StatRing = ({ value, max, label, color = 'var(--color-gold)', size = 96 }: StatRingProps) => {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0
  const offset = CIRCUMFERENCE * (1 - percent / 100)
  const fontSize = Math.round(size * 0.17)

  return (
    <div className="flex flex-col items-center text-center" style={{ width: size + 16 }}>
      <svg viewBox="0 0 90 90" style={{ width: size, height: size }}>
        <circle cx="45" cy="45" r={RADIUS} fill="none" stroke="var(--color-ink-15)" strokeWidth={7} />
        <circle
          cx="45"
          cy="45"
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 45 45)"
          className="transition-[stroke-dashoffset] duration-500"
        />
        <text
          x="45"
          y="50"
          textAnchor="middle"
          className="fill-(--color-parchment) font-accent font-bold"
          style={{ fontSize }}
        >
          {percent}%
        </text>
      </svg>
      <span className="mt-2 text-sm text-(--color-parchment-muted)">{label}</span>
    </div>
  )
}
