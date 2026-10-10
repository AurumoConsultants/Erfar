import Image from 'next/image'
import Link from 'next/link'
import { getProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import HideOnClinicLink from '@/components/HideOnClinicLink'

export default async function Header() {
  const profile = await getProfile()
  // Dentists see how many cases have unread messages next to "Granskning".
  let unreadCases = 0
  if (profile?.role === 'tandlakare') {
    const supabase = await createClient()
    const { data } = await supabase.rpc('unread_message_counts')
    unreadCases = data?.length ?? 0
  }

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="shrink-0" aria-label="Tandsmart — till startsidan">
          <Image src="/tandsmart-logo.png" alt="Tandsmart" width={1284} height={332} priority
            className="h-8 sm:h-9 w-auto" />
        </Link>
        <HideOnClinicLink>
        <nav className="flex items-center gap-4 text-sm font-brand font-semibold">
          <Link href="/priser" className="text-brand-navy/80 hover:text-accent-600 hidden sm:inline">Priser</Link>
          {profile?.role !== 'tandlakare' && (
            <Link href="/snabbkoll" className="text-brand-navy/80 hover:text-accent-600">Snabbkoll</Link>
          )}
          {profile?.role === 'tandlakare' && (
            <>
              <Link href={unreadCases ? '/granskning?status=olasta' : '/granskning'} className="text-brand-navy/80 hover:text-accent-600 inline-flex items-center gap-1.5">
                Granskning
                {unreadCases > 0 && (
                  <span className="rounded-full bg-red-600 text-white text-xs font-bold min-w-5 h-5 px-1.5 inline-flex items-center justify-center"
                    aria-label={`${unreadCases} ärenden med olästa meddelanden`}>{unreadCases}</span>
                )}
              </Link>
              <Link href="/granskning/referenspriser" className="text-brand-navy/80 hover:text-accent-600 hidden sm:inline">Referenspriser</Link>
            </>
          )}
          {profile?.role === 'patient' && (
            <Link href="/arenden" className="text-brand-navy/80 hover:text-accent-600">Mina ärenden</Link>
          )}
          {profile && (
            <Link href="/profil" className="text-brand-navy/80 hover:text-accent-600 hidden sm:inline">Min profil</Link>
          )}
          {profile ? (
            <form action="/auth/logout" method="post">
              <button className="text-gray-500 hover:text-accent-600 font-brand font-semibold">Logga ut</button>
            </form>
          ) : (
            <Link href="/auth/login" className="font-semibold text-accent-700">Logga in</Link>
          )}
        </nav>
        </HideOnClinicLink>
      </div>
    </header>
  )
}
