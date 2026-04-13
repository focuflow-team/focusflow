'use client'

import { motion } from 'framer-motion'
import type { TimerPhase } from '@/hooks/useTimer'

interface TimerDisplayProps {
  remaining: number
  totalDuration: number
  phase: TimerPhase
}

const PHASE_COLORS: Record<TimerPhase, string> = {
  idle: 'var(--color-primary)',
  work: 'var(--color-focus)',
  break: 'var(--color-break)',
  long_break: 'var(--color-break)',
}

const PHASE_LABELS: Record<TimerPhase, string> = {
  idle: '집중 준비',
  work: '집중 시간',
  break: '짧은 휴식',
  long_break: '긴 휴식',
}

// Responsive sizes: rendered at 200px on mobile, 240px on desktop via CSS container
const SIZE = 240
const STROKE = 10
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function TimerDisplay({ remaining, totalDuration, phase }: TimerDisplayProps) {
  const progress = totalDuration > 0 ? remaining / totalDuration : 1
  const dashOffset = CIRCUMFERENCE * (1 - progress)

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const color = PHASE_COLORS[phase]

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest sm:text-sm">
        {PHASE_LABELS[phase]}
      </p>
      {/* Scale down to 200px on small screens */}
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            className="text-muted opacity-20"
          />
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
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={timeString}
            initial={{ opacity: 0.8, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="font-mono font-bold tabular-nums text-4xl sm:text-5xl"
            style={{ color }}
          >
            {timeString}
          </motion.span>
        </div>
      </div>
    </div>
  )
}
