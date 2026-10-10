import { NextResponse } from 'next/server'
import { dentistOrError } from '@/lib/apiAuth'

// Company facts for the clinic review via apiverket.se (same provider as
// Erfar's company lookup). Optional: without COMPANY_LOOKUP_API_KEY the
// dentist uses the manual source links instead. The response shape beyond
// `name` isn't guaranteed, so the raw record is passed through for display.
export async function GET(req: Request) {
  const dentist = await dentistOrError()
  if (dentist instanceof NextResponse) return dentist

  const digits = (new URL(req.url).searchParams.get('orgNumber') ?? '').replace(/\D/g, '')
  if (digits.length !== 10) return NextResponse.json({ error: 'Ogiltigt organisationsnummer.' }, { status: 400 })

  const apiKey = process.env.COMPANY_LOOKUP_API_KEY
  if (!apiKey) return NextResponse.json({ configured: false })

  try {
    const res = await fetch(`https://apiverket.se/v1/companies/${digits}`, { headers: { Authorization: `Bearer ${apiKey}` } })
    if (!res.ok) return NextResponse.json({ configured: true, company: null, error: 'Företaget hittades inte.' })
    const { data } = await res.json()
    return NextResponse.json({ configured: true, company: data ?? null })
  } catch {
    return NextResponse.json({ configured: true, company: null, error: 'Sökningen misslyckades.' })
  }
}
