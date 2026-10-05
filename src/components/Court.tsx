import { forwardRef, useId, useImperativeHandle, useRef } from 'react'
import type { Diagram, DiagramPath } from '../data/schema'

type Pt = readonly [number, number]

export function lobCtrl(p: DiagramPath): [number, number] {
  return [(p.a[0] + p.b[0]) / 2 - 4.5, (p.a[1] + p.b[1]) / 2]
}

export function dedupe(pts: readonly Pt[]): Pt[] {
  return pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1])
}

export function pathPoint(p: DiagramPath, u: number): [number, number] {
  const [ax, ay] = p.a
  const [bx, by] = p.b
  if (p.t === 'lob') {
    const [cx, cy] = lobCtrl(p)
    const v = 1 - u
    return [v * v * ax + 2 * v * u * cx + u * u * bx, v * v * ay + 2 * v * u * cy + u * u * by]
  }
  return [ax + (bx - ax) * u, ay + (by - ay) * u]
}

/** Points are evenly spaced keyframes in time. Repeated points mean "hold". */
export function polyPoint(pts: readonly Pt[], u: number): Pt {
  if (pts.length === 1) return pts[0]
  const f = Math.min(Math.max(u, 0), 1) * (pts.length - 1)
  const i = Math.min(Math.floor(f), pts.length - 2)
  const k = f - i
  return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]
}

export interface CourtHandle {
  play(): void
}

const STEP = 900

/** SVG court in feet: 20 x 44, net at y=22, kitchen lines at y=15 and y=29. */
export const Court = forwardRef<CourtHandle, { d: Diagram }>(function Court({ d }, ref) {
  const id = 'ah' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const ballRef = useRef<SVGCircleElement>(null)
  const playerRefs = useRef<Record<string, SVGGElement | null>>({})
  const raf = useRef(0)

  useImperativeHandle(ref, () => ({
    play() {
      cancelAnimationFrame(raf.current)
      const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
      const paths = d.paths
      const moves = d.moves ?? []
      const T = Math.max(paths.length * STEP, 1200)
      const ball = ballRef.current
      const t0 = performance.now()
      const frame = (now: number) => {
        const t = reduce ? T : Math.min(now - t0, T)
        if (paths.length && ball) {
          const i = Math.min(Math.floor(t / STEP), paths.length - 1)
          const u = Math.min((t - i * STEP) / STEP, 1)
          const p = paths[i]
          const [x, y] = pathPoint(p, u)
          ball.setAttribute('cx', String(x))
          ball.setAttribute('cy', String(y))
          ball.setAttribute('r', p.t === 'lob' ? (0.6 + 0.8 * Math.sin(Math.PI * u)).toFixed(3) : '0.6')
          ball.setAttribute('opacity', '1')
        }
        for (const m of moves) {
          const g = playerRefs.current[m.who]
          if (!g) continue
          const [x, y] = polyPoint(m.pts, t / T)
          g.setAttribute('transform', `translate(${x} ${y})`)
        }
        if (t < T) raf.current = requestAnimationFrame(frame)
      }
      raf.current = requestAnimationFrame(frame)
    },
  }))

  const common = { strokeWidth: 0.28, fill: 'none', markerEnd: `url(#${id})`, strokeLinecap: 'round' as const }
  return (
    <svg className="court" viewBox="-2 -2 24 48" role="img" aria-label="Court diagram">
      <defs>
        <marker id={id} viewBox="0 0 4 4" refX="3" refY="2" markerWidth="3.2" markerHeight="3.2" orient="auto">
          <path d="M0,0 L4,2 L0,4z" fill="#fff" />
        </marker>
      </defs>
      <rect x="-2" y="-2" width="24" height="48" fill="var(--surround)" />
      <rect x="0" y="0" width="20" height="44" fill="var(--court)" />
      <rect x="0" y="15" width="20" height="14" fill="var(--kitchen)" />
      {(d.zones ?? []).map((z, i) => (
        <rect key={i} x={z[0]} y={z[1]} width={z[2]} height={z[3]} fill="var(--ball)" opacity=".32" />
      ))}
      <g stroke="#fff" strokeWidth=".22" fill="none">
        <rect x="0" y="0" width="20" height="44" />
        <line x1="0" y1="15" x2="20" y2="15" />
        <line x1="0" y1="29" x2="20" y2="29" />
        <line x1="10" y1="0" x2="10" y2="15" />
        <line x1="10" y1="29" x2="10" y2="44" />
      </g>
      <line x1="-1" y1="22" x2="21" y2="22" stroke="var(--net)" strokeWidth=".55" />
      {d.paths.map((p, i) => {
        if (p.t === 'lob') {
          const c = lobCtrl(p)
          return <path key={i} d={`M${p.a[0]},${p.a[1]} Q${c[0]},${c[1]} ${p.b[0]},${p.b[1]}`} stroke="var(--ball)" {...common} />
        }
        return (
          <line
            key={i}
            x1={p.a[0]}
            y1={p.a[1]}
            x2={p.b[0]}
            y2={p.b[1]}
            stroke="rgba(255,255,255,.9)"
            strokeDasharray={p.t === 'feed' ? '.7 .5' : undefined}
            {...common}
          />
        )
      })}
      {(d.moves ?? []).map((m, i) => {
        const pts = dedupe(m.pts)
        if (pts.length < 2) return null
        return (
          <polyline
            key={i}
            points={pts.map((p) => p.join(',')).join(' ')}
            stroke="rgba(255,255,255,.55)"
            strokeWidth=".22"
            strokeDasharray=".35 .35"
            fill="none"
            markerEnd={`url(#${id})`}
          />
        )
      })}
      <circle ref={ballRef} r=".6" cx="-10" cy="-10" fill="var(--ball)" stroke="var(--net)" strokeWidth=".12" opacity="0" />
      {d.players.map((p) => (
        <g
          key={p.l}
          ref={(el) => {
            playerRefs.current[p.l] = el
          }}
          transform={`translate(${p.x} ${p.y})`}
        >
          <circle r="1.35" fill={`var(--p${p.c})`} stroke="var(--net)" strokeWidth=".22" />
          <text y=".5" textAnchor="middle" fontSize="1.45" fontWeight="700" fontFamily="Barlow, sans-serif" fill="#122229">
            {p.l}
          </text>
        </g>
      ))}
    </svg>
  )
})
