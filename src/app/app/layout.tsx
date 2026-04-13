import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt'
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration'
import { LogoutButton } from '@/components/LogoutButton'

export const metadata: Metadata = {
  title: '타이머',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <ServiceWorkerRegistration />

      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/app" className="text-base font-bold tracking-tight sm:text-lg">
            FocusFlow
          </Link>
          <nav className="flex items-center gap-0.5 sm:gap-3">
            <Link
              href="/app/stats"
              className="rounded-md px-1.5 sm:px-2 py-1.5 text-xs sm:text-sm whitespace-nowrap text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              통계
            </Link>
            <Link
              href="/app/leaderboard"
              className="rounded-md px-1.5 sm:px-2 py-1.5 text-xs sm:text-sm whitespace-nowrap text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              리더보드
            </Link>
            <Link
              href="/app/settings"
              className="rounded-md px-1.5 sm:px-2 py-1.5 text-xs sm:text-sm whitespace-nowrap text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              설정
            </Link>
            <ThemeToggle />
            <LogoutButton />
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:py-12">
        {children}
      </main>

      <PWAInstallPrompt />
    </div>
  )
}
