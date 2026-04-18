---
name: AI 코칭 품질 개선
description: 환각·반말·형식 문제를 프롬프트 강화 + UI 렌더링 수정으로 해결
created: 2026-04-18
status: approved
---

# AI 코칭 품질 개선 — 설계 문서

## 문제 요약

| 문제                 | 원인                                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| 환각 (hallucination) | `pattern_analysis`에서 "비자명한 교차 패턴" 강요 → 데이터에 없는 수치·날짜 생성                      |
| 반말                 | 시스템 프롬프트 어미 규칙이 `~다` 계열 → recommendation에서 직접 명령형(`~해야 해`, `~하면 돼`) 출현 |
| 형식 (줄글)          | AI가 `\n` 없이 한 덩어리 출력 + UI fallback이 단일 `<p>` 렌더링                                      |

## 접근법: 프롬프트 강화 + UI 렌더링 수정

프롬프트만으로는 LLM 불이행을 완전히 막을 수 없으므로 두 레이어에서 동시 방어.

## 섹션 1: 프롬프트 개선 (`src/app/api/ai/insights/route.ts`)

### 1-A. 데이터 그라운딩 규칙 추가

시스템 프롬프트에 `## 데이터 근거 규칙` 블록 추가:

```
## 데이터 근거 규칙

content에서 인용하는 수치(%, 분, 회), 날짜(MM/DD), 시간대는
반드시 위에 제공된 세션 로그 또는 통계 컨텍스트에 실제로 존재해야 한다.
로그에 없는 수치를 만들어내지 않는다.
패턴이 명확하지 않으면 가장 두드러진 단일 사실만 서술하고,
없는 교차 패턴을 억지로 만들지 않는다.
```

### 1-B. 어미 규칙 → 전체 존댓말로 교체

기존: `어미는 "~다 / ~된다 / ~한다 / ~있다 / ~없다" 중 자연스러운 것을 고른다.`

교체:

```
어미는 "~습니다 / ~합니다 / ~됩니다 / ~있습니다 / ~없습니다" 중 자연스러운 것을 고른다.
"~해요 / ~거예요 / ~네요"는 너무 가볍다. 금지.
"~습니다"체로 전문가가 데이터를 보고하듯 쓴다.
```

좋은 예 / 나쁜 예도 존댓말로 업데이트:

- 좋은 예: `"오전 9–11시 코드 리뷰 완주율이 91%입니다. 같은 태스크를 오후에 배치하면 57%로 떨어집니다."`
- 나쁜 예: `"오전 9–11시 코드 리뷰 완주율 91%, 오후엔 57%로 떨어져요."`

"절대 쓰지 말 것" 목록에 추가:

```
직접 명령형: "~해야 해", "~하면 돼", "~해라", "~할 것", "~해봐"
```

### 1-C. 형식 강제 (`\n` 구분)

응답 형식 섹션에 추가:

```
문장마다 반드시 \n으로 구분한다.

올바른 예:
"오전 9–11시 완주율이 91%입니다.\n오후 배치 시 57%로 떨어집니다.\n4월 10일이 유일한 예외였습니다."

틀린 예:
"오전 9–11시 완주율이 91%입니다. 오후 배치 시 57%로 떨어집니다."
```

## 섹션 2: UI 렌더링 수정 (`src/components/ai/AICoachCard.tsx`)

### 현재 문제

`InsightContent` 컴포넌트가 `\n` 분리 후 1줄이면 단일 `<p>` fallback. AI가 `\n` 없이 응답하면 긴 문단으로 렌더링됨.

### 수정: 한국어 문장 끝 기준 fallback 분리

```tsx
function InsightContent({ content }: { content: string }) {
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

분리 순서:

1. `\n` 분리 시도
2. 1줄이면 한국어 문장 끝(`다.` / `됩니다.` / `합니다.`) 기준 재분리
3. 그래도 1줄이면 단일 `<p>`

## 영향 파일

- `src/app/api/ai/insights/route.ts` — 시스템 프롬프트 3개 블록 수정
- `src/components/ai/AICoachCard.tsx` — `InsightContent` 함수만 수정

## 완료 기준

- [ ] `pattern_analysis`에서 세션 로그에 없는 수치가 나오지 않음
- [ ] 모든 인사이트 어미가 `~습니다/합니다` 계열
- [ ] `~해야 해`, `~하면 돼` 어미 미출현
- [ ] `\n` 없는 응답도 UI에서 문장 단위로 분리 렌더링
- [ ] `bash scripts/verify-task.sh` 녹색

## Open Questions

없음
