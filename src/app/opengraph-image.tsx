import { ImageResponse } from 'next/og'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1e2e 0%, #2d2b55 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          padding: '60px',
        }}
      >
        {/* Logo / App name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'rgba(139, 92, 246, 0.3)',
              border: '2px solid rgba(139, 92, 246, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
            }}
          >
            ⏱
          </div>
          <span
            style={{
              fontSize: '48px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-1px',
            }}
          >
            FocusFlow
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: '52px',
            fontWeight: 700,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.2,
            marginBottom: '24px',
            maxWidth: '900px',
          }}
        >
          더 깊이 집중하고,
          <br />더 많이 완성하세요
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '24px',
            color: 'rgba(255,255,255,0.7)',
            textAlign: 'center',
            maxWidth: '700px',
          }}
        >
          포모도로 타이머 · 집중 통계 · 앰비언트 사운드
        </div>

        {/* Badge */}
        <div
          style={{
            marginTop: '40px',
            padding: '10px 24px',
            borderRadius: '999px',
            background: 'rgba(139, 92, 246, 0.25)',
            border: '1px solid rgba(139, 92, 246, 0.5)',
            color: '#c4b5fd',
            fontSize: '18px',
            fontWeight: 600,
          }}
        >
          1인 개발자를 위한 생산성 앱
        </div>
      </div>
    ),
    { ...size }
  )
}
