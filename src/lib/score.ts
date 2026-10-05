/** Pure scoring engine. No DOM, no storage: every function returns new state. */

export interface ModeRules {
  name: string
  sides: readonly [{ role: string; target: number; start: number }, { role: string; target: number; start: number }]
  defaultNames: readonly [string, string]
  netReset?: boolean
  minus?: boolean
  winBy?: number
}

export interface Game {
  mode: string
  names: [string, string]
  scores: [number, number]
  hist: [number, number][]
  lobs: boolean
  over: 0 | 1 | null
}

export interface GameRecord {
  mode: string
  names: [string, string]
  roles: [string, string]
  scores: [number, number]
  winner: 0 | 1
  lobs: boolean
  at: number
}

export interface ScoreState {
  score: Game | null
  games: GameRecord[]
}

export type Delta = 1 | -1 | 'net'
export const MAX_HISTORY = 50

export function newGame(modes: Record<string, ModeRules>, mode: string, names?: [string, string], lobs = false): Game {
  const m = modes[mode]
  return {
    mode,
    names: names ? [names[0], names[1]] : [m.defaultNames[0], m.defaultNames[1]],
    scores: [m.sides[0].start, m.sides[1].start],
    hist: [],
    lobs,
    over: null,
  }
}

export function winnerOf(m: ModeRules, scores: readonly [number, number]): 0 | 1 | null {
  for (const i of [0, 1] as const) {
    const me = scores[i]
    const other = scores[1 - i]
    if (me >= m.sides[i].target && (!m.winBy || me - other >= m.winBy)) return i
  }
  return null
}

/** Apply a rally result to side i. Returns the new state and whether the point ended the game. */
export function point(
  s: ScoreState,
  modes: Record<string, ModeRules>,
  i: 0 | 1,
  delta: Delta,
  now = Date.now(),
): { state: ScoreState; won: boolean } {
  const sc = s.score
  if (!sc || sc.over !== null) return { state: s, won: false }
  const m = modes[sc.mode]
  const scores: [number, number] = [sc.scores[0], sc.scores[1]]
  if (delta === 'net') scores[i] = 0
  else if (delta === -1) scores[i] = m.minus ? scores[i] - 1 : Math.max(0, scores[i] - 1)
  else scores[i] = scores[i] + 1
  const game: Game = { ...sc, scores, hist: [...sc.hist, [sc.scores[0], sc.scores[1]]] }
  const w = winnerOf(m, scores)
  if (w === null) return { state: { ...s, score: game }, won: false }
  game.over = w
  const rec: GameRecord = {
    mode: sc.mode,
    names: [sc.names[0], sc.names[1]],
    roles: [m.sides[0].role, m.sides[1].role],
    scores: [scores[0], scores[1]],
    winner: w,
    lobs: !!sc.lobs,
    at: now,
  }
  return { state: { score: game, games: [rec, ...s.games].slice(0, MAX_HISTORY) }, won: true }
}

/** Undo the last point. Undoing a winning point reopens the game and removes it from history. */
export function undo(s: ScoreState): ScoreState {
  const sc = s.score
  if (!sc || !sc.hist.length) return s
  const hist = sc.hist.slice(0, -1)
  const prev = sc.hist[sc.hist.length - 1]
  const games = sc.over !== null ? s.games.slice(1) : s.games
  return { games, score: { ...sc, hist, scores: [prev[0], prev[1]], over: null } }
}

/** Same mode, names swapped (the other player takes the other role). */
export function swapRoles(modes: Record<string, ModeRules>, sc: Game, keepLobs = false): Game {
  return newGame(modes, sc.mode, [sc.names[1], sc.names[0]], keepLobs ? sc.lobs : false)
}

/** Which side is closer to its target, for highlighting. -1 when level. */
export function leader(m: ModeRules, scores: readonly [number, number]): -1 | 0 | 1 {
  if (scores[0] === scores[1]) return -1
  return scores[0] / m.sides[0].target > scores[1] / m.sides[1].target ? 0 : 1
}
