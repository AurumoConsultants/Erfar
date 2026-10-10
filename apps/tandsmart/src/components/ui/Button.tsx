import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'destructive'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent-600 text-white hover:bg-accent-700 focus-visible:ring-accent-500',
  secondary: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-400',
  destructive: 'border border-red-300 text-red-700 hover:bg-red-50 focus-visible:ring-red-500',
}

// Exported so non-<button> elements needing the same look (e.g. a Next.js
// <Link> acting as a button) can apply it directly.
export function buttonClassName(variant: ButtonVariant = 'primary', className = '') {
  return `inline-flex items-center justify-center min-h-11 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export default function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return <button className={buttonClassName(variant, className)} {...props} />
}
