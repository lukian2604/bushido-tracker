import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'accent' | 'ghost'
  children: ReactNode
}

const VARIANT_CLASSES: Record<string, string> = {
  accent: 'bg-(--color-accent) text-white hover:opacity-90',
  ghost: 'border border-(--color-border) text-(--color-parchment-muted) hover:text-(--color-parchment) hover:border-(--color-accent)',
}

export const Button = ({ variant = 'accent', className = '', children, ...props }: ButtonProps) => {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
