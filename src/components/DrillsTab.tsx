import { useRef } from 'react'
import { CATS, DRILLS, NAMES } from '../data'
import type { Drill } from '../data/schema'
import type { AppState } from '../lib/storage'
import { PEOPLE } from '../lib/storage'
import { Court, type CourtHandle } from './Court'

interface Props {
  s: AppState
  openId: string | null
  setOpenId: (id: string | null) => void
  setFilter: (f: string) => void
  togglePick: (id: string) => void
  toggleDone: (id: string) => void
  startTimer: (d: Drill) => void
  keepScore: (mode: string) => void
}

export function DrillsTab(p: Props) {
  const { s } = p
  const cats = s.filter === 'all' ? CATS : CATS.filter((c) => c.id === s.filter)
  return (
    <section>
      <p className="hint">
        Star anything you want to do. No fixed order. If you want a shape: warm up, one reset drill for Karl, one lob drill for
        Roger, then play 7-Eleven until you're done.
      </p>
      <div className="filters">
        {[{ id: 'all', name: 'All' }, ...CATS].map((c) => (
          <button key={c.id} className="chip" aria-pressed={s.filter === c.id} onClick={() => p.setFilter(c.id)}>
            {c.name}
          </button>
        ))}
      </div>
      <div>
        {cats.map((c) => {
          const ds = DRILLS.filter((d) => d.cat === c.id)
          if (!ds.length) return null
          return (
            <div key={c.id}>
              <h2 className="cat">{c.name}</h2>
              {ds.map((d) => (
                <Card key={d.id} d={d} {...p} />
              ))}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function Card({ d, s, openId, setOpenId, togglePick, toggleDone, startTimer, keepScore }: Props & { d: Drill }) {
  const mine = s.picks[s.me].includes(d.id)
  const by = PEOPLE.filter((n) => s.picks[n].includes(d.id))
  const done = s.done.includes(d.id)
  const open = openId === d.id
  return (
    <article className={'drill' + (done ? ' done' : '')} id={'d-' + d.id} style={{ ['--catc' as string]: `var(--cat-${d.cat})` }}>
      <button
        className="dhead"
        aria-expanded={open}
        onClick={() => {
          setOpenId(open ? null : d.id)
          if (!open) requestAnimationFrame(() => document.getElementById('d-' + d.id)?.scrollIntoView({ block: 'nearest' }))
        }}
      >
        <span className="dtitle">{d.title}</span>
        <span className="dmeta">
          <span className="tag">{d.mins} min</span>
          <span className="tag who">For {d.forWho}</span>
          {d.scoring && <span className="tag">Scored</span>}
          {done && <span className="tag">Done</span>}
        </span>
        <span className="dsum">{d.summary}</span>
      </button>
      <button
        className={'star' + (mine ? ' on' : '')}
        aria-pressed={mine}
        aria-label={`${mine ? 'Unpick' : 'Pick'} ${d.title}`}
        onClick={() => togglePick(d.id)}
      >
        ★
      </button>
      {by.length > 0 && (
        <span className="pickers" aria-label={`Picked by ${by.join(' and ')}`}>
          {by.map((n) => (
            <span key={n} className={'pk ' + n[0]}>
              {n[0]}
            </span>
          ))}
        </span>
      )}
      {open && <Body d={d} done={done} toggleDone={toggleDone} startTimer={startTimer} keepScore={keepScore} />}
    </article>
  )
}

function Body({
  d,
  done,
  toggleDone,
  startTimer,
  keepScore,
}: {
  d: Drill
  done: boolean
  toggleDone: (id: string) => void
  startTimer: (d: Drill) => void
  keepScore: (mode: string) => void
}) {
  const court = useRef<CourtHandle>(null)
  const playBtn = useRef<HTMLButtonElement>(null)
  return (
    <div className="dbody">
      <div className="diag">
        <div className="courtbox">
          <Court ref={court} d={d.diagram} />
          <button
            ref={playBtn}
            className="play"
            onClick={() => {
              court.current?.play()
              if (playBtn.current) playBtn.current.textContent = 'Replay'
            }}
          >
            Play
          </button>
        </div>
        <div>
          <p className="legend">
            {Object.entries(d.who).map(([k, v]) => (
              <span key={k}>
                <span className="dot" style={{ background: `var(--p${k === 'K' ? 0 : 1})` }} />
                <b>{k}</b> {NAMES[k] ?? k}: {v}
                <br />
              </span>
            ))}
            Swap roles any time.
          </p>
          <h3>How it works</h3>
          <ul>
            {d.rules.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      </div>
      {d.cues.length > 0 && (
        <>
          <h3>Cues</h3>
          <ul>
            {d.cues.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </>
      )}
      {d.videos.length > 0 && (
        <>
          <h3>Videos</h3>
          <div className="vids">
            {d.videos.map((v) => (
              <a key={v.url} href={v.url} target="_blank" rel="noopener">
                {v.label}
              </a>
            ))}
          </div>
        </>
      )}
      <div className="actions">
        <button className="btn primary" onClick={() => startTimer(d)}>
          Start {d.mins} min timer
        </button>
        {d.scoring && (
          <button className="btn" onClick={() => keepScore(d.scoring!)}>
            Keep score
          </button>
        )}
        <button className="btn" onClick={() => toggleDone(d.id)}>
          {done ? 'Mark not done' : 'Mark done'}
        </button>
      </div>
    </div>
  )
}
