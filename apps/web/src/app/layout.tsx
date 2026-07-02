import type { Metadata } from 'next'
import './globals.css'
import { I18nProvider } from '@/lib/i18n'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  title: 'Erfar — Bättre byggprojekt',
  description: 'Kunskapsbank för lärdomar från byggprojekt',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <I18nProvider>
          {children}
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  )
}
