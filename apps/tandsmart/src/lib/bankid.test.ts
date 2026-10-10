import { beforeAll, describe, expect, it } from 'vitest'
import { signBankIdSession, verifyBankIdSession, BANKID_SESSION_SECONDS } from './bankid'

describe('BankID session marker', () => {
  beforeAll(() => { process.env.CRIIPTO_CLIENT_SECRET = 'test-secret' })
  const now = Date.UTC(2026, 9, 10, 12)

  it('accepts its own fresh marker for the same user', () => {
    expect(verifyBankIdSession(signBankIdSession('user-1', now), 'user-1', now + 1000)).toBe(true)
  })
  it('rejects another user, a tampered value and an expired marker', () => {
    const v = signBankIdSession('user-1', now)
    expect(verifyBankIdSession(v, 'user-2', now)).toBe(false)
    expect(verifyBankIdSession(v.replace('user-1', 'user-2'), 'user-2', now)).toBe(false)
    expect(verifyBankIdSession(v, 'user-1', now + (BANKID_SESSION_SECONDS + 1) * 1000)).toBe(false)
    expect(verifyBankIdSession(undefined, 'user-1', now)).toBe(false)
  })
})
