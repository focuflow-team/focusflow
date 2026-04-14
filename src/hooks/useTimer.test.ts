/**
 * Reproduction tests for: pomodoro timer double-count bug
 *
 * Bug: requestAnimationFrame(tick) was re-queued unconditionally after phase
 * completion, causing onSessionComplete to fire on every subsequent frame.
 *
 * These tests verify the fix: onSessionComplete fires exactly once per completion.
 *
 * Test strategy:
 * - Stub requestAnimationFrame / cancelAnimationFrame with a plain Map (NOT setTimeout)
 *   so Vitest's timer tracking doesn't interfere.
 * - Mock Date.now() to control elapsed time precisely.
 * - Manually flush one RAF frame at a time to trigger tick.
 */
import { renderHook, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTimer } from './useTimer'

// ── RAF stub (Vitest-timer-system independent) ──────────────────────────────
let rafCallbacks: Map<number, FrameRequestCallback>
let rafCounter: number

function flushOneRAF() {
  const entry = rafCallbacks.entries().next().value as [number, FrameRequestCallback] | undefined
  if (entry) {
    const [id, cb] = entry
    rafCallbacks.delete(id)
    cb(0)
  }
}

beforeEach(() => {
  rafCallbacks = new Map()
  rafCounter = 0

  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback): number => {
    rafCounter += 1
    rafCallbacks.set(rafCounter, cb)
    return rafCounter
  })

  vi.stubGlobal('cancelAnimationFrame', (id: number): void => {
    rafCallbacks.delete(id)
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  rafCallbacks.clear()
})

// ── helpers ─────────────────────────────────────────────────────────────────

const WORK_SECONDS = 25 * 60 // 1500

function startAndAdvanceToCompletion(
  result: ReturnType<
    typeof renderHook<ReturnType<typeof useTimer>, { onSessionComplete?: (d: number) => void }>
  >['result'],
) {
  const START_TIME = 1_000_000

  vi.spyOn(Date, 'now').mockReturnValue(START_TIME)

  act(() => {
    result.current.start()
  })

  // Advance wall clock past work duration so next tick sees elapsed > totalDuration
  vi.spyOn(Date, 'now').mockReturnValue(START_TIME + (WORK_SECONDS + 1) * 1000)

  // Fire the pending RAF frame — this is the tick that processes completion
  act(() => {
    flushOneRAF()
  })
}

// ── tests ────────────────────────────────────────────────────────────────────

describe('useTimer — onSessionComplete call count (bug regression)', () => {
  it('work phase 완료 시 onSessionComplete는 정확히 1번 호출된다', () => {
    const onSessionComplete = vi.fn()
    const { result } = renderHook(() => useTimer({ onSessionComplete }))

    startAndAdvanceToCompletion(result)

    expect(onSessionComplete).toHaveBeenCalledTimes(1)
    expect(onSessionComplete).toHaveBeenCalledWith(WORK_SECONDS / 60)
  })

  it('work phase 완료 시 pomodoroCount는 정확히 1 증가한다', () => {
    const { result } = renderHook(() => useTimer({}))

    expect(result.current.state.pomodoroCount).toBe(0)

    startAndAdvanceToCompletion(result)

    expect(result.current.state.pomodoroCount).toBe(1)
  })

  it('완료 후 추가 RAF 프레임이 flush되어도 onSessionComplete는 1번만 호출된다', () => {
    const onSessionComplete = vi.fn()
    const { result } = renderHook(() => useTimer({ onSessionComplete }))

    startAndAdvanceToCompletion(result)

    // Flush any leftover pending frames (e.g. from React Strict Mode double-invoking start())
    // startedAtRef.current is null after completion → early return, no extra calls
    act(() => {
      flushOneRAF()
      flushOneRAF()
      flushOneRAF()
    })

    expect(onSessionComplete).toHaveBeenCalledTimes(1)
  })
})
