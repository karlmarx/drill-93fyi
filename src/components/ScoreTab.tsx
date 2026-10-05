import { MODES } from '../data'
import { leader, type Delta } from '../lib/score'
import type { AppState } from '../lib/storage'

interface Props {
  s: AppState
  pickMode: (mode: string) => void
  point: (i: 0 | 1, d: Delta) => void
  undo: () => void
  swap: () => void
  rematch: () => void
  reset: () => void
  setLobs: (on: boolean) => void
  clearHistory: () => void
}

export function ScoreTab({ s, pickMode, point, undo, swap, rematch, reset, setLobs, clearHistory }: Props) {
  const sc = s.score
  if (!sc || !MODES[sc.mode]) return null
  const m = MODES[sc.mode]
  const lead = leader(m, sc.scores)
  const w = sc.over
  const recent = s.games.slice(0, 12)

  const side = (i: 0 | 1) => (
    <>
      <button className={`side side${i}${lead === i ? ' lead' : ''}`} onClick={() => point(i, 1)} aria-label={`Point for ${sc.names[i]}`}>
        <span className="role">{m.sides[i].role}</span>
        <span className="nm">{sc.names[i]}</span>
        <span className="num">{sc.scores[i]}</span>
        <span className="tg">
          to {m.sides[i].target}
          {m.winBy ? `, win by ${m.winBy}` : ''}
        </span>
      </button>
      {(m.netReset || m.minus) && (
        <div className="sidectl">
          {m.netReset && <button onClick={() => point(i, 'net')}>Net: back to 0</button>}
          {m.minus && <button onClick={() => point(i, -1)}>Called and lost: -1</button>}
        </div>
      )}
    </>
  )

  return (
    <section>
      <div className="modes">
        {Object.entries(MODES).map(([k, v]) => (
          <button key={k} className="chip" aria-pressed={sc.mode === k} onClick={() => pickMode(k)}>
            {v.name}
          </button>
        ))}
      </div>
      <div className="board">
        {side(0)}
        <div className="netline" aria-hidden="true" />
        {side(1)}
        {w !== null && (
          <div className="over" role="dialog" aria-label="Game over">
            <h2>{sc.names[w]} wins</h2>
            <p>
              {m.name}: {sc.scores[w]} to {sc.scores[1 - w]}
            </p>
            <button className="btn" onClick={rematch}>
              Rematch, swap roles
            </button>
            <button className="btn ghost" onClick={undo}>
              Undo last point
            </button>
          </div>
        )}
      </div>
      <div className="ctl">
        <button className="btn" onClick={undo} disabled={!sc.hist.length}>
          Undo
        </button>
        <button className="btn" onClick={swap}>
          Swap roles
        </button>
        <button className="btn" onClick={reset}>
          New game
        </button>
      </div>
      {m.lobsToggle && (
        <label className="toggle">
          <input type="checkbox" checked={sc.lobs} onChange={(e) => setLobs(e.target.checked)} /> Lobs allowed this game
        </label>
      )}
      <p className="rule">{m.rule} Tap a side to give it the point.</p>
      <div className="section">
        <h2>Games today</h2>
        {recent.length ? (
          <>
            <ul className="hist">
              {recent.map((g, idx) => {
                const name = MODES[g.mode]?.name ?? g.mode
                const t = new Date(g.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                return (
                  <li key={g.at + '-' + idx}>
                    <b>{g.names[g.winner]}</b> won {name}, {g.scores[g.winner]} to {g.scores[1 - g.winner]}
                    <br />
                    <small>
                      {g.names[0]} ({g.roles[0]}) vs {g.names[1]} ({g.roles[1]})
                      {g.mode === 'seven11' ? (g.lobs ? ', lobs on' : ', lobs off') : ''}, {t}
                    </small>
                  </li>
                )
              })}
            </ul>
            <div className="actions">
              <button className="btn" onClick={clearHistory}>
                Clear game history
              </button>
            </div>
          </>
        ) : (
          <p className="empty">Finished games land here.</p>
        )}
      </div>
    </section>
  )
}
