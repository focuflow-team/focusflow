'use client'

import { useState } from 'react'
import { Check, Sparkles, Users, Zap, CreditCard, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Plan {
  key: 'free' | 'pro' | 'team'
  name: string
  price: string
  priceKRW: string
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
    priceKRW: '무료',
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
    priceKRW: '₩6,900',
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
    priceKRW: '₩18,000',
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

// 한국 결제 수단 목록
const KR_PAYMENT_METHODS = [
  { label: '신용/체크카드', value: 'CARD' },
  { label: '카카오페이', value: 'EASY_PAY_KAKAOPAY' },
  { label: '네이버페이', value: 'EASY_PAY_NAVERPAY' },
  { label: '토스페이', value: 'EASY_PAY_TOSSPAY' },
]

export function PricingClient({ currentTier }: { currentTier: 'free' | 'pro' | 'team' }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<string>('CARD')

  const handleSubscribe = async (plan: 'pro' | 'team') => {
    setLoading(plan)
    setError(null)

    try {
      // PortOne V2 SDK 동적 로드
      const PortOne = await import('@portone/browser-sdk/v2')

      const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID
      if (!storeId) {
        throw new Error('PortOne 스토어 ID가 설정되지 않았습니다.')
      }

      // 결제 수단에 따른 채널키 선택
      const channelKeyMap: Record<string, string | undefined> = {
        CARD: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_CARD,
        EASY_PAY_KAKAOPAY: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_KAKAOPAY,
        EASY_PAY_NAVERPAY: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_NAVERPAY,
        EASY_PAY_TOSSPAY: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_TOSSPAY,
      }
      const channelKey = channelKeyMap[selectedMethod]
      if (!channelKey) {
        throw new Error('선택한 결제 수단의 채널키가 설정되지 않았습니다.')
      }

      const issueId = `focusflow-billing-${plan}-${Date.now()}`
      const planLabel = plan === 'pro' ? 'Pro' : 'Team'
      const planPriceKRW = plan === 'pro' ? 6900 : 18000

      // 빌링키 발급 (정기결제 등록)
      const response = await PortOne.requestIssueBillingKey({
        storeId,
        channelKey,
        billingKeyMethod: selectedMethod === 'CARD' ? 'CARD' : 'EASY_PAY',
        issueId,
        issueName: `FocusFlow ${planLabel} 정기결제 등록`,
        amount: { total: planPriceKRW },
        currency: 'KRW',
        ...(selectedMethod !== 'CARD' && {
          easyPay: { easyPayProvider: selectedMethod.replace('EASY_PAY_', '') as never },
        }),
      })

      if (!response) {
        throw new Error('결제 응답이 없습니다.')
      }

      if ('code' in response && response.code) {
        // 사용자가 취소하거나 오류 발생
        if (response.code !== 'PORTONE_REQUEST_CANCELLED') {
          const msg = 'message' in response ? (response.message as string) : '결제 등록에 실패했습니다.'
          setError(msg)
        }
        return
      }

      const billingKey = 'billingKey' in response ? response.billingKey : undefined
      if (!billingKey) {
        throw new Error('빌링키를 받지 못했습니다.')
      }

      // 서버에 빌링키 전송 → 첫 번째 결제 수행
      const res = await fetch('/api/payment/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, billingKey }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        router.push('/app/billing?success=true')
      } else {
        setError(data.error ?? '결제 처리 중 오류가 발생했습니다.')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '결제 시작에 실패했습니다.'
      setError(message)
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

      {/* 결제 수단 선택 */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CreditCard className="h-4 w-4" />
          결제 수단 선택
        </div>
        <div className="flex flex-wrap gap-2">
          {KR_PAYMENT_METHODS.map((method) => (
            <button
              key={method.value}
              onClick={() => setSelectedMethod(method.value)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedMethod === method.value
                  ? 'border-purple-400 bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              {method.label}
            </button>
          ))}
        </div>
      </div>

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
                  <span className="text-2xl font-bold">{plan.priceKRW}</span>
                  {plan.key !== 'free' && (
                    <span className="text-xs text-muted-foreground">
                      /월 ({plan.price})
                    </span>
                  )}
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
                    : '구독하기'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <MessageCircle className="h-3.5 w-3.5" />
        카카오페이, 네이버페이, 토스페이, 신용/체크카드 결제 지원 · 언제든지 취소 가능
      </div>
    </div>
  )
}
