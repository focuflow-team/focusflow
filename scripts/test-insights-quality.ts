#!/usr/bin/env npx tsx
/* eslint-disable no-console */
/**
 * AI Insights Quality Tester
 *
 * 페르소나별 세션 데이터를 인메모리로 구성하여 AI 인사이트 품질을 채점합니다.
 * DB를 건드리지 않으므로 실제 사용자 데이터에 영향 없음.
 *
 * Usage:
 *   npx tsx scripts/test-insights-quality.ts              # 전체 페르소나
 *   npx tsx scripts/test-insights-quality.ts 아침형개발자  # 특정 페르소나
 */

import OpenAI from 'openai'
import { subDays, format, getHours } from 'date-fns'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Session {
  started_at: string
  duration_minutes: number
  status: 'completed' | 'interrupted'
  task_name: string | null
}

interface Persona {
  id: string
  name: string
  description: string
  sessions: Session[]
  /** AI가 반드시 언급해야 할 핵심 패턴들 */
  mustMentionPatterns: string[]
  /** AI가 피해야 할 뻔한 관찰 (단순 집계 읽기) */
  banPatterns: string[]
}

interface InsightResult {
  type: string
  title: string
  content: string
}

interface JudgeScore {
  crossVariableAnalysis: number // 0-10: 두 변수 이상 교차 분석 여부
  accuracy: number // 0-10: 실제 패턴과 일치 여부
  nonObviousness: number // 0-10: 집계만 읽지 않고 비자명한 발견
  actionability: number // 0-10: 추천이 구체적인지
  total: number
  feedback: string
  matchedPatterns: string[]
  missedPatterns: string[]
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function ago(days: number, hour: number, minute = 0): string {
  const d = subDays(new Date(), days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

/**
 * 특정 요일의 가장 최근 날짜를 반환 (요일 기반 세션 생성용)
 * @param dow 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
 * @param weeksAgo 0=이번 주, 1=저번 주
 * @param hour 시작 시각
 */
function lastDow(dow: number, weeksAgo: number, hour: number): string {
  const today = new Date()
  const currentDow = today.getDay()
  let daysBack = (currentDow - dow + 7) % 7
  // 오늘이 해당 요일이면 0 (오늘), 아니면 지난 해당 요일
  daysBack += weeksAgo * 7
  const d = subDays(today, daysBack)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

// ─── Personas ──────────────────────────────────────────────────────────────────

const PERSONAS: Persona[] = [
  {
    id: '아침형개발자',
    name: '아침형 개발자',
    description:
      '오전 9-11시 코딩 태스크는 100% 완주. 오후 세션은 거의 중단. ' +
      '문서/기획 태스크는 시간대 불문 완주율 낮음.',
    mustMentionPatterns: [
      '오전(9-11시) 코딩 태스크 완주율이 높음',
      '오후 시간대 중단율이 높음',
      '태스크 유형(코딩 vs 문서/기획)과 완주율의 상관관계',
    ],
    banPatterns: ['오전에 집중이 많아요', '생산적 요일은 월요일'],
    sessions: [
      // 오전 코딩 — 전부 완료
      { started_at: ago(1, 9), duration_minutes: 50, status: 'completed', task_name: '기능 구현' },
      { started_at: ago(1, 10), duration_minutes: 25, status: 'completed', task_name: '기능 구현' },
      { started_at: ago(2, 9), duration_minutes: 50, status: 'completed', task_name: '버그 수정' },
      { started_at: ago(2, 10), duration_minutes: 25, status: 'completed', task_name: '버그 수정' },
      { started_at: ago(3, 9), duration_minutes: 50, status: 'completed', task_name: '기능 구현' },
      { started_at: ago(4, 9), duration_minutes: 50, status: 'completed', task_name: '코드 리뷰' },
      { started_at: ago(5, 10), duration_minutes: 25, status: 'completed', task_name: '기능 구현' },
      { started_at: ago(6, 9), duration_minutes: 50, status: 'completed', task_name: '기능 구현' },
      { started_at: ago(7, 10), duration_minutes: 25, status: 'completed', task_name: '코드 리뷰' },
      { started_at: ago(8, 9), duration_minutes: 50, status: 'completed', task_name: '버그 수정' },
      // 오후 세션 — 전부 중단
      {
        started_at: ago(1, 14),
        duration_minutes: 25,
        status: 'interrupted',
        task_name: '문서 작성',
      },
      {
        started_at: ago(2, 15),
        duration_minutes: 25,
        status: 'interrupted',
        task_name: '업무 기획',
      },
      {
        started_at: ago(3, 14),
        duration_minutes: 25,
        status: 'interrupted',
        task_name: '문서 작성',
      },
      {
        started_at: ago(5, 15),
        duration_minutes: 25,
        status: 'interrupted',
        task_name: '업무 기획',
      },
      {
        started_at: ago(7, 14),
        duration_minutes: 25,
        status: 'interrupted',
        task_name: '문서 작성',
      },
      // 문서/기획은 오전에도 중단
      {
        started_at: ago(4, 10),
        duration_minutes: 25,
        status: 'interrupted',
        task_name: '업무 기획',
      },
      {
        started_at: ago(8, 9),
        duration_minutes: 25,
        status: 'interrupted',
        task_name: '문서 작성',
      },
    ],
  },

  {
    id: '야행성학생',
    name: '야행성 학생',
    description:
      '밤 22-23시에 집중력 피크. 25분 세션은 잘 완주하지만 50분 세션은 자주 중단. ' +
      '알고리즘/스터디 태스크 특화, 사이드 프로젝트는 50분 넘어가면 중단.',
    mustMentionPatterns: [
      '밤 22-23시 세션 완주율이 낮 시간대보다 높음',
      '50분 세션 중단율이 25분 세션보다 현저히 높음',
      '사이드 프로젝트 50분 세션 = 거의 중단, 스터디 25분 = 거의 완료',
    ],
    banPatterns: ['저녁에 집중을 많이 해요', '알고리즘 스터디를 자주 해요'],
    sessions: [
      // 밤 25분 — 완료
      {
        started_at: ago(1, 22),
        duration_minutes: 25,
        status: 'completed',
        task_name: '알고리즘 스터디',
      },
      {
        started_at: ago(1, 23),
        duration_minutes: 25,
        status: 'completed',
        task_name: '알고리즘 스터디',
      },
      { started_at: ago(2, 22), duration_minutes: 25, status: 'completed', task_name: '영어 공부' },
      {
        started_at: ago(3, 23),
        duration_minutes: 25,
        status: 'completed',
        task_name: '알고리즘 스터디',
      },
      {
        started_at: ago(4, 22),
        duration_minutes: 25,
        status: 'completed',
        task_name: '알고리즘 스터디',
      },
      { started_at: ago(5, 22), duration_minutes: 25, status: 'completed', task_name: '독서' },
      {
        started_at: ago(6, 23),
        duration_minutes: 25,
        status: 'completed',
        task_name: '알고리즘 스터디',
      },
      { started_at: ago(7, 22), duration_minutes: 25, status: 'completed', task_name: '영어 공부' },
      // 밤 50분 사이드 프로젝트 — 중단
      {
        started_at: ago(2, 22),
        duration_minutes: 50,
        status: 'interrupted',
        task_name: '사이드 프로젝트',
      },
      {
        started_at: ago(4, 23),
        duration_minutes: 50,
        status: 'interrupted',
        task_name: '사이드 프로젝트',
      },
      {
        started_at: ago(6, 22),
        duration_minutes: 50,
        status: 'interrupted',
        task_name: '사이드 프로젝트',
      },
      {
        started_at: ago(8, 23),
        duration_minutes: 50,
        status: 'interrupted',
        task_name: '사이드 프로젝트',
      },
      // 낮 시간 — 완주율 낮음
      {
        started_at: ago(1, 14),
        duration_minutes: 25,
        status: 'interrupted',
        task_name: '알고리즘 스터디',
      },
      {
        started_at: ago(3, 15),
        duration_minutes: 25,
        status: 'interrupted',
        task_name: '사이드 프로젝트',
      },
      { started_at: ago(5, 13), duration_minutes: 25, status: 'completed', task_name: '영어 공부' },
    ],
  },

  {
    id: '주말단절형',
    name: '주말 단절형',
    description:
      '주중(월-금)은 꾸준히 집중하지만 주말에 완전히 끊김. ' +
      '월/화는 50분 세션 완주, 목/금은 짧고 중단이 잦음.',
    mustMentionPatterns: [
      '주말(토/일) 세션이 없어 매주 스트릭이 리셋됨',
      '월/화의 세션 길이·완주율이 목/금보다 높음',
      '주 초반 집중 → 주 후반 피로 패턴',
    ],
    banPatterns: ['월요일 생산성이 가장 높아요'],
    sessions: [
      // 이번 주 월~금 (lastDow: 1=월 2=화 3=수 4=목 5=금, 토/일 없음)
      {
        started_at: lastDow(1, 0, 9),
        duration_minutes: 50,
        status: 'completed',
        task_name: '기능 구현',
      },
      {
        started_at: lastDow(1, 0, 10),
        duration_minutes: 50,
        status: 'completed',
        task_name: '코드 리뷰',
      },
      {
        started_at: lastDow(2, 0, 9),
        duration_minutes: 50,
        status: 'completed',
        task_name: '버그 수정',
      },
      {
        started_at: lastDow(2, 0, 10),
        duration_minutes: 50,
        status: 'completed',
        task_name: '버그 수정',
      },
      {
        started_at: lastDow(3, 0, 10),
        duration_minutes: 25,
        status: 'completed',
        task_name: '문서 작성',
      },
      {
        started_at: lastDow(4, 0, 14),
        duration_minutes: 25,
        status: 'interrupted',
        task_name: '업무 기획',
      },
      {
        started_at: lastDow(4, 0, 15),
        duration_minutes: 25,
        status: 'interrupted',
        task_name: '업무 기획',
      },
      {
        started_at: lastDow(5, 0, 16),
        duration_minutes: 25,
        status: 'interrupted',
        task_name: '사이드 프로젝트',
      },
      // 토/일 공백 (의도적으로 세션 없음)
      // 저번 주 월~금
      {
        started_at: lastDow(1, 1, 9),
        duration_minutes: 50,
        status: 'completed',
        task_name: '아키텍처 설계',
      },
      {
        started_at: lastDow(1, 1, 10),
        duration_minutes: 50,
        status: 'completed',
        task_name: '아키텍처 설계',
      },
      {
        started_at: lastDow(2, 1, 9),
        duration_minutes: 50,
        status: 'completed',
        task_name: '기능 구현',
      },
      {
        started_at: lastDow(2, 1, 10),
        duration_minutes: 50,
        status: 'completed',
        task_name: '기능 구현',
      },
      {
        started_at: lastDow(3, 1, 10),
        duration_minutes: 25,
        status: 'completed',
        task_name: '테스트 작성',
      },
      {
        started_at: lastDow(4, 1, 15),
        duration_minutes: 25,
        status: 'interrupted',
        task_name: '문서 작성',
      },
      {
        started_at: lastDow(5, 1, 16),
        duration_minutes: 25,
        status: 'interrupted',
        task_name: '업무 기획',
      },
      {
        started_at: lastDow(5, 1, 17),
        duration_minutes: 25,
        status: 'interrupted',
        task_name: '업무 기획',
      },
    ],
  },

  {
    id: '교대근무자',
    name: '업무 시간이 불규칙한 3교대 간호사',
    description:
      '주간(7-15시), 저녁(15-23시), 야간(23-7시) 근무가 불규칙하게 바뀜. ' +
      '비번 날 새벽이나 심야에 갑자기 긴 집중 세션이 나오고, ' +
      '근무 직후에는 아무리 짧은 세션도 중단됨.',
    mustMentionPatterns: [
      '근무 직후 시간대(근무 종료 1-2시간 이내) 세션 중단율이 매우 높음',
      '비번날 새벽/심야 세션의 완주율이 오히려 높음',
      '세션이 불규칙한 시간대에 분산되어 있어 특정 "최적 시간대"가 없음',
    ],
    banPatterns: ['오전에 집중이 많아요', '특정 요일 생산성이 높아요'],
    sessions: [
      // 비번날 새벽 — 완료 (주간 근무 후 충분히 쉬고 나서)
      { started_at: ago(1, 2), duration_minutes: 50, status: 'completed', task_name: '논문 읽기' },
      { started_at: ago(1, 3), duration_minutes: 50, status: 'completed', task_name: '논문 읽기' },
      { started_at: ago(4, 1), duration_minutes: 50, status: 'completed', task_name: '공부 정리' },
      { started_at: ago(4, 2), duration_minutes: 25, status: 'completed', task_name: '공부 정리' },
      { started_at: ago(8, 0), duration_minutes: 50, status: 'completed', task_name: '독서' },
      { started_at: ago(11, 2), duration_minutes: 50, status: 'completed', task_name: '논문 읽기' },
      // 비번날 오후 — 비교적 완료
      { started_at: ago(4, 14), duration_minutes: 25, status: 'completed', task_name: '공부 정리' },
      { started_at: ago(8, 15), duration_minutes: 25, status: 'completed', task_name: '독서' },
      {
        started_at: ago(15, 13),
        duration_minutes: 50,
        status: 'completed',
        task_name: '논문 읽기',
      },
      // 주간 근무(7-15시) 직후 — 거의 중단
      {
        started_at: ago(2, 16),
        duration_minutes: 25,
        status: 'interrupted',
        task_name: '공부 정리',
      },
      {
        started_at: ago(5, 15),
        duration_minutes: 25,
        status: 'interrupted',
        task_name: '논문 읽기',
      },
      {
        started_at: ago(9, 16),
        duration_minutes: 25,
        status: 'interrupted',
        task_name: '공부 정리',
      },
      { started_at: ago(12, 15), duration_minutes: 25, status: 'interrupted', task_name: '독서' },
      // 야간 근무(23-7시) 직후 — 거의 중단
      {
        started_at: ago(3, 8),
        duration_minutes: 25,
        status: 'interrupted',
        task_name: '논문 읽기',
      },
      {
        started_at: ago(6, 9),
        duration_minutes: 25,
        status: 'interrupted',
        task_name: '공부 정리',
      },
      { started_at: ago(10, 8), duration_minutes: 25, status: 'interrupted', task_name: '독서' },
      // 저녁 근무(15-23시) 전 오전 — 간간이 완료
      { started_at: ago(7, 10), duration_minutes: 25, status: 'completed', task_name: '공부 정리' },
      {
        started_at: ago(13, 11),
        duration_minutes: 25,
        status: 'completed',
        task_name: '논문 읽기',
      },
      { started_at: ago(14, 10), duration_minutes: 25, status: 'interrupted', task_name: '독서' },
    ],
  },
]

// ─── Stats Context Builder (route.ts 로직 동일) ────────────────────────────────

function buildStatsContext(sessions: Session[]): string {
  const completed = sessions.filter((s) => s.status === 'completed')
  const totalMinutes = completed.reduce((sum, s) => sum + s.duration_minutes, 0)
  const avgDuration = completed.length > 0 ? Math.round(totalMinutes / completed.length) : 0

  const timeBlocks = { 오전: 0, 오후: 0, 저녁: 0 }
  const hourlyInterruptMap: Record<number, number> = {}

  for (const s of sessions) {
    const h = getHours(new Date(s.started_at))
    if (s.status === 'completed') {
      if (h >= 6 && h < 12) timeBlocks.오전 += s.duration_minutes
      else if (h >= 12 && h < 18) timeBlocks.오후 += s.duration_minutes
      else timeBlocks.저녁 += s.duration_minutes
    } else if (s.status === 'interrupted') {
      hourlyInterruptMap[h] = (hourlyInterruptMap[h] ?? 0) + 1
    }
  }

  const worstHour = Object.entries(hourlyInterruptMap).sort((a, b) => b[1] - a[1])[0]

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

  const activeDates = new Set(completed.map((s) => format(new Date(s.started_at), 'yyyy-MM-dd')))
  const activeDaysCount = activeDates.size
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 30; i++) {
    const d = format(subDays(today, i), 'yyyy-MM-dd')
    if (activeDates.has(d)) streak++
    else break
  }

  const interruptedCount = sessions.filter((s) => s.status === 'interrupted').length
  const interruptRate =
    sessions.length > 0 ? Math.round((interruptedCount / sessions.length) * 100) : 0
  const weeklyAvg = Math.round(completed.length / Math.max(activeDaysCount / 7, 1))

  const dayShortMap: Record<string, string> = {
    Monday: '월',
    Tuesday: '화',
    Wednesday: '수',
    Thursday: '목',
    Friday: '금',
    Saturday: '토',
    Sunday: '일',
  }

  // 최근 14일 달력 뷰 (세션 없는 날 포함)
  const twoWeeksAgo = subDays(today, 14)
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

  const recentSessions = sessions
    .filter((s) => new Date(s.started_at) >= twoWeeksAgo)
    .map((s) => {
      const d = new Date(s.started_at)
      const dow = dayShortMap[format(d, 'EEEE')] ?? ''
      return `${format(d, 'MM/dd')}(${dow}) ${getHours(d)}시 | ${s.task_name ?? '(이름 없음)'} | ${s.duration_minutes}분 | ${s.status === 'completed' ? '완료' : '중단'}`
    })
    .join('\n')

  return `
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
}

// ─── AI Insights Call (route.ts 프롬프트 동일) ─────────────────────────────────

async function generateInsights(openai: OpenAI, statsContext: string): Promise<InsightResult[]> {
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

## 각 content 작성 방식
- **문장은 짧게. 한 문장에 하나의 사실만.**
- **한 인사이트당 반드시 3~5문장. 150~250자. 2문장 이하면 실패.**
- 첫 문장: 발견한 패턴을 수치와 함께 한 줄로 (두 변수 이상)
- 둘째 문장: 그게 왜 의미있는지 한 줄로
- 셋째 문장: 반례 또는 조건 한 줄로 (언제 이 패턴이 성립하고 언제 안 되는지)
- recommendation 마지막 문장: 내일 구체적 행동 (시간 + 태스크명)

## title 작성 방식
- 10자 이내, 명사형 또는 짧은 서술형
- 핵심 발견을 압축

## 절대 쓰지 말 것
- "~네요", "~해요", "~거예요" 같은 부드러운 어미 → "~다", "~임", "~됨"으로
- "열심히", "꾸준히", "응원", "격려" 등 감정적 표현
- 단일 집계 수치만 읽어주는 관찰

응답 형식: JSON 객체 { "insights": [ { "type": "...", "title": "10자 이내 제목", "content": "200~300자" } ] }`,
      },
      {
        role: 'user',
        content: `${statsContext}\n\n위 데이터로 인사이트 3개를 작성해 주세요. pattern_analysis → recommendation → daily_summary 순서를 반드시 지켜주세요. 각 content는 짧고 명확하게, 문장마다 끊어서 작성해 주세요.`,
      },
    ],
    response_format: { type: 'json_object' },
    max_completion_tokens: 1800,
    temperature: 0.6,
  })

  const usage = completion.usage
  if (usage) {
    console.log(
      `  [토큰] 입력: ${usage.prompt_tokens}, 출력: ${usage.completion_tokens}, 합계: ${usage.total_tokens}`,
    )
  }
  const raw = completion.choices[0].message.content ?? '{}'
  const parsed = JSON.parse(raw)
  return Array.isArray(parsed) ? parsed : (parsed.insights ?? parsed.items ?? [])
}

