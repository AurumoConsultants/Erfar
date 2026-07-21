'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'
import { ROLE_LABELS } from '@erfar/shared'
import type { Profile } from '@erfar/shared'

interface NavbarProps { profile: Profile; companyName?: string | null }

export default function Navbar({ profile, companyName }: NavbarProps) {
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  // mobila användare only log lessons — no review, no invites, no
  // knowledge-base browsing beyond what a project page needs to function.
  const isMobileUser = profile.role === 'mobil_anvandare'

  const links = [
    { href: '/dashboard', label: t.nav.dashboard },
    { href: '/projects', label: t.nav.projects },
    ...(isMobileUser ? [] : [{ href: '/knowledge-base', label: t.nav.knowledgeBase }]),
    ...(isMobileUser ? [] : [{ href: '/reports', label: t.nav.reports }]),
    ...(profile.role === 'client' ? [{ href: '/company/viewers', label: t.nav.companyViewers }] : []),
    ...(profile.role === 'client' || profile.role === 'entrepreneur'
      ? [{ href: '/company/mobile-users', label: t.nav.mobileUsers }]
      : []),
  ]

  return (
    <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center" onClick={() => setMenuOpen(false)}>
            <Image src="/logo.png" alt="Erfar" width={110} height={35} className="h-8 w-auto" priority />
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {links.map(l => (
              <Link key={l.href} href={l.href}
                className={`text-sm font-medium transition ${pathname.startsWith(l.href) ? 'text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
          {profile.is_admin && (
            <Link href="/admin" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
              {t.admin.title}
            </Link>
          )}
          <span className="text-sm text-gray-500">{companyName ?? profile.full_name}</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{ROLE_LABELS[profile.role]}</span>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-900 transition">
            {t.common.logout}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen(o => !o)}
          aria-label={menuOpen ? 'Stäng meny' : 'Öppna meny'}
          aria-expanded={menuOpen}
          className="md:hidden flex items-center justify-center w-11 h-11 -mr-2 text-gray-600"
        >
          {menuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden absolute left-0 right-0 top-full bg-white border-b border-gray-200 shadow-sm z-10">
          <div className="flex flex-col py-2">
            {links.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                className={`px-4 py-3 text-sm font-medium min-h-11 flex items-center transition ${pathname.startsWith(l.href) ? 'text-blue-700 bg-blue-50' : 'text-gray-600'}`}>
                {l.label}
              </Link>
            ))}
            {profile.is_admin && (
              <Link href="/admin" onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-sm font-medium min-h-11 flex items-center text-gray-600">
                {t.admin.title}
              </Link>
            )}
            <div className="px-4 pt-3 pb-2 border-t border-gray-100 mt-1 flex items-center gap-2">
              <span className="text-sm text-gray-500">{companyName ?? profile.full_name}</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{ROLE_LABELS[profile.role]}</span>
            </div>
            <button onClick={handleLogout} className="px-4 py-3 text-sm font-medium min-h-11 flex items-center text-left text-gray-600">
              {t.common.logout}
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
