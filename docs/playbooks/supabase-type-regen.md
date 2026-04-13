---
name: Playbook — Supabase Types Regeneration
description: 마이그레이션 추가 후 TypeScript 타입 재생성 절차
verification_status: verified
last_verified: 2026-04-13
owner: harness
---

# Playbook — Supabase 타입 재생성

## 언제 실행하나

- `supabase/migrations/*.sql`을 추가하거나 컬럼 변경했을 때
- 뷰/함수 정의 변경 시

## 명령

```bash
supabase gen types typescript --linked > src/types/database.ts
```

전제:

- `supabase link --project-ref <ref>` 수행됨
- 마이그레이션이 실제 프로젝트 DB에도 적용됨 (`supabase db push`)

## 체크

- diff 크기가 예상보다 크면 잘못된 프로젝트에 연결된 것일 수 있음.
- 결과 파일은 자동생성이므로 수동 편집 금지.

## 검증

- `npx tsc --noEmit` 통과 확인.
- `docs/generated/db-schema.md` 재생성 (`bash scripts/generate-db-docs.sh`).
