'use client'

import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTimer } from '@/hooks/useTimer'
import { TimerDisplay } from './TimerDisplay'
import { TimerControls } from './TimerControls'

export function PomodoroTimer() {
  const [taskName, setTaskName] = useState('')
  const [savingSession, setSavingSession] = useState(false)
  const [lastMessage, setLastMessage] = useState<string | null>(null)

  const handleSessionComplete = useCallback(async (durationMinutes: number) => {
    setSavingSession(true)
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_name: taskName || null,
          duration_minutes: durationMinutes,
          status: 'completed',
        }),
      })
      setLastMessage('세션 완료! 휴식을 취하세요.')
    } catch {
      // silently ignore — timer continues regardless
    } finally {
      setSavingSession(false)
    }
  }, [taskName])

  const { state, remaining, start, pause, reset } = useTimer({ onSessionComplete: handleSessionComplete })

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Task name input — only editable when not running */}
      <input
        type="text"
        placeholder="지금 집중할 작업을 입력하세요 (선택)"
        value={taskName}
        onChange={e => setTaskName(e.target.value)}
        disabled={state.status === 'running'}
        className="w-full max-w-sm rounded-lg border border-border bg-background px-4 py-2 text-sm text-center placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
      />

      {/* Timer circle */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state.phase}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25 }}
        >
          <TimerDisplay
            remaining={remaining}
            totalDuration={state.totalDuration}
            phase={state.phase}
          />
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <TimerControls
        status={state.status}
        onStart={start}
        onPause={pause}
        onReset={reset}
      />

      {/* Pomodoro count */}
      <div className="flex items-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-3 w-3 rounded-full transition-colors ${
              i < state.pomodoroCount % 4 || (state.pomodoroCount > 0 && state.pomodoroCount % 4 === 0)
                ? 'bg-primary'
                : 'bg-muted'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          총 {state.pomodoroCount}회 완료
        </span>
      </div>

      {/* Status messages */}
      <AnimatePresence>
        {savingSession && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-muted-foreground"
          >
            세션 저장 중...
          </motion.p>
        )}
        {lastMessage && !savingSession && (
          <motion.p
            key={lastMessage}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm font-medium text-green-600 dark:text-green-400"
          >
            {lastMessage}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
