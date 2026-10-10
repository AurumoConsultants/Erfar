import { beforeAll, describe, expect, it } from 'vitest'
import { signBankIdSession, verifyBankIdSession, BANKID_SESSION_SECONDS, signPendingIdentity, readPendingIdentity, PENDING_SECONDS } from './bankid'

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

describe('pending BankID signup', () => {
  beforeAll(() => { process.env.CRIIPTO_CLIENT_SECRET = 'test-secret' })
  const id = { personnummer: '19730131-5078', name: 'Test Testsson', subject: 'abc' }
  const now = Date.UTC(2026, 9, 10, 12)

  it('round-trips the verified identity while fresh', () => {
    expect(readPendingIdentity(signPendingIdentity(id, now), now + 60_000)).toEqual(id)
  })
  it('rejects tampering and expiry', () => {
    const v = signPendingIdentity(id, now)
    const [body, sig] = v.split('.')
    const forged = Buffer.from(JSON.stringify({ ...id, personnummer: '19900101-1234', exp: now / 1000 + 600 })).toString('base64url')
    expect(readPendingIdentity(`${forged}.${sig}`, now)).toBeNull()
    expect(readPendingIdentity(`${body}.${sig}x`, now)).toBeNull()
    expect(readPendingIdentity(v, now + (PENDING_SECONDS + 1) * 1000)).toBeNull()
  })
})
