'use client'

import { motion } from 'framer-motion'
import type { TimerPhase } from '@/hooks/useTimer'

interface TimerDisplayProps {
  remaining: number
  totalDuration: number
  phase: TimerPhase
}

const SIZE = 240
const STROKE = 10
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const PHASE_COLORS: Record<TimerPhase, string> = {
  idle: '#6366f1',
  work: '#6366f1',
  break: '#22c55e',
  long_break: '#f59e0b',
}

const PHASE_LABELS: Record<TimerPhase, string> = {
  idle: '집중 준비',
  work: '집중 시간',
  break: '짧은 휴식',
  long_break: '긴 휴식',
}

export function TimerDisplay({ remaining, totalDuration, phase }: TimerDisplayProps) {
  const progress = totalDuration > 0 ? remaining / totalDuration : 1
  const dashOffset = CIRCUMFERENCE * (1 - progress)

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const color = PHASE_COLORS[phase]

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
        {PHASE_LABELS[phase]}
      </p>
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          {/* Track */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            className="text-muted/20"
          />
          {/* Progress */}
          <motion.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 0.5, ease: 'linear' }}
          />
        </svg>
        {/* Time text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={timeString}
            initial={{ opacity: 0.8, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-5xl font-mono font-bold tabular-nums"
            style={{ color }}
          >
            {timeString}
          </motion.span>
        </div>
      </div>
    </div>
  )
}
