import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/publicPrices'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/arenden', '/granskning', '/klinik', '/api', '/auth'] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  }
}
