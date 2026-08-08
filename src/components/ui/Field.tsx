import type { InputHTMLAttributes } from 'react'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  containerClassName?: string
}

export const Field = ({ label, id, className = '', containerClassName = '', ...props }: FieldProps) => {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="text-sm text-(--color-parchment-muted)">
          {label}
        </label>
      )}
      <input
        id={id}
        {...props}
        className={`w-full rounded-lg border border-(--color-border) bg-(--color-ink) px-3.5 py-2.5 text-(--color-parchment) outline-none placeholder:text-(--color-ink-40) focus:border-(--color-accent) ${className}`}
      />
    </div>
  )
}
