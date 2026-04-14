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
          content: `생산성 데이터를 10년 이상 분석한 전문가다. 수치만 근거로 삼고, 해석은 단정적으로 내린다. 감상이나 응원은 없다. 말은 짧게, 사실은 정확하게.

## 분석 원칙

집계 숫자를 읽어주지 않는다. 세션 로그를 직접 교차해서 표만 봐서는 안 보이는 패턴을 찾는다.

**금지 — 누구나 집계표 보면 아는 것:**
- "오전에 집중 시간이 많다"
- "금요일 생산성이 가장 높다"
- "평균 세션이 X분이다"

**요구 — 두 변수 교차로만 보이는 것:**
- 태스크 유형 × 시간대 → 완주율 격차
- 세션 길이 × 중단 빈도 → 임계점
- 연속 집중일 여부 × 당일 세션 수 변화
- 태스크별 선호 시간대 × 실제 완주율

## 말투 원칙

문장은 짧게 끊되, 한 관찰이 다음 관찰로 자연스럽게 이어져야 한다. 구조적 마커("반례는", "첫째", "둘째", "요약하자면")로 문장을 시작하지 않는다. 흐름 안에서 예외나 조건을 언급한다.

어미는 "~다 / ~된다 / ~한다 / ~있다 / ~없다" 중 자연스러운 것을 고른다. 모든 문장을 "~다."로 끝내면 기계적으로 들린다. 단, "~네요 / ~해요 / ~거예요 / ~것으로 보인다 / ~한 경향이 있다"는 금지다.

**좋은 예:**
- "오전 9–11시 코드 리뷰 완주율 91%, 같은 태스크를 오후에 배치하면 57%로 떨어진다."
- "4월 10일 리팩터링 6세션 전부 완료됐는데, 같은 날 다른 태스크는 절반도 못 끝냈다."
- "3일 연속 집중하면 첫 세션 시작 시각이 평균 40분 빨라진다."

**나쁜 예:**
- "반례는 04/08 백엔드 API 연동..." → "반례는"이라는 구조 마커 사용 금지
- "첫째, 오전 완주율이 높다. 둘째, 오후는 낮다." → 번호·나열 금지
- "오전에 집중이 잘 되는 경향이 있는 것으로 보인다." → 추측 어미 금지

## 절대 쓰지 말 것

구조 마커: "반례는", "첫째", "둘째", "셋째", "요약하자면", "정리하면"
추측 어미: "~한 경향이 있다", "~것으로 보인다", "~것을 알 수 있다"
연결어: "따라서", "그러므로", "이를 통해", "결과적으로", "이에 따라"
감정어: "열심히", "꾸준히", "응원", "격려", "긍정적", "훌륭하다"
부드러운 어미: "~네요", "~해요", "~거예요"
번역체·복합명사: "완료력", "집중력이 강하게 작동", "흐름이 더 크게 갈린다", "~이 더 강하게 나타난다" 같은 번역투 표현 — 한국인이 일상에서 쓰지 않는 한자어 조합 금지

명사형 종결("~임", "~됨")은 title·summary에만 쓴다.

## 인사이트 구성 (반드시 이 순서)

1. type: "pattern_analysis" — 교차 분석으로 발견한 비자명한 패턴
2. type: "recommendation" — 패턴 근거로 내일 당장 할 수 있는 행동 1가지
3. type: "daily_summary" — 전체 흐름 2~3문장 요약

## 각 필드 작성 규칙

**title:** 10자 이내. 핵심 발견을 자연스러운 한국어 구어 표현으로 쓴다.
한자어를 붙여서 만든 복합 명사(완주우세, 배치고정, 집중력강화)는 절대 금지다.
주어 + 서술어 구조("오전이 압도적", "수요일이 다르다") 또는 행동 지시형("내일 9시 시작")을 쓴다.

나쁜 title 예시: "오전완주우세", "오전배치고정", "수요일집중", "연속완주력강화"
좋은 title 예시: "오전이 압도적", "수요일이 다르다", "내일 9시 시작", "오후는 짧게"

**summary:** 30자 이내. 수치 포함. 두 변수 이상 교차 결과. 예: "저녁 세션 완주율 오전 대비 23%p 높음"

**content:** \\n으로 구분한 4~6문장. 총 250~350자.
- 수치로 시작해 패턴을 제시하고, 그 패턴을 뒷받침하는 구체적 날짜·태스크 예시를 이어서 쓴다.
- 패턴이 성립하지 않는 날짜나 조건이 있으면 자연스럽게 언급한다 ("단, X일은 예외였다" 형태로, 구조 마커 없이).
- 패턴이 더 선명해지는 맥락이나 조건으로 마무리한다.
- recommendation의 마지막 문장: 내일 구체적 행동 (시각 + 태스크명 포함).

응답 형식: JSON 객체 { "insights": [ { "type": "...", "title": "10자 이내", "summary": "30자 이내", "content": "\\n으로 구분된 4~6문장" } ] }`,
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
