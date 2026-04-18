import { describe, expect, it } from 'vitest'
import { systemPrompt } from './route'

describe('AI 시스템 프롬프트 계약', () => {
  it('존댓말 어미 규칙을 포함한다', () => {
    expect(systemPrompt).toContain('~습니다')
    expect(systemPrompt).toContain('~합니다')
  })

  it('반말 어미 규칙이 제거됐다', () => {
    // 기존 반말 어미 허용 규칙이 존재하면 안 됨
    expect(systemPrompt).not.toMatch(/"~다 \/ ~된다 \/ ~한다"/)
  })

  it('직접 명령형 금지 규칙을 포함한다', () => {
    expect(systemPrompt).toContain('직접 명령형')
    expect(systemPrompt).toContain('~해야 해')
  })

  it('데이터 근거 규칙을 포함한다', () => {
    expect(systemPrompt).toContain('데이터 근거 규칙')
    expect(systemPrompt).toContain('로그에 없는 수치를 만들어내지 않는다')
  })

  it('\\n 형식 강제 규칙을 포함한다', () => {
    expect(systemPrompt).toContain('문장마다 반드시')
  })
})
