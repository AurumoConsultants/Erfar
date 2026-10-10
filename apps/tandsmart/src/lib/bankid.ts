import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'
import { normalizePersonnummer } from '@/lib/clinicRequest'

// Swedish BankID through an OpenID Connect e-ID broker (Criipto/Idura).
// Endpoints come from the broker's discovery document, so switching from the
// test tenant to production is only a change of env vars.
//   CRIIPTO_DOMAIN         e.g. tandsmart-test.criipto.id
//   CRIIPTO_CLIENT_ID      the application's client id ("realm")
//   CRIIPTO_CLIENT_SECRET  client secret (code flow)

export const BANKID_ACR = 'urn:grn:authn:se:bankid'
export const OIDC_COOKIE = 'ts_oidc'
export const BANKID_COOKIE = 'ts_bankid'
// How long a BankID login counts as "signed in with BankID" for video calls.
export const BANKID_SESSION_SECONDS = 12 * 60 * 60

export function bankIdConfigured() {
  return Boolean(process.env.CRIIPTO_DOMAIN && process.env.CRIIPTO_CLIENT_ID && process.env.CRIIPTO_CLIENT_SECRET)
}

interface Discovery { authorization_endpoint: string; token_endpoint: string; jwks_uri: string; issuer: string }

let discovery: Promise<Discovery> | null = null
function getDiscovery(): Promise<Discovery> {
  discovery ??= fetch(`https://${process.env.CRIIPTO_DOMAIN}/.well-known/openid-configuration`)
    .then(r => {
      if (!r.ok) throw new Error(`OIDC discovery failed: ${r.status}`)
      return r.json() as Promise<Discovery>
    })
    .catch(e => { discovery = null; throw e })
  return discovery
}

export const randomToken = () => randomBytes(24).toString('base64url')

export async function authorizeUrl(redirectUri: string, state: string, nonce: string) {
  const d = await getDiscovery()
  const url = new URL(d.authorization_endpoint)
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.CRIIPTO_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: 'openid',
    acr_values: BANKID_ACR,
    state,
    nonce,
    prompt: 'login',
  }).toString()
  return url.toString()
}

export interface BankIdIdentity { personnummer: string; name: string; subject: string }

// Exchanges the authorization code and verifies the signed ID token.
export async function completeLogin(code: string, redirectUri: string, nonce: string): Promise<BankIdIdentity> {
  const d = await getDiscovery()
  const basic = Buffer.from(
    `${encodeURIComponent(process.env.CRIIPTO_CLIENT_ID!)}:${encodeURIComponent(process.env.CRIIPTO_CLIENT_SECRET!)}`,
  ).toString('base64')
  const res = await fetch(d.token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${basic}` },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri }),
  })
  if (!res.ok) throw new Error(`token exchange failed: ${res.status}`)
  const { id_token } = await res.json() as { id_token?: string }
  if (!id_token) throw new Error('no id_token')

  const { payload } = await jwtVerify(id_token, createRemoteJWKSet(new URL(d.jwks_uri)), {
    issuer: d.issuer,
    audience: process.env.CRIIPTO_CLIENT_ID!,
  })
  if (payload.nonce !== nonce) throw new Error('nonce mismatch')

  const personnummer = normalizePersonnummer(pickSsn(payload) ?? '')
  if (!personnummer) throw new Error('no valid personnummer in id_token')
  const name = String(payload.name ?? [payload.given_name, payload.family_name].filter(Boolean).join(' '))
  return { personnummer, name, subject: String(payload.sub) }
}

// Brokers name the personnummer claim differently; accept the common ones.
function pickSsn(p: JWTPayload): string | null {
  for (const key of ['ssn', 'socialno', 'personalNumber', 'personal_number', 'https://data.criipto.id/socialno']) {
    const v = p[key]
    if (typeof v === 'string' && v.trim()) return v
  }
  return null
}

// --- "Signed in with BankID" marker -------------------------------------
// An HMAC-signed cookie binding the Supabase user id to the time of the
// BankID login. Video calls require it in addition to a verified profile.

function sessionKey() {
  return createHmac('sha256', 'tandsmart-bankid-session').update(process.env.CRIIPTO_CLIENT_SECRET ?? '').digest()
}

export function signBankIdSession(userId: string, now = Date.now()) {
  const body = `${userId}.${Math.floor(now / 1000)}`
  const sig = createHmac('sha256', sessionKey()).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifyBankIdSession(value: string | undefined, userId: string, now = Date.now()): boolean {
  if (!value || !process.env.CRIIPTO_CLIENT_SECRET) return false
  const parts = value.split('.')
  if (parts.length !== 3) return false
  const [uid, ts, sig] = parts
  const expected = createHmac('sha256', sessionKey()).update(`${uid}.${ts}`).digest()
  const given = Buffer.from(sig, 'base64url')
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false
  return uid === userId && now / 1000 - Number(ts) < BANKID_SESSION_SECONDS
}

// --- Pending BankID signup --------------------------------------------------
// When BankID succeeds but no account has this personnummer, the verified
// identity is parked in a short-lived signed cookie while the patient adds an
// e-mail address and consents on /auth/registrera/bankid.

export const BANKID_PENDING_COOKIE = 'ts_bankid_pending'
export const PENDING_SECONDS = 15 * 60

export function signPendingIdentity(identity: BankIdIdentity, now = Date.now()) {
  const body = Buffer.from(JSON.stringify({ ...identity, exp: Math.floor(now / 1000) + PENDING_SECONDS })).toString('base64url')
  return `${body}.${createHmac('sha256', sessionKey()).update(`pending.${body}`).digest('base64url')}`
}

export function readPendingIdentity(value: string | undefined, now = Date.now()): BankIdIdentity | null {
  if (!value || !process.env.CRIIPTO_CLIENT_SECRET) return null
  const [body, sig] = value.split('.')
  if (!body || !sig) return null
  const expected = createHmac('sha256', sessionKey()).update(`pending.${body}`).digest()
  const given = Buffer.from(sig, 'base64url')
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null
  const data = JSON.parse(Buffer.from(body, 'base64url').toString()) as BankIdIdentity & { exp: number }
  if (now / 1000 > data.exp) return null
  return { personnummer: data.personnummer, name: data.name, subject: data.subject }
}
