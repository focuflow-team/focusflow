---
name: Harness Bootstrap Execution Plan
description: Phase 0 발견 요약 + 5 Axes 실행 로그 (이 파일은 작업 중에 갱신)
verification_status: verified
last_verified: 2026-04-13
owner: harness
---

# Exec Plan — Harness Bootstrap

## Phase 0 Summary

- **Stack**: Next.js 16 + React 19 + TS, Supabase(SSR), PortOne V2 + Stripe, OpenAI, Google Calendar, MDX, PWA
- **Shape**: `active` (중간 규모 ~6.9k LOC, 71 src files)
- **Test/Lint**: 전무 → Axis 2/3에서 도입
- **CI**: `tsc --noEmit` + `next build`만
- **주요 리스크**:
  1. Supabase 3-factory 오용 (특히 `service.ts` 노출)
  2. PortOne V2 SDK 필드 오사용 (최근 핫픽스 4건이 이 카테고리)
  3. 웹훅 서명 검증 실수 반복 가능
  4. 정적 프리렌더 시 env 접근 → 빌드 실패
- **사용자 결정**:
  1. 제안 순서 OK
  2. ESLint/depcruise/Prettier/Husky 설치 진행
  3. Mistake collection: 2주 대기 대신 **회고적으로 최근 결제 핫픽스를 agent-failures.md에 시드**하여 결제 도메인 우선 하드닝

## Progress Log

| 일시       | 축   | 내용                                                                                           | 결과 |
| ---------- | ---- | ---------------------------------------------------------------------------------------------- | ---- |
| 2026-04-13 | -    | Phase 0 발견·사용자 승인                                                                       | Done |
| 2026-04-13 | 1    | docs 트리·ADR 0001-0004·scope CLAUDE.md                                                        | Done |
| 2026-04-13 | 5    | agent-failures 시드(4건)·golden-principles G-01~G-09·drift-detector·주간 workflow              | Done |
| 2026-04-13 | 2    | ESLint/dependency-cruiser/Prettier/Husky 설치·설정, depcruise 0 violation 확인                 | Done |
| 2026-04-13 | 3    | logger, scripts/{dev,test,verify,self-review,generate-db-docs}.sh, docs/generated/db-schema.md | Done |
| 2026-04-13 | 4    | ci.yml 확장·agent-review.yml·escalation-policy.md, self-review 통과                            | Done |
| 2026-04-13 | Meta | docs/meta/harness-prompt.md                                                                    | Done |

## Decision Log

- **2026-04-13**: dependency-cruiser 선택 (vs eslint-plugin-boundaries) → ADR-0004.
- **2026-04-13**: Test framework 강제 도입 안 함 — Axis 4에서 "필요 시 Vitest" 권고만.
- **2026-04-13**: Axis 2 도메인 순서: Supabase boundaries → 결제 → API route → 인증.

## Next Steps

1. Axis 1 완료: references/\*-llms.txt, exec-plan·playbook·generated 트리 마무리.
2. Axis 5: agent-failures.md 시드 + golden-principles + drift-detector.
3. Axis 2: ESLint·depcruise·Husky 설치, 결제 우선 하드닝.
4. Axis 3: logger + scripts/dev|test|verify.sh + db-schema 생성 스크립트.
5. Axis 4: self-review.sh + ci.yml 확장 + escalation-policy.
6. Meta: docs/meta/harness-prompt.md.
