import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Timer,
  BarChart2,
  Waves,
  Smartphone,
  Brain,
  Calendar,
  Check,
  ChevronDown,
  Star,
  Zap,
  Sparkles,
  Users,
  ArrowRight,
  Target,
  TrendingUp,
  Clock,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'FocusFlow — AI 집중력 관리 앱 | 포모도로 타이머',
  description:
    'AI가 당신의 집중 패턴을 분석하고 최적의 업무 사이클을 제안합니다. 포모도로 타이머, AI 코치, 앰비언트 사운드로 생산성을 극대화하세요.',
  openGraph: {
    title: 'FocusFlow — AI 집중력 관리 앱',
    description: 'AI가 당신의 집중 패턴을 분석하고 최적의 업무 사이클을 제안합니다.',
    type: 'website',
  },
  alternates: {
    canonical: '/',
  },
}

const features = [
  {
    icon: Timer,
    title: '스마트 포모도로 타이머',
    description: '집중/휴식 사이클을 AI가 개인 패턴에 맞게 자동 최적화합니다.',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  {
    icon: Brain,
    title: 'AI 집중 코치',
    description: '"오늘 오후 2~4시가 최적 집중 시간입니다." 데이터 기반 맞춤 조언을 받으세요.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    icon: BarChart2,
    title: '집중 통계 대시보드',
    description: '일·주·월 단위 집중 시간, 패턴, 최적 시간대를 시각화합니다.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Waves,
    title: '앰비언트 사운드',
    description: '빗소리, 로파이, 카페 소음 등 집중에 최적화된 배경음을 재생하세요.',
    color: 'text-teal-500',
    bg: 'bg-teal-500/10',
  },
  {
    icon: Calendar,
    title: 'Google Calendar 연동',
    description: '집중 블록을 캘린더에 자동 예약하고 일정과 함께 관리하세요.',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    icon: Smartphone,
    title: 'PWA + 브라우저 익스텐션',
    description: '홈 화면 설치, 오프라인 지원, 방해 요소 차단까지 한 번에.',
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
  },
]

const plans = [
  {
    key: 'free',
    name: 'Free',
    price: '$0',
    period: '',
    description: '기본 집중 타이머',
    icon: Zap,
    iconColor: 'text-muted-foreground',
    features: [
      '포모도로 타이머',
      '세션 기록 및 기본 통계',
      '앰비언트 사운드 3가지',
      '7일 세션 히스토리',
    ],
    cta: '무료로 시작',
    ctaHref: '/signup',
    ctaClass: 'border border-border bg-background hover:bg-muted text-foreground',
    highlight: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$4.99',
    period: '/월',
    description: '생산성 극대화',
    icon: Sparkles,
    iconColor: 'text-purple-500',
    features: [
      'Free 모든 기능',
      'AI 패턴 분석 및 코칭',
      '무제한 앰비언트 사운드',
      '고급 통계 및 트렌드',
      '무제한 세션 히스토리',
      'Google Calendar 연동',
      '브라우저 익스텐션',
    ],
    cta: 'Pro 시작하기',
    ctaHref: '/signup?plan=pro',
    ctaClass: 'bg-purple-500 hover:bg-purple-600 text-white',
    highlight: true,
  },
  {
    key: 'team',
    name: 'Team',
    price: '$12.99',
    period: '/월',
    description: '팀 생산성 관리',
    icon: Users,
    iconColor: 'text-blue-500',
    features: ['Pro 모든 기능', '팀 공유 통계', '최대 5인 팀', '팀 대시보드'],
    cta: 'Team 시작하기',
    ctaHref: '/signup?plan=team',
    ctaClass: 'bg-primary hover:bg-primary/90 text-primary-foreground',
    highlight: false,
  },
]

const testimonials = [
  {
    name: '김민준',
    role: '프리랜서 개발자',
    avatar: 'K',
    text: 'AI 코치 덕분에 내가 오전에 집중이 잘 된다는 걸 처음 알았어요. 이제 중요한 작업은 무조건 오전에 잡습니다.',
    stars: 5,
  },
  {
    name: '이수연',
    role: '디자이너',
    avatar: 'L',
    text: '앰비언트 사운드가 정말 좋아요. 카페 소음 틀고 작업하면 집중이 두 배는 되는 것 같아요.',
    stars: 5,
  },
  {
    name: '박지호',
    role: '스타트업 CEO',
    avatar: 'P',
    text: '팀 통계 기능으로 팀원들의 집중 패턴을 파악하니 회의 시간 배치가 훨씬 효율적이 됐습니다.',
    stars: 5,
  },
]

const faqs = [
  {
    q: 'FocusFlow는 무료인가요?',
    a: '네, 기본 포모도로 타이머와 기본 통계는 영원히 무료입니다. Pro ($4.99/월)로 업그레이드하면 AI 코치, 무제한 사운드, 고급 통계를 이용할 수 있습니다.',
  },
  {
    q: 'AI 코칭은 어떻게 작동하나요?',
    a: '세션 데이터를 분석해 최적 집중 시간대, 평균 집중 지속 시간, 패턴을 파악합니다. 이를 바탕으로 일일 업무 배치 조언을 제공합니다.',
  },
  {
    q: '오프라인에서도 사용할 수 있나요?',
    a: '네. FocusFlow는 PWA(Progressive Web App)로 홈 화면에 설치하면 인터넷 없이도 타이머를 사용할 수 있습니다. 세션 데이터는 연결 시 자동 동기화됩니다.',
  },
  {
    q: '브라우저 익스텐션은 무엇인가요?',
    a: '집중 모드 활성화 시 지정한 SNS/뉴스 사이트를 자동으로 차단합니다. Chrome, Firefox, Edge를 지원합니다. Pro 플랜에 포함됩니다.',
  },
  {
    q: '언제든지 해지할 수 있나요?',
    a: '물론입니다. 결제 주기 내 언제든지 해지 가능하며, 구독 기간이 끝나면 자동으로 무료 플랜으로 전환됩니다.',
  },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="font-bold tracking-tight">
            FocusFlow
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">
              기능
            </Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">
              가격
            </Link>
            <Link href="/blog" className="hover:text-foreground transition-colors">
              블로그
            </Link>
            <Link href="/focus-test" className="hover:text-foreground transition-colors">
              집중력 테스트
            </Link>
          </nav>
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
        <section className="relative overflow-hidden px-4 py-20 sm:py-32">
          {/* Background gradient */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/5 blur-3xl" />
          </div>

          <div className="mx-auto max-w-3xl text-center space-y-8">
            {/* Product Hunt badge */}
            <a
              href="https://www.producthunt.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100 transition-colors dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-400"
            >
              <span>🚀</span>
              <span>Product Hunt에서 #1 랭크 목표!</span>
              <ArrowRight className="h-3 w-3" />
            </a>

            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                AI가 당신의 집중 패턴을
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">
                  분석하고 최적화합니다
                </span>
              </h1>
              <p className="mx-auto max-w-xl text-base text-muted-foreground sm:text-lg">
                FocusFlow는 포모도로 타이머를 넘어 AI 코치가 당신만의 집중 패턴을 파악하고 최적의
                업무 시간을 제안하는 생산성 앱입니다.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                무료로 시작하기
              </Link>
              <Link
                href="/focus-test"
                className="rounded-full border border-border px-8 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                집중력 테스트 해보기 →
              </Link>
            </div>

            {/* Social proof numbers */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Target className="h-4 w-4 text-primary" />
                <span>
                  <strong className="text-foreground">1,200+</strong> 집중 세션/일
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>
                  <strong className="text-foreground">23%</strong> 평균 생산성 향상
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>
                  <strong className="text-foreground">4.8★</strong> 사용자 평점
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="border-t border-border/50 px-4 py-16 sm:py-24 scroll-mt-14"
        >
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 text-center space-y-3">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">집중을 위한 모든 것</h2>
              <p className="text-sm text-muted-foreground">
                타이머부터 AI 코치, 방해 요소 차단까지 집중에 필요한 도구를 모두 제공합니다.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description, color, bg }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-border bg-card p-6 space-y-3 hover:border-border/80 transition-colors"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section
          id="pricing"
          className="border-t border-border/50 px-4 py-16 sm:py-24 scroll-mt-14"
        >
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 text-center space-y-3">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                간단하고 투명한 가격
              </h2>
              <p className="text-sm text-muted-foreground">
                무료로 시작하고, 필요할 때 업그레이드하세요. 언제든지 해지 가능합니다.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              {plans.map((plan) => {
                const Icon = plan.icon
                return (
                  <div
                    key={plan.key}
                    className={`relative rounded-2xl border p-6 space-y-5 ${
                      plan.highlight
                        ? 'border-purple-400 dark:border-purple-600 bg-purple-50/50 dark:bg-purple-950/20 shadow-lg shadow-purple-500/10'
                        : 'border-border bg-card'
                    }`}
                  >
                    {plan.highlight && (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-purple-500 px-4 py-0.5 text-[11px] font-semibold text-white">
                        가장 인기
                      </span>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${plan.iconColor}`} />
                        <span className="font-semibold">{plan.name}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">{plan.price}</span>
                        {plan.period && (
                          <span className="text-xs text-muted-foreground">{plan.period}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    </div>

                    <ul className="space-y-2.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs">
                          <Check className="h-3.5 w-3.5 mt-0.5 text-green-500 shrink-0" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={plan.ctaHref}
                      className={`block w-full rounded-xl py-2.5 text-center text-sm font-medium transition-colors ${plan.ctaClass}`}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="border-t border-border/50 px-4 py-16 sm:py-24">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 text-center space-y-3">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">사용자들의 이야기</h2>
              <p className="text-sm text-muted-foreground">
                실제 사용자들이 FocusFlow와 함께 경험한 변화입니다.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              {testimonials.map((t) => (
                <div
                  key={t.name}
                  className="rounded-2xl border border-border bg-card p-6 space-y-4"
                >
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Focus Test CTA Banner */}
        <section className="border-t border-border/50 px-4 py-12 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-200/50 dark:border-purple-800/50 p-8 text-center space-y-4">
              <div className="text-3xl">🧠</div>
              <h2 className="text-xl font-bold sm:text-2xl">당신의 집중력은 몇 점일까요?</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                2분만에 집중력 수준을 테스트하고, 맞춤 집중 전략을 받아보세요.
              </p>
              <Link
                href="/focus-test"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                무료로 테스트하기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border/50 px-4 py-16 sm:py-24">
          <div className="mx-auto max-w-2xl">
            <div className="mb-12 text-center space-y-3">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">자주 묻는 질문</h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-xl border border-border bg-card open:bg-muted/30"
                >
                  <summary className="flex cursor-pointer items-center justify-between p-4 text-sm font-medium list-none">
                    <span>{faq.q}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180 shrink-0 ml-2" />
                  </summary>
                  <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-border/50 px-4 py-16 text-center sm:py-24">
          <div className="mx-auto max-w-lg space-y-6">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              지금 집중을 시작하세요
            </h2>
            <p className="text-sm text-muted-foreground">
              무료로 시작하고, AI 코치와 함께 당신만의 최적 집중 루틴을 만들어보세요. 신용카드가
              필요 없습니다.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                무료 계정 만들기
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-border px-8 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                기존 계정으로 로그인
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 px-4 py-8">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="/blog" className="hover:text-foreground transition-colors">
              블로그
            </Link>
            <Link href="/focus-test" className="hover:text-foreground transition-colors">
              집중력 테스트
            </Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">
              가격
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 FocusFlow. 1인 개발자를 위해 만들었습니다.
          </p>
        </div>
      </footer>
    </div>
  )
}
