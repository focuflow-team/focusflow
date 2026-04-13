import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger } from './logger'

describe('logger', () => {
  let spy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    spy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })
  afterEach(() => spy.mockRestore())

  function parse(call: number) {
    return JSON.parse(String(spy.mock.calls[call]?.[0]))
  }

  it('emits JSON with ts/level/event', () => {
    logger.info('payment.webhook.received', { paymentId: 'pay_1' })
    const record = parse(0)
    expect(record.level).toBe('info')
    expect(record.event).toBe('payment.webhook.received')
    expect(record.paymentId).toBe('pay_1')
    expect(typeof record.ts).toBe('string')
    expect(new Date(record.ts).toString()).not.toBe('Invalid Date')
  })

  it('masks sensitive keys', () => {
    logger.info('auth.login', {
      password: 'topsecretvalue',
      token: 'abc',
      nested: { apiKey: 'k_1234567890', safe: 'ok' },
    })
    const record = parse(0)
    expect(record.password).toBe('***alue')
    expect(record.token).toBe('***')
    expect(record.nested.apiKey).toBe('***7890')
    expect(record.nested.safe).toBe('ok')
  })

  it('error/warn routes to console.error/warn', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logger.error('x.y.failed', { code: 500 })
    logger.warn('x.y.degraded')
    expect(errSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalledTimes(1)
    errSpy.mockRestore()
    warnSpy.mockRestore()
  })
})
