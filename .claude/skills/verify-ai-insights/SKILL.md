---
name: verify-ai-insights
description: AI 인사이트 생성 규칙 검증 (모델명, rate limit, max_completion_tokens, 톤 마커, 인사이트 타입 순서). route.ts 또는 test script 수정 후 사용.
---

# AI 인사이트 생성 규칙 검증

## Purpose

1. **모델명 일치** — `route.ts`와 `test-insights-quality.ts`가 동일한 모델명(`gpt-5.4-mini`)을 사용하는지 확인
2. **rate limit 값 일치** — `DAILY_LIMIT = 3` 상수가 유지되는지 확인
3. **max_completion_tokens 일치** — `route.ts`와 test script 모두 2400 이상인지 확인
4. **인사이트 타입 순서** — `pattern_analysis → recommendation → daily_summary` 순서 강제가 프롬프트에 존재하는지 확인
5. **금지 어미 마커** — 프롬프트에 "~네요", "~해요" 금지 지시가 존재하는지 확인

## When to Run

- `src/app/api/ai/insights/route.ts` 수정 후 (모델명, 프롬프트, rate limit, 토큰 수 변경 시)
- `scripts/test-insights-quality.ts` 수정 후 (모델명, 토큰 수, 퀄리티 임계값 변경 시)
- AI 인사이트 기능의 요금 계획 조정 시 (rate limit 변경)
- 프롬프트 톤/길이 요구사항 변경 시

## Related Files

| File                                | Purpose                                                        |
| ----------------------------------- | -------------------------------------------------------------- |
| `src/app/api/ai/insights/route.ts`  | AI 인사이트 생성 API (모델명, rate limit, 프롬프트, 토큰 설정) |
| `scripts/test-insights-quality.ts`  | 인사이트 품질 검증 스크립트 (모델명, 토큰 설정, 품질 임계값)   |
| `src/components/ai/AICoachCard.tsx` | 인사이트 UI 컴포넌트 (insight_type에 따른 렌더링 분기)         |

## Workflow

### Step 1: 모델명 일치 확인

**파일:** `src/app/api/ai/insights/route.ts`, `scripts/test-insights-quality.ts`

**검사:** 두 파일에서 모델명을 추출하여 일치 여부 확인

```bash
grep -n "model:" src/app/api/ai/insights/route.ts
grep -n "model:" scripts/test-insights-quality.ts
```

**PASS 기준:** 두 파일 모두 동일한 모델명 (`gpt-5.4-mini`) 사용

**FAIL 예시:**

```typescript
// route.ts
model: 'gpt-5.4-mini'
// test script
model: 'gpt-4o-mini' // 불일치 — 테스트가 프로덕션과 다른 모델 검증
```

**수정 방법:** 두 파일의 모델명을 `gpt-5.4-mini`로 통일

---

### Step 2: rate limit 값 확인

**파일:** `src/app/api/ai/insights/route.ts`

**검사:** `DAILY_LIMIT` 상수 값 확인

```bash
grep -n "DAILY_LIMIT" src/app/api/ai/insights/route.ts
```

**PASS 기준:** `DAILY_LIMIT = 3` (하루 3회 제한)

**FAIL 예시:**

```typescript
const DAILY_LIMIT = 10 // 비용 초과 위험 (gpt-5.4-mini: ~$0.0015/호출 × 10회/일 × DAU)
const DAILY_LIMIT = 1 // UX 저하 (사용자 재분석 불가)
```

**수정 방법:** `DAILY_LIMIT = 3` 으로 복원. 변경 필요 시 `docs/escalation-policy.md` 확인 후 승인 필요

---

### Step 3: max_completion_tokens 확인

**파일:** `src/app/api/ai/insights/route.ts`, `scripts/test-insights-quality.ts`

**검사:** 토큰 한도 설정 추출

```bash
grep -n "max_completion_tokens" src/app/api/ai/insights/route.ts
grep -n "max_completion_tokens" scripts/test-insights-quality.ts
```

**PASS 기준:** 두 파일 모두 `max_completion_tokens: 2400` 이상

**FAIL 예시:**

```typescript
max_completion_tokens: 1800 // 250자×3 인사이트 생성 시 잘릴 수 있음
max_tokens: 2400 // gpt-5.4-mini는 max_tokens 미지원, max_completion_tokens 필수
```

**수정 방법:**

