'use client'

import { useEffect, useState, useCallback } from 'react'
import { Sparkles, RefreshCw, Lock, TrendingUp, Lightbulb, BarChart2 } from 'lucide-react'

interface AiInsight {
  id: string
  insight_type: 'pattern_analysis' | 'recommendation' | 'daily_summary'
  content: string
  metadata: { title?: string; sessionCount?: number; avgDuration?: number } | null
  created_at: string
}

interface AICoachCardProps {
  subscriptionTier: 'free' | 'pro' | 'team'
}

const INSIGHT_ICONS = {
  pattern_analysis: <BarChart2 className="h-4 w-4 text-blue-500" />,
  recommendation: <Lightbulb className="h-4 w-4 text-amber-500" />,
  daily_summary: <TrendingUp className="h-4 w-4 text-green-500" />,
}

const INSIGHT_LABELS = {
  pattern_analysis: '패턴 분석',
  recommendation: '추천',
  daily_summary: '요약',
}

export function AICoachCard({ subscriptionTier }: AICoachCardProps) {
  const [insights, setInsights] = useState<AiInsight[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPro = subscriptionTier === 'pro' || subscriptionTier === 'team'

  const fetchInsights = useCallback(async () => {
    if (!isPro) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/insights')
      if (res.ok) {
        const data = await res.json()
        setInsights(data.insights ?? [])
      }
    } catch {
      setError('인사이트를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [isPro])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  const generateInsights = async () => {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/insights', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setInsights(data.insights ?? [])
      } else if (data.code === 'PRO_REQUIRED') {
        setError('Pro 플랜이 필요합니다.')
      } else {
        setError(data.message ?? data.error ?? '인사이트 생성에 실패했습니다.')
      }
    } catch {
      setError('인사이트 생성 중 오류가 발생했습니다.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <h2 className="text-sm font-medium">AI 코칭</h2>
          {!isPro && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              <Lock className="h-2.5 w-2.5" />
              Pro
            </span>
          )}
        </div>
        {isPro && (
          <button
            onClick={generateInsights}
            disabled={generating || loading}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${generating ? 'animate-spin' : ''}`} />
            {generating ? '분석 중...' : '새 분석'}
          </button>
        )}
      </div>

      {!isPro ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center space-y-2">
          <Sparkles className="mx-auto h-8 w-8 text-purple-400 opacity-60" />
          <p className="text-sm font-medium">AI 맞춤 코칭</p>
          <p className="text-xs text-muted-foreground">
            집중 패턴을 AI가 분석하고 최적의 집중 시간대, 개선 방법을 추천해드립니다.
          </p>
          <p className="text-xs text-muted-foreground font-medium">Pro 플랜으로 업그레이드하세요</p>
        </div>
      ) : loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
          {error}
        </div>
      ) : insights.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">아직 생성된 인사이트가 없습니다.</p>
          <p className="text-xs text-muted-foreground">
            최소 3개의 세션을 완료한 후 &apos;새 분석&apos;을 눌러보세요.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {insights.map((insight) => (
            <li
              key={insight.id}
              className="rounded-lg border border-border bg-background p-3 space-y-1"
            >
              <div className="flex items-center gap-1.5">
                {INSIGHT_ICONS[insight.insight_type]}
                <span className="text-[10px] text-muted-foreground font-medium">
                  {INSIGHT_LABELS[insight.insight_type]}
                </span>
                {insight.metadata?.title && (
                  <span className="ml-auto text-xs font-medium truncate max-w-[160px]">
                    {insight.metadata.title}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{insight.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
