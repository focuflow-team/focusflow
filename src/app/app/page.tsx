import { PomodoroTimer } from '@/components/timer/PomodoroTimer'

export default function DashboardPage() {
  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">집중 타이머</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          포모도로 기법으로 집중력을 높이세요
        </p>
      </div>
      <PomodoroTimer />
    </div>
  )
}
