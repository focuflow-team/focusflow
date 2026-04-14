import { describe, it, expect, beforeEach, afterEach } from 'vitest'

// DEV_BYPASS_EMAILS 파싱 및 이메일 매칭 로직을 직접 테스트
// (route.ts와 동일한 로직)
function resolveBypass(email: string | null | undefined, envVar: string | undefined): boolean {
  const devBypassEmails = (envVar ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
  return email != null && devBypassEmails.includes(email)
}

describe('DEV_BYPASS_EMAILS 파싱 및 bypass 판별', () => {
  const originalEnv = process.env.DEV_BYPASS_EMAILS

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.DEV_BYPASS_EMAILS
    } else {
      process.env.DEV_BYPASS_EMAILS = originalEnv
    }
  })

  it('등록된 이메일은 bypass 처리', () => {
    expect(resolveBypass('vljh246v@naver.com', 'vljh246v@naver.com')).toBe(true)
  })

  it('쉼표 구분 목록에서 두 번째 이메일도 bypass', () => {
    expect(resolveBypass('dev2@example.com', 'vljh246v@naver.com,dev2@example.com')).toBe(true)
  })

  it('공백 포함 환경변수도 정상 파싱', () => {
    expect(resolveBypass('vljh246v@naver.com', 'vljh246v@naver.com , dev2@example.com')).toBe(true)
  })

  it('미등록 이메일은 bypass 안 됨', () => {
    expect(resolveBypass('other@example.com', 'vljh246v@naver.com')).toBe(false)
  })

  it('환경변수 미설정(undefined)이면 bypass 안 됨', () => {
    expect(resolveBypass('vljh246v@naver.com', undefined)).toBe(false)
  })

  it('환경변수 빈 문자열이면 bypass 안 됨', () => {
    expect(resolveBypass('vljh246v@naver.com', '')).toBe(false)
  })

  it('이메일이 null이면 bypass 안 됨', () => {
    expect(resolveBypass(null, 'vljh246v@naver.com')).toBe(false)
  })
})
