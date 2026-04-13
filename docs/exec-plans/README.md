---
name: Exec Plans index
description: active/completed 플랜 위치와 작성 규약
verification_status: verified
last_verified: 2026-04-13
owner: harness
---

# Exec Plans

복수 단계·여러 파일을 건드리는 모든 작업은 `active/*.md`에 먼저 플랜 파일을 만든다. 완료 후 `completed/`로 이동.

## 디렉터리

- `active/` — 현재 진행 중
- `completed/` — 아카이브
- `tech-debt-tracker.md` — 테크 부채 모음 (Axis 5 관리)

## 플랜 파일 구조 (템플릿)

```markdown
---
name: <plan name>
description: <한 문장>
verification_status: draft
last_verified: YYYY-MM-DD
owner: <you>
---

# Exec Plan — <제목>

## Goal

한두 문장으로 완료 조건.

## Non-goals

이 플랜에서 **하지 않을** 것.

## Steps

1. ...
2. ...

## Progress Log

| 일시 | 단계 | 결과 |

## Decision Log

- YYYY-MM-DD: <결정과 이유>

## Next Steps
```

## 소소한 변경 (one-file, 문서 오탈자 등)은 플랜 생략 가능 — 커밋 메시지가 곧 플랜이다.
