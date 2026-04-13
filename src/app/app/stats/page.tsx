import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { StatsClient } from '@/components/stats/StatsClient'

export const metadata: Metadata = {
  title: '통계',
}

export default async function StatsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let subscriptionTier: 'free' | 'pro' | 'team' = 'free'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()
    if (profile?.subscription_tier) {
      subscriptionTier = profile.subscription_tier as 'free' | 'pro' | 'team'
    }
  }

  return <StatsClient subscriptionTier={subscriptionTier} />
}
