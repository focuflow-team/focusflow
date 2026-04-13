import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from '@/components/settings/SettingsClient'

export const metadata: Metadata = { title: '설정' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let subscriptionTier: 'free' | 'pro' | 'team' = 'free'
  let calendarConnected = false

  if (user) {
    const [profileResult, calendarResult] = await Promise.all([
      supabase.from('profiles').select('subscription_tier').eq('id', user.id).single(),
      supabase.from('google_calendar_tokens').select('id').eq('user_id', user.id).single(),
    ])

    if (profileResult.data?.subscription_tier) {
      subscriptionTier = profileResult.data.subscription_tier as 'free' | 'pro' | 'team'
    }
    calendarConnected = !calendarResult.error && !!calendarResult.data
  }

  return (
    <SettingsClient subscriptionTier={subscriptionTier} calendarConnected={calendarConnected} />
  )
}
