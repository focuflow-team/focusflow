import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createOAuth2Client } from '@/lib/google-calendar'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state') // state = userId
  const error = searchParams.get('error')

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (error || !code || !state) {
    return NextResponse.redirect(`${origin}/app/settings?calendar_error=true`)
  }

  try {
    const client = createOAuth2Client()
    const { tokens } = await client.getToken(code)

    if (!tokens.access_token) {
      return NextResponse.redirect(`${origin}/app/settings?calendar_error=true`)
    }

    const supabase = createServiceClient()

    // Upsert tokens
    await supabase
      .from('google_calendar_tokens')
      .upsert({
        user_id: state,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    return NextResponse.redirect(`${origin}/app/settings?calendar_connected=true`)
  } catch {
    return NextResponse.redirect(`${origin}/app/settings?calendar_error=true`)
  }
}