// ─── Rule-Based Judge ──────────────────────────────────────────────────────────
// LLM이 자기 자신을 채점하면 점수가 관대해지는 문제가 있어 규칙 기반으로 대체.

function judgeInsights(
  persona: Persona,
  sessions: Session[],
  insights: InsightResult[],
): JudgeScore {
  const allContent = insights.map((i) => i.content).join('\n')
  const recommendation = insights.find((i) => i.type === 'recommendation')?.content ?? ''

  // ── 1. 교차 분석 (0-10) ───────────────────────────────────────────────────────
  // 태스크명 × 시간대, 세션길이 × 완주율, 시간대 × 중단율 등 2개 변수가 같은 문장에 등장하는지 확인
  const taskNames = [...new Set(sessions.map((s) => s.task_name).filter(Boolean))] as string[]
  const timeKeywords = ['시', '오전', '오후', '저녁', '새벽', '밤']
  const completionKeywords = ['완료', '완주', '중단', '성공', '실패']
  const lengthKeywords = ['25분', '50분', '분 세션', '짧은', '긴']

  let crossVarScore = 0
  for (const sentence of allContent.split(/[.。\n]/)) {
    const hasTask = taskNames.some((t) => sentence.includes(t))
    const hasTime = timeKeywords.some((k) => sentence.includes(k))
    const hasCompletion = completionKeywords.some((k) => sentence.includes(k))
    const hasLength = lengthKeywords.some((k) => sentence.includes(k))

    if (hasTask && hasTime) crossVarScore += 3 // 태스크 × 시간 교차
    if (hasTask && hasCompletion) crossVarScore += 2 // 태스크 × 완주
    if (hasLength && hasCompletion) crossVarScore += 3 // 길이 × 완주
    if (hasTime && hasCompletion) crossVarScore += 2 // 시간 × 완주
  }
  const crossVariableAnalysis = Math.min(10, crossVarScore)

  // ── 2. 데이터 정확도 (0-10) ───────────────────────────────────────────────────
  // 데이터에서 도출 가능한 모든 숫자를 화이트리스트로 미리 계산
  const completed = sessions.filter((s) => s.status === 'completed')
  const interrupted = sessions.filter((s) => s.status === 'interrupted')
  const interruptRate = Math.round((interrupted.length / sessions.length) * 100)

  const validNums = new Set<number>()
  // 전체 카운트
  validNums.add(sessions.length)
  validNums.add(completed.length)
  validNums.add(interrupted.length)
  validNums.add(interruptRate)
  // 세션 길이
  sessions.forEach((s) => validNums.add(s.duration_minutes))
  // 시간대 (시각 값)
  sessions.forEach((s) => validNums.add(getHours(new Date(s.started_at))))
  // 태스크별 완료/중단 수
  const taskCounts: Record<string, { c: number; i: number }> = {}
  sessions.forEach((s) => {
    const k = s.task_name ?? '(이름 없음)'
    if (!taskCounts[k]) taskCounts[k] = { c: 0, i: 0 }
    if (s.status === 'completed') taskCounts[k].c++
    else taskCounts[k].i++
  })
  Object.values(taskCounts).forEach(({ c, i }) => {
    validNums.add(c)
    validNums.add(i)
    validNums.add(c + i)
    if (c + i > 0) validNums.add(Math.round((c / (c + i)) * 100))
  })
  // 시간대별 완료/중단 수
  const hourCounts: Record<number, { c: number; i: number }> = {}
  sessions.forEach((s) => {
    const h = getHours(new Date(s.started_at))
    if (!hourCounts[h]) hourCounts[h] = { c: 0, i: 0 }
    if (s.status === 'completed') hourCounts[h].c++
    else hourCounts[h].i++
  })
  Object.values(hourCounts).forEach(({ c, i }) => {
    validNums.add(c)
    validNums.add(i)
    validNums.add(c + i)
  })

  // content 에서 숫자 추출 후 화이트리스트 대조
  const rawNums = (allContent.match(/\d+/g) ?? []).map(Number)
  const smallNums = new Set([1, 2, 3, 4, 5]) // 너무 흔한 숫자는 판단 제외
  const validHits = rawNums.filter((n) => validNums.has(n)).length
  const invalidHits = rawNums.filter((n) => !validNums.has(n) && !smallNums.has(n)).length

  // 정확한 수치 인용 +1, 없는 수치 지어내면 -2
  const accuracy = Math.min(10, Math.max(0, 5 + validHits - invalidHits * 2))

  // ── 3. 비자명성 (0-10) ────────────────────────────────────────────────────────
  // mustMentionPatterns 키워드가 실제로 언급됐는지 + 뻔한 표현 페널티
  const matchedPatterns: string[] = []
  const missedPatterns: string[] = []

  for (const pattern of persona.mustMentionPatterns) {
    // 패턴에서 핵심 명사/수치 추출 (첫 10자 기준 포함 여부로 판단)
    const keywords = pattern.split(/[,·×\s]+/).filter((w) => w.length >= 2)
    const matched = keywords.some((kw) => allContent.includes(kw))
    if (matched) matchedPatterns.push(pattern)
    else missedPatterns.push(pattern)
  }

  const banPenalty = persona.banPatterns.filter((b) => allContent.includes(b)).length
  const patternScore = (matchedPatterns.length / persona.mustMentionPatterns.length) * 10
  const nonObviousness = Math.min(10, Math.max(0, Math.round(patternScore - banPenalty * 2)))

  // ── 4. 실행 가능성 (0-10) ─────────────────────────────────────────────────────
  // recommendation에 구체적 시간(N시) + 태스크명이 함께 등장하는지
  const hasSpecificTime = /\d+시/.test(recommendation)
  const hasTaskName = taskNames.some((t) => recommendation.includes(t))
  // 청유형(~보세요/~하세요)과 명령형(~하라/~해라/~말고 등) 모두 인정
  const hasAction = [
    '보세요',
    '하세요',
    '마세요',
    '두세요',
    '잡으세요',
    '써보세요',
    '하라',
    '해라',
    '말고',
    '배치해',
    '시작해',
    '넣어',
    '고정해',
    '잡아',
  ].some((v) => recommendation.includes(v))

  let actionability = 0
  if (hasSpecificTime) actionability += 4
  if (hasTaskName) actionability += 3
  if (hasAction) actionability += 3

  // ── 5. 길이 보너스/페널티 ─────────────────────────────────────────────────────
  const contentLengths = insights.map((i) => [...i.content].length)
  const shortCount = contentLengths.filter((l) => l < 150).length

  // 최종 점수 (길이 미달 시 총점에서 감점)
  const rawTotal = (crossVariableAnalysis + accuracy + nonObviousness + actionability) / 4
  const total = Math.max(0, Math.round(rawTotal - shortCount * 0.5))

  // ── 피드백 생성 ──────────────────────────────────────────────────────────────
  const feedbackParts: string[] = []
  if (crossVariableAnalysis >= 7) feedbackParts.push('교차 분석 양호')
  else feedbackParts.push('교차 분석 부족 — 단일 변수 관찰에 그침')
  if (missedPatterns.length > 0) feedbackParts.push(`놓친 핵심 패턴 ${missedPatterns.length}개`)
  if (shortCount > 0) feedbackParts.push(`${shortCount}개 인사이트가 150자 미달`)
  if (invalidHits > 0) feedbackParts.push(`데이터에 없는 수치 ${invalidHits}개 발견`)
  if (banPenalty > 0) feedbackParts.push(`금지 표현 ${banPenalty}개 사용`)

  const feedback =
    feedbackParts.length === 0 ? '전반적으로 기준을 충족함' : feedbackParts.join(' / ')

  return {
    crossVariableAnalysis,
    accuracy,
    nonObviousness,
    actionability,
    total,
    feedback,
    matchedPatterns,
    missedPatterns,
  }
}

