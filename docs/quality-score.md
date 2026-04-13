---
name: Quality Score
description: 도메인·레이어별 현재 하네스 품질 점수 (initial baseline)
verification_status: verified
last_verified: 2026-04-13
owner: harness
---

# Quality Score — Initial Baseline (2026-04-13)

점수 스케일: **0 (없음)** / **1 (문서만)** / **2 (문서 + 부분 강제)** / **3 (구조적 강제)**.

| 도메인 / 레이어           | 문서 | 린트/구조 강제       | 테스트 | 합계 / 9 | 메모                      |
| ------------------------- | ---- | -------------------- | ------ | -------- | ------------------------- |
| Supabase 경계 (ADR-0001)  | 3    | 1 (Axis 2에서 3으로) | 0      | 4        | depcruise 규칙 대기       |
| 인증 경계 (ADR-0002)      | 3    | 0                    | 0      | 3        | 수동 이중 체크            |
| 결제 - PortOne (ADR-0003) | 3    | 1                    | 0      | 4        | playbook + 회고 시드 완료 |
| 결제 - Stripe             | 2    | 0                    | 0      | 2        | LLMs 참조만               |
| API route 일반            | 2    | 1                    | 0      | 3        | scope CLAUDE.md           |
| 빌드/린트/CI              | 1    | 0 (Axis 2/4)         | -      | 1        | `tsc + build`만           |
| 로깅/관찰성               | 0    | 0                    | 0      | 0        | Axis 3 대기               |
| 테스트 전반               | 0    | 0                    | 0      | 0        | 프레임워크 없음           |

## 목표 (Axis 2~4 완료 후)

- Supabase 경계 8/9
- 결제 PortOne 7/9
- 빌드/린트/CI 7/9
- 로깅/관찰성 5/9
- 테스트 전반 2/9 (결정적 fixture 도입까지)

## 재측정 주기

- 각 Axis 완료 시
- 분기별 drift-detector가 자동 보고 예정 (장기)
