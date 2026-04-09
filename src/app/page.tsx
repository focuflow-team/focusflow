import type { Metadata } from 'next'
import Link from 'next/link'
import { Timer, BarChart2, Waves, Smartphone } from 'lucide-react'

export const metadata: Metadata = {
  title: 'FocusFlow — 포모도로 집중 타이머',
  description: '포모도로 기법으로 집중력을 높이세요. 타이머, 집중 통계, 앰비언트 사운드를 한곳에. 무료로 시작하세요.',
  openGraph: {
    title: 'FocusFlow — 포모도로 집중 타이머',
    description: '포모도로 기법으로 집중력을 높이세요. 타이머, 집중 통계, 앰비언트 사운드를 한곳에. 무료로 시작하세요.',
    type: 'website',
  },
  alternates: {
    canonical: '/',
  },
}

const features = [
  {
    icon: Timer,
    title: '포모도로 타이머',
    description: '25분 집중 + 5분 휴식 사이클로 생산성을 극대화하세요.',
  },
  {
    icon: BarChart2,
    title: '집중 통계',
    description: '일별·주별·월별 집중 데이터를 한눈에 확인하세요.',
  },
  {
    icon: Waves,
    title: '앰비언트 사운드',
    description: '빗소리, 카페 소음 등 집중에 도움되는 배경음을 재생하세요.',
  },
  {
    icon: Smartphone,
    title: '오프라인 지원 PWA',
    description: '홈 화면에 설치하면 인터넷 없이도 타이머를 사용할 수 있어요.',
  },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <span className="font-bold tracking-tight">FocusFlow</span>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              무료 시작
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="flex flex-col items-center justify-center px-4 py-20 text-center sm:py-32">
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
              포모도로 기법 기반 집중 앱
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              더 깊이 집중하고,
              <br />
              더 많이 완성하세요
            </h1>
            <p className="mx-auto max-w-md text-base text-muted-foreground sm:text-lg">
              FocusFlow는 포모도로 타이머, 집중 통계, 앰비언트 사운드를
              하나로 묶어 1인 개발자의 생산성을 도와줍니다.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                무료로 시작하기
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-border px-8 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                로그인
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border/50 px-4 py-16 sm:py-24">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-12 text-center text-2xl font-bold tracking-tight sm:text-3xl">
              집중을 위한 모든 것
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-border bg-card p-6 space-y-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-16 text-center sm:py-24">
          <div className="mx-auto max-w-md space-y-4">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              지금 바로 집중을 시작하세요
            </h2>
            <p className="text-sm text-muted-foreground">
              가입 없이는 데이터가 저장되지 않아요. 무료로 계정을 만들고 집중 기록을 쌓아보세요.
            </p>
            <Link
              href="/signup"
              className="inline-flex rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              무료 계정 만들기
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 px-4 py-6 text-center text-xs text-muted-foreground">
        © 2026 FocusFlow. 1인 개발자를 위해 만들었습니다.
      </footer>
    </div>
  )
}
