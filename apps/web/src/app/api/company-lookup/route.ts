import { NextResponse } from 'next/server'
import { isValidSwedishOrgNumber, normalizeOrgNumber } from '@/lib/validations/orgNumber'

interface CompanySearchResult {
  name: string
  orgNumber: string
}

// Looks up Swedish company data via apiverket.se (free tier: 200 calls/day).
// Supports two directions:
//   ?orgNumber=... -> single company name (existing org-number -> name lookup)
//   ?name=...      -> list of matching companies with their org numbers
// If COMPANY_LOOKUP_API_KEY isn't configured, or the lookup fails, callers
// should fall back to letting the user type the details in manually — this
// is a convenience, not a hard requirement.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const orgNumber = searchParams.get('orgNumber')
  const name = searchParams.get('name')

  const apiKey = process.env.COMPANY_LOOKUP_API_KEY
  if (!apiKey) return NextResponse.json({ configured: false, name: null, results: [] })

  if (name !== null) {
    const query = name.trim()
    if (!query) return NextResponse.json({ error: 'Ange ett företagsnamn.' }, { status: 400 })

    try {
      const res = await fetch(`https://apiverket.se/v1/companies/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      if (!res.ok) {
        return NextResponse.json({ configured: true, results: [], error: 'Inga företag hittades. Ange uppgifterna manuellt.' })
      }
      const json = await res.json()
      // Confirmed shape: { meta: {...}, data: { total, query, companies: [...] } }
      const raw: any[] = Array.isArray(json?.data?.companies) ? json.data.companies
        : Array.isArray(json?.data) ? json.data
        : Array.isArray(json?.results) ? json.results
        : Array.isArray(json) ? json
        : []
      const results: CompanySearchResult[] = raw
        .map((item): CompanySearchResult => ({
          name: item?.name ?? item?.company_name ?? '',
          orgNumber: item?.org_number ?? item?.orgNumber ?? item?.organisationsnummer ?? '',
        }))
        .filter(r => r.name && r.orgNumber)
        .slice(0, 8)

      return NextResponse.json({
        configured: true,
        results,
        error: results.length ? undefined : 'Inga företag hittades. Ange uppgifterna manuellt.',
      })
    } catch {
      return NextResponse.json({ configured: true, results: [], error: 'Sökningen misslyckades. Ange uppgifterna manuellt.' })
    }
  }

  if (!isValidSwedishOrgNumber(orgNumber ?? '')) {
    return NextResponse.json({ error: 'Ogiltigt organisationsnummer.' }, { status: 400 })
  }

  const normalized = normalizeOrgNumber(orgNumber ?? '').replace('-', '')

  try {
    const res = await fetch(`https://apiverket.se/v1/companies/${normalized}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!res.ok) {
      return NextResponse.json({ configured: true, name: null, error: 'Företaget hittades inte. Ange namnet manuellt.' })
    }
    // Response shape: { meta: {...}, data: { name, org_number, ... } }
    const { data } = await res.json()
    return NextResponse.json({ configured: true, name: data?.name ?? null })
  } catch {
    return NextResponse.json({ configured: true, name: null, error: 'Sökningen misslyckades. Ange namnet manuellt.' })
  }
}
