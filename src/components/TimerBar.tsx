import { useEffect, useRef, useState } from 'react'

function beep() {
  try {
    const A = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new A()
    for (const off of [0, 0.35]) {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = 880
      o.connect(g)
      g.connect(ctx.destination)
      g.gain.setValueAtTime(0.25, ctx.currentTime + off)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + off + 0.3)
      o.start(ctx.currentTime + off)
      o.stop(ctx.currentTime + off + 0.3)
    }
  } catch {
    /* no audio */
  }
}

export function vibrate(p: number | number[]) {
  try {
    navigator.vibrate?.(p)
  } catch {
    /* unsupported */
  }
}

interface Props {
  timer: { end: number; label: string }
  add: () => void
  stop: () => void
}

export function TimerBar({ timer, add, stop }: Props) {
  const [now, setNow] = useState(() => Date.now())
  const beeped = useRef(false)
  const left = timer.end - now
  const done = left <= 0

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    beeped.current = Date.now() >= timer.end
  }, [timer.end])

  useEffect(() => {
    if (done && !beeped.current) {
      beeped.current = true
      beep()
      vibrate([300, 150, 300])
    }
  }, [done])

  // Keep the screen on while the timer runs.
  useEffect(() => {
    let lock: WakeLockSentinel | null = null
    let cancelled = false
    const acquire = async () => {
      try {
        if ('wakeLock' in navigator && document.visibilityState === 'visible') {
          const l = await navigator.wakeLock.request('screen')
          if (cancelled) l.release().catch(() => {})
          else lock = l
        }
      } catch {
        /* denied or unsupported */
      }
    }
    const onVis = () => {
      if (document.visibilityState === 'visible') acquire()
    }
    acquire()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVis)
      lock?.release().catch(() => {})
    }
  }, [])

  const m = Math.floor(left / 60000)
  const sec = Math.floor((left % 60000) / 1000)
  return (
    <div className={'timerbar' + (done ? ' done' : '')}>
      <div className="wrap">
        <span className="tleft" role="timer">
          {done ? 'Time' : `${m}:${String(sec).padStart(2, '0')}`}
        </span>
        <span className="tl">{timer.label}</span>
        <button onClick={add}>+1 min</button>
        <button onClick={stop}>Stop</button>
      </div>
    </div>
  )
}
