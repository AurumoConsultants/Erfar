import Image from 'next/image'
import Link from 'next/link'
import { getProfile } from '@/lib/auth'

export default async function Header() {
  const profile = await getProfile()

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="shrink-0" aria-label="Tandsmart — till startsidan">
          <Image src="/tandsmart-logo.png" alt="Tandsmart" width={1284} height={332} priority
            className="h-8 sm:h-9 w-auto" />
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/priser" className="text-gray-600 hover:text-gray-900 hidden sm:inline">Priser</Link>
          <Link href="/snabbkoll" className="text-gray-600 hover:text-gray-900">Snabbkoll</Link>
          {profile?.role === 'tandlakare' && (
            <>
              <Link href="/granskning" className="text-gray-600 hover:text-gray-900">Granskning</Link>
              <Link href="/granskning/referenspriser" className="text-gray-600 hover:text-gray-900 hidden sm:inline">Referenspriser</Link>
            </>
          )}
          {profile?.role === 'patient' && (
            <Link href="/arenden" className="text-gray-600 hover:text-gray-900">Mina ärenden</Link>
          )}
          {profile ? (
            <form action="/auth/logout" method="post">
              <button className="text-gray-500 hover:text-gray-900">Logga ut</button>
            </form>
          ) : (
            <Link href="/auth/login" className="font-semibold text-accent-700">Logga in</Link>
          )}
        </nav>
      </div>
    </header>
  )
}
