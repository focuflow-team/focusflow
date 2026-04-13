'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function togglePublicAction(isPublic: boolean): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('profiles').update({ is_public: isPublic }).eq('id', user.id)

  revalidatePath('/app/leaderboard')
}

export async function toggleFollowAction(targetUserId: string, follow: boolean): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  if (follow) {
    await supabase.from('user_follows').insert({ follower_id: user.id, following_id: targetUserId })
  } else {
    await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
  }

  revalidatePath('/app/leaderboard')
}
