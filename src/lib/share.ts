import { PEOPLE, type Person } from './storage'

export function buildShareUrl(loc: { origin: string; pathname: string; search: string }, from: Person, ids: string[]): string {
  return `${loc.origin}${loc.pathname}${loc.search}#from=${encodeURIComponent(from)}&picks=${ids.map(encodeURIComponent).join(',')}`
}

/** Parse "#from=Karl&picks=a,b". Unknown drill ids are dropped. Returns null if the hash is not a picks link. */
export function parsePicksHash(hash: string, known: (id: string) => boolean): { from: Person; ids: string[] } | null {
  if (!hash || hash.length < 2) return null
  const h = new URLSearchParams(hash.slice(1))
  const from = h.get('from')
  const p = h.get('picks')
  if (!PEOPLE.includes(from as Person) || p === null) return null
  return { from: from as Person, ids: p.split(',').filter((id) => id && known(id)) }
}