// ─── Report Printer ─────────────────────────────────────────────────────────────

function printReport(persona: Persona, insights: InsightResult[], score: JudgeScore) {
  const bar = (n: number) => '█'.repeat(n) + '░'.repeat(10 - n)
  const WIDE = '═'.repeat(60)
  const THIN = '─'.repeat(60)

  const TYPE_LABEL: Record<string, string> = {
    pattern_analysis: '📊 패턴 분석',
    recommendation: '💡 추천',
    daily_summary: '📅 요약',
  }

  // wrap text by word (space) boundaries to fit within given width
  function wrap(text: string, width = 54, indent = '  '): string {
    const tokens = text.split(' ')
    const lines: string[] = []
    let line = ''
    for (const token of tokens) {
      const candidate = line ? line + ' ' + token : token
      if ([...candidate].length > width && line) {
        lines.push(indent + line)
        line = token
      } else {
        line = candidate
      }
    }
    if (line) lines.push(indent + line)
    return lines.join('\n')
  }

  console.log(`\n${WIDE}`)
  console.log(`  페르소나: ${persona.name}`)
  console.log(`  ${persona.description}`)
  console.log(WIDE)

  for (const insight of insights) {
    const label = TYPE_LABEL[insight.type] ?? insight.type
    const charCount = [...insight.content].length
    console.log(`\n┌─ ${label}  ·  ${insight.title}`)
    console.log(`│`)
    console.log(wrap(insight.content).replace(/^/gm, '│'))
    console.log(`│`)
    console.log(`└─ ${charCount}자`)
  }

  console.log(`\n\n🏆 품질 채점\n${THIN}`)
  console.log(`교차 분석    ${bar(score.crossVariableAnalysis)} ${score.crossVariableAnalysis}/10`)
  console.log(`데이터 정확도 ${bar(score.accuracy)} ${score.accuracy}/10`)
  console.log(`비자명성     ${bar(score.nonObviousness)} ${score.nonObviousness}/10`)
  console.log(`실행 가능성  ${bar(score.actionability)} ${score.actionability}/10`)
  console.log(`${'─'.repeat(40)}`)
  console.log(`총점         ${bar(score.total)} ${score.total}/10`)

  if (score.matchedPatterns?.length) {
    console.log('\n✅ 발견한 패턴:')
    score.matchedPatterns.forEach((p) => console.log(`   • ${p}`))
  }
  if (score.missedPatterns?.length) {
    console.log('\n❌ 놓친 패턴:')
    score.missedPatterns.forEach((p) => console.log(`   • ${p}`))
  }

  console.log('\n💬 심사 피드백:')
  console.log(`   ${score.feedback}`)
}

