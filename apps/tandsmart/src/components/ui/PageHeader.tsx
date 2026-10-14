import type { ReactNode } from 'react'
import Icon, { type IconName } from '@/components/Icon'

// Page title band in the brand style: soft teal gradient, icon chip,
// navy brand-font heading. Used on the patient and dentist pages.
export default function PageHeader({ icon, eyebrow, title, badge, children, actions }: {
  icon: IconName
  eyebrow?: string
  title: string
  badge?: ReactNode
  children?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-accent-100 bg-gradient-to-br from-accent-50 via-white to-accent-100 px-5 py-6 sm:px-8">
      <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-accent-200/40 blur-3xl" />
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-600 text-white shadow-lg shadow-accent-600/20">
          <Icon name={icon} className="h-7 w-7" />
        </span>
        <div className="min-w-0 flex-1">
          {eyebrow && <p className="font-brand font-semibold text-accent-600 uppercase tracking-wider text-xs">{eyebrow}</p>}
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{title}</h1>
            {badge}
          </div>
          {children && <div className="text-sm text-gray-600 mt-1">{children}</div>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
