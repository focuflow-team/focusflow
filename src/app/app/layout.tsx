import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/app" className="text-lg font-bold tracking-tight">
            FocusFlow
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/app/stats" className="hover:text-foreground transition-colors">
              통계
            </Link>
            <Link href="/app/settings" className="hover:text-foreground transition-colors">
              설정
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  )
}
