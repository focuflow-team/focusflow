'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Users, Zap, ExternalLink, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const TIER_INFO = {
  free: { label: 'Free', icon: <Zap className="h-4 w-4" />, color: 'text-foreground' },
  pro: { label: 'Pro', icon: <Sparkles className="h-4 w-4 text-purple-500" />, color: 'text-purple-600 dark:text-purple-400' },
  team: { label: 'Team', icon: <Users className="h-4 w-4 text-blue-500" />, color: 'text-blue-600 dark:text-blue-400' },
}

export function BillingClient({
  subscriptionTier,
  hasStripeCustomer,
}: {
  subscriptionTier: 'free' | 'pro' | 'team'
  hasStripeCustomer: boolean
}) {
  const searchParams = useSearchParams()
  const justUpgraded = searchParams.get('success') === 'true'
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(justUpgraded)

  useEffect(() => {
    if (showSuccess) {
      const t = setTimeout(() => setShowSuccess(false), 5000)
      return () => clearTimeout(t)
    }
  }, [showSuccess])

  const openPortal = async () => {
    setPortalLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? '포털 오류가 발생했습니다.')
      }
    } catch {
      setError('구독 관리 포털에 접속할 수 없습니다.')
    } finally {
      setPortalLoading(false)
    }
  }

  const info = TIER_INFO[subscriptionTier]

  return (
    <div className="w-full max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">구독 관리</h1>

      {showSuccess && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 text-sm text-green-700 dark:text-green-300">
          <CheckCircle className="h-4 w-4 shrink-0" />
          업그레이드 완료! Pro 기능을 이용할 수 있습니다.
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Current plan card */}
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
            <p className="text-sm text-muted-foreground">
              구독을 관리하거나 취소하려면 Stripe 포털을 이용하세요.
            </p>
            {hasStripeCustomer && (
              <button
                onClick={openPortal}
                disabled={portalLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background hover:bg-muted px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60"
              >
                <ExternalLink className="h-4 w-4" />
                {portalLoading ? '연결 중...' : '구독 관리 포털'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pro features summary */}
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
