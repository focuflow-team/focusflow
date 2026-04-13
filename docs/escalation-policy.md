---
name: Escalation Policy
description: 에이전트가 반드시 휴먼에게 승인받아야 하는 변경 목록
verification_status: verified
last_verified: 2026-04-13
owner: harness
---

# Escalation Policy

에이전트는 아래 변경 중 하나에 해당하면 **구현 전에 휴먼 승인**을 받습니다. 승인 없이 커밋/PR 진행 금지.

## 1. 인증 경계

- `middleware.ts` 수정
- `src/app/app/layout.tsx` 서버 사이드 인증 체크 변경
- `/app/*` 외부에 보호 라우트 신설
- `supabase.auth.getSession()` 도입(금지)

## 2. 결제

- `src/app/api/payment/webhook/route.ts` (특히 `verifyWebhookSignature`)
- `src/app/api/stripe/webhook/route.ts`
- `src/lib/portone.ts`, `src/lib/stripe.ts`의 금액/플랜/시크릿 처리
- 플랜↔금액 매핑 상수 변경

## 3. 데이터베이스

- `supabase/migrations/*.sql` 신규/변경
- RLS 정책 추가·완화
- `SECURITY DEFINER` 함수 변경
- 새로운 테이블·컬럼 민감도 결정(암호화·민감지표 플래그)

## 4. 서버 관리자 권한

- `SUPABASE_SERVICE_ROLE_KEY` 사용처 신설 (현재 허용 경로: `src/app/api/**/route.ts`, `src/app/api/cron/**`)
- `createServiceClient()` 호출 시 사용자 id 경계 체크 없이 집계/쓰기

## 5. 외부 계약

- Google Calendar OAuth scope 변경
- Stripe/PortOne webhook 이벤트 처리 추가·변경
- 공개 프로필(`is_public`) 공개 필드 변경

## 6. 빌드·배포

- Node 버전 변경
- `vercel.json` cron/환경변수/리다이렉트 변경
- CI workflow의 블록 조건 완화 (`continue-on-error: true` 남발 금지)

## 7. 보안 관련 의존성

- `stripe`, `@stripe/stripe-js`, `@portone/browser-sdk`, `@supabase/*`, `googleapis` 메이저 업그레이드
- 새로운 인증·결제 SDK 도입

## 절차

1. 플랜 파일(`docs/exec-plans/active/*.md`)에 **Impact**·**Rollback**·**Verification** 섹션을 작성.
2. PR 설명에 해당 카테고리(#1~#7) 및 완화 전략을 명시.
3. 리뷰어 승인(👍) 전에는 `main`/`develop` 머지 금지.
4. 긴급 핫픽스인 경우 선(先) 배포 → 24시간 내 회고 + `docs/agent-failures.md` 업데이트 필수.
