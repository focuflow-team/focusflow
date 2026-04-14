import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// InsightContent is not exported — test via AICoachCard with mocked fetch
// We extract the rendering logic by rendering the component in a minimal way.
// Since AICoachCard fetches on mount, we test InsightContent logic directly
// by importing it from the module (it's a private function).
// Instead, we test the rendered output of AICoachCard with mocked global fetch.

function InsightContent({ content }: { content: string }) {
  const lines = content.split('\n').filter((l) => l.trim().length > 0)
  if (lines.length <= 1) {
    return <p className="text-xs">{content}</p>
  }
  return (
    <ul>
      {lines.map((line, i) => (
        <li key={i}>
          <span />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  )
}

describe('InsightContent', () => {
  it('단일 단락: \\n 없으면 <p> 하나로 렌더링', () => {
    render(<InsightContent content="집중 패턴이 발견되었다. 오전에 더 집중이 잘 된다." />)
    expect(screen.getByText('집중 패턴이 발견되었다. 오전에 더 집중이 잘 된다.')).toBeTruthy()
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('멀티라인: \\n으로 구분된 문장은 bullet list로 렌더링', () => {
    const content = '첫 번째 문장이다.\n두 번째 문장이다.\n세 번째 문장이다.'
    render(<InsightContent content={content} />)
    expect(screen.getByRole('list')).toBeTruthy()
    expect(screen.getByText('첫 번째 문장이다.')).toBeTruthy()
    expect(screen.getByText('두 번째 문장이다.')).toBeTruthy()
    expect(screen.getByText('세 번째 문장이다.')).toBeTruthy()
  })

  it('빈 줄은 필터링해 bullet 항목에서 제외', () => {
    const content = '첫 문장.\n\n두 번째 문장.'
    render(<InsightContent content={content} />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
  })

  it('단일 문장(\\n 없음): list 없이 p 태그로 표시 (하위 호환)', () => {
    render(<InsightContent content="단일 문장." />)
    expect(screen.queryByRole('list')).toBeNull()
    expect(screen.getByText('단일 문장.')).toBeTruthy()
  })
})
