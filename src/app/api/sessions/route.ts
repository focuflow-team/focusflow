import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { task_name, duration_minutes, break_duration_minutes, status, interruptions, mood_before, mood_after } = body

  const { data, error } = await supabase
    .from('focus_sessions')
    .insert({
      user_id: user.id,
      task_name: task_name ?? null,
      duration_minutes: duration_minutes ?? 25,
      break_duration_minutes: break_duration_minutes ?? 5,
      status: status ?? 'completed',
      interruptions: interruptions ?? 0,
      mood_before: mood_before ?? null,
      mood_after: mood_after ?? null,
      started_at: new Date(Date.now() - (duration_minutes ?? 25) * 60 * 1000).toISOString(),
      ended_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ session: data }, { status: 201 })
}

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('focus_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ sessions: data })
}
