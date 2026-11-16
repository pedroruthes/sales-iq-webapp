import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-[var(--acc)] text-white hover:opacity-90 shadow-sm',
  secondary: 'bg-white border border-[var(--border)] text-[var(--ink-muted)] hover:border-[var(--acc-border)] hover:text-[var(--acc)]',
  ghost: 'text-[var(--ink-faint)] hover:bg-[var(--bg-subtle)] hover:text-[var(--ink-muted)]',
  danger: 'bg-[var(--danger)] text-white hover:opacity-90',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-[13px] rounded-[10px] gap-1.5',
  md: 'h-11 px-5 text-[14px] rounded-[12px] gap-2',
  lg: 'h-11 px-5 text-[14px] rounded-[12px] gap-2',
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : children}
    </button>
  )
}
