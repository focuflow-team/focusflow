import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-03-25.dahlia',
      typescript: true,
    })
  }
  return _stripe
}

export const STRIPE_PLANS = {
  pro: {
    name: 'Pro',
    price: '$4.99/월',
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    features: [
      'AI 패턴 분석 및 코칭',
      '무제한 앰비언트 사운드',
      '고급 통계 및 트렌드',
      '우선 지원',
    ],
  },
  team: {
    name: 'Team',
    price: '$12.99/월',
    priceId: process.env.STRIPE_TEAM_PRICE_ID!,
    features: [
      'Pro 모든 기능',
      '팀 공유 통계',
      '최대 5인 팀',
      '팀 대시보드',
    ],
  },
} as const
