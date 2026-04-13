import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Trophy, Flame, Clock, Target } from 'lucide-react'

interface Props {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, username, is_public')
    .eq('username', username)
    .single()

  if (!profile || !profile.is_public) {
    return { title: '프로필을 찾을 수 없습니다' }
  }

  const name = profile.display_name ?? profile.username ?? username
  return {
    title: `${name}의 FocusFlow 프로필`,
    description: `${name}의 집중 통계를 확인하세요.`,
  }
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}분`
  if (m === 0) return `${h}시간`
  return `${h}시간 ${m}분`
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'id, display_name, username, avatar_url, is_public, total_focus_minutes, weekly_streak, created_at',
    )
    .eq('username', username)
    .single()

  if (!profile || !profile.is_public) notFound()

  // 최근 30일 세션 통계
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: sessions } = await supabase
    .from('focus_sessions')
    .select('duration_minutes, started_at, status')
    .eq('user_id', profile.id)
    .eq('status', 'completed')
    .gte('started_at', thirtyDaysAgo.toISOString())
    .order('started_at', { ascending: false })

  const totalSessions = sessions?.length ?? 0
  const totalMinutes = sessions?.reduce((sum, s) => sum + s.duration_minutes, 0) ?? 0

  // 이번 주 통계
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
  weekStart.setHours(0, 0, 0, 0)

  const weekSessions = sessions?.filter((s) => new Date(s.started_at) >= weekStart) ?? []
  const weekMinutes = weekSessions.reduce((sum, s) => sum + s.duration_minutes, 0)

  // 최근 7일 히트맵 데이터
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  const sessionsByDay =
    sessions?.reduce<Record<string, number>>((acc, s) => {
      const day = s.started_at.split('T')[0]
      acc[day] = (acc[day] ?? 0) + s.duration_minutes
      return acc
    }, {}) ?? {}

  const maxDayMinutes = Math.max(...last7Days.map((d) => sessionsByDay[d] ?? 0), 1)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link href="/" className="font-bold tracking-tight">
            FocusFlow
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary overflow-hidden shrink-0">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                (profile.display_name?.[0] ?? profile.username?.[0] ?? '?').toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold">{profile.display_name ?? profile.username}</h1>
              {profile.username && profile.display_name && (
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(profile.created_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                })}
                부터 사용 중
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4 space-y-1 text-center">
              <Clock className="h-4 w-4 mx-auto text-blue-500" />
              <p className="text-lg font-bold tabular-nums">{formatMinutes(weekMinutes)}</p>
              <p className="text-xs text-muted-foreground">이번 주</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-1 text-center">
              <Target className="h-4 w-4 mx-auto text-green-500" />
              <p className="text-lg font-bold tabular-nums">{totalSessions}</p>
              <p className="text-xs text-muted-foreground">최근 30일 세션</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-1 text-center">
              <Flame className="h-4 w-4 mx-auto text-orange-500" />
              <p className="text-lg font-bold tabular-nums">{profile.weekly_streak}</p>
              <p className="text-xs text-muted-foreground">주 연속 달성</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-1 text-center">
              <Trophy className="h-4 w-4 mx-auto text-yellow-500" />
              <p className="text-lg font-bold tabular-nums">{formatMinutes(totalMinutes)}</p>
              <p className="text-xs text-muted-foreground">30일 총 집중</p>
            </div>
          </div>

          {/* 7-day Activity Heatmap */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h2 className="text-sm font-semibold">최근 7일 활동</h2>
            <div className="flex gap-2">
              {last7Days.map((day) => {
                const mins = sessionsByDay[day] ?? 0
                const intensity = Math.round((mins / maxDayMinutes) * 4)
                const label = new Date(day).toLocaleDateString('ko-KR', {
                  weekday: 'short',
                  month: 'numeric',
                  day: 'numeric',
                })
                const colors = [
                  'bg-muted',
                  'bg-purple-200 dark:bg-purple-900',
                  'bg-purple-300 dark:bg-purple-700',
                  'bg-purple-400 dark:bg-purple-600',
                  'bg-purple-500',
                ]
                return (
                  <div
                    key={day}
                    className="flex-1 flex flex-col items-center gap-1.5"
                    title={`${label}: ${formatMinutes(mins)}`}
                  >
                    <div className={`w-full aspect-square rounded-md ${colors[intensity]}`} />
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(day).toLocaleDateString('ko-KR', { weekday: 'narrow' })}
                    </span>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">색이 진할수록 집중 시간이 길어요</p>
          </div>

          {/* CTA */}
          <div className="rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-200/50 dark:border-purple-800/50 p-6 text-center space-y-3">
            <p className="text-sm font-medium">나도 집중력을 키워볼까요?</p>
            <Link
              href="/signup"
              className="inline-flex rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              FocusFlow 무료로 시작하기
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
