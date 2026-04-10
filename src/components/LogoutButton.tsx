'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      title="로그아웃"
      className="rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-60 flex items-center gap-1"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">로그아웃</span>
    </button>
  )
}
