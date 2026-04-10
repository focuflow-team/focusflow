import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { BillingClient } from '@/components/billing/BillingClient'

export const metadata: Metadata = { title: '구독 관리' }

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let subscriptionTier: 'free' | 'pro' | 'team' = 'free'
  let nextBillingAt: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, portone_next_billing_at')
      .eq('id', user.id)
      .single()

    if (profile) {
      subscriptionTier = (profile.subscription_tier ?? 'free') as 'free' | 'pro' | 'team'
      nextBillingAt = profile.portone_next_billing_at ?? null
    }
  }

  return <BillingClient subscriptionTier={subscriptionTier} nextBillingAt={nextBillingAt} />
}
