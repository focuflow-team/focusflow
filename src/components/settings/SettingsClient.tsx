'use client'

import { useState, useEffect } from 'react'
import { Calendar, CheckCircle, XCircle, Loader2, Lock, ExternalLink } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export function SettingsClient({
  subscriptionTier,
  calendarConnected: initialConnected,
}: {
  subscriptionTier: 'free' | 'pro' | 'team'
  calendarConnected: boolean
}) {
  const searchParams = useSearchParams()
  const [calendarConnected, setCalendarConnected] = useState(initialConnected)
  const [disconnecting, setDisconnecting] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const isPro = subscriptionTier === 'pro' || subscriptionTier === 'team'

  useEffect(() => {
    if (searchParams.get('calendar_connected') === 'true') {
      setCalendarConnected(true)
      setToast({ type: 'success', message: 'Google Calendar가 연결되었습니다!' })
    } else if (searchParams.get('calendar_error') === 'true') {
      setToast({ type: 'error', message: 'Google Calendar 연결에 실패했습니다.' })
    }
  }, [searchParams])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      await fetch('/api/calendar/disconnect', { method: 'POST' })
      setCalendarConnected(false)
      setToast({ type: 'success', message: '캘린더 연결이 해제되었습니다.' })
    } catch {
      setToast({ type: 'error', message: '연결 해제에 실패했습니다.' })
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <div className="w-full max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">설정</h1>

      {toast && (
        <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
          toast.type === 'success'
            ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
            : 'bg-destructive/10 border-destructive/20 text-destructive'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle className="h-4 w-4 shrink-0" />
            : <XCircle className="h-4 w-4 shrink-0" />
          }
          {toast.message}
        </div>
      )}

      {/* Google Calendar section */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-500" />
          <h2 className="font-medium">Google Calendar 연동</h2>
          {!isPro && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground ml-auto">
              <Lock className="h-2.5 w-2.5" />
              Pro
            </span>
          )}
        </div>

        {!isPro ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              집중 세션이 완료되면 Google Calendar에 자동으로 이벤트를 생성합니다.
            </p>
            <Link
              href="/app/pricing"
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-500 hover:bg-purple-600 px-3 py-1.5 text-sm text-white transition-colors"
            >
              Pro로 업그레이드
            </Link>
          </div>
        ) : calendarConnected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              연결됨 — 집중 세션이 캘린더에 자동 기록됩니다
            </div>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background hover:bg-muted px-3 py-1.5 text-sm transition-colors disabled:opacity-60"
            >
              {disconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
              연결 해제
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Google 계정을 연결하면 집중 세션이 완료될 때 캘린더에 자동으로 기록됩니다.
            </p>
            <a
              href="/api/calendar/connect"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background hover:bg-muted px-3 py-1.5 text-sm transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Google Calendar 연결
            </a>
          </div>
        )}
      </div>

      {/* Account section placeholder */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="font-medium">계정</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">구독 플랜</span>
          <Link href="/app/billing" className="text-sm font-medium hover:underline">
            {subscriptionTier === 'free' ? 'Free' : subscriptionTier === 'pro' ? 'Pro' : 'Team'} →
          </Link>
        </div>
      </div>
    </div>
  )
}
