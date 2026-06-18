import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'edit' | 'delete'
  children: ReactNode
}

export const IconButton = ({ variant = 'edit', className = '', children, ...props }: IconButtonProps) => {
  const hoverColor = variant === 'delete' ? 'hover:text-(--color-accent)' : 'hover:text-(--color-gold)'

  return (
    <button
      type="button"
      {...props}
      className={`inline-flex size-7 items-center justify-center rounded-md text-(--color-ink-40) hover:bg-(--color-ink-15) ${hoverColor} ${className}`}
    >
      {children}
    </button>
  )
}
