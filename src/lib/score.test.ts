import { describe, expect, it } from 'vitest'
import { DATA } from '../data'
import { newGame, point, undo, swapRoles, type Delta, type ScoreState } from './score'

const M = DATA.modes

function play(mode: string, moves: [0 | 1, Delta][]): ScoreState {
  let s: ScoreState = { score: newGame(M, mode), games: [] }
  for (const [i, d] of moves) s = point(s, M, i, d, 1000).state
  return s
}
const times = (n: number, i: 0 | 1, d: Delta = 1): [0 | 1, Delta][] => Array.from({ length: n }, () => [i, d])

describe('7-Eleven', () => {
  it('kitchen (side 0) wins at 11', () => {
    const s = play('seven11', times(10, 0))
    expect(s.score!.over).toBeNull()
    const r = point(s, M, 0, 1)
    expect(r.won).toBe(true)
    expect(r.state.score!.over).toBe(0)
    expect(r.state.score!.scores).toEqual([11, 0])
  })
  it('baseline (side 1) wins at 7', () => {
    const s = play('seven11', [...times(10, 0), ...times(7, 1)])
    expect(s.score!.over).toBe(1)
    expect(s.score!.scores).toEqual([10, 7])
    expect(s.games).toHaveLength(1)
    expect(s.games[0]).toMatchObject({ winner: 1, roles: ['Kitchen', 'Baseline'], names: ['Roger', 'Karl'] })
  })
  it('baseline at 6 has not won', () => {
    expect(play('seven11', times(6, 1)).score!.over).toBeNull()
  })
  it('ignores points after the game is over', () => {
    const s = play('seven11', [...times(7, 1), [0, 1]])
    expect(s.score!.scores).toEqual([0, 7])
  })
  it('records the lobs setting with the game', () => {
    let s: ScoreState = { score: { ...newGame(M, 'seven11'), lobs: true }, games: [] }
    for (let k = 0; k < 7; k++) s = point(s, M, 1, 1).state
    expect(s.games[0].lobs).toBe(true)
  })
  it('rematch swaps names and keeps lobs', () => {
    const g = swapRoles(M, { ...newGame(M, 'seven11'), lobs: true }, true)
    expect(g.names).toEqual(['Karl', 'Roger'])
    expect(g.lobs).toBe(true)
  })
})

describe('Zero-Nine', () => {
  it('starts 0 vs 9 and ends at 11', () => {
    const s0 = play('zero9', [])
    expect(s0.score!.scores).toEqual([0, 9])
    const s = play('zero9', times(2, 1))
    expect(s.score!.over).toBe(1)
    expect(s.score!.scores).toEqual([0, 11])
  })
})

describe('Dink to 5', () => {
  it('net resets a side to 0', () => {
    const s = play('dink5', [...times(4, 0), [0, 'net']])
    expect(s.score!.scores).toEqual([0, 0])
    expect(s.score!.over).toBeNull()
  })
  it('first to 5', () => {
    expect(play('dink5', times(5, 1)).score!.over).toBe(1)
  })
})

describe('Call your winner', () => {
  it('allows -1, including below zero', () => {
    const s = play('call7', [[0, 1], [0, -1], [0, -1]])
    expect(s.score!.scores).toEqual([-1, 0])
  })
  it('first to 7', () => {
    expect(play('call7', times(7, 0)).score!.over).toBe(0)
  })
})

describe('Game to 11', () => {
  it('needs win by 2', () => {
    const s = play('to11', [...times(10, 0), ...times(10, 1), [0, 1]])
    expect(s.score!.scores).toEqual([11, 10])
    expect(s.score!.over).toBeNull()
    const s2 = point(s, M, 0, 1).state
    expect(s2.score!.over).toBe(0)
  })
  it('11-9 wins', () => {
    expect(play('to11', [...times(9, 1), ...times(11, 0)]).score!.over).toBe(0)
  })
})

describe('undo', () => {
  it('undoes a normal point', () => {
    const s = undo(play('seven11', [[0, 1], [1, 1]]))
    expect(s.score!.scores).toEqual([1, 0])
    expect(s.score!.hist).toHaveLength(1)
  })
  it('after a win reopens the game and removes it from history', () => {
    const won = play('seven11', times(7, 1))
    expect(won.games).toHaveLength(1)
    const s = undo(won)
    expect(s.score!.over).toBeNull()
    expect(s.score!.scores).toEqual([0, 6])
    expect(s.games).toHaveLength(0)
    expect(point(s, M, 1, 1).won).toBe(true)
  })
  it('undoes a net reset', () => {
    const s = undo(play('dink5', [...times(3, 0), [0, 'net']]))
    expect(s.score!.scores).toEqual([3, 0])
  })
  it('does nothing with no history', () => {
    const s = play('seven11', [])
    expect(undo(s)).toBe(s)
  })
})
