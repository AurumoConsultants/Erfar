import type { HTMLAttributes } from 'react'

export default function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`bg-white border border-gray-200 rounded-2xl p-5 shadow-sm ${className}`} {...props} />
}
