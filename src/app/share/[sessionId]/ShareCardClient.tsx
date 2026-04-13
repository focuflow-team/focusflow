'use client'

import { useState } from 'react'
import { Check, Copy, Share2 } from 'lucide-react'

interface Session {
  id: string
  duration_minutes: number
  task_name: string | null
  status: string
  started_at: string
  ended_at: string | null
}

interface Props {
  session: Session
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ShareCardClient({ session }: Props) {
  const [copied, setCopied] = useState(false)

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/share/${session.id}`
      : `/share/${session.id}`

  const shareText = session.task_name
    ? `"${session.task_name}" 작업을 ${session.duration_minutes}분 동안 집중 완료! 🎯 #FocusFlow #포모도로`
    : `${session.duration_minutes}분 포모도로 세션 완료! 🎯 #FocusFlow #집중력`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${session.duration_minutes}분 집중 완료!`,
        text: shareText,
        url: shareUrl,
      })
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Card Visual */}
      <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-8 text-white text-center space-y-3">
        <div className="text-5xl font-bold tabular-nums">{session.duration_minutes}분</div>
        <div className="text-lg font-medium opacity-90">집중 완료! 🎯</div>
        {session.task_name && (
          <div className="text-sm opacity-75 px-4">&ldquo;{session.task_name}&rdquo;</div>
        )}
        <div className="text-xs opacity-60 pt-1">{formatDate(session.started_at)}</div>
      </div>

      {/* Share Actions */}
      <div className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground text-center">이 세션을 공유하세요</p>

        <div className="flex gap-2">
          <button
            onClick={handleTwitterShare}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
          >
            <span className="text-sky-500 font-bold text-sm">𝕏</span>X (Twitter)
          </button>

          <button
            onClick={handleCopy}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                복사됨!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                링크 복사
              </>
            )}
          </button>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="flex items-center justify-center rounded-xl border border-border px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Share2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
