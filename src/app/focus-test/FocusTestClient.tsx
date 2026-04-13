'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, RefreshCw, Share2, Check } from 'lucide-react'

interface Question {
  id: number
  text: string
  options: { label: string; score: number }[]
}

const questions: Question[] = [
  {
    id: 1,
    text: '일을 시작하면 얼마나 빠르게 몰입 상태에 들어가나요?',
    options: [
      { label: '5분 이내에 바로 집중된다', score: 5 },
      { label: '10~15분 정도 걸린다', score: 3 },
      { label: '30분 이상 걸리거나 잘 안 된다', score: 1 },
    ],
  },
  {
    id: 2,
    text: '집중 중에 스마트폰을 몇 번이나 확인하나요?',
    options: [
      { label: '거의 안 본다 (1시간에 0~1회)', score: 5 },
      { label: '가끔 본다 (1시간에 2~3회)', score: 3 },
      { label: '자주 본다 (1시간에 4회 이상)', score: 1 },
    ],
  },
  {
    id: 3,
    text: '방해받지 않고 집중할 수 있는 최대 시간은?',
    options: [
      { label: '90분 이상', score: 5 },
      { label: '30~60분 정도', score: 3 },
      { label: '20분 이하', score: 1 },
    ],
  },
  {
    id: 4,
    text: '하루 중 가장 집중이 잘 되는 시간대를 알고 있나요?',
    options: [
      { label: '명확히 알고 그 시간에 중요한 일을 한다', score: 5 },
      { label: '어느 정도 알지만 잘 활용 못 한다', score: 3 },
      { label: '잘 모른다', score: 1 },
    ],
  },
  {
    id: 5,
    text: '작업 중 다른 생각(SNS, 뉴스 등)이 얼마나 자주 떠오르나요?',
    options: [
      { label: '거의 없다', score: 5 },
      { label: '가끔 있지만 금방 돌아온다', score: 3 },
      { label: '자주 있고 빠져나오기 어렵다', score: 1 },
    ],
  },
  {
    id: 6,
    text: '오늘 할 일을 시작 전에 구체적으로 계획하나요?',
    options: [
      { label: '항상 할 일 목록을 만들고 우선순위를 정한다', score: 5 },
      { label: '대략적인 계획만 있다', score: 3 },
      { label: '계획 없이 그날 느낌에 따른다', score: 1 },
    ],
  },
]

interface Result {
  title: string
  emoji: string
  description: string
  tips: string[]
  color: string
  bgColor: string
}

function getResult(score: number): Result {
  if (score >= 26) {
    return {
      title: '집중력 마스터',
      emoji: '🏆',
      description:
        '탁월한 집중력을 갖고 있습니다! 이미 생산성 전문가 수준이에요. FocusFlow의 AI 분석으로 더욱 정교하게 최적화해보세요.',
      tips: [
        'AI 코치로 집중 피크 시간을 더 정밀하게 파악하세요',
        '팀 리더보드로 동료들과 생산성을 공유해보세요',
        '심층 통계로 월간 트렌드를 분석해보세요',
      ],
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800',
    }
  } else if (score >= 18) {
    return {
      title: '집중력 중급자',
      emoji: '⚡',
      description:
        '평균 이상의 집중력을 갖고 있어요! 몇 가지 습관만 개선하면 훨씬 더 높은 생산성을 달성할 수 있습니다.',
      tips: [
        '포모도로 기법(25분 집중 + 5분 휴식)으로 집중 사이클을 잡아보세요',
        '집중 시간에는 스마트폰을 다른 방에 두어보세요',
        'AI 코치로 나만의 최적 집중 시간대를 파악하세요',
      ],
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    }
  } else {
    return {
      title: '집중력 개선 필요',
      emoji: '🌱',
      description:
        '집중력을 키울 여지가 많이 있어요! 걱정 마세요. FocusFlow로 작은 습관부터 시작하면 2주 내에 큰 변화를 느낄 수 있습니다.',
      tips: [
        '처음에는 15분 집중 세션으로 시작해 점차 늘려가세요',
        '집중할 때 앰비언트 사운드를 켜면 산만함이 줄어들어요',
        '브라우저 익스텐션으로 방해 사이트를 차단해보세요',
      ],
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
    }
  }
}

