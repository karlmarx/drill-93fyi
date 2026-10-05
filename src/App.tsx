import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { byId, MODES } from './data'
import type { Drill } from './data/schema'
import * as score from './lib/score'
import { buildShareUrl, parsePicksHash } from './lib/share'
import { LocalAdapter, type AppState, type Person, type SyncAdapter } from './lib/storage'
import { DrillsTab } from './components/DrillsTab'
import { PicksTab } from './components/PicksTab'
import { ScoreTab } from './components/ScoreTab'
import { TimerBar, vibrate } from './components/TimerBar'

type Tab = 'drills' | 'picks' | 'score'

function importHash(s: AppState): { state: AppState; msg: string | null } {
  const got = parsePicksHash(location.hash, (id) => !!byId[id])
  if (!got) return { state: s, msg: null }
  try {
    history.replaceState(null, '', location.pathname + location.search)
  } catch {
    /* ignore */
  }
  return { state: { ...s, picks: { ...s.picks, [got.from]: got.ids } }, msg: `Loaded ${got.from}'s picks (${got.ids.length})` }
}

export function App({ adapter = new LocalAdapter() as SyncAdapter }: { adapter?: SyncAdapter }) {
  const initial = useMemo(() => importHash(adapter.load()), [adapter])
  const [s, setS] = useState<AppState>(initial.state)
  const [tab, setTab] = useState<Tab>('drills')
  const [openId, setOpenId] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(initial.msg)
  const toastT = useRef<ReturnType<typeof setTimeout>>(undefined)

  const update = useCallback((fn: (s: AppState) => AppState) => setS((prev) => fn(prev)), [])
  const toast = useCallback((msg: string) => setToastMsg(msg), [])

  useEffect(() => adapter.save(s), [adapter, s])
  useEffect(() => adapter.subscribe((next) => setS(next)), [adapter])

  useEffect(() => {
    if (!toastMsg) return
    clearTimeout(toastT.current)
    toastT.current = setTimeout(() => setToastMsg(null), 2400)
  }, [toastMsg])

  useEffect(() => {
    const onHash = () => {
      setS((prev) => {
        const r = importHash(prev)
        if (r.msg) setToastMsg(r.msg)
        return r.state
      })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Theme: system default, toggle overrides.
  useEffect(() => {
    if (s.theme) document.documentElement.setAttribute('data-theme', s.theme)
    else document.documentElement.removeAttribute('data-theme')
  }, [s.theme])

  // Make sure the scoreboard always has a game.
  useEffect(() => {
    if (!s.score || !MODES[s.score.mode]) update((p) => ({ ...p, score: score.newGame(MODES, 'seven11') }))
  }, [s.score, update])

  const showTab = (t: Tab) => {
    setTab(t)
    window.scrollTo(0, 0)
  }

  const toggleIn = (arr: string[], id: string) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id])
  const togglePick = (id: string) => update((p) => ({ ...p, picks: { ...p.picks, [p.me]: toggleIn(p.picks[p.me], id) } }))
  const toggleDone = (id: string) => update((p) => ({ ...p, done: toggleIn(p.done, id) }))

  const startTimer = (d: Drill) => {
    update((p) => ({ ...p, timer: { end: Date.now() + d.mins * 60000, label: d.title } }))
    toast(`${d.mins} min timer started`)
  }

  const setScore = (fn: (st: score.ScoreState) => score.ScoreState) =>
    update((p) => {
      const r = fn({ score: p.score, games: p.games })
      return { ...p, score: r.score, games: r.games }
    })

  const keepScore = (mode: string) => {
    update((p) => ({ ...p, score: score.newGame(MODES, mode) }))
    showTab('score')
  }

  const onPoint = (i: 0 | 1, d: score.Delta) => {
    const r = score.point({ score: s.score, games: s.games }, MODES, i, d)
    if (r.state.score === s.score) return // game over or no game: nothing changed
    vibrate(r.won ? [80, 60, 160] : 25)
    setScore(() => r.state)
  }

  const share = async () => {
    const ids = s.picks[s.me]
    if (!ids.length) {
      toast('Star a few drills first.')
      return
    }
    const url = buildShareUrl(location, s.me, ids)
    const text = `${s.me}'s drill picks: ${ids.map((i) => byId[i]?.title ?? i).join(', ')}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Drill picks', text, url })
        return
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return
    }
    try {
      await navigator.clipboard.writeText(text + '\n' + url)
      toast('Link copied. Text it over.')
    } catch {
      window.prompt('Copy this link', url)
    }
  }

  const toggleTheme = () =>
    update((p) => {
      const dark = p.theme ? p.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
      return { ...p, theme: dark ? 'light' : 'dark' }
    })

  const pickCount = new Set([...s.picks.Karl, ...s.picks.Roger].filter((id) => byId[id])).size

  return (
    <>
      <header className="top">
        <div className="wrap">
          <div className="brand">
            <h1>Drill</h1>
            <p>Karl and Roger</p>
          </div>
          <div className="seg" role="group" aria-label="I am">
            {(['Karl', 'Roger'] as Person[]).map((n) => (
              <button key={n} aria-pressed={s.me === n} onClick={() => update((p) => ({ ...p, me: n }))}>
                {n}
              </button>
            ))}
          </div>
          <button className="icon-btn" onClick={toggleTheme} aria-label="Switch light or dark">
            ◐
          </button>
        </div>
      </header>

      {s.timer && (
        <TimerBar
          key={s.timer.label + s.timer.end}
          timer={s.timer}
          add={() => update((p) => (p.timer ? { ...p, timer: { ...p.timer, end: Math.max(p.timer.end, Date.now()) + 60000 } } : p))}
          stop={() => update((p) => ({ ...p, timer: null }))}
        />
      )}

      <main className="wrap">
        {tab === 'drills' && (
          <DrillsTab
            s={s}
            openId={openId}
            setOpenId={setOpenId}
            setFilter={(f) => update((p) => ({ ...p, filter: f }))}
            togglePick={togglePick}
            toggleDone={toggleDone}
            startTimer={startTimer}
            keepScore={keepScore}
          />
        )}
        {tab === 'picks' && (
          <PicksTab
            s={s}
            toggleDone={toggleDone}
            goto={(id) => {
              setOpenId(id)
              update((p) => ({ ...p, filter: 'all' }))
              setTab('drills')
              requestAnimationFrame(() => document.getElementById('d-' + id)?.scrollIntoView({ block: 'start' }))
            }}
            share={share}
            clearDone={() => update((p) => ({ ...p, done: [] }))}
            setNotes={(v) => update((p) => ({ ...p, notes: v }))}
          />
        )}
        {tab === 'score' && (
          <ScoreTab
            s={s}
            pickMode={(m) => update((p) => ({ ...p, score: score.newGame(MODES, m) }))}
            point={onPoint}
            undo={() => setScore(score.undo)}
            swap={() => update((p) => (p.score ? { ...p, score: score.swapRoles(MODES, p.score) } : p))}
            rematch={() => update((p) => (p.score ? { ...p, score: score.swapRoles(MODES, p.score, true) } : p))}
            reset={() => update((p) => (p.score ? { ...p, score: score.newGame(MODES, p.score.mode, p.score.names) } : p))}
            setLobs={(on) => update((p) => (p.score ? { ...p, score: { ...p.score, lobs: on } } : p))}
            clearHistory={() => {
              if (confirm('Clear all saved games?')) update((p) => ({ ...p, games: [] }))
            }}
          />
        )}
      </main>

      <nav className="tabs" role="tablist">
        <div className="wrap">
          <button role="tab" aria-selected={tab === 'drills'} onClick={() => showTab('drills')}>
            Drills
          </button>
          <button role="tab" aria-selected={tab === 'picks'} onClick={() => showTab('picks')}>
            Our picks <span className="badge">{pickCount}</span>
          </button>
          <button role="tab" aria-selected={tab === 'score'} onClick={() => showTab('score')}>
            Score
          </button>
        </div>
      </nav>
      <div className={'toast' + (toastMsg ? ' show' : '')} role="status" aria-live="polite">
        {toastMsg}
      </div>
    </>
  )
}
