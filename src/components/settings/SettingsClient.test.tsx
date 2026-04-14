import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { SettingsClient } from './SettingsClient'

vi.mock('@/app/app/settings/actions', () => ({
  updateProfileAction: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => null }),
}))

import { updateProfileAction } from '@/app/app/settings/actions'

const BASE_PROPS = {
  subscriptionTier: 'free' as const,
  calendarConnected: false,
  displayName: null,
  username: null,
}

describe('SettingsClient — 프로필 섹션', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('프로필 섹션이 렌더링된다', () => {
    render(<SettingsClient {...BASE_PROPS} />)

    expect(screen.getByText('프로필')).toBeInTheDocument()
    expect(screen.getByLabelText('표시 이름')).toBeInTheDocument()
    expect(screen.getByLabelText('사용자명')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument()
  })

  it('초기값이 props로 채워진다', () => {
    render(<SettingsClient {...BASE_PROPS} displayName="홍길동" username="gildong" />)

    expect(screen.getByLabelText('표시 이름')).toHaveValue('홍길동')
    expect(screen.getByLabelText('사용자명')).toHaveValue('gildong')
  })

  it('저장 버튼 클릭 시 updateProfileAction을 호출한다', () => {
    render(<SettingsClient {...BASE_PROPS} displayName="홍길동" username="gildong" />)

    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(updateProfileAction).toHaveBeenCalledWith('홍길동', 'gildong')
  })

  it('표시 이름 변경 후 저장 시 변경된 값으로 호출한다', () => {
    render(<SettingsClient {...BASE_PROPS} displayName="기존이름" username="user1" />)

    fireEvent.change(screen.getByLabelText('표시 이름'), { target: { value: '새이름' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(updateProfileAction).toHaveBeenCalledWith('새이름', 'user1')
  })

  it('username 입력 시 영소문자·숫자·언더스코어만 허용한다', () => {
    render(<SettingsClient {...BASE_PROPS} />)

    const input = screen.getByLabelText('사용자명')
    fireEvent.change(input, { target: { value: 'Hello World!@#' } })

    expect(input).toHaveValue('helloworld')
  })

  it('username 중복 에러 시 에러 toast를 표시한다', async () => {
    vi.mocked(updateProfileAction).mockResolvedValueOnce({
      success: false,
      error: 'username_taken',
    })

    render(<SettingsClient {...BASE_PROPS} username="taken" />)
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('이미 사용 중인 사용자명입니다.')).toBeInTheDocument()
  })

  it('저장 성공 시 성공 toast를 표시한다', async () => {
    render(<SettingsClient {...BASE_PROPS} displayName="홍길동" username="gildong" />)
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('프로필이 저장되었습니다.')).toBeInTheDocument()
  })
})
