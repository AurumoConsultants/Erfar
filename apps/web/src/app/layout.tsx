import type { Metadata, Viewport } from 'next'
import './globals.css'
import { I18nProvider } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'Erfar — Bättre byggprojekt',
  description: 'Kunskapsbank för lärdomar från byggprojekt',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Erfar',
  },
}

export const viewport: Viewport = {
  themeColor: '#d46740',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  )
}
