import Image from 'next/image'
import Link from 'next/link'
import { getProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import HideOnClinicLink from '@/components/HideOnClinicLink'
import MobileMenu, { type MenuLink } from '@/components/MobileMenu'

export default async function Header() {
  const profile = await getProfile()
  // Dentists see how many cases have unread messages next to "Granskning".
  let unreadCases = 0
  if (profile?.role === 'tandlakare') {
    const supabase = await createClient()
    const { data } = await supabase.rpc('unread_message_counts')
    unreadCases = data?.length ?? 0
  }

  const isDentist = profile?.role === 'tandlakare'
  const links: MenuLink[] = [
    { href: '/priser', label: 'Tandvårdspriser' },
    ...(isDentist
      ? [
          { href: unreadCases ? '/granskning?status=olasta' : '/granskning', label: 'Granskning', badge: unreadCases },
          { href: '/granskning/startsamtal', label: 'Startsamtal' },
          { href: '/granskning/referenspriser', label: 'Referenspriser' },
        ]
      : [{ href: '/snabbkoll', label: 'Snabbkoll' }]),
    ...(profile?.role === 'patient' ? [{ href: '/arenden', label: 'Mina ärenden' }] : []),
    ...(profile ? [{ href: '/profil', label: 'Min profil' }] : []),
  ]

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="shrink-0" aria-label="Tandsmart — till startsidan">
          <Image src="/tandsmart-logo.png" alt="Tandsmart" width={1284} height={332} priority
            className="h-8 sm:h-9 w-auto" />
        </Link>
        <HideOnClinicLink>
          <nav className="hidden md:flex items-center gap-5 text-sm font-brand font-semibold">
            {links.map(l => (
              <Link key={l.href} href={l.href} className="text-brand-navy/80 hover:text-accent-600 inline-flex items-center gap-1.5">
                {l.label}
                {!!l.badge && (
                  <span className="rounded-full bg-red-600 text-white text-xs font-bold min-w-5 h-5 px-1.5 inline-flex items-center justify-center"
                    aria-label={`${l.badge} ärenden med olästa meddelanden`}>{l.badge}</span>
                )}
              </Link>
            ))}
            {profile ? (
              <form action="/auth/logout" method="post">
                <button className="text-gray-500 hover:text-accent-600 font-brand font-semibold">Logga ut</button>
              </form>
            ) : (
              <Link href="/auth/login" className="font-semibold text-accent-700">Logga in</Link>
            )}
          </nav>
          <MobileMenu links={links} signedIn={!!profile} />
        </HideOnClinicLink>
      </div>
    </header>
  )
}
