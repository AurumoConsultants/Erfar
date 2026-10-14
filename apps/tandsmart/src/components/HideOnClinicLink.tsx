'use client'

import { usePathname } from 'next/navigation'

// The clinic's upload page (/klinik/[token]) is reached by clinic staff from
// an e-mailed link; the site menu is not for them, so it is left out there.
export default function HideOnClinicLink({ children }: { children: React.ReactNode }) {
  return usePathname().startsWith('/klinik/') ? null : children
}
