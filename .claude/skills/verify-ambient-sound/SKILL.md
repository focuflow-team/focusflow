---
name: verify-ambient-sound
description: 앰비언트 사운드 프로파일 동기화 규칙을 검증합니다. SoundId 타입, SOUND_PROFILES, /public/sounds/ 파일이 항상 일치하는지 확인합니다. 사운드 추가/변경/삭제 후 사용.
---

# 앰비언트 사운드 프로파일 검증

## Purpose

1. **SoundId ↔ SOUND_PROFILES 동기화** — `SoundId` 타입의 모든 값이 `SOUND_PROFILES` 배열의 `id`와 1:1 일치하는지 확인
2. **src 파일 형식** — `src` 필드가 있는 프로파일은 반드시 `/sounds/*.mp3` 형식을 따르는지 확인
3. **gainMultiplier 유효성** — `gainMultiplier`가 있으면 양수(> 0)인지 확인
4. **공개 사운드 파일 존재** — `src`로 참조된 `/public/sounds/*.mp3` 파일이 실제로 존재하는지 확인

## When to Run

- `src/hooks/useAmbientSound.ts` 수정 후 (새 사운드 추가, 사운드 교체, 타입 변경 시)
- `public/sounds/` 디렉토리에 파일을 추가하거나 삭제한 후
- `SoundId` 타입 변경 후

## Related Files

| File                           | Purpose                                                    |
| ------------------------------ | ---------------------------------------------------------- |
| `src/hooks/useAmbientSound.ts` | SoundId 타입, SoundProfile 인터페이스, SOUND_PROFILES 정의 |
| `public/sounds/`               | 실제 재생될 MP3 파일 디렉토리                              |

## Workflow

### Step 1: SoundId 타입 값 수집

**파일:** `src/hooks/useAmbientSound.ts`

**검사:** `SoundId` 타입에서 모든 값을 추출합니다.

```bash
grep -n "^export type SoundId" src/hooks/useAmbientSound.ts
```

**PASS 기준:** `export type SoundId = 'A' | 'B' | ...` 형식의 union 타입이 존재

**FAIL:** 타입이 없거나 비어 있는 경우

---

### Step 2: SOUND_PROFILES id 목록 수집

**파일:** `src/hooks/useAmbientSound.ts`

**검사:** `SOUND_PROFILES` 배열에서 모든 `id` 값을 추출합니다.

```bash
grep -n "id: '" src/hooks/useAmbientSound.ts
```

**PASS 기준:** 각 프로파일 객체에 `id` 필드가 존재하고, 그 값들이 SoundId 타입의 모든 값과 정확히 일치

**FAIL 예시:**

```typescript
// SoundId에는 'lofi'가 있는데 SOUND_PROFILES에는 'fireplace'만 있는 경우
export type SoundId = 'white' | 'pink' | 'lofi' // 타입이 오래됨
// SOUND_PROFILES id: 'white', 'pink', 'fireplace'  // 실제 값
```

**수정 방법:** `SoundId` 타입을 `SOUND_PROFILES`의 실제 id 목록과 일치시킵니다.

---

### Step 3: src 필드 형식 확인

**파일:** `src/hooks/useAmbientSound.ts`

**검사:** `src` 필드가 있는 프로파일이 `/sounds/` 경로를 사용하는지 확인합니다.

```bash
grep -n "src:" src/hooks/useAmbientSound.ts
```

**PASS 기준:** 모든 `src` 값이 `/sounds/` 로 시작하는 경로 형식

**FAIL 예시:**

```typescript
src: 'sounds/rain.mp3' // 앞에 / 없음
src: '../public/sounds/rain.mp3' // 상대 경로 사용
src: 'https://cdn.example.com/rain.mp3' // 외부 URL (CDN 의존성 위험)
```

**수정 방법:** `src: '/sounds/filename.mp3'` 형식으로 통일합니다.

---

### Step 4: gainMultiplier 유효성 확인

**파일:** `src/hooks/useAmbientSound.ts`

**검사:** `gainMultiplier` 값이 있는 경우 양수인지 확인합니다.

```bash
grep -n "gainMultiplier" src/hooks/useAmbientSound.ts
```

**PASS 기준:** `gainMultiplier` 값이 모두 > 0인 숫자

**FAIL 예시:**

```typescript
gainMultiplier: 0,   // 무음이 됨
gainMultiplier: -1,  // 음수 (위상 반전)
```

---

### Step 5: 공개 사운드 파일 존재 확인

**검사:** `SOUND_PROFILES`에서 `src`로 참조된 파일이 `public/sounds/`에 실제로 존재하는지 확인합니다.

```bash
ls public/sounds/
```

위 결과와 Step 3에서 수집한 src 경로를 대조합니다. 예:

- `src: '/sounds/rain.mp3'` → `public/sounds/rain.mp3` 존재 여부 확인

**PASS 기준:** `src`로 참조된 모든 파일이 `public/sounds/`에 존재

**FAIL:** `src`에 명시된 파일이 `public/sounds/`에 없는 경우 → 해당 MP3 파일을 추가하거나 `src` 값을 수정합니다.

## Output Format

```markdown
| 검사                     | 결과 | 상세                                       |
| ------------------------ | ---- | ------------------------------------------ |
| SoundId 타입 존재        | PASS | 6개 값 확인                                |
| SOUND_PROFILES id 동기화 | PASS | white, pink, rain, forest, cafe, fireplace |
| src 형식                 | PASS | 4개 모두 /sounds/ 형식                     |
| gainMultiplier 유효성    | PASS | 3개 모두 > 0                               |
| 공개 파일 존재           | PASS | rain, forest, cafe, fireplace 모두 확인    |
```

## Exceptions

1. **합성음 프로파일의 src 없음** — `white`, `pink`처럼 Web Audio API로 합성하는 프로파일은 `src` 없음이 정상입니다. `src`가 없는 프로파일은 Step 3, 5의 검사 대상에서 제외합니다.
2. **외부 URL src** — 외부 CDN URL을 의도적으로 사용하는 경우 Step 3 FAIL이지만, 팀이 외부 CDN을 명시적으로 승인한 경우 면제입니다. 단, 이 경우 CORS 및 가용성 위험을 주석으로 명시해야 합니다.
3. **gainMultiplier 없음** — `gainMultiplier`를 설정하지 않으면 기본값 1.0으로 동작합니다. 생략은 정상입니다.
