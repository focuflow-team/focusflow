'use client'

import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTimer } from '@/hooks/useTimer'
import { useAmbientSound } from '@/hooks/useAmbientSound'
import { TimerDisplay } from './TimerDisplay'
import { TimerControls } from './TimerControls'
import { AmbientPlayer } from '@/components/ambient/AmbientPlayer'

export function TimerPage() {
  const [taskName, setTaskName] = useState('')
  const [savingSession, setSavingSession] = useState(false)
  const [lastMessage, setLastMessage] = useState<string | null>(null)
  const [showAmbient, setShowAmbient] = useState(false)

  const ambientSound = useAmbientSound()

  const handleSessionComplete = useCallback(
    async (durationMinutes: number) => {
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
        setLastMessage('세션 완료! 잠시 쉬어가세요.')
      } catch {
        // silently ignore — timer continues regardless
      } finally {
        setSavingSession(false)
      }
    },
    [taskName],
  )

  const { state, remaining, start, pause, reset } = useTimer({
    onSessionComplete: handleSessionComplete,
  })

  const handleStart = useCallback(() => {
    start()
    ambientSound.notifyTimerStatus('running')
  }, [start, ambientSound])

  const handlePause = useCallback(() => {
    pause()
    ambientSound.notifyTimerStatus('paused')
  }, [pause, ambientSound])

  const handleReset = useCallback(() => {
    reset()
    ambientSound.notifyTimerStatus('stopped')
  }, [reset, ambientSound])

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6 sm:max-w-lg sm:gap-8">
      {/* Task name input */}
      <input
        type="text"
        placeholder="지금 집중할 작업을 입력하세요 (선택)"
        value={taskName}
        onChange={(e) => setTaskName(e.target.value)}
        disabled={state.status === 'running'}
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-center placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 transition"
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
        onStart={handleStart}
        onPause={handlePause}
        onReset={handleReset}
      />

      {/* Pomodoro count */}
      <div className="flex items-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-2.5 w-2.5 rounded-full transition-colors sm:h-3 sm:w-3 ${
              i < state.pomodoroCount % 4 ||
              (state.pomodoroCount > 0 && state.pomodoroCount % 4 === 0)
                ? 'bg-primary'
                : 'bg-muted'
            }`}
          />
        ))}
        <span className="ml-1 text-xs text-muted-foreground sm:text-sm">
          총 {state.pomodoroCount}회 완료
        </span>
      </div>

      {/* Ambient sound toggle */}
      <button
        onClick={() => setShowAmbient((v) => !v)}
        className={`text-xs transition-colors ${showAmbient ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
      >
        🎧 {showAmbient ? '사운드 숨기기' : '앰비언트 사운드'}
        {ambientSound.playing && ' · 재생 중'}
      </button>

      <AnimatePresence>
        {showAmbient && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <AmbientPlayer sound={ambientSound} />
          </motion.div>
        )}
      </AnimatePresence>

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
            className="text-sm font-medium text-primary"
          >
            {lastMessage}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
