'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Users, Zap, CheckCircle, AlertCircle, CalendarClock } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

const TIER_INFO = {
  free: { label: 'Free', icon: <Zap className="h-4 w-4" />, color: 'text-foreground' },
  pro: { label: 'Pro', icon: <Sparkles className="h-4 w-4 text-purple-500" />, color: 'text-purple-600 dark:text-purple-400' },
  team: { label: 'Team', icon: <Users className="h-4 w-4 text-blue-500" />, color: 'text-blue-600 dark:text-blue-400' },
}

export function BillingClient({
  subscriptionTier,
  nextBillingAt,
}: {
  subscriptionTier: 'free' | 'pro' | 'team'
  nextBillingAt: string | null
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const justUpgraded = searchParams.get('success') === 'true'
  const [cancelLoading, setCancelLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(justUpgraded)
  const [confirmCancel, setConfirmCancel] = useState(false)

  useEffect(() => {
    if (showSuccess) {
      const t = setTimeout(() => setShowSuccess(false), 5000)
      return () => clearTimeout(t)
    }
  }, [showSuccess])

  const handleCancel = async () => {
    if (!confirmCancel) {
      setConfirmCancel(true)
      return
    }

    setCancelLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/payment/cancel', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.success) {
        router.refresh()
      } else {
        setError(data.error ?? '구독 취소 중 오류가 발생했습니다.')
      }
    } catch {
      setError('구독 취소에 실패했습니다.')
    } finally {
      setCancelLoading(false)
      setConfirmCancel(false)
    }
  }

  const info = TIER_INFO[subscriptionTier]

  const nextBillingFormatted = nextBillingAt
    ? new Date(nextBillingAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <div className="w-full max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">구독 관리</h1>

      {showSuccess && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 text-sm text-green-700 dark:text-green-300">
          <CheckCircle className="h-4 w-4 shrink-0" />
          업그레이드 완료! 결제가 성공적으로 처리되었습니다.
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* 현재 플랜 카드 */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">현재 플랜</h2>
        <div className="flex items-center gap-2">
          {info.icon}
          <span className={`text-xl font-bold ${info.color}`}>{info.label}</span>
        </div>

        {subscriptionTier === 'free' ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Pro로 업그레이드하면 AI 코칭, 무제한 사운드 등 고급 기능을 이용할 수 있습니다.
            </p>
            <Link
              href="/app/pricing"
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-500 hover:bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Pro로 업그레이드
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {nextBillingFormatted && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" />
                다음 결제일: {nextBillingFormatted}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Link
                href="/app/pricing"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background hover:bg-muted px-4 py-2 text-sm font-medium transition-colors"
              >
                플랜 변경
              </Link>

              {confirmCancel ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={cancelLoading}
                    className="rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60"
                  >
                    {cancelLoading ? '취소 중...' : '정말 취소하기'}
                  </button>
                  <button
                    onClick={() => setConfirmCancel(false)}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    돌아가기
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleCancel}
                  className="rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 px-4 py-2 text-sm font-medium transition-colors"
                >
                  구독 취소
                </button>
              )}
            </div>

            {confirmCancel && (
              <p className="text-xs text-destructive">
                구독을 취소하면 즉시 Free 플랜으로 변경됩니다. 이미 결제한 기간 환불은 지원되지 않습니다.
              </p>
            )}
          </div>
        )}
      </div>

      {/* 이용 가능한 기능 */}
      {subscriptionTier !== 'free' && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">이용 가능한 기능</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-purple-500" />
              AI 패턴 분석 및 코칭
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              무제한 앰비언트 사운드
            </li>
            {subscriptionTier === 'team' && (
              <li className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-3.5 w-3.5 text-blue-500" />
                팀 공유 통계 (최대 5인)
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
