import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { LeaderboardClient } from './LeaderboardClient'

export const metadata: Metadata = { title: '주간 리더보드' }

export const revalidate = 60 // 1분마다 재검증

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // 주간 리더보드 데이터
  const { data: leaderboard } = await supabase
    .from('weekly_leaderboard')
    .select('*')
    .order('weekly_minutes', { ascending: false })
    .limit(50)

  // 현재 사용자 프로필 (팔로우 여부 확인용)
  let myProfile = null
  let followingIds: string[] = []
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_name, username, avatar_url, is_public')
      .eq('id', user.id)
      .single()
    myProfile = profile

    // 내가 팔로우하는 사람들
    const { data: follows } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', user.id)
    followingIds = (follows ?? []).map((f) => f.following_id)
  }

  // 현재 사용자의 이번 주 순위
  const myRank = user
    ? (leaderboard ?? []).findIndex((e) => e.user_id === user.id) + 1
    : 0

  return (
    <LeaderboardClient
      leaderboard={leaderboard ?? []}
      currentUserId={user?.id ?? null}
      myRank={myRank}
      isPublic={myProfile?.is_public ?? false}
      followingIds={followingIds}
    />
  )
}
