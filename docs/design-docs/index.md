---
name: ADR Index
description: Architecture Decision Records 색인 (상태·주제 포함)
verification_status: verified
last_verified: 2026-04-13
owner: harness
---

# ADR Index

| #                                                | 제목                                           | 상태     | 주제        |
| ------------------------------------------------ | ---------------------------------------------- | -------- | ----------- |
| [0001](./ADR-0001-supabase-client-boundaries.md) | Supabase 3-factory 클라이언트 경계             | Accepted | 데이터 접근 |
| [0002](./ADR-0002-auth-boundary.md)              | 인증 경계 및 보호 라우트 패턴                  | Accepted | 인증        |
| [0003](./ADR-0003-payment-hardening.md)          | 결제(PortOne V2) 하드닝 규약                   | Accepted | 결제        |
| [0004](./ADR-0004-structural-enforcement.md)     | 구조적 강제 도구 (ESLint + dependency-cruiser) | Accepted | 빌드/CI     |
| [0005](./ADR-0005-task-lifecycle.md)             | 5-step task lifecycle 강제                     | Accepted | 워크플로    |

## 새 ADR 작성

파일명: `ADR-NNNN-kebab-case-title.md` (NNNN은 +1).
템플릿:

```markdown
---
name: ADR-NNNN 제목
description: 한 문장 요약
verification_status: draft
last_verified: YYYY-MM-DD
owner: <you>
---

# ADR-NNNN — 제목

- 상태: Proposed | Accepted | Superseded by ADR-XXXX | Deprecated
- 날짜: YYYY-MM-DD

## Context

왜 결정이 필요한가?

## Decision

무엇을 결정했는가?

## Consequences

긍정/부정 결과, 대체 고려사항.

## Enforcement

이 결정을 구조적으로 강제하는 장치 (린트 규칙명, depcruise 규칙, 테스트).
```
