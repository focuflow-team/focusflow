'use client'

import { useState, useTransition } from 'react'
import { Trophy, Medal, Users, Lock, Globe, UserPlus, UserCheck } from 'lucide-react'
import { toggleFollowAction, togglePublicAction } from './actions'
import type { LeaderboardEntry } from '@/types/database'

interface Props {
  leaderboard: LeaderboardEntry[]
  currentUserId: string | null
  myRank: number
  isPublic: boolean
  followingIds: string[]
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}분`
  if (m === 0) return `${h}시간`
  return `${h}시간 ${m}분`
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />
  return <span className="w-5 text-center text-sm text-muted-foreground font-mono">{rank}</span>
}

export function LeaderboardClient({
  leaderboard,
  currentUserId,
  myRank,
  isPublic: initialIsPublic,
  followingIds: initialFollowingIds,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set(initialFollowingIds))
  const [tab, setTab] = useState<'global' | 'following'>('global')

  const handleTogglePublic = () => {
    const next = !isPublic
    setIsPublic(next)
    startTransition(async () => {
      await togglePublicAction(next)
    })
  }

  const handleFollow = (userId: string) => {
    const isFollowing = followingIds.has(userId)
    const next = new Set(followingIds)
    if (isFollowing) {
      next.delete(userId)
    } else {
      next.add(userId)
    }
    setFollowingIds(next)
    startTransition(async () => {
      await toggleFollowAction(userId, !isFollowing)
    })
  }

  const displayList =
    tab === 'following'
      ? leaderboard.filter((e) => followingIds.has(e.user_id) || e.user_id === currentUserId)
      : leaderboard

  return (
    <div className="w-full max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            주간 리더보드
          </h1>
          <p className="text-xs text-muted-foreground">이번 주 (월~일) 집중 시간 기준</p>
        </div>

        {/* Public toggle */}
        {currentUserId && (
          <button
            onClick={handleTogglePublic}
            disabled={isPending}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              isPublic
                ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {isPublic ? (
              <>
                <Globe className="h-3.5 w-3.5" />
                공개 중
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5" />
                비공개
              </>
            )}
          </button>
        )}
      </div>

      {/* My rank banner */}
      {currentUserId && myRank > 0 && isPublic && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex items-center justify-between">
          <div className="text-sm">
            <span className="font-semibold">내 현재 순위</span>
            <span className="text-muted-foreground ml-2">
              {displayList.find((e) => e.user_id === currentUserId)
                ? `이번 주 ${formatMinutes(displayList.find((e) => e.user_id === currentUserId)?.weekly_minutes ?? 0)} 집중`
                : ''}
            </span>
          </div>
          <span className="text-2xl font-bold text-primary">#{myRank}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        {(['global', 'following'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
              tab === t
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'global' ? (
              <span className="flex items-center justify-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                전체 순위
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                팔로잉 ({followingIds.size}명)
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Leaderboard List */}
      {displayList.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
          {tab === 'following'
            ? '팔로우하는 사람이 없거나 아직 이번 주 세션이 없어요.'
            : '이번 주 완료된 세션이 없습니다. 첫 번째 주인공이 되어보세요!'}
        </div>
      ) : (
        <div className="space-y-2">
          {displayList.map((entry, i) => {
            const rank =
              tab === 'global'
                ? i + 1
                : leaderboard.findIndex((e) => e.user_id === entry.user_id) + 1
            const isMe = entry.user_id === currentUserId
            const isFollowing = followingIds.has(entry.user_id)

            return (
              <div
                key={entry.user_id}
                className={`flex items-center gap-3 rounded-xl border p-3.5 transition-colors ${
                  isMe
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border bg-card hover:bg-muted/30'
                }`}
              >
                <div className="flex w-6 items-center justify-center shrink-0">
                  <RankBadge rank={rank} />
                </div>

                {/* Avatar */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold overflow-hidden">
                  {entry.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={entry.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (entry.display_name?.[0] ?? entry.username?.[0] ?? '?').toUpperCase()
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {entry.display_name ?? entry.username ?? '익명'}
                    {isMe && <span className="ml-1.5 text-xs text-primary">(나)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{entry.weekly_sessions}세션 완료</p>
                </div>

                {/* Focus time */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold tabular-nums">
                    {formatMinutes(entry.weekly_minutes)}
                  </p>
                  <p className="text-xs text-muted-foreground">이번 주</p>
                </div>

                {/* Follow button */}
                {currentUserId && !isMe && (
                  <button
                    onClick={() => handleFollow(entry.user_id)}
                    disabled={isPending}
                    className={`ml-1 flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors shrink-0 ${
                      isFollowing
                        ? 'bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                    }`}
                    title={isFollowing ? '언팔로우' : '팔로우'}
                  >
                    {isFollowing ? (
                      <UserCheck className="h-3.5 w-3.5" />
                    ) : (
                      <UserPlus className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!currentUserId && (
        <p className="text-center text-xs text-muted-foreground pt-2">
          리더보드에 참여하려면{' '}
          <a href="/signup" className="text-primary hover:underline">
            가입
          </a>
          하고 프로필을 공개로 설정하세요.
        </p>
      )}
    </div>
  )
}
