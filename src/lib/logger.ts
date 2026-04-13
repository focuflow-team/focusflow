/**
 * 구조적 JSON logger — 서버(Route Handler / Server Component / middleware) 전용.
 *
 * 목적:
 *  - stdout에 JSON 한 줄로 출력 → Vercel / grep / jq 친화.
 *  - 개발/프로덕션 공통 포맷.
 *  - 민감 필드 자동 마스킹.
 *
 * 사용:
 *   import { logger } from '@/lib/logger'
 *   logger.info('payment.webhook.received', { paymentId, eventType })
 *   logger.error('payment.webhook.verify_failed', { error })
 *
 * 이벤트 이름은 `<domain>.<object>.<action>` 규약.
 */

type Level = 'debug' | 'info' | 'warn' | 'error'

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
  'apiKey',
  'api_key',
  'signature',
  'billingKey',
  'billing_key',
  'service_role_key',
])

function mask(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(mask)
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value)) {
    if (SENSITIVE_KEYS.has(k)) {
      out[k] = typeof v === 'string' && v.length > 8 ? `***${v.slice(-4)}` : '***'
    } else {
      out[k] = mask(v)
    }
  }
  return out
}

function emit(level: Level, event: string, fields?: Record<string, unknown>) {
  const record = {
    ts: new Date().toISOString(),
    level,
    event,
    ...(fields ? (mask(fields) as Record<string, unknown>) : {}),
  }
  const line = JSON.stringify(record)
  if (level === 'error') {
    console.error(line)
  } else if (level === 'warn') {
    console.warn(line)
  } else {
    // eslint-disable-next-line no-console
    console.log(line)
  }
}

export const logger = {
  debug: (event: string, fields?: Record<string, unknown>) => emit('debug', event, fields),
  info: (event: string, fields?: Record<string, unknown>) => emit('info', event, fields),
  warn: (event: string, fields?: Record<string, unknown>) => emit('warn', event, fields),
  error: (event: string, fields?: Record<string, unknown>) => emit('error', event, fields),
}
