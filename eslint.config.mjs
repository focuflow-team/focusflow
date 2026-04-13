import next from 'eslint-config-next'
import reactHooks from 'eslint-plugin-react-hooks'
import react from 'eslint-plugin-react'

export default [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'extension/**',
      'public/**',
      'src/types/database.ts',
      'docs/**',
      '**/*.mdx',
    ],
  },
  ...next,
  {
    plugins: { 'react-hooks': reactHooks, react },
    rules: {
      // 로깅은 src/lib/logger.ts(Axis 3)로 이전 예정 (TD-005)
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // TD-007: 기존 코드 정리 전까지 warn. 정리 후 'error'로 승격.
      'react-hooks/immutability': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react/no-unescaped-entities': 'warn',
    },
  },
  {
    // Route Handlers: 구조적 로거 도입 전까지 console 허용
    files: ['src/app/api/**/route.ts'],
    rules: { 'no-console': 'off' },
  },
]
