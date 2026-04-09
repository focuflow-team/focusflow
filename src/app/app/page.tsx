import type { Metadata } from 'next'
import { TimerPage } from '@/components/timer/TimerPage'

export const metadata: Metadata = {
  title: '타이머',
}

export default function DashboardPage() {
  return (
    <div className="w-full max-w-lg flex flex-col items-center gap-8 sm:gap-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">집중 타이머</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          포모도로 기법으로 집중력을 높이세요
        </p>
      </div>
      <TimerPage />
    </div>
  )
}
