'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type UpdateProfileResult =
  | { success: true }
  | { success: false; error: 'username_taken' | 'unauthorized' | 'unknown' }

export async function updateProfileAction(
  displayName: string,
  username: string,
): Promise<UpdateProfileResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'unauthorized' }

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName.trim() || null, username: username.trim() || null })
    .eq('id', user.id)

  if (error) {
    if (error.code === '23505') return { success: false, error: 'username_taken' }
    return { success: false, error: 'unknown' }
  }

  revalidatePath('/app/settings')
  revalidatePath('/app/leaderboard')

  return { success: true }
}
