import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { subDays, format, getHours } from 'date-fns'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check Pro tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  if (!profile || profile.subscription_tier === 'free') {
    return NextResponse.json(
      { error: 'Pro subscription required', code: 'PRO_REQUIRED' },
      { status: 403 },
    )
  }

  // Return cached insights (last 7 days)
  const since = subDays(new Date(), 7).toISOString()
  const { data: cached } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(5)

  return NextResponse.json({ insights: cached ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check Pro tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, timezone')
    .eq('id', user.id)
    .single()

  if (!profile || profile.subscription_tier === 'free') {
    return NextResponse.json(
      { error: 'Pro subscription required', code: 'PRO_REQUIRED' },
      { status: 403 },
    )
  }

  // Fetch last 30 days of sessions for analysis
  const since = subDays(new Date(), 30).toISOString()
  const { data: sessions, error: sessionsError } = await supabase
    .from('focus_sessions')
    .select(
      'duration_minutes, started_at, ended_at, status, interruptions, mood_before, mood_after, task_name',
    )
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .gte('started_at', since)
    .order('started_at', { ascending: false })

  if (sessionsError) {
    return NextResponse.json({ error: sessionsError.message }, { status: 500 })
  }

  if (!sessions || sessions.length < 3) {
    return NextResponse.json(
      {
        error: 'Not enough data',
        message: '인사이트 생성을 위해 최소 3개의 완료된 세션이 필요합니다.',
      },
      { status: 422 },
    )
  }

  // Compute pattern stats for prompt
  const hourlyMap: Record<number, { totalMinutes: number; count: number }> = {}
  let totalMinutes = 0
  const dailyMap: Record<string, number> = {}

  for (const s of sessions) {
    const hour = getHours(new Date(s.started_at))
    if (!hourlyMap[hour]) hourlyMap[hour] = { totalMinutes: 0, count: 0 }
    hourlyMap[hour].totalMinutes += s.duration_minutes
    hourlyMap[hour].count += 1
    totalMinutes += s.duration_minutes

    const day = format(new Date(s.started_at), 'EEEE') // Monday, Tuesday, etc.
    dailyMap[day] = (dailyMap[day] ?? 0) + s.duration_minutes
  }

  const avgDuration = Math.round(totalMinutes / sessions.length)
  const bestHour = Object.entries(hourlyMap).sort(
    (a, b) => b[1].totalMinutes - a[1].totalMinutes,
  )[0]
  const bestDay = Object.entries(dailyMap).sort((a, b) => b[1] - a[1])[0]
  const avgMoodBefore =
    sessions
      .filter((s) => s.mood_before != null)
      .reduce((sum, s) => sum + (s.mood_before ?? 0), 0) /
    (sessions.filter((s) => s.mood_before != null).length || 1)
  const avgMoodAfter =
    sessions.filter((s) => s.mood_after != null).reduce((sum, s) => sum + (s.mood_after ?? 0), 0) /
    (sessions.filter((s) => s.mood_after != null).length || 1)

  const statsContext = `
사용자의 최근 30일 집중 세션 데이터:
- 총 완료 세션: ${sessions.length}개
- 총 집중 시간: ${Math.round(totalMinutes / 60)}시간 ${totalMinutes % 60}분
- 평균 세션 시간: ${avgDuration}분
- 최적 집중 시간대: ${bestHour ? `${bestHour[0]}시 (평균 ${Math.round(bestHour[1].totalMinutes / bestHour[1].count)}분)` : '데이터 없음'}
- 가장 생산적인 요일: ${bestDay ? `${bestDay[0]}` : '데이터 없음'}
- 세션 전 평균 기분: ${avgMoodBefore.toFixed(1)}/5
- 세션 후 평균 기분: ${avgMoodAfter.toFixed(1)}/5
`

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `당신은 집중력과 생산성 코칭 전문가입니다. 사용자의 집중 세션 데이터를 분석하여 한국어로 간결하고 실용적인 인사이트를 제공합니다.
응답은 반드시 JSON 배열 형식으로, 각 항목에 type(pattern_analysis/recommendation/daily_summary), title(20자 이내), content(150자 이내의 구체적인 인사이트) 필드를 포함해야 합니다.`,
        },
        {
          role: 'user',
          content: `${statsContext}\n\n이 데이터를 바탕으로 3가지 맞춤 인사이트와 추천을 제공해주세요. 구체적인 시간, 패턴, 개선 방법을 포함하세요.`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 800,
      temperature: 0.7,
    })

    let insightsData: { type: string; title: string; content: string }[] = []
    try {
      const parsed = JSON.parse(completion.choices[0].message.content ?? '{}')
      insightsData = Array.isArray(parsed) ? parsed : (parsed.insights ?? parsed.items ?? [])
    } catch {
      return NextResponse.json({ error: 'AI 응답 파싱 실패' }, { status: 500 })
    }

    // Save to ai_insights table
    const rows = insightsData.slice(0, 3).map((item) => ({
      user_id: user.id,
      insight_type: (['pattern_analysis', 'recommendation', 'daily_summary'].includes(item.type)
        ? item.type
        : 'pattern_analysis') as 'pattern_analysis' | 'recommendation' | 'daily_summary',
      content: item.content,
      metadata: { title: item.title, sessionCount: sessions.length, avgDuration },
    }))

    const { data: saved, error: saveError } = await supabase
      .from('ai_insights')
      .insert(rows)
      .select()

    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 500 })
    }

    return NextResponse.json({ insights: saved ?? [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI 오류'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
