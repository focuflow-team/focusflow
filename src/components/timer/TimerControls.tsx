'use client'

import { motion } from 'framer-motion'
import type { TimerStatus } from '@/hooks/useTimer'

interface TimerControlsProps {
  status: TimerStatus
  onStart: () => void
  onPause: () => void
  onReset: () => void
}

export function TimerControls({ status, onStart, onPause, onReset }: TimerControlsProps) {
  return (
    <motion.div
      className="flex items-center gap-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {status === 'running' ? (
        <button
          onClick={onPause}
          className="flex h-14 w-36 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold shadow-md transition hover:opacity-90 active:scale-95"
        >
          일시정지
        </button>
      ) : (
        <button
          onClick={onStart}
          className="flex h-14 w-36 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold shadow-md transition hover:opacity-90 active:scale-95"
        >
          {status === 'paused' ? '계속하기' : '시작'}
        </button>
      )}
      <button
        onClick={onReset}
        className="flex h-10 w-20 items-center justify-center rounded-full border border-border text-sm text-muted-foreground transition hover:bg-muted active:scale-95"
      >
        리셋
      </button>
    </motion.div>
  )
}
