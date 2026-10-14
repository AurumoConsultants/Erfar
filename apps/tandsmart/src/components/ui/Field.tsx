import type { ReactNode } from 'react'

// Shared input/textarea/select styling — apply via className on the actual
// form element; Field itself only wraps the label + hint/error text, since
// a single polymorphic input component would need to cover too many native
// element types (text, textarea, select, date...) for real benefit here.
export function fieldInputClassName(className = '') {
  return `w-full border border-gray-300 rounded-lg px-3 py-2 min-h-11 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 ${className}`
}

interface FieldProps {
  label: string
  htmlFor?: string
  children: ReactNode
  hint?: string
  error?: string
}

export default function Field({ label, htmlFor, children, hint, error }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium mb-1">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
