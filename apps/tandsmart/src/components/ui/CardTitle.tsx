import type { ReactNode } from 'react'
import Icon, { type IconName } from '@/components/Icon'

// Card heading with a small icon chip, matching PageHeader.
export default function CardTitle({ icon, children, className = '' }: { icon: IconName; children: ReactNode; className?: string }) {
  return (
    <h2 className={`flex items-center gap-3 text-lg font-bold ${className}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-700">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <span className="min-w-0">{children}</span>
    </h2>
  )
}
