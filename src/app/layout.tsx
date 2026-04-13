import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration'
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://focusflow.app'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'FocusFlow — 포모도로 집중 타이머',
    template: '%s | FocusFlow',
  },
  description:
    '포모도로 기법으로 집중력을 높이세요. 타이머, 집중 통계, 앰비언트 사운드를 한곳에. 1인 개발자를 위한 생산성 앱.',
  applicationName: 'FocusFlow',
  keywords: ['포모도로', '집중', '타이머', '생산성', 'pomodoro', '뽀모도로', '집중력', '시간관리'],
  authors: [{ name: 'FocusFlow' }],
  creator: 'FocusFlow',
  publisher: 'FocusFlow',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FocusFlow',
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: BASE_URL,
    siteName: 'FocusFlow',
    title: 'FocusFlow — 포모도로 집중 타이머',
    description:
      '포모도로 기법으로 집중력을 높이세요. 타이머, 집중 통계, 앰비언트 사운드를 한곳에.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FocusFlow — 포모도로 집중 타이머',
    description:
      '포모도로 기법으로 집중력을 높이세요. 타이머, 집중 통계, 앰비언트 사운드를 한곳에.',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f8fc' },
    { media: '(prefers-color-scheme: dark)', color: '#1e1e2e' },
  ],
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${BASE_URL}/#webapp`,
      name: 'FocusFlow',
      url: BASE_URL,
      description:
        '포모도로 기법으로 집중력을 높이는 생산성 앱. 타이머, 통계, 앰비언트 사운드를 한곳에.',
      applicationCategory: 'ProductivityApplication',
      operatingSystem: 'Web, iOS, Android',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'KRW',
      },
      inLanguage: 'ko',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${BASE_URL}/#software`,
      name: 'FocusFlow',
      url: BASE_URL,
      applicationCategory: 'ProductivityApplication',
      operatingSystem: 'Web',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '120',
      },
    },
    {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#org`,
      name: 'FocusFlow',
      url: BASE_URL,
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="FocusFlow 블로그 RSS"
          href="/api/rss"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
        <ServiceWorkerRegistration />
        <PWAInstallPrompt />
      </body>
    </html>
  )
}
