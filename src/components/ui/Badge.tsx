import { cn } from '@/lib/utils'

type Variant = 'primary' | 'success' | 'danger' | 'warn' | 'info' | 'neutral'

const styles: Record<Variant, string> = {
  primary: 'bg-[var(--acc-pale)] text-[var(--acc)] border-[var(--acc-border)]',
  success: 'bg-[var(--success-bg)] text-[var(--success)] border-green-200/60',
  danger:  'bg-[var(--danger-bg)] text-[var(--danger)] border-red-200/60',
  warn:    'bg-[var(--warn-bg)] text-[var(--warn)] border-amber-200/60',
  info:    'bg-[var(--info-bg)] text-[var(--info)] border-blue-200/60',
  neutral: 'bg-[var(--bg-subtle)] text-[var(--ink-faint)] border-[var(--border-md)]',
}

export function Badge({ children, variant = 'primary', className }: {
  children: React.ReactNode
  variant?: Variant
  className?: string
}) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border',
      styles[variant],
      className
    )}>
      {children}
    </span>
  )
}
