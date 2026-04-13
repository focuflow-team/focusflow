import type { Metadata } from 'next'
import { FocusTestClient } from './FocusTestClient'

export const metadata: Metadata = {
  title: '집중력 테스트 — 당신의 집중력은 몇 점? | FocusFlow',
  description:
    '2분만에 집중력 수준을 테스트하고 맞춤 집중 전략을 받아보세요. 직장인 평균보다 높은지 확인해보세요!',
  openGraph: {
    title: '집중력 테스트 — 당신의 집중력은 몇 점?',
    description: '2분만에 집중력 수준을 테스트하고 맞춤 집중 전략을 받아보세요.',
    type: 'website',
  },
  alternates: {
    canonical: '/focus-test',
  },
}

export default function FocusTestPage() {
  return <FocusTestClient />
}
