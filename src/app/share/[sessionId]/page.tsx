import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ShareCardClient } from './ShareCardClient'

interface Props {
  params: Promise<{ sessionId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sessionId } = await params
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('focus_sessions')
    .select('duration_minutes, task_name, started_at')
    .eq('id', sessionId)
    .single()

  if (!session) {
    return { title: '세션을 찾을 수 없습니다' }
  }

  const title = `${session.duration_minutes}분 집중 세션 완료! 🎯`
  const description = session.task_name
    ? `"${session.task_name}" 작업을 ${session.duration_minutes}분 동안 집중했습니다.`
    : `${session.duration_minutes}분 포모도로 세션을 완료했습니다.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [`/api/share/og/${sessionId}`],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/api/share/og/${sessionId}`],
    },
  }
}

export default async function SharePage({ params }: Props) {
  const { sessionId } = await params
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('focus_sessions')
    .select(
      `
      id, duration_minutes, task_name, status, started_at, ended_at,
      profiles!inner(display_name, username, avatar_url, is_public)
    `,
    )
    .eq('id', sessionId)
    .single()

  if (!session) notFound()

  // 비공개 프로필인 경우 공유 페이지 숨김
  const profile = (session as unknown as { profiles?: { is_public: boolean } }).profiles
  if (profile && !profile.is_public) notFound()

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <ShareCardClient session={session} />

        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">FocusFlow로 집중력을 키워보세요</p>
          <Link
            href="/signup"
            className="inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            무료로 시작하기
          </Link>
        </div>
      </div>
    </div>
  )
}
