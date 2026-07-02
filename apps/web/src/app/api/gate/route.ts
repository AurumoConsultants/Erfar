import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { password } = await req.json()

  if (password !== process.env.SITE_GATE_PASSWORD) {
    return NextResponse.json({ error: 'Fel lösenord.' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  // Lightweight testing gate, not real auth: keeps casual visitors out
  // before launch. Not meant to withstand a determined attacker.
  res.cookies.set('erfar_gate', 'granted', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return res
}
