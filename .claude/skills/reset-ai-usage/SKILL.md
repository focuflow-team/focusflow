---
name: reset-ai-usage
description: AI 코칭 분석 횟수를 오늘 기준으로 초기화. DEV_BYPASS_USER_IDS의 모든 계정에 대해 오늘 생성된 ai_insights 행을 삭제.
---

# AI 분석 횟수 초기화

## Purpose

`DEV_BYPASS_USER_IDS`에 등록된 개발 계정의 오늘 AI 코칭 분석 횟수를 초기화한다.

## Steps

1. Supabase project ID `ackkxhfzkavbfnzgiljx` 에 연결
2. 다음 SQL 실행:

```sql
DELETE FROM ai_insights
WHERE user_id IN (
  SELECT unnest(string_to_array(
    current_setting('app.dev_bypass_user_ids', true),
    ','
  ))
)
AND created_at >= NOW()::date
RETURNING user_id, insight_type, created_at;
```

> `current_setting` 대신 직접 user_id 목록을 넣어도 된다:

```sql
DELETE FROM ai_insights
WHERE user_id = 'a9c48508-2725-41fc-bdbb-5d199e054ce5'
  AND created_at >= NOW()::date
RETURNING id, insight_type, created_at;
```

3. RETURNING 결과로 삭제된 행 수 확인 후 사용자에게 보고

## Success Criteria

- 삭제된 행 수 출력 (0이면 "이미 초기화됨" 안내)
- "오늘 분석을 X회 사용할 수 있습니다" 형식으로 마무리

## Note

터미널에서 바로 실행하려면 Claude 없이도 가능:

```bash
npm run reset-ai-usage
# 또는 Claude Code 터미널에서
! npm run reset-ai-usage
```
