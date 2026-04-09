import type { Metadata } from 'next'
import { StatsClient } from '@/components/stats/StatsClient'

export const metadata: Metadata = {
  title: '통계',
}

export default function StatsPage() {
  return <StatsClient />
}
