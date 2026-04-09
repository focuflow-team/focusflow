import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { subDays, format, getHours } from 'date-fns'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use service role client for cron
  const supabase = await createClient()

  // Find all Pro/Team users active in the last 7 days
  const since7d = subDays(new Date(), 7).toISOString()
  const { data: activeUsers } = await supabase
    .from('focus_sessions')
    .select('user_id')
    .eq('status', 'completed')
    .gte('started_at', since7d)

  if (!activeUsers || activeUsers.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 })
  }

  const uniqueUserIds = [...new Set(activeUsers.map(r => r.user_id))]

  // Filter to Pro/Team users
  const { data: proProfiles } = await supabase
    .from('profiles')
    .select('id')
    .in('id', uniqueUserIds)
    .in('subscription_tier', ['pro', 'team'])

  if (!proProfiles || proProfiles.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 })
  }

  let processed = 0

  for (const { id: userId } of proProfiles) {
    // Skip if insights were generated in last 24h
    const since24h = subDays(new Date(), 1).toISOString()
    const { data: recent } = await supabase
      .from('ai_insights')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', since24h)
      .limit(1)

    if (recent && recent.length > 0) continue

    // Fetch sessions for analysis
    const since30d = subDays(new Date(), 30).toISOString()
    const { data: sessions } = await supabase
      .from('focus_sessions')
      .select('duration_minutes, started_at, mood_before, mood_after')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('started_at', since30d)

    if (!sessions || sessions.length < 3) continue

    const hourlyMap: Record<number, { totalMinutes: number; count: number }> = {}
    let totalMinutes = 0
    const dailyMap: Record<string, number> = {}

    for (const s of sessions) {
      const hour = getHours(new Date(s.started_at))
      if (!hourlyMap[hour]) hourlyMap[hour] = { totalMinutes: 0, count: 0 }
      hourlyMap[hour].totalMinutes += s.duration_minutes
      hourlyMap[hour].count += 1
      totalMinutes += s.duration_minutes
      const day = format(new Date(s.started_at), 'EEEE')
      dailyMap[day] = (dailyMap[day] ?? 0) + s.duration_minutes
    }

    const avgDuration = Math.round(totalMinutes / sessions.length)
    const bestHour = Object.entries(hourlyMap).sort((a, b) => b[1].totalMinutes - a[1].totalMinutes)[0]
    const bestDay = Object.entries(dailyMap).sort((a, b) => b[1] - a[1])[0]

    const statsContext = `사용자 집중 데이터 (최근 30일): 총 ${sessions.length}세션, 평균 ${avgDuration}분, 최적 시간대: ${bestHour ? `${bestHour[0]}시` : '없음'}, 최고 요일: ${bestDay ? bestDay[0] : '없음'}`

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `집중력 코칭 전문가. JSON 배열로 3개의 인사이트 반환. 각 항목: type(pattern_analysis/recommendation/daily_summary), title(20자 이내), content(150자 이내 한국어).`,
          },
          { role: 'user', content: statsContext },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 600,
        temperature: 0.7,
      })

      const parsed = JSON.parse(completion.choices[0].message.content ?? '{}')
      const items: { type: string; title: string; content: string }[] = Array.isArray(parsed)
        ? parsed
        : (parsed.insights ?? parsed.items ?? [])

      const rows = items.slice(0, 3).map(item => ({
        user_id: userId,
        insight_type: (['pattern_analysis', 'recommendation', 'daily_summary'].includes(item.type)
          ? item.type
          : 'pattern_analysis') as 'pattern_analysis' | 'recommendation' | 'daily_summary',
        content: item.content,
        metadata: { title: item.title, sessionCount: sessions.length, avgDuration },
      }))

      await supabase.from('ai_insights').insert(rows)
      processed++
    } catch {
      // Continue with next user on failure
    }
  }

  return NextResponse.json({ ok: true, processed })
}
