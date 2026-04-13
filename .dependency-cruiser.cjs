/**
 * Dependency Cruiser 규칙 — FocusFlow 아키텍처 경계 강제
 *
 * 각 규칙의 `comment`는 **수정 지시**를 포함. 에러 메시지에 그대로 흐르므로
 * 에이전트가 컨텍스트로 받음.
 *
 * 참고:
 *  - docs/design-docs/ADR-0001-supabase-client-boundaries.md
 *  - docs/design-docs/ADR-0003-payment-hardening.md
 */
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-service-from-client',
      severity: 'error',
      comment:
        '❌ Supabase service role 클라이언트를 Client Component에서 import했습니다.\n' +
        '   이유: SUPABASE_SERVICE_ROLE_KEY가 클라이언트 번들에 노출되며 RLS가 우회됩니다.\n' +
        '   수정: Client Component는 "@/lib/supabase/client"만 사용하세요.\n' +
        '          관리자 작업은 Route Handler(src/app/api/**/route.ts)로 옮기세요.\n' +
        '   참고: docs/design-docs/ADR-0001-supabase-client-boundaries.md, G-06',
      from: {
        // 'use client' 파일 식별: dependency-cruiser는 내용 검사 불가 → 경로 기반 근사.
        // Client Component 관례: src/components/** 및 *Client.tsx 파일.
        path: ['^src/components/', 'Client\\.tsx$'],
      },
      to: {
        path: '^src/lib/supabase/service\\.ts$',
      },
    },
    {
      // Server-only 파일(route.ts / middleware)에서 브라우저 클라이언트 사용 금지.
      // page.tsx는 Server/Client 혼재라 제외 (naming convention만으로 판별 불가).
      name: 'no-browser-client-from-server',
      severity: 'error',
      comment:
        '❌ Server-only 파일에서 브라우저 Supabase 클라이언트를 import했습니다.\n' +
        '   수정: 서버에서는 "@/lib/supabase/server"의 createClient()를 사용하세요.\n' +
        '   참고: docs/design-docs/ADR-0001-supabase-client-boundaries.md',
      from: {
        path: ['^src/app/api/.*/route\\.ts$', '^src/app/.*/route\\.ts$', '^middleware\\.ts$'],
      },
      to: {
        path: '^src/lib/supabase/client\\.ts$',
      },
    },
    {
      name: 'no-direct-external-sdk',
      severity: 'warn',
      comment:
        '⚠️ 외부 서비스 SDK를 직접 import하지 마세요. src/lib 래퍼를 경유하세요.\n' +
        '   이유: lazy init / 단일 진입점 / SDK 업그레이드 지점 통일 (G-05)\n' +
        '   수정:\n' +
        '     - stripe        → @/lib/stripe\n' +
        '     - @portone/*    → @/lib/portone\n' +
        '     - googleapis    → @/lib/google-calendar',
      from: {
        // 래퍼 자신은 제외. PortOne **browser** SDK는 client-only라 billing 컴포넌트에서 직접 사용 허용.
        path: ['^src/'],
        pathNot: [
          '^src/lib/stripe\\.ts$',
          '^src/lib/portone\\.ts$',
          '^src/lib/google-calendar\\.ts$',
          '^src/components/billing/', // client-only browser-sdk
        ],
      },
      to: {
        path: ['^node_modules/(stripe|@portone|googleapis)(/|$)'],
      },
    },
    {
      name: 'no-circular',
      severity: 'error',
      comment:
        '❌ 순환 import 발견. 레이어링(architecture.md)을 위반합니다. 공통 타입은 src/types/로 이동.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment:
        '⚠️ 어디서도 import되지 않는 모듈입니다. 사용 안 하면 삭제하세요 (dead code).\n' +
        '   예외: src/app 내 관례 파일(page/layout/route 등) 및 설정 파일은 orphan이 정상.',
      from: {
        orphan: true,
        pathNot: [
          '\\.d\\.ts$',
          '(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$',
          '(^|/)(babel|webpack)\\.config\\.(js|cjs|mjs|ts|json)$',
          '^src/app/.*/(page|layout|loading|error|not-found|route|opengraph-image|sitemap|robots|manifest)\\.(ts|tsx)$',
          '^src/app/(layout|page|globals\\.css|favicon\\.ico|robots|sitemap|manifest|opengraph-image)\\.(ts|tsx|css|ico)$',
          '^middleware\\.ts$',
          '^next\\.config\\.ts$',
          '^postcss\\.config\\.mjs$',
          '^eslint\\.config\\.mjs$',
          '^scripts/',
          '^src/components/pwa/ServiceWorkerRegistration\\.tsx$',
          '^src/components/pwa/PWAInstallPrompt\\.tsx$',
          '^src/types/database\\.ts$',
          '^src/lib/logger\\.ts$', // Axis 3에서 도입, 점진 채택 (TD-005)
        ],
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
    },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
}
