import type { Metadata } from 'next'
import { TimerPage } from '@/components/timer/TimerPage'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: '타이머',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let subscriptionTier: 'free' | 'pro' | 'team' = 'free'
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()
    if (data?.subscription_tier) {
      subscriptionTier = data.subscription_tier as 'free' | 'pro' | 'team'
    }
  }

  return (
    <div className="w-full max-w-lg flex flex-col items-center gap-8 sm:gap-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">집중 타이머</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">포모도로 기법으로 집중력을 높이세요</p>
      </div>
      <TimerPage subscriptionTier={subscriptionTier} />
    </div>
  )
}
