import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { startOfDay, subDays, subMonths, format, getHours, differenceInCalendarDays } from 'date-fns'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') ?? 'week'

  const now = new Date()
  let rangeStart: Date
  if (period === 'day') {
    rangeStart = startOfDay(now)
  } else if (period === 'month') {
    rangeStart = startOfDay(subMonths(now, 1))
  } else {
    // week (default)
    rangeStart = startOfDay(subDays(now, 6))
  }

  const { data: sessions, error } = await supabase
    .from('focus_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .gte('started_at', rangeStart.toISOString())
    .order('started_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Aggregated by day
  const dailyMap: Record<string, { totalMinutes: number; sessionCount: number }> = {}
  // Aggregated by hour (0-23)
  const hourlyMap: Record<number, { totalMinutes: number; sessionCount: number }> = {}

  for (const s of sessions ?? []) {
    const dateKey = format(new Date(s.started_at), 'yyyy-MM-dd')
    if (!dailyMap[dateKey]) dailyMap[dateKey] = { totalMinutes: 0, sessionCount: 0 }
    dailyMap[dateKey].totalMinutes += s.duration_minutes
    dailyMap[dateKey].sessionCount += 1

    const hour = getHours(new Date(s.started_at))
    if (!hourlyMap[hour]) hourlyMap[hour] = { totalMinutes: 0, sessionCount: 0 }
    hourlyMap[hour].totalMinutes += s.duration_minutes
    hourlyMap[hour].sessionCount += 1
  }

  // Build dailyStats with all days in range filled (zero if no sessions)
  const days = period === 'day' ? 1 : period === 'month' ? 30 : 7
  const dailyStats = Array.from({ length: days }, (_, i) => {
    const d = subDays(now, days - 1 - i)
    const dateKey = format(d, 'yyyy-MM-dd')
    return {
      date: dateKey,
      label: format(d, period === 'month' ? 'M/d' : 'EEE'),
      totalMinutes: dailyMap[dateKey]?.totalMinutes ?? 0,
      sessionCount: dailyMap[dateKey]?.sessionCount ?? 0,
    }
  })

  // Hourly stats (0-23)
  const hourlyStats = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: `${hour}시`,
    totalMinutes: hourlyMap[hour]?.totalMinutes ?? 0,
    sessionCount: hourlyMap[hour]?.sessionCount ?? 0,
  }))

  // Summary
  const totalMinutes = (sessions ?? []).reduce((sum, s) => sum + s.duration_minutes, 0)
  const sessionCount = sessions?.length ?? 0
  const activeDays = Object.keys(dailyMap).length

  // Streak: fetch all completed sessions to compute streak (not limited to period)
  const { data: allSessions } = await supabase
    .from('focus_sessions')
    .select('started_at')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('started_at', { ascending: false })

  let streak = 0
  if (allSessions && allSessions.length > 0) {
    const sessionDays = new Set(
      allSessions.map(s => format(new Date(s.started_at), 'yyyy-MM-dd'))
    )
    const today = format(now, 'yyyy-MM-dd')
    let cursor = now
    let cursorKey = today

    // If no session today, streak may have ended yesterday
    if (!sessionDays.has(today)) {
      cursor = subDays(now, 1)
      cursorKey = format(cursor, 'yyyy-MM-dd')
    }

    while (sessionDays.has(cursorKey)) {
      streak++
      cursor = subDays(cursor, 1)
      cursorKey = format(cursor, 'yyyy-MM-dd')
    }
  }

  // Recent sessions (last 10, not limited to period)
  const { data: recentSessions } = await supabase
    .from('focus_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('started_at', { ascending: false })
    .limit(10)

  return NextResponse.json({
    period,
    summary: {
      totalMinutes,
      sessionCount,
      activeDays,
      streak,
      avgMinutesPerSession: sessionCount > 0 ? Math.round(totalMinutes / sessionCount) : 0,
    },
    dailyStats,
    hourlyStats,
    recentSessions: recentSessions ?? [],
  })
}
