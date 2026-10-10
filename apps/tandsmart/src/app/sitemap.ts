import type { MetadataRoute } from 'next'
import { GUIDES } from '@/lib/guides'
import { getReferencePrices, siteUrl } from '@/lib/publicPrices'

export const revalidate = 86400

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const fixed = ['', '/snabbkoll', '/priser', '/guider'].map(path => ({ url: `${base}${path}`, changeFrequency: 'weekly' as const }))
  const guides = GUIDES.map(g => ({ url: `${base}/guider/${g.slug}`, changeFrequency: 'monthly' as const }))
  // Unreachable database (e.g. at build time without env) → sitemap without code pages.
  const codes = await getReferencePrices().catch(() => [])
  return [...fixed, ...guides, ...codes.map(r => ({ url: `${base}/priser/${r.code}`, changeFrequency: 'yearly' as const }))]
}
