# AI 코칭 품질 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AI 인사이트의 환각·반말·형식 문제를 시스템 프롬프트 강화 + UI 렌더링 수정으로 해결한다.

**Architecture:** 시스템 프롬프트를 모듈 상수로 추출·수정해 데이터 그라운딩·존댓말·`\n` 형식을 강제하고, `InsightContent` 컴포넌트에 한국어 문장 단위 fallback 분리를 추가한다. 프롬프트 변경은 LLM 행동을 제어하고, UI 변경은 LLM이 지시를 따르지 않을 때의 방어선이다.

**Tech Stack:** Next.js 16 App Router, OpenAI Chat Completions API, React, Vitest, @testing-library/react

---

## File Map

| 파일                                     | 변경 유형 | 담당                                                    |
| ---------------------------------------- | --------- | ------------------------------------------------------- |
| `src/app/api/ai/insights/route.ts`       | Modify    | `systemPrompt` 상수 추출·export, 프롬프트 3개 블록 수정 |
| `src/app/api/ai/insights/prompt.test.ts` | Create    | systemPrompt 계약 테스트                                |
| `src/components/ai/AICoachCard.tsx`      | Modify    | `InsightContent` export + fallback 로직 추가            |
| `src/components/ai/AICoachCard.test.tsx` | Modify    | 실제 컴포넌트에서 import + fallback 테스트 추가         |

---

### Task 0: 하네스 준비

- [ ] **Step 1: start-task.sh 실행**

```bash
bash scripts/start-task.sh improve-ai-coaching-quality feat
```

Expected:

```
✅ Task 준비 완료
  - branch:    feat/improve-ai-coaching-quality
  - worktree:  .worktrees/improve-ai-coaching-quality
  - exec-plan: docs/exec-plans/active/improve-ai-coaching-quality.md
```

- [ ] **Step 2: exec-plan 채우기**

`docs/exec-plans/active/improve-ai-coaching-quality.md`의 스켈레톤을 아래 내용으로 채운다.

```markdown
## Goal

AI 인사이트의 환각·반말·형식 3가지 문제를 프롬프트 강화 + UI 렌더링 수정으로 해결한다.

## Approach

- systemPrompt를 모듈 상수로 추출해 테스트 가능하게 하고, 데이터 그라운딩·존댓말·\n 형식 강제 규칙 추가
- InsightContent에 한국어 문장 끝 기준 fallback 분리 추가

## Sub-tasks

1. InsightContent fallback 추가 (TDD)
2. 시스템 프롬프트 개선 (TDD)

## Completion Criteria

- [ ] pattern_analysis에서 세션 로그에 없는 수치가 나오지 않음
- [ ] 모든 인사이트 어미가 ~습니다/합니다 계열
- [ ] \n 없는 응답도 UI에서 문장 단위로 분리 렌더링
- [ ] bash scripts/verify-task.sh 녹색

## Affected Files (expected)

- src/app/api/ai/insights/route.ts
- src/app/api/ai/insights/prompt.test.ts
- src/components/ai/AICoachCard.tsx
- src/components/ai/AICoachCard.test.tsx

## Open Questions

없음
```

- [ ] **Step 3: worktree로 이동**

```bash
cd .worktrees/improve-ai-coaching-quality
```

---

### Task 1: InsightContent UI 수정 (TDD)

**Files:**

- Modify: `src/components/ai/AICoachCard.tsx` — `InsightContent` 함수에 `export` 추가 + fallback 로직
- Modify: `src/components/ai/AICoachCard.test.tsx` — 실제 컴포넌트에서 import + fallback 테스트 추가

현재 `AICoachCard.test.tsx`는 `InsightContent`를 파일 안에서 별도로 재정의해 테스트한다 (실제 컴포넌트가 아닌 복사본을 테스트). 이번 작업에서 실제 컴포넌트를 import 하도록 수정한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/ai/AICoachCard.test.tsx` 전체를 아래로 교체한다:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { InsightContent } from './AICoachCard'

describe('InsightContent', () => {
  it('단일 단락: \\n 없으면 <p> 하나로 렌더링', () => {
    render(<InsightContent content="집중 패턴이 발견되었습니다. 오전에 더 집중이 잘 됩니다." />)
    expect(screen.getByText('집중 패턴이 발견되었습니다. 오전에 더 집중이 잘 됩니다.')).toBeTruthy()
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('멀티라인: \\n으로 구분된 문장은 bullet list로 렌더링', () => {
    const content = '첫 번째 문장입니다.\n두 번째 문장입니다.\n세 번째 문장입니다.'
    render(<InsightContent content={content} />)
    expect(screen.getByRole('list')).toBeTruthy()
    expect(screen.getByText('첫 번째 문장입니다.')).toBeTruthy()
    expect(screen.getByText('두 번째 문장입니다.')).toBeTruthy()
    expect(screen.getByText('세 번째 문장입니다.')).toBeTruthy()
  })

  it('빈 줄은 필터링해 bullet 항목에서 제외', () => {
    const content = '첫 문장입니다.\n\n두 번째 문장입니다.'
    render(<InsightContent content={content} />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
  })

  it('\\n 없이 다중 문장(다. 끝): fallback으로 bullet list 렌더링', () => {
    const content =
      '오전 9–11시 완주율이 91%입니다. 오후 배치 시 57%로 떨어집니다. 4월 10일이 예외였습니다.'
    render(<InsightContent content={content} />)
    expect(screen.getByRole('list')).toBeTruthy()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('단일 짧은 문장: list 없이 <p>로 표시', () => {
    render(<InsightContent content="단일 문장입니다." />)
    expect(screen.queryByRole('list')).toBeNull()
    expect(screen.getByText('단일 문장입니다.')).toBeTruthy()
  })
})
```