- 필드명은 반드시 `max_completion_tokens` (not `max_tokens`)
- 값은 2400 이상 유지

---

### Step 4: 인사이트 타입 순서 강제 확인

**파일:** `src/app/api/ai/insights/route.ts`

**검사:** 프롬프트에 타입 순서 지시가 존재하는지 확인

```bash
grep -n "pattern_analysis" src/app/api/ai/insights/route.ts
grep -n "recommendation" src/app/api/ai/insights/route.ts
grep -n "daily_summary" src/app/api/ai/insights/route.ts
```

**PASS 기준:** 시스템 프롬프트에 세 타입 모두 언급되고, `pattern_analysis → recommendation → daily_summary` 순서가 명시됨

**FAIL 예시:**

```
// 순서 미명시 — AI가 임의 순서로 생성
"인사이트 3개를 pattern_analysis, recommendation, daily_summary 타입으로 작성"
```

**수정 방법:** 프롬프트에 `pattern_analysis → recommendation → daily_summary 순서를 반드시 지켜주세요` 문구 유지

---

### Step 5: 금지 어미 마커 확인

**파일:** `src/app/api/ai/insights/route.ts`

**검사:** 분석형 톤 강제 지시(~네요/~해요 금지) 존재 여부 확인

```bash
grep -n "네요\|해요\|거예요" src/app/api/ai/insights/route.ts
```

**PASS 기준:** 프롬프트에 `"~네요", "~해요", "~거예요"` 금지 지시가 존재 (주의: 이 grep 결과가 나오는 것이 PASS)

**FAIL:** grep 결과 없음 → 톤 강제 지시가 제거된 것

**수정 방법:** 시스템 프롬프트 `## 절대 쓰지 말 것` 섹션에 금지 어미 목록 복원

---

### Step 6: UI 컴포넌트 타입 커버리지 확인

**파일:** `src/components/ai/AICoachCard.tsx`

**검사:** `INSIGHT_ICONS`와 `INSIGHT_LABELS`가 3개 타입 모두 커버하는지 확인

```bash
grep -n "pattern_analysis\|recommendation\|daily_summary" src/components/ai/AICoachCard.tsx
```

**PASS 기준:** `INSIGHT_ICONS`와 `INSIGHT_LABELS` 객체 모두 `pattern_analysis`, `recommendation`, `daily_summary` 키 보유

**FAIL 예시:**

```typescript
const INSIGHT_ICONS = {
  pattern_analysis: <BarChart2 />,
  recommendation: <Lightbulb />,
  // daily_summary 누락 → 런타임 undefined 렌더
}
```

**수정 방법:** 누락된 타입 키를 적절한 아이콘/라벨과 함께 추가

---

## Output Format

```markdown
| 검사                     | 결과 | 상세                                    |
| ------------------------ | ---- | --------------------------------------- |
| 모델명 일치              | PASS | route.ts, test script 모두 gpt-5.4-mini |
| rate limit (DAILY_LIMIT) | PASS | DAILY_LIMIT = 3                         |
| max_completion_tokens    | PASS | 2400 (두 파일 일치)                     |
| 인사이트 타입 순서 강제  | PASS | 프롬프트에 순서 명시 확인               |
| 금지 어미 마커           | PASS | ~네요/~해요/~거예요 금지 지시 존재      |
| UI 타입 커버리지         | PASS | INSIGHT_ICONS/LABELS 3타입 모두 커버    |
```

## Exceptions

1. **test script의 모델명이 의도적으로 다른 경우** — 비용 절감을 위해 테스트에서 더 저렴한 모델을 명시적으로 사용하는 경우 면제. 단, 코드 주석에 `// cost-saving: uses cheaper model for local testing` 명시 필요.
2. **DAILY_LIMIT 상향 조정 시** — 비용 영향이 있으므로 `docs/escalation-policy.md` 승인 후 변경. 값이 3보다 크더라도 주석에 승인 근거가 있으면 PASS.
3. **max_completion_tokens 2400 미만** — 향후 모델 교체로 응답 속도/비용 최적화가 필요한 경우. 단, 250자×3 인사이트가 실제로 잘리지 않는지 검증 선행 필요.
4. **금지 어미 grep 결과 없음이지만 다른 방식으로 톤 강제** — 금지 목록 대신 "분석형 문장체만 사용" 등 다른 방식으로 톤을 강제하는 경우 면제.
