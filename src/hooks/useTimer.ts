'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type TimerPhase = 'idle' | 'work' | 'break' | 'long_break'
export type TimerStatus = 'stopped' | 'running' | 'paused'

export interface TimerState {
  phase: TimerPhase
  status: TimerStatus
  elapsed: number // seconds elapsed in current phase
  totalDuration: number // seconds for current phase
  pomodoroCount: number // completed work sessions
}

const WORK_DURATION = 25 * 60 // 25 minutes
const BREAK_DURATION = 5 * 60 // 5 minutes
const LONG_BREAK_DURATION = 25 * 60 // 25 minutes (after 4 pomodoros)
const LONG_BREAK_INTERVAL = 4

function phaseForCount(count: number): TimerPhase {
  if (count > 0 && count % LONG_BREAK_INTERVAL === 0) return 'long_break'
  return 'break'
}

function durationForPhase(phase: TimerPhase): number {
  switch (phase) {
    case 'work':
      return WORK_DURATION
    case 'break':
      return BREAK_DURATION
    case 'long_break':
      return LONG_BREAK_DURATION
    default:
      return WORK_DURATION
  }
}

export interface UseTimerOptions {
  onSessionComplete?: (durationMinutes: number) => void
}

const EXTENSION_STATE_KEY = 'focusflow_timer_state'

function persistTimerState(state: TimerState) {
  try {
    localStorage.setItem(EXTENSION_STATE_KEY, JSON.stringify(state))
  } catch {
    // localStorage may be unavailable (SSR, private mode) — ignore
  }
}

export function useTimer({ onSessionComplete }: UseTimerOptions = {}) {
  const [state, setState] = useState<TimerState>({
    phase: 'idle',
    status: 'stopped',
    elapsed: 0,
    totalDuration: WORK_DURATION,
    pomodoroCount: 0,
  })

  // We track actual wall-clock start so background tabs stay accurate
  const startedAtRef = useRef<number | null>(null)
  const baseElapsedRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)

  const tick = useCallback(() => {
    if (startedAtRef.current === null) return

    const now = Date.now()
    const elapsed = baseElapsedRef.current + Math.floor((now - startedAtRef.current) / 1000)

    setState((prev) => {
      if (elapsed >= prev.totalDuration) {
        // Phase complete
        if (prev.phase === 'work') {
          const newCount = prev.pomodoroCount + 1
          onSessionComplete?.(prev.totalDuration / 60)
          const nextPhase = phaseForCount(newCount)
          const nextDuration = durationForPhase(nextPhase)
          return {
            phase: nextPhase,
            status: 'stopped',
            elapsed: 0,
            totalDuration: nextDuration,
            pomodoroCount: newCount,
          }
        } else {
          // Break finished — go back to work
          return {
            phase: 'work',
            status: 'stopped',
            elapsed: 0,
            totalDuration: WORK_DURATION,
            pomodoroCount: prev.pomodoroCount,
          }
        }
      }
      return { ...prev, elapsed }
    })

    rafRef.current = requestAnimationFrame(tick)
  }, [onSessionComplete])

  // Start / resume
  const start = useCallback(() => {
    setState((prev) => {
      const phase = prev.phase === 'idle' ? 'work' : prev.phase
      const totalDuration = prev.phase === 'idle' ? WORK_DURATION : prev.totalDuration
      startedAtRef.current = Date.now()
      baseElapsedRef.current = prev.elapsed
      rafRef.current = requestAnimationFrame(tick)
      return { ...prev, phase, totalDuration, status: 'running' }
    })
  }, [tick])

  // Pause
  const pause = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (startedAtRef.current !== null) {
      baseElapsedRef.current += Math.floor((Date.now() - startedAtRef.current) / 1000)
      startedAtRef.current = null
    }
    setState((prev) => ({ ...prev, status: 'paused' }))
  }, [])

  // Reset
  const reset = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    startedAtRef.current = null
    baseElapsedRef.current = 0
    setState((prev) => ({
      phase: 'idle',
      status: 'stopped',
      elapsed: 0,
      totalDuration: WORK_DURATION,
      pomodoroCount: prev.pomodoroCount,
    }))
  }, [])

  // Handle page visibility change for accuracy
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && state.status === 'running') {
        // Re-sync elapsed from wall clock on tab restore — already handled by tick()
        // Just re-queue a frame if somehow stopped
        if (rafRef.current === null && startedAtRef.current !== null) {
          rafRef.current = requestAnimationFrame(tick)
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [state.status, tick])

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Sync timer state to localStorage so the Chrome extension can read it
  useEffect(() => {
    persistTimerState(state)
  }, [state])

  const remaining = Math.max(0, state.totalDuration - state.elapsed)

  return { state, remaining, start, pause, reset }
}
