import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createFocusSessionEvent } from '@/lib/google-calendar'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
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
    return NextResponse.json({ error: 'Pro subscription required', code: 'PRO_REQUIRED' }, { status: 403 })
  }

  // Get calendar tokens
  const { data: tokenRow } = await supabase
    .from('google_calendar_tokens')
    .select('access_token, refresh_token, calendar_id')
    .eq('user_id', user.id)
    .single()

  if (!tokenRow) {
    return NextResponse.json({ error: 'Calendar not connected', code: 'NOT_CONNECTED' }, { status: 404 })
  }

  const body = await request.json()
  const { taskName, startedAt, durationMinutes } = body as {
    taskName: string | null
    startedAt: string
    durationMinutes: number
  }

  try {
    const event = await createFocusSessionEvent(
      tokenRow.access_token,
      tokenRow.refresh_token,
      { taskName, startedAt, durationMinutes, calendarId: tokenRow.calendar_id ?? 'primary' }
    )
    return NextResponse.json({ eventId: event.id, htmlLink: event.htmlLink })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Calendar event creation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
