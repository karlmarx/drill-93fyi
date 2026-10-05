import { byId } from '../data'
import type { AppState } from '../lib/storage'

interface Props {
  s: AppState
  toggleDone: (id: string) => void
  goto: (id: string) => void
  share: () => void
  clearDone: () => void
  setNotes: (v: string) => void
}

export function PicksTab({ s, toggleDone, goto, share, clearDone, setNotes }: Props) {
  const k = s.picks.Karl.filter((id) => byId[id])
  const r = s.picks.Roger.filter((id) => byId[id])
  const both = k.filter((id) => r.includes(id))
  const kOnly = k.filter((id) => !both.includes(id))
  const rOnly = r.filter((id) => !both.includes(id))
  const all = [...new Set([...k, ...r])]
  const mins = all.reduce((a, id) => a + byId[id].mins, 0)
  const left = all.filter((id) => !s.done.includes(id)).reduce((a, id) => a + byId[id].mins, 0)
  const other = s.me === 'Karl' ? 'Roger' : 'Karl'

  const row = (id: string) => {
    const d = byId[id]
    const done = s.done.includes(id)
    return (
      <div key={id} className={'row' + (done ? ' done' : '')}>
        <input type="checkbox" checked={done} onChange={() => toggleDone(id)} aria-label={`Done: ${d.title}`} />
        <div className="rt">
          <b>{d.title}</b>
          <span>
            {d.mins} min, for {d.forWho}
          </span>
        </div>
        <button className="btn" onClick={() => goto(id)}>
          Open
        </button>
      </div>
    )
  }
  const sec = (title: string, ids: string[], empty: string) => (
    <div className="section">
      <h2>{title}</h2>
      {ids.length ? ids.map(row) : <p className="empty">{empty}</p>}
    </div>
  )

  return (
    <section>
      <div className="section">
        <p className="sum">
          {all.length
            ? `${all.length} drills picked, about ${mins} min total, ${left} min left.`
            : 'Nothing picked yet. Tap the star on any drill.'}
        </p>
        <div className="actions">
          <button className="btn primary" onClick={share}>
            Send my picks to {other}
          </button>
          {s.done.length > 0 && (
            <button className="btn" onClick={clearDone}>
              Clear done marks
            </button>
          )}
        </div>
        <p className="rule">
          Picks stay on this phone. Sending makes a link; when the other person opens it, your picks show up on their phone too.
        </p>
      </div>
      {sec('Both picked', both, 'Nothing in common yet.')}
      {sec("Karl's picks", kOnly, 'Karl has no other picks.')}
      {sec("Roger's picks", rOnly, "Roger's picks show up here after he sends them.")}
      <div className="section">
        <h2>Notes for next time</h2>
        <textarea value={s.notes} onChange={(e) => setNotes(e.target.value)} placeholder="One thing each to bring next time" />
      </div>
    </section>
  )
}
