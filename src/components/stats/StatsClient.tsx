'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'
import { Flame, Clock, Target, TrendingUp } from 'lucide-react'

type Period = 'day' | 'week' | 'month'

interface DailyStat {
  date: string
  label: string
  totalMinutes: number
  sessionCount: number
}

interface HourlyStat {
  hour: number
  label: string
  totalMinutes: number
  sessionCount: number
}

interface RecentSession {
  id: string
  task_name: string | null
  duration_minutes: number
  started_at: string
  status: string
}

interface Stats {
  period: Period
  summary: {
    totalMinutes: number
    sessionCount: number
    activeDays: number
    streak: number
    avgMinutesPerSession: number
  }
  dailyStats: DailyStat[]
  hourlyStats: HourlyStat[]
  recentSessions: RecentSession[]
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}분`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`
}

export function StatsClient() {
  const [period, setPeriod] = useState<Period>('week')
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async (p: Period) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/sessions/stats?period=${p}`)
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats(period)
  }, [period, fetchStats])

  const periods: { key: Period; label: string }[] = [
    { key: 'day', label: '오늘' },
    { key: 'week', label: '이번 주' },
    { key: 'month', label: '이번 달' },
  ]

  return (
    <div className="w-full max-w-3xl space-y-8">
      {/* Header + period tabs */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">집중 통계</h1>
        <div className="flex rounded-lg border border-border overflow-hidden text-sm">
          {periods.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-3 py-1.5 transition-colors ${
                period === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
          불러오는 중...
        </div>
      ) : stats ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard
              icon={<Clock className="h-4 w-4" />}
              label="총 집중 시간"
              value={formatMinutes(stats.summary.totalMinutes)}
            />
            <SummaryCard
              icon={<Target className="h-4 w-4" />}
              label="완료 세션"
              value={`${stats.summary.sessionCount}회`}
            />
            <SummaryCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="세션 평균"
              value={formatMinutes(stats.summary.avgMinutesPerSession)}
            />
            <SummaryCard
              icon={<Flame className="h-4 w-4 text-orange-500" />}
              label="스트릭"
              value={`${stats.summary.streak}일 연속`}
              highlight={stats.summary.streak > 0}
            />
          </div>

          {/* Bar chart: daily focus time */}
          {period !== 'day' && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">일별 집중 시간 (분)</h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={stats.dailyStats} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload as DailyStat
                      return (
                        <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                          <p className="font-medium">{d.date}</p>
                          <p className="text-muted-foreground">{formatMinutes(d.totalMinutes)} · {d.sessionCount}회</p>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="totalMinutes" radius={[4, 4, 0, 0]} className="fill-primary" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Line chart: trend (only for month) */}
          {period === 'month' && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">월간 트렌드</h2>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={stats.dailyStats} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload as DailyStat
                      return (
                        <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                          <p className="font-medium">{d.date}</p>
                          <p className="text-muted-foreground">{formatMinutes(d.totalMinutes)}</p>
                        </div>
                      )
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalMinutes"
                    strokeWidth={2}
                    className="stroke-primary"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Hourly heatmap (best focus times) */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">시간대별 집중 패턴</h2>
            <HourlyHeatmap data={stats.hourlyStats} />
          </div>

          {/* Recent sessions */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">최근 세션</h2>
            {stats.recentSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">아직 완료된 세션이 없습니다.</p>
            ) : (
              <ul className="divide-y divide-border">
                {stats.recentSessions.map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{s.task_name ?? '이름 없는 세션'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(s.started_at), 'yyyy년 M월 d일 HH:mm')}
                      </p>
                    </div>
                    <span className="ml-4 shrink-0 text-muted-foreground">
                      {formatMinutes(s.duration_minutes)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-muted-foreground text-sm">
          데이터를 불러올 수 없습니다.
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30' : 'border-border bg-card'}`}>
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  )
}

function HourlyHeatmap({ data }: { data: HourlyStat[] }) {
  const maxMinutes = Math.max(...data.map(d => d.totalMinutes), 1)
  const blocks = data.filter(d => d.hour >= 6 && d.hour <= 23)

  return (
    <div className="flex flex-wrap gap-1">
      {blocks.map((d) => {
        const intensity = d.totalMinutes / maxMinutes
        const opacity = d.totalMinutes === 0 ? 0.08 : 0.2 + intensity * 0.8
        return (
          <div
            key={d.hour}
            title={`${d.hour}시: ${formatMinutes(d.totalMinutes)} (${d.sessionCount}회)`}
            className="relative group"
          >
            <div
              className="h-8 w-8 rounded-md bg-primary transition-all"
              style={{ opacity }}
            />
            <span className="absolute -bottom-4 left-0 right-0 text-center text-[9px] text-muted-foreground">
              {d.hour}
            </span>
            {/* Tooltip */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-border bg-popover px-2 py-1 text-xs shadow-md opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
              {d.hour}시 · {formatMinutes(d.totalMinutes)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
