import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { deleteBillingKey } from '@/lib/portone'

// 구독을 취소합니다 (빌링키 삭제 + 플랜을 free로 변경)
export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, portone_billing_key')
    .eq('id', user.id)
    .single()

  if (!profile || profile.subscription_tier === 'free') {
    return NextResponse.json({ error: '활성 구독이 없습니다.' }, { status: 400 })
  }

  // PortOne 빌링키 삭제 (실패해도 계속 진행)
  if (profile.portone_billing_key) {
    try {
      await deleteBillingKey(profile.portone_billing_key)
    } catch (err) {
      console.error('빌링키 삭제 실패 (구독 취소는 진행):', err)
    }
  }

  // DB에서 구독 정보 초기화
  const serviceClient = createServiceClient()
  const { error: updateError } = await serviceClient
    .from('profiles')
    .update({
      subscription_tier: 'free',
      portone_billing_key: null,
      portone_next_billing_at: null,
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('구독 취소 DB 업데이트 실패:', updateError)
    return NextResponse.json({ error: '구독 취소 처리 중 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
