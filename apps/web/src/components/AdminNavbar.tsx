'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'

export default function AdminNavbar() {
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const links = [
    { href: '/admin', label: t.admin.overview, exact: true },
    { href: '/admin/users', label: t.admin.users },
    { href: '/admin/companies', label: t.admin.companies },
    { href: '/admin/projects', label: t.admin.projects },
    { href: '/admin/lessons', label: t.admin.lessons },
  ]

  return (
    <nav className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/admin" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Erfar" width={90} height={28} className="h-7 w-auto bg-white rounded px-1" priority />
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-300">{t.admin.title}</span>
        </Link>
        {links.map(l => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href)
          return (
            <Link key={l.href} href={l.href}
              className={`text-sm font-medium transition ${active ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
              {l.label}
            </Link>
          )
        })}
      </div>
      <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition">
        {t.common.logout}
      </button>
    </nav>
  )
}
