import { describe, expect, it } from 'vitest'
import { buildShareUrl, parsePicksHash } from './share'

describe('share links', () => {
  it('round-trips', () => {
    const url = buildShareUrl({ origin: 'https://drill.93.fyi', pathname: '/', search: '' }, 'Roger', ['l1', 'g1'])
    expect(url).toBe('https://drill.93.fyi/#from=Roger&picks=l1,g1')
    expect(parsePicksHash(new URL(url).hash, () => true)).toEqual({ from: 'Roger', ids: ['l1', 'g1'] })
  })
  it('drops unknown ids and rejects unknown people', () => {
    expect(parsePicksHash('#from=Roger&picks=l1,zz', (id) => id === 'l1')).toEqual({ from: 'Roger', ids: ['l1'] })
    expect(parsePicksHash('#from=Bob&picks=l1', () => true)).toBeNull()
    expect(parsePicksHash('#picks=l1', () => true)).toBeNull()
    expect(parsePicksHash('', () => true)).toBeNull()
  })
  it('empty picks clears that person', () => {
    expect(parsePicksHash('#from=Karl&picks=', () => true)).toEqual({ from: 'Karl', ids: [] })
  })
})
