import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getPayment } from '@/lib/portone'
import crypto from 'crypto'

// PortOne V2 웹훅 서명 검증
function verifyWebhookSignature(
  webhookId: string,
  webhookTimestamp: string,
  body: string,
  secret: string,
  signature: string,
): boolean {
  const signedContent = `${webhookId}.${webhookTimestamp}.${body}`
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const expected = crypto
    .createHmac('sha256', secretBytes)
    .update(signedContent)
    .digest('base64')

  // PortOne V2 서명은 "v1,<base64>" 형식
  const signatures = signature.split(' ')
  return signatures.some((sig) => {
    const [version, hash] = sig.split(',')
    return version === 'v1' && hash === expected
  })
}

export async function POST(request: NextRequest) {
  const body = await request.text()

  // 웹훅 서명 검증 (설정된 경우)
  const webhookSecret = process.env.PORTONE_WEBHOOK_SECRET
  if (webhookSecret) {
    const webhookId = request.headers.get('webhook-id') ?? ''
    const webhookTimestamp = request.headers.get('webhook-timestamp') ?? ''
    const signature = request.headers.get('webhook-signature') ?? ''

    if (!webhookId || !webhookTimestamp || !signature) {
      return NextResponse.json({ error: '웹훅 서명 헤더 누락' }, { status: 400 })
    }

    if (!verifyWebhookSignature(webhookId, webhookTimestamp, body, webhookSecret, signature)) {
      return NextResponse.json({ error: '웹훅 서명 검증 실패' }, { status: 401 })
    }
  }

  let event: PortOneWebhookEvent
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: '잘못된 JSON' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // 결제 완료 이벤트 처리
  if (event.type === 'Transaction.Paid' && event.data?.paymentId) {
    try {
      const payment = await getPayment(event.data.paymentId)

      if (payment.status === 'PAID' && payment.customer?.id) {
        const userId = payment.customer.id

        // 결제 금액으로 플랜 결정
        const amountKRW = payment.amount.total
        const plan = amountKRW >= 18000 ? 'team' : amountKRW >= 6900 ? 'pro' : null

        if (plan) {
          const nextBillingDate = new Date()
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)

          await supabase
            .from('profiles')
            .update({
              subscription_tier: plan,
              portone_next_billing_at: nextBillingDate.toISOString(),
            })
            .eq('id', userId)
        }
      }
    } catch (err) {
      console.error('결제 확인 웹훅 처리 실패:', err)
    }
  }

  // 결제 실패 이벤트 처리
  if (event.type === 'Transaction.Failed' && event.data?.paymentId) {
    try {
      const payment = await getPayment(event.data.paymentId)
      if (payment.customer?.id) {
        // 실패 기록만 로깅 (구독은 /api/payment/subscribe에서 이미 처리됨)
        console.warn(`결제 실패: userId=${payment.customer.id}, paymentId=${event.data.paymentId}`)
      }
    } catch (err) {
      console.error('결제 실패 웹훅 처리 중 오류:', err)
    }
  }

  return NextResponse.json({ received: true })
}

interface PortOneWebhookEvent {
  type: string
  data?: {
    paymentId?: string
    billingKey?: string
    customerId?: string
  }
}
