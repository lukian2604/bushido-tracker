import { useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { rankForStreak, type RankId } from '@/lib/ranks'
import { colorForUid, initialFor } from '@/lib/avatar'
import { RankRoninIcon, RankAshigaruIcon, RankSamuraiIcon, RankDaimyoIcon, RankShogunIcon, ProfileIcon } from '@/components/ui/icons'

const SEAL_ICONS: Record<RankId, typeof ProfileIcon> = {
  ronin: RankRoninIcon,
  ashigaru: RankAshigaruIcon,
  samurai: RankSamuraiIcon,
  daimyo: RankDaimyoIcon,
  shogun: RankShogunIcon,
}

// Colori letterali (non var()) — servono al canvas, che non risolve le custom property CSS.
const RANK_HEX: Record<RankId, string> = {
  ronin: '#9a978d',
  ashigaru: '#3a9d72',
  samurai: '#b5332b',
  daimyo: '#8768c9',
  shogun: '#c9a24b',
}

const RANK_TIER: Record<RankId, number> = { ronin: 0, ashigaru: 0, samurai: 1, daimyo: 2, shogun: 3 }

interface Ember {
  x: number
  y: number
  r: number
  vx: number
  vy: number
  life: number
  speedFade: number
}

const spawnEmber = (w: number, h: number): Ember => ({
  x: w / 2 + (Math.random() - 0.5) * w * 0.5,
  y: h * 0.7 + Math.random() * h * 0.3,
  r: 0.8 + Math.random() * 1.6,
  vy: 0.25 + Math.random() * 0.4,
  vx: (Math.random() - 0.5) * 0.25,
  life: Math.random(),
  speedFade: 0.004 + Math.random() * 0.006,
})

interface AvatarFrameProps {
  streak: number
  uid: string
  displayName: string
  photoUrl?: string | null
  size?: number
  showSeal?: boolean
  interactive?: boolean
}

export const AvatarFrame = ({ streak, uid, displayName, photoUrl, size = 132, showSeal = true, interactive = false }: AvatarFrameProps) => {
  const rank = rankForStreak(streak)
  const SealIcon = SEAL_ICONS[rank.id]
  const frameRef = useRef<HTMLDivElement>(null)
  const coreRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!interactive) return
    const canvas = canvasRef.current
    if (!canvas) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const tier = RANK_TIER[rank.id]
    if (prefersReducedMotion || tier < 1) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const count = tier === 1 ? 5 : tier === 2 ? 8 : 12
    const particles = Array.from({ length: count }, () => spawnEmber(w, h))
    let raf = 0

    const tick = () => {
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = RANK_HEX[rank.id]
      particles.forEach((particle, index) => {
        particle.y -= particle.vy
        particle.x += particle.vx
        particle.life += particle.speedFade
        if (particle.life >= 1) {
          particles[index] = spawnEmber(w, h)
          return
        }
        ctx.globalAlpha = Math.max(0, 1 - particle.life) * 0.85
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(tick)
    }
    tick()

    return () => cancelAnimationFrame(raf)
  }, [interactive, rank.id])

  const canTilt = interactive && window.matchMedia?.('(pointer: fine)').matches && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canTilt || !frameRef.current) return
    const rect = frameRef.current.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width
    const py = (event.clientY - rect.top) / rect.height
    const tiltRange = 14
    frameRef.current.style.setProperty('--tilt-y', `${(px - 0.5) * tiltRange}deg`)
    frameRef.current.style.setProperty('--tilt-x', `${(0.5 - py) * tiltRange}deg`)
    coreRef.current?.style.setProperty('--glare-x', `${px * 100}%`)
    coreRef.current?.style.setProperty('--glare-y', `${py * 100}%`)
    coreRef.current?.style.setProperty('--glare-opacity', '1')
  }

  const onPointerLeave = () => {
    if (!canTilt || !frameRef.current) return
    frameRef.current.style.setProperty('--tilt-y', '0deg')
    frameRef.current.style.setProperty('--tilt-x', '0deg')
    coreRef.current?.style.setProperty('--glare-opacity', '0')
  }

  return (
    <div
      ref={frameRef}
      className="avatar-frame"
      data-rank={rank.id}
      style={{ '--frame-size': `${size}px` } as CSSProperties}
      onPointerMove={interactive ? onPointerMove : undefined}
      onPointerLeave={interactive ? onPointerLeave : undefined}
    >
      {rank.id === 'shogun' && (
        <span className="avatar-frame__crown" aria-hidden="true">
          <RankShogunIcon />
        </span>
      )}
      {interactive && <canvas ref={canvasRef} className="avatar-frame__particles" width={size + 28} height={size + 28} aria-hidden="true" />}
      <div className="avatar-frame__ring" aria-hidden="true" />
      <div
        ref={coreRef}
        className="avatar-frame__core"
        style={!photoUrl ? { backgroundColor: colorForUid(uid) } : undefined}
      >
        {photoUrl ? (
          <img src={photoUrl} alt="" className="avatar-frame__photo" />
        ) : (
          initialFor(displayName)
        )}
      </div>
      {showSeal && (
        <span className="avatar-frame__seal" aria-hidden="true">
          <SealIcon />
        </span>
      )}
    </div>
  )
}
