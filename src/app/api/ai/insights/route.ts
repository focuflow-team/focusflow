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

  // Rate limit: 하루 3회만 생성 허용
  const DAILY_LIMIT = 3
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const { data: todayInsights } = await supabase
    .from('ai_insights')
    .select('created_at')
    .eq('user_id', user.id)
    .gte('created_at', todayStart.toISOString())
    .order('created_at', { ascending: false })

  const usedToday = Math.floor((todayInsights?.length ?? 0) / 3) // 인사이트 3개 = 1회 분석
  if (usedToday >= DAILY_LIMIT) {
    return NextResponse.json(
      {
        error: 'Rate limited',
        message: `오늘 분석 횟수(${DAILY_LIMIT}회)를 모두 사용했습니다. 내일 다시 이용해 주세요.`,
      },
      { status: 429 },
    )
  }

  // Fetch last 30 days of ALL sessions (completed + interrupted) for richer analysis
  const since = subDays(new Date(), 30).toISOString()
  const { data: allSessions, error: sessionsError } = await supabase
    .from('focus_sessions')
    .select('duration_minutes, started_at, status, task_name')
    .eq('user_id', user.id)
    .gte('started_at', since)
    .order('started_at', { ascending: true })

  if (sessionsError) {
    return NextResponse.json({ error: sessionsError.message }, { status: 500 })
  }

  const sessions = allSessions ?? []
  const completed = sessions.filter((s) => s.status === 'completed')

  if (completed.length < 3) {
    return NextResponse.json(
      {
        error: 'Not enough data',
        message: '인사이트 생성을 위해 최소 3개의 완료된 세션이 필요합니다.',
      },
      { status: 422 },
    )
  }

  // ── 통계 계산 ──────────────────────────────────────────────

  // 총 집중 시간
  const totalMinutes = completed.reduce((sum, s) => sum + s.duration_minutes, 0)
  const avgDuration = Math.round(totalMinutes / completed.length)

  // 시간대별
  const timeBlocks = { 오전: 0, 오후: 0, 저녁: 0 }
  const hourlyMap: Record<number, number> = {}
  const hourlyInterruptMap: Record<number, number> = {}
  for (const s of sessions) {
    const h = getHours(new Date(s.started_at))
    if (s.status === 'completed') {
      hourlyMap[h] = (hourlyMap[h] ?? 0) + s.duration_minutes
      if (h >= 6 && h < 12) timeBlocks.오전 += s.duration_minutes
      else if (h >= 12 && h < 18) timeBlocks.오후 += s.duration_minutes
      else timeBlocks.저녁 += s.duration_minutes
    } else if (s.status === 'interrupted') {
      hourlyInterruptMap[h] = (hourlyInterruptMap[h] ?? 0) + 1
    }
  }

  // 중단이 가장 많은 시간대
  const worstHour = Object.entries(hourlyInterruptMap).sort((a, b) => b[1] - a[1])[0]

  // 요일별
  const dayKorMap: Record<string, string> = {
    Monday: '월요일',
    Tuesday: '화요일',
    Wednesday: '수요일',
    Thursday: '목요일',
    Friday: '금요일',
    Saturday: '토요일',
    Sunday: '일요일',
  }
  const dowMap: Record<string, number> = {}
  for (const s of completed) {
    const day = dayKorMap[format(new Date(s.started_at), 'EEEE')] ?? ''
    dowMap[day] = (dowMap[day] ?? 0) + s.duration_minutes
  }
  const bestDay = Object.entries(dowMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '데이터 없음'
  const worstDay = Object.entries(dowMap).sort((a, b) => a[1] - b[1])[0]?.[0] ?? '데이터 없음'

  // 태스크별 세부 분석 (평균 세션 길이, 주로 하는 시간대)
  const taskDetailMap: Record<string, { totalMin: number; count: number; hours: number[] }> = {}
  for (const s of completed) {
    const name = s.task_name ?? '(이름 없음)'
    if (!taskDetailMap[name]) taskDetailMap[name] = { totalMin: 0, count: 0, hours: [] }
    taskDetailMap[name].totalMin += s.duration_minutes
    taskDetailMap[name].count += 1
    taskDetailMap[name].hours.push(getHours(new Date(s.started_at)))
  }
  const taskDetails = Object.entries(taskDetailMap)
    .sort((a, b) => b[1].totalMin - a[1].totalMin)
    .slice(0, 6)
    .map(([name, d]) => {
      const avgMin = Math.round(d.totalMin / d.count)
      const avgHour = Math.round(d.hours.reduce((a, b) => a + b, 0) / d.hours.length)
      const block = avgHour < 12 ? '오전' : avgHour < 18 ? '오후' : '저녁'
      return `${name}: ${d.count}회 완료, 평균 ${avgMin}분, 주로 ${block}(${avgHour}시대)`
    })
    .join('\n')

  // 활성 날짜 & 스트릭
  const activeDates = new Set(completed.map((s) => format(new Date(s.started_at), 'yyyy-MM-dd')))
  const activeDaysCount = activeDates.size
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 30; i++) {
    const d = format(subDays(today, i), 'yyyy-MM-dd')
    if (activeDates.has(d)) streak++
    else break
  }

  // 중단율
  const interruptedCount = sessions.filter((s) => s.status === 'interrupted').length
  const interruptRate =
    sessions.length > 0 ? Math.round((interruptedCount / sessions.length) * 100) : 0

  // 주간 평균 세션수
  const weeklyAvg = Math.round(completed.length / Math.max(activeDaysCount / 7, 1))

  // 최근 14일 개별 세션 목록 (요일 포함)
  const twoWeeksAgo = subDays(today, 14)
  const dayShortMap: Record<string, string> = {
    Monday: '월',
    Tuesday: '화',
    Wednesday: '수',
    Thursday: '목',
    Friday: '금',
    Saturday: '토',
    Sunday: '일',
  }
  const recentSessions = sessions
    .filter((s) => new Date(s.started_at) >= twoWeeksAgo)
    .map((s) => {
      const d = new Date(s.started_at)
      const dow = dayShortMap[format(d, 'EEEE')] ?? ''
      return `${format(d, 'MM/dd')}(${dow}) ${getHours(d)}시 | ${s.task_name ?? '(이름 없음)'} | ${s.duration_minutes}분 | ${s.status === 'completed' ? '완료' : '중단'}`
    })
    .join('\n')

  // 최근 14일 달력 뷰 (세션 없는 날 포함)
  const calendarRows: string[] = []
  for (let i = 13; i >= 0; i--) {
    const d = subDays(today, i)
    const dateStr = format(d, 'yyyy-MM-dd')
    const dow = dayShortMap[format(d, 'EEEE')] ?? ''
    const daySessions = sessions.filter(
      (s) => format(new Date(s.started_at), 'yyyy-MM-dd') === dateStr,
    )
    const hasCompleted = daySessions.some((s) => s.status === 'completed')
    const hasInterrupted = daySessions.some((s) => s.status === 'interrupted')
    const mark =
      daySessions.length === 0
        ? '✗'
        : hasInterrupted && !hasCompleted
          ? '✗'
          : hasInterrupted
            ? '△'
            : '✓'
    calendarRows.push(`${format(d, 'MM/dd')}(${dow})${mark}`)
  }
  const calendarView = calendarRows.join('  ')

  const statsContext = `
[최근 30일 집중 요약]
- 완료 ${completed.length}개 / 중단 ${interruptedCount}개 (중단율 ${interruptRate}%)
- 총 ${Math.floor(totalMinutes / 60)}시간 ${totalMinutes % 60}분 / 평균 세션 ${avgDuration}분
- 활성 ${activeDaysCount}일 / 현재 스트릭 ${streak}일 연속 / 주간 평균 ${weeklyAvg}세션
- 오전(6–12시): ${timeBlocks.오전}분 / 오후(12–18시): ${timeBlocks.오후}분 / 저녁(18–24시): ${timeBlocks.저녁}분
- 생산적 요일: ${bestDay} / 집중 저조 요일: ${worstDay}
${worstHour ? `- 중단이 가장 많은 시간대: ${worstHour[0]}시 (${worstHour[1]}회)` : ''}

[최근 14일 달력] ✓완료 △일부중단 ✗세션없음
${calendarView}

[태스크별 세부 패턴]
${taskDetails}

[최근 14일 개별 세션 로그]
날짜(요일) | 시작시간 | 태스크 | 길이 | 상태
${recentSessions}
`

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const completion = await openai.chat.completions.create({
      model: 'gpt-5.4-mini',
      messages: [
        {
          role: 'system',
          content: `당신은 집중 데이터를 분석하는 생산성 애널리스트입니다. 감정적 응원 없이, 데이터에서 발견한 사실을 짧고 명확하게 전달합니다.

## 핵심 원칙: 비자명한 교차 분석
집계 숫자를 읽어주지 않습니다. 개별 세션 로그를 직접 뜯어보고, 두 가지 이상 변수를 교차해야만 보이는 패턴을 찾습니다.

**금지: 누구나 집계표 보면 알 수 있는 관찰**
- "오전에 집중 시간이 많아요"
- "금요일 생산성이 가장 높아요"
- "평균 세션이 X분이에요"

**요구: 두 변수 이상을 교차한 비자명한 패턴**
- 특정 태스크 유형 × 시간대 → 완주율 차이
- 세션 길이 × 중단 여부 → 임계점
- 연속 집중일 여부 × 세션 패턴 변화
- 태스크별 선호 시간대 × 실제 완주율

## 인사이트 구성 (반드시 이 순서와 타입으로)
1. type: "pattern_analysis" — 교차 분석으로 발견한 비자명한 패턴
2. type: "recommendation" — 패턴을 근거로 내일 당장 할 수 있는 행동 1가지
3. type: "daily_summary" — 전체 흐름 2~3줄 요약

## 각 인사이트 필드 작성 방식

### summary (한 줄 핵심 발견)
- 30자 이내, 수치 포함, 두 변수 이상을 교차한 결과
- 예: "저녁 세션 완주율이 오전보다 23% 높음"

### content (상세 분석, 문장 배열)
- **반드시 각 문장을 \\n으로 구분한 4~6문장. 총 250~350자.**
- 첫 문장: summary의 근거가 되는 수치와 교차 변수
- 둘째 문장: 세션 로그에서 가져온 구체적인 날짜·태스크 예시 1개 이상
- 셋째 문장: 그게 왜 의미있는지 또는 반례·조건
- 넷째 문장 이후: 패턴이 더 구체적으로 드러나는 조건이나 맥락
- recommendation 마지막 문장: 내일 구체적 행동 (시간 + 태스크명)

### title 작성 방식
- 10자 이내, 명사형 또는 짧은 서술형
- 핵심 발견을 압축

## 절대 쓰지 말 것
- "~네요", "~해요", "~거예요" 같은 부드러운 어미 → "~다", "~임", "~됨"으로
- "열심히", "꾸준히", "응원", "격려" 등 감정적 표현
- 단일 집계 수치만 읽어주는 관찰

응답 형식: JSON 객체 { "insights": [ { "type": "...", "title": "10자 이내", "summary": "한 줄 핵심 발견 (30자 이내)", "content": "\\n으로 구분된 4~6문장" } ] }`,
        },
        {
          role: 'user',
          content: `${statsContext}\n\n위 데이터로 인사이트 3개를 작성해 주세요. pattern_analysis → recommendation → daily_summary 순서를 반드시 지켜주세요. 각 content는 문장마다 \\n으로 구분해 4~6문장으로 작성하고, summary는 30자 이내 한 줄 핵심 발견으로 작성해 주세요. 각 인사이트는 250자 이상이어야 합니다.`,
        },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 2400,
      temperature: 0.6,
    })

    let insightsData: { type: string; title: string; summary?: string; content: string }[] = []
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
      metadata: {
        title: item.title,
        summary: item.summary ?? null,
        sessionCount: sessions.length,
        avgDuration,
      },
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
