import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { chargeWithBillingKey, getBillingKey, PORTONE_PLANS } from '@/lib/portone'

// 빌링키를 등록하고 첫 번째 결제를 수행합니다
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const plan = body.plan as 'pro' | 'team'
  const billingKey = body.billingKey as string

  if (!['pro', 'team'].includes(plan)) {
    return NextResponse.json({ error: '잘못된 플랜입니다.' }, { status: 400 })
  }

  if (!billingKey || typeof billingKey !== 'string') {
    return NextResponse.json({ error: '빌링키가 필요합니다.' }, { status: 400 })
  }

  // 빌링키 유효성 확인
  try {
    const billingKeyInfo = await getBillingKey(billingKey)
    if (billingKeyInfo.status !== 'ISSUED') {
      return NextResponse.json({ error: '유효하지 않은 빌링키입니다.' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: '빌링키 확인에 실패했습니다.' }, { status: 400 })
  }

  // 사용자 이메일 가져오기
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, subscription_tier')
    .eq('id', user.id)
    .single()

  if (profile?.subscription_tier === plan) {
    return NextResponse.json({ error: '이미 해당 플랜을 구독 중입니다.' }, { status: 400 })
  }

  const customerEmail = profile?.email ?? user.email ?? ''

  // 첫 번째 결제 수행
  const paymentId = `focusflow-${plan}-${user.id}-${Date.now()}`

  try {
    const payment = await chargeWithBillingKey({
      billingKey,
      paymentId,
      plan,
      userId: user.id,
      customerEmail,
    })

    if (payment.status !== 'PAID') {
      return NextResponse.json({ error: '결제에 실패했습니다.' }, { status: 400 })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : '결제 처리 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  // DB 업데이트 (service client로 RLS 우회)
  const serviceClient = createServiceClient()
  const nextBillingDate = new Date()
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)

  const { error: updateError } = await serviceClient
    .from('profiles')
    .update({
      subscription_tier: plan,
      portone_billing_key: billingKey,
      portone_next_billing_at: nextBillingDate.toISOString(),
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('프로필 업데이트 실패:', updateError)
    return NextResponse.json({ error: '구독 정보 저장에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, plan })
}
