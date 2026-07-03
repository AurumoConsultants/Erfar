'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'
import type { Profile } from '@erfar/shared'

interface NavbarProps { profile: Profile; companyName?: string | null }

export default function Navbar({ profile, companyName }: NavbarProps) {
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const links = [
    { href: '/dashboard', label: t.nav.dashboard },
    { href: '/projects', label: t.nav.projects },
    { href: '/knowledge-base', label: t.nav.knowledgeBase },
    { href: '/reports', label: t.nav.reports },
    ...(profile.role === 'client' ? [{ href: '/company/viewers', label: t.nav.companyViewers }] : []),
  ]

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center">
          <Image src="/logo.png" alt="Erfar" width={110} height={35} className="h-8 w-auto" priority />
        </Link>
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className={`text-sm font-medium transition ${pathname.startsWith(l.href) ? 'text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>
            {l.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">{companyName ?? profile.full_name}</span>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium capitalize">{profile.role}</span>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-900 transition">
          {t.common.logout}
        </button>
      </div>
    </nav>
  )
}
