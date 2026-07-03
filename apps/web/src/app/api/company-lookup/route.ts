import { NextResponse } from 'next/server'
import { isValidSwedishOrgNumber, normalizeOrgNumber } from '@/lib/validations/orgNumber'

// Looks up a company name from a Swedish organisationsnummer via apiverket.se
// (free tier: 200 calls/day). If COMPANY_LOOKUP_API_KEY isn't configured, or
// the lookup fails, callers should fall back to letting the user type the
// company name in manually — this is a convenience, not a hard requirement.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const orgNumber = searchParams.get('orgNumber') ?? ''

  if (!isValidSwedishOrgNumber(orgNumber)) {
    return NextResponse.json({ error: 'Ogiltigt organisationsnummer.' }, { status: 400 })
  }

  const apiKey = process.env.COMPANY_LOOKUP_API_KEY
  if (!apiKey) {
    return NextResponse.json({ configured: false, name: null })
  }

  const normalized = normalizeOrgNumber(orgNumber).replace('-', '')

  try {
    const res = await fetch(`https://apiverket.se/v1/companies/${normalized}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    const bodyText = await res.text()
    if (!res.ok) {
      // TEMP DEBUG: surface the real upstream response to diagnose the integration
      return NextResponse.json({
        configured: true,
        name: null,
        error: 'Företaget hittades inte. Ange namnet manuellt.',
        debugUpstreamStatus: res.status,
        debugUpstreamBody: bodyText.slice(0, 500),
      })
    }
    const data = JSON.parse(bodyText)
    return NextResponse.json({ configured: true, name: data?.name ?? null, debugUpstreamBody: bodyText.slice(0, 500) })
  } catch (e) {
    return NextResponse.json({
      configured: true,
      name: null,
      error: 'Sökningen misslyckades. Ange namnet manuellt.',
      debugError: e instanceof Error ? e.message : String(e),
    })
  }
}
