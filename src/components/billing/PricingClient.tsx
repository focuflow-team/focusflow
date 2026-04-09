'use client'

import { useState } from 'react'
import { Check, Sparkles, Users, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Plan {
  key: 'free' | 'pro' | 'team'
  name: string
  price: string
  description: string
  icon: React.ReactNode
  features: string[]
  highlight?: boolean
}

const PLANS: Plan[] = [
  {
    key: 'free',
    name: 'Free',
    price: '$0',
    description: '기본 집중 타이머',
    icon: <Zap className="h-5 w-5" />,
    features: [
      '포모도로 타이머',
      '세션 기록 및 기본 통계',
      '3가지 앰비언트 사운드',
      '7일 세션 히스토리',
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$4.99',
    description: '생산성 극대화',
    icon: <Sparkles className="h-5 w-5 text-purple-500" />,
    features: [
      'Free 모든 기능',
      'AI 패턴 분석 및 코칭',
      '무제한 앰비언트 사운드',
      '고급 통계 및 트렌드',
      '무제한 세션 히스토리',
      '우선 지원',
    ],
    highlight: true,
  },
  {
    key: 'team',
    name: 'Team',
    price: '$12.99',
    description: '팀 생산성 관리',
    icon: <Users className="h-5 w-5 text-blue-500" />,
    features: [
      'Pro 모든 기능',
      '팀 공유 통계',
      '최대 5인 팀',
      '팀 대시보드',
    ],
  },
]

export function PricingClient({ currentTier }: { currentTier: 'free' | 'pro' | 'team' }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async (plan: 'pro' | 'team') => {
    setLoading(plan)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (res.ok && data.url) {
        router.push(data.url)
      } else {
        setError(data.error ?? '결제 오류가 발생했습니다.')
      }
    } catch {
      setError('결제 시작에 실패했습니다.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="w-full max-w-4xl space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">플랜 선택</h1>
        <p className="text-sm text-muted-foreground">집중력을 높이는 최적의 플랜을 선택하세요</p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive text-center">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = currentTier === plan.key
          const isDisabled = isCurrent || loading !== null

          return (
            <div
              key={plan.key}
              className={`relative rounded-xl border p-5 space-y-4 ${
                plan.highlight
                  ? 'border-purple-400 dark:border-purple-600 bg-purple-50/50 dark:bg-purple-950/20'
                  : 'border-border bg-card'
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-purple-500 px-3 py-0.5 text-[11px] font-semibold text-white">
                  추천
                </span>
              )}

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {plan.icon}
                  <span className="font-semibold">{plan.name}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{plan.price}</span>
                  {plan.key !== 'free' && <span className="text-xs text-muted-foreground">/월</span>}
                </div>
                <p className="text-xs text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs">
                    <Check className="h-3.5 w-3.5 mt-0.5 text-green-500 shrink-0" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              {plan.key === 'free' ? (
                <button
                  disabled
                  className="w-full rounded-lg border border-border py-2 text-sm text-muted-foreground cursor-default"
                >
                  {isCurrent ? '현재 플랜' : '무료'}
                </button>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.key as 'pro' | 'team')}
                  disabled={isDisabled}
                  className={`w-full rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                    isCurrent
                      ? 'border border-border bg-background text-muted-foreground cursor-default'
                      : plan.highlight
                      ? 'bg-purple-500 hover:bg-purple-600 text-white'
                      : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                  }`}
                >
                  {loading === plan.key
                    ? '처리 중...'
                    : isCurrent
                    ? '현재 플랜'
                    : '업그레이드'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Stripe 테스트 카드: 4242 4242 4242 4242 · 언제든지 취소 가능
      </p>
    </div>
  )
}
