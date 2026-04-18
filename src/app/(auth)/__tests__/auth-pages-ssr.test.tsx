import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

const mockSignInWithPassword = vi.fn().mockResolvedValue({ error: null })
const mockSignInWithOAuth = vi.fn().mockResolvedValue({ error: null })
const mockSignUp = vi.fn().mockResolvedValue({ error: null })

const createClientMock = vi.fn(() => ({
  auth: {
    signInWithPassword: mockSignInWithPassword,
    signInWithOAuth: mockSignInWithOAuth,
    signUp: mockSignUp,
  },
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: createClientMock,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))

describe('인증 페이지 SSR 안전성', () => {
  beforeEach(() => {
    createClientMock.mockClear()
  })

  it('LoginPage — 렌더 시점에 createClient() 호출하지 않음', async () => {
    const { default: LoginPage } = await import('../login/page')
    render(<LoginPage />)
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('LoginPage — 이메일 로그인 제출 시에만 createClient() 호출', async () => {
    const { default: LoginPage } = await import('../login/page')
    render(<LoginPage />)

    fireEvent.change(screen.getByPlaceholderText('이메일'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('비밀번호'), {
      target: { value: 'password123' },
    })
    fireEvent.submit(screen.getByRole('button', { name: '로그인' }))

    expect(createClientMock).toHaveBeenCalledTimes(1)
  })

  it('SignupPage — 렌더 시점에 createClient() 호출하지 않음', async () => {
    const { default: SignupPage } = await import('../signup/page')
    render(<SignupPage />)
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('SignupPage — 회원가입 제출 시에만 createClient() 호출', async () => {
    const { default: SignupPage } = await import('../signup/page')
    render(<SignupPage />)

    fireEvent.change(screen.getByPlaceholderText('이메일'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('비밀번호 (최소 6자)'), {
      target: { value: 'password123' },
    })
    fireEvent.submit(screen.getByRole('button', { name: '회원가입' }))

    expect(createClientMock).toHaveBeenCalledTimes(1)
  })
})