- [ ] **Step 2: 테스트 실행 → FAIL 확인**

```bash
npm run test -- AICoachCard --run
```

Expected: FAIL — `InsightContent` is not exported from `./AICoachCard`

- [ ] **Step 3: InsightContent 수정 + export 추가**

`src/components/ai/AICoachCard.tsx`의 `InsightContent` 함수(18~33행)를 아래로 교체한다:

```tsx
export function InsightContent({ content }: { content: string }) {
  let lines = content.split('\n').filter((l) => l.trim().length > 0)
  if (lines.length <= 1) {
    lines = content
      .split(/(?<=다\.)(?=\s)/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
  }
  if (lines.length <= 1) {
    return <p className="text-xs leading-[1.75] text-foreground/80">{content}</p>
  }
  return (
    <ul className="space-y-1.5">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-2 text-xs leading-[1.75] text-foreground/80">
          <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 4: 테스트 실행 → PASS 확인**

```bash
npm run test -- AICoachCard --run
```

Expected: 5개 테스트 모두 PASS

- [ ] **Step 5: 커밋**

```bash
git add src/components/ai/AICoachCard.tsx src/components/ai/AICoachCard.test.tsx
git commit -m "feat(ai): InsightContent export + 한국어 문장 fallback 분리"
```

---

### Task 2: 시스템 프롬프트 개선 (TDD)

**Files:**

- Modify: `src/app/api/ai/insights/route.ts` — `systemPrompt` 상수 추출·export + 3개 블록 수정
- Create: `src/app/api/ai/insights/prompt.test.ts` — 프롬프트 계약 테스트

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/api/ai/insights/prompt.test.ts` 파일을 새로 생성한다:

```ts
import { describe, expect, it } from 'vitest'
import { systemPrompt } from './route'

describe('AI 시스템 프롬프트 계약', () => {
  it('존댓말 어미 규칙을 포함한다', () => {
    expect(systemPrompt).toContain('~습니다')
    expect(systemPrompt).toContain('~합니다')
  })

  it('반말 어미 규칙이 제거됐다', () => {
    // 기존 반말 어미 허용 규칙이 존재하면 안 됨
    expect(systemPrompt).not.toMatch(/"~다 \/ ~된다 \/ ~한다"/)
  })

  it('직접 명령형 금지 규칙을 포함한다', () => {
    expect(systemPrompt).toContain('직접 명령형')
    expect(systemPrompt).toContain('~해야 해')
  })

  it('데이터 근거 규칙을 포함한다', () => {
    expect(systemPrompt).toContain('데이터 근거 규칙')
    expect(systemPrompt).toContain('로그에 없는 수치를 만들어내지 않는다')
  })

  it('\\n 형식 강제 규칙을 포함한다', () => {
    expect(systemPrompt).toContain('문장마다 반드시')
  })
})
```

- [ ] **Step 2: 테스트 실행 → FAIL 확인**

```bash
npm run test -- prompt --run
```

Expected: FAIL — `systemPrompt` is not exported from `./route`

- [ ] **Step 3: route.ts에서 systemPrompt 상수 추출·export + 프롬프트 수정**

`src/app/api/ai/insights/route.ts` 파일 상단(`import` 다음 줄)에 아래 상수를 추가한다:

```ts
export const systemPrompt = `생산성 데이터를 10년 이상 분석한 전문가다. 수치만 근거로 삼고, 해석은 단정적으로 내린다. 감상이나 응원은 없다. 말은 짧게, 사실은 정확하게.

## 데이터 근거 규칙

content에서 인용하는 수치(%, 분, 회), 날짜(MM/DD), 시간대는
반드시 위에 제공된 세션 로그 또는 통계 컨텍스트에 실제로 존재해야 한다.
로그에 없는 수치를 만들어내지 않는다.
패턴이 명확하지 않으면 가장 두드러진 단일 사실만 서술하고,
없는 교차 패턴을 억지로 만들지 않는다.

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

어미는 "~습니다 / ~합니다 / ~됩니다 / ~있습니다 / ~없습니다" 중 자연스러운 것을 고른다.
"~해요 / ~거예요 / ~네요"는 너무 가볍다. 금지.
"~습니다"체로 전문가가 데이터를 보고하듯 쓴다.

