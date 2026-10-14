import { createClient } from '@supabase/supabase-js'
import { cache } from 'react'
import type { ReferencePrice } from '@/lib/pricing'

export interface PublicReferencePrice extends ReferencePrice {
  valid_year: number
  patient_note: string | null
}

// Cookie-less anon client: reference_prices is publicly readable, so the
// public price pages and the sitemap don't need a user session.
function publicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  })
}

export const getReferencePrices = cache(async (): Promise<PublicReferencePrice[]> => {
  const { data } = await publicClient()
    .from('reference_prices')
    .select('code, description, price_general, price_specialist, valid_year, patient_note')
    .order('code')
  return ((data ?? []) as PublicReferencePrice[]).map(r => ({
    ...r,
    price_general: r.price_general == null ? null : Number(r.price_general),
    price_specialist: r.price_specialist == null ? null : Number(r.price_specialist),
  }))
})

export async function getReferencePrice(code: string) {
  return (await getReferencePrices()).find(r => r.code === code) ?? null
}

// TLV groups åtgärder by their first digit. Patient-facing summary per group.
export const CODE_GROUPS: Record<string, { title: string; slug: string; text: string }> = {
  '1': { title: 'Undersökning, röntgen och utredning', slug: 'undersokning',
    text: 'Åtgärder där tandläkaren eller tandhygienisten undersöker munnen, tar röntgen eller utreder ett problem. Det är ofta här en behandling börjar — och här vårdplanen och kostnadsförslaget tas fram.' },
  '2': { title: 'Förebyggande åtgärder', slug: 'forebyggande',
    text: 'Åtgärder för att förebygga sjukdom i munnen, till exempel rådgivning, fluorbehandling, tandstensborttagning och profylaxskenor.' },
  '3': { title: 'Sjukdoms- och smärtbehandling', slug: 'sjukdomsbehandling',
    text: 'Behandling av sjukdomar och smärttillstånd som inte är fyllningar eller kirurgi — till exempel behandling av tandköttssjukdom (parodontit) eller akuta besvär. Koderna skiljer sig främst i hur omfattande och tidskrävande behandlingen är.' },
  '4': { title: 'Kirurgi och implantat', slug: 'kirurgi',
    text: 'Tanduttagningar, käkkirurgi och den kirurgiska delen av implantatbehandling, till exempel att operera in implantat eller bygga upp käkbenet.' },
  '5': { title: 'Rotbehandling', slug: 'rotbehandling',
    text: 'Rensning och rotfyllning av tandens rotkanaler när nerven är inflammerad eller död. Priset beror främst på hur många rotkanaler tanden har.' },
  '6': { title: 'Bettfysiologi', slug: 'bettfysiologi',
    text: 'Behandling av besvär från käkleder och tuggmuskler, till exempel bettskenor vid tandgnissling.' },
  '7': { title: 'Fyllningar och reparationer', slug: 'fyllningar',
    text: 'Lagning av tänder med fyllning. Priset beror på hur många av tandens ytor som lagas och om det är en framtand eller kindtand.' },
  '8': { title: 'Protetik: kronor, broar, proteser och implantatkronor', slug: 'protetik',
    text: 'Ersättning eller förstärkning av tänder — kronor, broar, proteser och kronor på implantat. Här ligger ofta de största posterna i ett kostnadsförslag, och det är här det lönar sig mest att jämföra.' },
  '9': { title: 'Tandreglering och utbytesåtgärder', slug: 'tandreglering',
    text: 'Tandreglering samt utbytesåtgärder — när du väljer en annan behandling än den som ger ersättning, och stödet räknas på den ersättningsberättigande behandlingen.' },
}

export function groupOf(code: string) {
  return CODE_GROUPS[code.charAt(0)] ?? null
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'https://tandsmart.vercel.app').replace(/\/$/, '')
}
