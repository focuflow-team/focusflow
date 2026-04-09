import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { BillingClient } from '@/components/billing/BillingClient'

export const metadata: Metadata = { title: '구독 관리' }

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let subscriptionTier: 'free' | 'pro' | 'team' = 'free'
  let hasStripeCustomer = false

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profile) {
      subscriptionTier = (profile.subscription_tier ?? 'free') as 'free' | 'pro' | 'team'
      hasStripeCustomer = !!profile.stripe_customer_id
    }
  }

  return <BillingClient subscriptionTier={subscriptionTier} hasStripeCustomer={hasStripeCustomer} />
}
