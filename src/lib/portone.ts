// PortOne V2 서버사이드 설정 및 API 헬퍼

export const PORTONE_API_BASE = 'https://api.portone.io'

export const PORTONE_PLANS = {
  pro: {
    name: 'FocusFlow Pro',
    displayName: 'Pro',
    priceKRW: 6900,
    description: 'FocusFlow Pro 월간 구독',
  },
  team: {
    name: 'FocusFlow Team',
    displayName: 'Team',
    priceKRW: 18000,
    description: 'FocusFlow Team 월간 구독',
  },
} as const

type Plan = keyof typeof PORTONE_PLANS

function apiHeaders() {
  return {
    Authorization: `PortOne ${process.env.PORTONE_V2_API_SECRET}`,
    'Content-Type': 'application/json',
  }
}

/** 빌링키로 즉시 결제 */
export async function chargeWithBillingKey({
  billingKey,
  paymentId,
  plan,
  userId,
  customerEmail,
}: {
  billingKey: string
  paymentId: string
  plan: Plan
  userId: string
  customerEmail: string
}) {
  const planConfig = PORTONE_PLANS[plan]
  const res = await fetch(`${PORTONE_API_BASE}/payments/${encodeURIComponent(paymentId)}/billing-key`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({
      billingKey,
      orderName: planConfig.description,
      amount: { total: planConfig.priceKRW },
      currency: 'KRW',
      customer: {
        id: userId,
        email: customerEmail,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`PortOne 결제 실패: ${res.status} ${err}`)
  }

  return res.json() as Promise<PortOnePayment>
}

/** 결제 정보 조회 */
export async function getPayment(paymentId: string): Promise<PortOnePayment> {
  const res = await fetch(`${PORTONE_API_BASE}/payments/${encodeURIComponent(paymentId)}`, {
    headers: apiHeaders(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`PortOne 결제 조회 실패: ${res.status} ${err}`)
  }

  return res.json()
}

/** 빌링키 정보 조회 */
export async function getBillingKey(billingKey: string): Promise<PortOneBillingKey> {
  const res = await fetch(`${PORTONE_API_BASE}/billing-keys/${encodeURIComponent(billingKey)}`, {
    headers: apiHeaders(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`PortOne 빌링키 조회 실패: ${res.status} ${err}`)
  }

  return res.json()
}

/** 빌링키 삭제 (구독 취소 시) */
export async function deleteBillingKey(billingKey: string): Promise<void> {
  const res = await fetch(`${PORTONE_API_BASE}/billing-keys/${encodeURIComponent(billingKey)}`, {
    method: 'DELETE',
    headers: apiHeaders(),
  })

  if (!res.ok && res.status !== 404) {
    const err = await res.text()
    throw new Error(`PortOne 빌링키 삭제 실패: ${res.status} ${err}`)
  }
}

// PortOne V2 응답 타입
export interface PortOnePayment {
  id: string
  status: 'VIRTUAL_ACCOUNT_ISSUED' | 'PAID' | 'FAILED' | 'CANCELLED' | 'PARTIAL_CANCELLED'
  orderName: string
  amount: { total: number; taxFree?: number }
  currency: string
  customer?: { id?: string; email?: string }
  paidAt?: string
  failedAt?: string
}

export interface PortOneBillingKey {
  billingKey: string
  status: 'ISSUED' | 'DELETED'
  methods?: Array<{ type: string; card?: { name: string; number: string } }>
  issuedAt?: string
}
