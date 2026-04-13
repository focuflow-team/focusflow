import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PricingClient } from '@/components/billing/PricingClient'

export const metadata: Metadata = { title: '플랜 선택' }

export default async function PricingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let currentTier: 'free' | 'pro' | 'team' = 'free'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()
    if (profile?.subscription_tier) {
      currentTier = profile.subscription_tier as 'free' | 'pro' | 'team'
    }
  }

  return <PricingClient currentTier={currentTier} />
}