**좋은 예:**
- "오전 9–11시 코드 리뷰 완주율이 91%입니다. 같은 태스크를 오후에 배치하면 57%로 떨어집니다."
- "4월 10일 리팩터링 6세션이 전부 완료됐는데, 같은 날 다른 태스크는 절반도 못 끝냈습니다."
- "3일 연속 집중하면 첫 세션 시작 시각이 평균 40분 빨라집니다."

**나쁜 예:**
- "반례는 04/08 백엔드 API 연동..." → "반례는"이라는 구조 마커 사용 금지
- "첫째, 오전 완주율이 높습니다. 둘째, 오후는 낮습니다." → 번호·나열 금지
- "오전에 집중이 잘 되는 경향이 있는 것으로 보입니다." → 추측 어미 금지
- "내일 9시에 시작해야 해." → 직접 명령형 금지

## 절대 쓰지 말 것

구조 마커: "반례는", "첫째", "둘째", "셋째", "요약하자면", "정리하면"
추측 어미: "~한 경향이 있다", "~것으로 보인다", "~것을 알 수 있다"
연결어: "따라서", "그러므로", "이를 통해", "결과적으로", "이에 따라", "반대로", "반면", "한편"
감정어: "열심히", "꾸준히", "응원", "격려", "긍정적", "훌륭하다"
부드러운 어미: "~네요", "~해요", "~거예요"
직접 명령형: "~해야 해", "~하면 돼", "~해라", "~할 것", "~해봐"
번역체·복합명사: "완료력", "집중력이 강하게 작동", "흐름이 더 크게 갈린다" 같은 번역투 표현 — 한국인이 일상에서 쓰지 않는 한자어 조합 금지
어색한 결말: "~은 상태다", "~못한 상태다", "앞을 열어줬다", "흐름을 만들고" 같은 억지 비유·상태 서술 금지
어색한 동사 용법: "오전에 붙고", "세션이 붙었다", "연속 완료를 만들고" — "붙다/만들다"를 집중 패턴에 쓰는 것 금지

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
- 패턴이 성립하지 않는 날짜나 조건이 있으면 자연스럽게 언급한다 ("단, X일은 예외였습니다" 형태로, 구조 마커 없이).
- 패턴이 더 선명해지는 맥락이나 조건으로 마무리한다.
- recommendation의 마지막 문장: 내일 구체적 행동 (시각 + 태스크명 포함), 서술형으로 쓴다 ("내일 오전 9시에 코드 리뷰를 시작합니다." 형태).

문장마다 반드시 \\n으로 구분한다.

올바른 예:
"오전 9–11시 완주율이 91%입니다.\\n오후 배치 시 57%로 떨어집니다.\\n4월 10일이 유일한 예외였습니다."

틀린 예:
"오전 9–11시 완주율이 91%입니다. 오후 배치 시 57%로 떨어집니다."

응답 형식: JSON 객체 { "insights": [ { "type": "...", "title": "10자 이내", "summary": "30자 이내", "content": "\\n으로 구분된 4~6문장" } ] }`
```

그다음, `openai.chat.completions.create` 호출의 `messages` 배열에서 인라인 system content를 `systemPrompt` 상수로 교체한다:

변경 전:

```ts
messages: [
  {
    role: 'system',
    content: `생산성 데이터를 10년 이상 분석한 전문가다. ...`, // 기존 인라인 문자열
  },
```

변경 후:

```ts
messages: [
  {
    role: 'system',
    content: systemPrompt,
  },
```

- [ ] **Step 4: 테스트 실행 → PASS 확인**

```bash
npm run test -- prompt --run
```

Expected: 5개 테스트 모두 PASS

- [ ] **Step 5: 전체 테스트 실행**

```bash
npm run test -- --run
```

Expected: 모든 테스트 PASS (dev-bypass 7개 + AICoachCard 5개 + prompt 5개)

- [ ] **Step 6: 커밋**

```bash
git add src/app/api/ai/insights/route.ts src/app/api/ai/insights/prompt.test.ts
git commit -m "feat(ai): 시스템 프롬프트 존댓말·그라운딩·형식 강제 적용"
```

---

### Task 3: Verify + Complete

- [ ] **Step 1: 전체 검증 실행**

```bash
bash scripts/verify-task.sh
```

6개 검사(typecheck, eslint, prettier, dependency-cruiser, vitest, drift-detector) 모두 녹색 확인.
실패 시 `logs/improve-ai-coaching-quality/verify-report-*.txt` 확인 → 근본원인 수정 → 재실행.

- [ ] **Step 2: complete-task.sh 실행**

worktree 안(`cd .worktrees/improve-ai-coaching-quality`)이 아닌 **프로젝트 루트**에서 실행한다.

```bash
# 현재 위치 확인
pwd  # /Users/jaehyun/Documents/workspace/focusflow 이어야 함

bash scripts/complete-task.sh improve-ai-coaching-quality
```

Expected:

```
✅ improve-ai-coaching-quality 완료
  - feat/improve-ai-coaching-quality → develop 머지
  - exec-plan: active/ → completed/
  - worktree 제거
```
