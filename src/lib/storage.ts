import type { Game, GameRecord } from './score'

export type Person = 'Karl' | 'Roger'
export const PEOPLE: Person[] = ['Karl', 'Roger']

/** Same key and shape as the single-file prototype, so existing data carries over. */
export const STORAGE_KEY = 'drill93:v1'

export interface AppState {
  me: Person
  picks: Record<Person, string[]>
  done: string[]
  notes: string
  score: Game | null
  games: GameRecord[]
  timer: { end: number; label: string } | null
  theme: 'light' | 'dark' | null
  filter: string
}

export const DEFAULT_STATE: AppState = {
  me: 'Karl',
  picks: { Karl: [], Roger: [] },
  done: [],
  notes: '',
  score: null,
  games: [],
  timer: null,
  theme: null,
  filter: 'all',
}

export function normalize(raw: unknown): AppState {
  const r = raw && typeof raw === 'object' ? (raw as Partial<AppState>) : {}
  const picks = r.picks && typeof r.picks === 'object' ? r.picks : DEFAULT_STATE.picks
  return {
    ...DEFAULT_STATE,
    ...r,
    me: r.me === 'Roger' ? 'Roger' : 'Karl',
    picks: {
      Karl: Array.isArray(picks.Karl) ? picks.Karl : [],
      Roger: Array.isArray(picks.Roger) ? picks.Roger : [],
    },
    done: Array.isArray(r.done) ? r.done : [],
    games: Array.isArray(r.games) ? r.games : [],
    notes: typeof r.notes === 'string' ? r.notes : '',
  }
}

/**
 * Where app state lives. Only LocalAdapter exists today; a synced adapter
 * (Supabase, Neon, Cloudflare D1 or a Durable Object) can implement the same
 * interface later without touching components.
 */
export interface SyncAdapter {
  load(): AppState
  save(state: AppState): void
  /** Called when state changes elsewhere (another tab today, another device later). Returns unsubscribe. */
  subscribe(cb: (state: AppState) => void): () => void
}

export class LocalAdapter implements SyncAdapter {
  constructor(private key = STORAGE_KEY) {}

  load(): AppState {
    try {
      return normalize(JSON.parse(localStorage.getItem(this.key) || '{}'))
    } catch {
      return normalize({})
    }
  }

  save(state: AppState): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(state))
    } catch {
      /* storage full or blocked: keep running in memory */
    }
  }

  subscribe(cb: (state: AppState) => void): () => void {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== this.key || e.newValue === null) return
      try {
        cb(normalize(JSON.parse(e.newValue)))
      } catch {
        /* ignore malformed writes */
      }
    }
    try {
      window.addEventListener('storage', onStorage)
    } catch {
      return () => {}
    }
    return () => window.removeEventListener('storage', onStorage)
  }
}