// ─── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  // CLI 인수 전체를 합쳐서 검색 (공백 포함 이름 지원)
  const query = process.argv.slice(2).join(' ').trim()
  const targets = query
    ? PERSONAS.filter((p) => p.id === query || p.name.includes(query) || p.id.includes(query))
    : PERSONAS

  if (targets.length === 0) {
    console.error(`페르소나를 찾을 수 없습니다: "${query}"`)
    console.error(`사용 가능:`)
    PERSONAS.forEach((p) => console.error(`  - ${p.id}  (${p.name})`))
    process.exit(1)
  }

  console.log(`\n🔍 AI 인사이트 품질 테스터`)
  console.log(`대상 페르소나: ${targets.map((p) => p.name).join(', ')}`)
  console.log(`모델: gpt-5.4-mini (생성) + 규칙 기반 채점\n`)

  const summaries: { name: string; total: number }[] = []

  for (const persona of targets) {
    process.stdout.write(`\n⏳ ${persona.name} 분석 중...`)

    const statsContext = buildStatsContext(persona.sessions)
    const insights = await generateInsights(openai, statsContext)

    process.stdout.write(' 채점 중...')
    const score = judgeInsights(persona, persona.sessions, insights)

    process.stdout.write(' 완료\n')
    printReport(persona, insights, score)
    summaries.push({ name: persona.name, total: score.total })
  }

  if (summaries.length > 1) {
    console.log(`\n\n${'═'.repeat(60)}`)
    console.log('  전체 요약')
    console.log('═'.repeat(60))
    for (const s of summaries) {
      const grade = s.total >= 8 ? '🟢' : s.total >= 6 ? '🟡' : '🔴'
      console.log(`  ${grade} ${s.name.padEnd(16)} ${s.total}/10`)
    }
    const avg = Math.round(summaries.reduce((a, b) => a + b.total, 0) / summaries.length)
    console.log(`\n  평균 점수: ${avg}/10`)
  }

  console.log()
}

main().catch(console.error)
