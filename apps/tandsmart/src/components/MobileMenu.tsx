'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export interface MenuLink { href: string; label: string; badge?: number }

// Hamburger menu for small screens. The header passes the same links the
// desktop nav shows; the panel closes on navigation and on Escape.
export default function MobileMenu({ links, signedIn }: { links: MenuLink[]; signedIn: boolean }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const badgeTotal = links.reduce((n, l) => n + (l.badge ?? 0), 0)

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="md:hidden">
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-controls="mobile-menu"
        aria-label={open ? 'Stäng menyn' : 'Öppna menyn'}
        className="relative -mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-brand-navy hover:bg-accent-50">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-6 w-6" aria-hidden>
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
        {badgeTotal > 0 && !open && (
          <span aria-hidden className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white" />
        )}
      </button>

      {open && (
        <>
          <div aria-hidden className="absolute inset-x-0 top-16 h-dvh bg-brand-navy/20" onClick={() => setOpen(false)} />
          <nav id="mobile-menu" className="absolute inset-x-0 top-16 border-b border-gray-200 bg-white shadow-lg">
            <ul className="max-w-5xl mx-auto px-4 py-2 font-brand font-semibold text-brand-navy">
              {links.map(l => {
                const active = pathname === l.href.split('?')[0]
                return (
                  <li key={l.href}>
                    <Link href={l.href} onClick={() => setOpen(false)}
                      className={`flex items-center justify-between rounded-lg px-3 py-3 hover:bg-accent-50 ${active ? 'text-accent-700' : ''}`}>
                      {l.label}
                      {!!l.badge && (
                        <span className="rounded-full bg-red-600 text-white text-xs font-bold min-w-5 h-5 px-1.5 inline-flex items-center justify-center">{l.badge}</span>
                      )}
                    </Link>
                  </li>
                )
              })}
              <li className="border-t border-gray-100 mt-1 pt-1">
                {signedIn ? (
                  <form action="/auth/logout" method="post">
                    <button className="w-full text-left rounded-lg px-3 py-3 text-gray-500 hover:bg-accent-50">Logga ut</button>
                  </form>
                ) : (
                  <Link href="/auth/login" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 text-accent-700 hover:bg-accent-50">Logga in</Link>
                )}
              </li>
            </ul>
          </nav>
        </>
      )}
    </div>
  )
}
