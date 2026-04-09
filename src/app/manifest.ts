import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FocusFlow',
    short_name: 'FocusFlow',
    description: '포모도로 기법으로 집중력을 높이세요',
    start_url: '/app',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f8f8fc',
    theme_color: '#3b3b8c',
    categories: ['productivity', 'utilities'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    screenshots: [],
  }
}
