import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { OIDC_COOKIE, authorizeUrl, bankIdConfigured, randomToken } from '@/lib/bankid'

// Starts a BankID login at the e-ID broker. `next` is where to land after,
// e.g. /video/<id> or /profil.
export async function GET(request: Request) {
  const url = new URL(request.url)
  if (!bankIdConfigured()) {
    return NextResponse.redirect(new URL('/auth/login?bankid=ej-aktiverat', url))
  }
  const nextParam = url.searchParams.get('next') ?? '/profil'
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/profil'
  const state = randomToken()
  const nonce = randomToken()
  const redirectUri = `${url.origin}/auth/bankid/callback`

  const cookieStore = await cookies()
  cookieStore.set(OIDC_COOKIE, JSON.stringify({ state, nonce, next }), {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/auth/bankid', maxAge: 600,
  })
  return NextResponse.redirect(await authorizeUrl(redirectUri, state, nonce))
}
