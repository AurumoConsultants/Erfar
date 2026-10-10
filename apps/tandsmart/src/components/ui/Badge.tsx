import type { HTMLAttributes } from 'react'

export type BadgeTone = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'accent'

const toneClasses: Record<BadgeTone, string> = {
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  neutral: 'bg-gray-100 text-gray-600',
  accent: 'bg-accent-100 text-accent-700',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

export default function Badge({ tone = 'neutral', className = '', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${toneClasses[tone]} ${className}`}
      {...props}
    />
  )
}