export function FocusTestClient() {
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [copied, setCopied] = useState(false)

  const totalScore = answers.reduce((sum, s) => sum + s, 0)
  const maxScore = questions.length * 5
  const scorePercent = Math.round((totalScore / maxScore) * 100)
  const result = getResult(totalScore)

  const handleOptionSelect = (score: number) => {
    setSelectedOption(score)
  }

  const handleNext = () => {
    if (selectedOption === null) return
    const newAnswers = [...answers, selectedOption]
    setAnswers(newAnswers)
    setSelectedOption(null)

    if (currentQ + 1 >= questions.length) {
      setShowResult(true)
    } else {
      setCurrentQ(currentQ + 1)
    }
  }

  const handleReset = () => {
    setCurrentQ(0)
    setAnswers([])
    setSelectedOption(null)
    setShowResult(false)
    setCopied(false)
  }

  const handleShare = async () => {
    const text = `나의 집중력 테스트 결과: ${result.title} (${scorePercent}점) 🧠\n당신은 몇 점인가요? → https://focusflow.app/focus-test`
    try {
      if (navigator.share) {
        await navigator.share({ title: '집중력 테스트', text })
      } else {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      // ignore
    }
  }

  const progress = (currentQ / questions.length) * 100

  if (showResult) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b border-border/50">
          <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
            <Link href="/" className="font-bold tracking-tight">
              FocusFlow
            </Link>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg space-y-6">
            {/* Score Card */}
            <div className={`rounded-2xl border p-8 text-center space-y-4 ${result.bgColor}`}>
              <div className="text-5xl">{result.emoji}</div>
              <div className="space-y-1">
                <h1 className={`text-2xl font-bold ${result.color}`}>{result.title}</h1>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-4xl font-bold tabular-nums">{scorePercent}</span>
                  <span className="text-lg text-muted-foreground">/ 100</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-3 w-full rounded-full bg-background/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-current transition-all duration-700"
                  style={{ width: `${scorePercent}%` }}
                />
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">{result.description}</p>
            </div>

            {/* Tips */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="font-semibold text-sm">맞춤 집중 전략</h2>
              <ul className="space-y-3">
                {result.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTAs */}
            <div className="space-y-3">
              <Link
                href="/signup"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                FocusFlow 무료로 시작하기
                <ArrowRight className="h-4 w-4" />
              </Link>

              <div className="flex gap-3">
                <button
                  onClick={handleShare}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      복사됨!
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" />
                      결과 공유하기
                    </>
                  )}
                </button>

                <button
                  onClick={handleReset}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  다시 테스트
                </button>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              친구들에게 공유해서 집중력을 비교해보세요! 🏆
            </p>
          </div>
        </main>
      </div>
    )
  }

  const question = questions[currentQ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link href="/" className="font-bold tracking-tight">
            FocusFlow
          </Link>
          <span className="text-sm text-muted-foreground">
            {currentQ + 1} / {questions.length}
          </span>
        </div>
      </header>

      {/* Progress */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg space-y-8">
          {/* Intro on first question */}
          {currentQ === 0 && (
            <div className="text-center space-y-2">
              <div className="text-4xl">🧠</div>
              <h1 className="text-xl font-bold">집중력 테스트</h1>
              <p className="text-sm text-muted-foreground">
                6가지 질문으로 집중력 수준을 파악하고 맞춤 전략을 받아보세요. 2분이면 충분합니다.
              </p>
            </div>
          )}

          {/* Question */}
          <div className="space-y-5">
            <h2 className="text-base font-semibold leading-relaxed">{question.text}</h2>

            <div className="space-y-3">
              {question.options.map((option) => (
                <button
                  key={option.score}
                  onClick={() => handleOptionSelect(option.score)}
                  className={`w-full rounded-xl border p-4 text-left text-sm transition-all ${
                    selectedOption === option.score
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 shrink-0 ${
                        selectedOption === option.score
                          ? 'border-primary bg-primary'
                          : 'border-border'
                      }`}
                    >
                      {selectedOption === option.score && (
                        <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                    {option.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={selectedOption === null}
            className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {currentQ + 1 >= questions.length ? '결과 보기' : '다음'}
          </button>
        </div>
      </main>
    </div>
  )
}
