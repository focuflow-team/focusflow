import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'
import { Calendar, Tag, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: '블로그 — 생산성과 집중력 가이드',
  description:
    '포모도로 기법, 집중력 향상, 재택근무 생산성 등 과학이 검증한 생산성 전략을 소개합니다.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'FocusFlow 블로그 — 생산성과 집중력 가이드',
    description:
      '포모도로 기법, 집중력 향상, 재택근무 생산성 등 과학이 검증한 생산성 전략을 소개합니다.',
    type: 'website',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'FocusFlow 블로그',
  description: '생산성과 집중력에 관한 과학 기반 가이드',
  url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://focusflow.app'}/blog`,
  publisher: {
    '@type': 'Organization',
    name: 'FocusFlow',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://focusflow.app',
  },
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card/50">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← FocusFlow 홈
            </Link>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              블로그
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              포모도로, 집중력, 생산성에 관한 과학 기반 가이드
            </p>
          </div>
        </div>

        {/* Post List */}
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md sm:p-8"
              >
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(post.date)}
                    </span>
                    <span>·</span>
                    <span>{post.author}</span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors sm:text-2xl">
                    {post.title}
                  </h2>
                  <p className="mt-3 text-muted-foreground leading-relaxed">
                    {post.description}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className="flex flex-wrap gap-2">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                      읽기 <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
