---
name: ADR-0004 Structural enforcement tooling
description: ESLint + dependency-cruiser + Prettier + Husky 스택 선택 근거
verification_status: verified
last_verified: 2026-04-13
owner: harness
---

# ADR-0004 — 구조적 강제 도구 (ESLint + dependency-cruiser + Prettier + Husky)

- 상태: Accepted
- 날짜: 2026-04-13

## Context

현재 린트·포매터·구조 테스트 전무. Next.js 16은 내장 ESLint가 옵션이며 eslint-config-next는 v9+에 맞춰 ESLint flat config를 사용.

## Decision

| 도구                                      | 역할                                    | 비고                      |
| ----------------------------------------- | --------------------------------------- | ------------------------- |
| ESLint (flat config, `eslint.config.mjs`) | 코드 스타일·Next/React 룰·커스텀 메시지 | `eslint-config-next`      |
| dependency-cruiser                        | 레이어링·import 경계 강제               | `.dependency-cruiser.cjs` |
| Prettier                                  | 포매팅                                  | `.prettierrc`             |
| Husky + lint-staged                       | pre-commit 훅                           | 변경 파일만 검사          |

대안 `eslint-plugin-boundaries` 대신 **dependency-cruiser** 선택: 선언적·분리된 설정, Next.js/Client-Server 경계에 표현력이 더 좋음.

## Consequences

- 설치 devDependencies: `eslint`, `eslint-config-next`, `dependency-cruiser`, `prettier`, `husky`, `lint-staged`, `@typescript-eslint/*`(필요 시 eslint-config-next가 처리).
- `extension/` 디렉터리는 lint ignore.

## Enforcement

- `npm run lint` → `eslint . && depcruise src`
- pre-commit: `lint-staged`로 변경된 파일만 eslint+prettier
- CI: `.github/workflows/ci.yml`에 `lint` job 추가 (Axis 4).
