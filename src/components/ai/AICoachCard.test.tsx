import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { InsightContent } from './AICoachCard'

describe('InsightContent', () => {
  it('단일 단락: \\n 없으면 <p> 하나로 렌더링', () => {
    render(<InsightContent content="집중 패턴이 발견되었습니다. 오전에 더 집중이 잘 됩니다." />)
    expect(screen.getByText('집중 패턴이 발견되었습니다. 오전에 더 집중이 잘 됩니다.')).toBeTruthy()
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('멀티라인: \\n으로 구분된 문장은 bullet list로 렌더링', () => {
    const content = '첫 번째 문장입니다.\n두 번째 문장입니다.\n세 번째 문장입니다.'
    render(<InsightContent content={content} />)
    expect(screen.getByRole('list')).toBeTruthy()
    expect(screen.getByText('첫 번째 문장입니다.')).toBeTruthy()
    expect(screen.getByText('두 번째 문장입니다.')).toBeTruthy()
    expect(screen.getByText('세 번째 문장입니다.')).toBeTruthy()
  })

  it('빈 줄은 필터링해 bullet 항목에서 제외', () => {
    const content = '첫 문장입니다.\n\n두 번째 문장입니다.'
    render(<InsightContent content={content} />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
  })

  it('\\n 없이 다중 문장(다. 끝): fallback으로 bullet list 렌더링', () => {
    const content =
      '오전 9–11시 완주율이 91%입니다. 오후 배치 시 57%로 떨어집니다. 4월 10일이 예외였습니다.'
    render(<InsightContent content={content} />)
    expect(screen.getByRole('list')).toBeTruthy()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('단일 짧은 문장: list 없이 <p>로 표시', () => {
    render(<InsightContent content="단일 문장입니다." />)
    expect(screen.queryByRole('list')).toBeNull()
    expect(screen.getByText('단일 문장입니다.')).toBeTruthy()
  })
})
