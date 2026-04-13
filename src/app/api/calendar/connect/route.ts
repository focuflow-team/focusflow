import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthUrl } from '@/lib/google-calendar'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check Pro tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  if (!profile || profile.subscription_tier === 'free') {
    return NextResponse.json(
      { error: 'Pro subscription required', code: 'PRO_REQUIRED' },
      { status: 403 },
    )
  }

  const url = getAuthUrl(user.id)
  return NextResponse.redirect(url)
}
