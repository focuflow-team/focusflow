import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { LeaderboardClient } from './LeaderboardClient'
import type { LeaderboardEntry } from '@/types/database'

vi.mock('./actions', () => ({
  togglePublicAction: vi.fn().mockResolvedValue(undefined),
  toggleFollowAction: vi.fn().mockResolvedValue(undefined),
}))

import { togglePublicAction, toggleFollowAction } from './actions'

function makeEntry(overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return {
    user_id: 'user-1',
    display_name: '홍길동',
    username: 'gildong',
    avatar_url: null,
    weekly_minutes: 120,
    weekly_sessions: 4,
    ...overrides,
  }
}

const DEFAULT_PROPS = {
  leaderboard: [] as LeaderboardEntry[],
  currentUserId: null as string | null,
  myRank: 0,
  isPublic: false,
  followingIds: [] as string[],
}

describe('LeaderboardClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── 렌더링 ──────────────────────────────────────────────────────────────

  it('전체 순위 탭: 항목 이름과 집중 시간을 렌더링한다', () => {
    const entries = [
      makeEntry({ user_id: 'u1', display_name: '김철수', weekly_minutes: 180 }),
      makeEntry({ user_id: 'u2', display_name: '이영희', weekly_minutes: 90 }),
    ]
    render(<LeaderboardClient {...DEFAULT_PROPS} leaderboard={entries} />)

    expect(screen.getByText('김철수')).toBeInTheDocument()
    expect(screen.getByText('이영희')).toBeInTheDocument()
    expect(screen.getByText('3시간')).toBeInTheDocument()
    expect(screen.getByText('1시간 30분')).toBeInTheDocument()
  })

  it('1~3위는 아이콘, 4위 이상은 숫자 순위를 표시한다', () => {
    const entries = [
      makeEntry({ user_id: 'u1', display_name: '가나다', weekly_minutes: 300 }),
      makeEntry({ user_id: 'u2', display_name: '라마바', weekly_minutes: 200 }),
      makeEntry({ user_id: 'u3', display_name: '사아자', weekly_minutes: 100 }),
      makeEntry({ user_id: 'u4', display_name: '차카타', weekly_minutes: 50 }),
    ]
    render(<LeaderboardClient {...DEFAULT_PROPS} leaderboard={entries} />)

    // 4위는 숫자 span으로 표시
    const rankSpan = screen.getByText('4', { selector: 'span.font-mono' })
    expect(rankSpan).toBeInTheDocument()
    // 1~3위 숫자 span은 없음 (아이콘으로 대체)
    expect(screen.queryByText('1', { selector: 'span.font-mono' })).not.toBeInTheDocument()
  })

  it('현재 사용자 항목에 "(나)" 텍스트를 표시한다', () => {
    const entries = [makeEntry({ user_id: 'me', display_name: '김테스트' })]
    render(
      <LeaderboardClient {...DEFAULT_PROPS} leaderboard={entries} currentUserId="me" isPublic />,
    )

    expect(screen.getByText('(나)')).toBeInTheDocument()
  })

  it('전체 순위 빈 상태: 적절한 안내 메시지를 표시한다', () => {
    render(<LeaderboardClient {...DEFAULT_PROPS} leaderboard={[]} />)

    expect(screen.getByText(/이번 주 완료된 세션이 없습니다/)).toBeInTheDocument()
  })

  it('비로그인 상태: 가입 안내 문구를 표시한다', () => {
    render(<LeaderboardClient {...DEFAULT_PROPS} currentUserId={null} />)

    expect(screen.getByText(/리더보드에 참여하려면/)).toBeInTheDocument()
  })

  // ── 공개/비공개 토글 ──────────────────────────────────────────────────

  it('비공개 상태에서 토글 클릭 시 공개로 변경하고 서버 액션을 호출한다', () => {
    render(<LeaderboardClient {...DEFAULT_PROPS} currentUserId="me" isPublic={false} />)

    const toggleBtn = screen.getByRole('button', { name: /비공개/ })
    fireEvent.click(toggleBtn)

    expect(screen.getByRole('button', { name: /공개 중/ })).toBeInTheDocument()
    expect(togglePublicAction).toHaveBeenCalledWith(true)
  })

  it('공개 상태에서 토글 클릭 시 비공개로 변경하고 서버 액션을 호출한다', () => {
    render(<LeaderboardClient {...DEFAULT_PROPS} currentUserId="me" isPublic={true} />)

    const toggleBtn = screen.getByRole('button', { name: /공개 중/ })
    fireEvent.click(toggleBtn)

    expect(screen.getByRole('button', { name: /비공개/ })).toBeInTheDocument()
    expect(togglePublicAction).toHaveBeenCalledWith(false)
  })

  // ── 팔로우/언팔로우 ───────────────────────────────────────────────────

  it('팔로우 버튼 클릭 시 서버 액션을 호출하고 팔로잉 수가 증가한다', () => {
    const entries = [makeEntry({ user_id: 'other', display_name: '다른 사람' })]
    render(
      <LeaderboardClient
        {...DEFAULT_PROPS}
        leaderboard={entries}
        currentUserId="me"
        followingIds={[]}
      />,
    )

    // 팔로우 버튼 클릭
    const followBtn = screen.getByTitle('팔로우')
    fireEvent.click(followBtn)

    expect(toggleFollowAction).toHaveBeenCalledWith('other', true)
    // 팔로잉 탭 카운트 증가
    expect(screen.getByText(/팔로잉 \(1명\)/)).toBeInTheDocument()
  })

  it('이미 팔로우 중인 사람의 버튼 클릭 시 언팔로우 액션을 호출한다', () => {
    const entries = [makeEntry({ user_id: 'other', display_name: '다른 사람' })]
    render(
      <LeaderboardClient
        {...DEFAULT_PROPS}
        leaderboard={entries}
        currentUserId="me"
        followingIds={['other']}
      />,
    )

    const unfollowBtn = screen.getByTitle('언팔로우')
    fireEvent.click(unfollowBtn)

    expect(toggleFollowAction).toHaveBeenCalledWith('other', false)
  })

  // ── 팔로잉 탭 ─────────────────────────────────────────────────────────

  it('팔로잉 탭: 팔로우한 사람과 나만 표시한다', () => {
    const entries = [
      makeEntry({ user_id: 'me', display_name: '김내계정' }),
      makeEntry({ user_id: 'friend', display_name: '박친구님' }),
      makeEntry({ user_id: 'stranger', display_name: '이모르는분' }),
    ]
    render(
      <LeaderboardClient
        {...DEFAULT_PROPS}
        leaderboard={entries}
        currentUserId="me"
        followingIds={['friend']}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /팔로잉/ }))

    expect(screen.getByText('김내계정')).toBeInTheDocument()
    expect(screen.getByText('박친구님')).toBeInTheDocument()
    expect(screen.queryByText('이모르는분')).not.toBeInTheDocument()
  })

  it('팔로잉 탭 빈 상태: 적절한 안내 메시지를 표시한다', () => {
    render(
      <LeaderboardClient
        {...DEFAULT_PROPS}
        leaderboard={[makeEntry({ user_id: 'stranger' })]}
        currentUserId="me"
        followingIds={[]}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /팔로잉/ }))

    expect(screen.getByText(/팔로우하는 사람이 없거나/)).toBeInTheDocument()
  })
})
