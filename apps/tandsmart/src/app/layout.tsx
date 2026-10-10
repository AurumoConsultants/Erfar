import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Lexend } from 'next/font/google'
import Header from '@/components/Header'

// Rounded geometric sans close to the logo's wordmark, for brand headings.
const brand = Lexend({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-lexend', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://tandsmart.vercel.app'),
  title: 'Tandsmart — second opinion på din tandvård',
  description: 'Få ditt prisförslag, din vårdplan och din klinik granskade av en legitimerad tandläkare.',
}

export const viewport: Viewport = {
  themeColor: '#237a74',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className={brand.variable}>
      <body className="bg-gray-50 text-gray-900 antialiased min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">{children}</main>
        <footer className="border-t border-gray-200 bg-white">
          <div className="max-w-5xl mx-auto px-4 py-6 text-xs text-gray-500 space-y-1">
            <p>
              Tandsmart ger en rådgivande bedömning utifrån det underlag du skickar in. Den ersätter inte
              en undersökning på plats — vid akuta besvär, kontakta din klinik eller ring 1177.
            </p>
            <p className="flex flex-wrap gap-x-4 gap-y-1">
              <a href="/priser" className="underline">Referenspriser</a>
              <a href="/guider" className="underline">Prisguider</a>
              <a href="/integritet" className="underline">Integritet & personuppgifter</a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
