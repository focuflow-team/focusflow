import { NextResponse } from 'next/server'
import { getAllPosts } from '@/lib/blog'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://focusflow.app'

function escapeXml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const posts = getAllPosts()

  const items = posts
    .map((post) => {
      const pubDate = new Date(post.date).toUTCString()
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${BASE_URL}/blog/${post.slug}</link>
      <guid isPermaLink="true">${BASE_URL}/blog/${post.slug}</guid>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${pubDate}</pubDate>
      ${post.tags.map((t) => `<category>${escapeXml(t)}</category>`).join('\n      ')}
      <author>${escapeXml(post.author)}</author>
    </item>`
    })
    .join('')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>FocusFlow 블로그</title>
    <link>${BASE_URL}/blog</link>
    <description>포모도로, 집중력, 생산성에 관한 과학 기반 가이드</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/api/rss" rel="self" type="application/rss+xml"/>
    <managingEditor>team@focusflow.app (FocusFlow 팀)</managingEditor>
    <webMaster>team@focusflow.app (FocusFlow 팀)</webMaster>
    <image>
      <url>${BASE_URL}/icons/icon-192.png</url>
      <title>FocusFlow 블로그</title>
      <link>${BASE_URL}/blog</link>
    </image>${items}
  </channel>
</rss>`

  return new NextResponse(rss, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
