import { useState, type InputHTMLAttributes } from 'react'
import { EyeIcon, EyeOffIcon } from './icons'

interface PasswordFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const PasswordField = ({ label, id, className = '', ...props }: PasswordFieldProps) => {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm text-(--color-parchment-muted)">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={isVisible ? 'text' : 'password'}
          {...props}
          className={`w-full rounded-lg border border-(--color-border) bg-(--color-ink) px-3.5 py-2.5 pr-11 text-(--color-parchment) outline-none placeholder:text-(--color-ink-40) focus:border-(--color-accent) ${className}`}
        />
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-(--color-ink-40) hover:text-(--color-parchment-muted)"
        >
          {isVisible ? <EyeOffIcon className="size-4.5" /> : <EyeIcon className="size-4.5" />}
        </button>
      </div>
    </div>
  )
}
