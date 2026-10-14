import type { ReactNode } from 'react'

// Navy call-to-action band, matching the "Så fungerar det" band on the home page.
export default function CtaBand({ children, actions }: { children: ReactNode; actions: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-brand-navy text-white px-6 py-6 sm:px-8 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
      <div aria-hidden className="pointer-events-none absolute -bottom-16 -right-10 h-40 w-40 rounded-full bg-accent-500/30 blur-3xl" />
      <div className="relative font-brand font-semibold text-lg leading-snug">{children}</div>
      <div className="relative flex flex-wrap gap-2 shrink-0">{actions}</div>
    </div>
  )
}
