import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params

  const supabase = await createClient()
  const { data: session } = await supabase
    .from('focus_sessions')
    .select('duration_minutes, task_name, started_at')
    .eq('id', sessionId)
    .single()

  const minutes = session?.duration_minutes ?? 25
  const taskName = session?.task_name ?? null

  return new ImageResponse(
    <div
      style={{
        width: '1200px',
        height: '630px',
        background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
        color: 'white',
        gap: '24px',
      }}
    >
      {/* App name */}
      <div style={{ fontSize: '28px', fontWeight: '700', opacity: 0.8 }}>FocusFlow</div>

      {/* Main stat */}
      <div style={{ fontSize: '120px', fontWeight: '900', lineHeight: 1 }}>{minutes}분</div>

      <div style={{ fontSize: '40px', fontWeight: '600' }}>집중 완료! 🎯</div>

      {taskName && (
        <div
          style={{
            fontSize: '24px',
            opacity: 0.75,
            maxWidth: '800px',
            textAlign: 'center',
            padding: '0 40px',
          }}
        >
          &ldquo;{taskName}&rdquo;
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          fontSize: '20px',
          opacity: 0.6,
        }}
      >
        focusflow.app
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  )
}
