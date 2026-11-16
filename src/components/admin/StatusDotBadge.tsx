import { cn } from '@/lib/utils'

type StatusVariant = 'success' | 'neutral' | 'danger' | 'warn' | 'info'

const styles: Record<StatusVariant, { wrap: string; dot: string }> = {
  success: {
    wrap: 'bg-[var(--success-bg)] text-[var(--success)] border-green-200/60',
    dot: 'bg-[var(--success)]',
  },
  neutral: {
    wrap: 'bg-[var(--bg-subtle)] text-[var(--ink-faint)] border-[var(--border-md)]',
    dot: 'bg-[var(--ink-ghost)]',
  },
  danger: {
    wrap: 'bg-[var(--danger-bg)] text-[var(--danger)] border-red-200/60',
    dot: 'bg-[var(--danger)]',
  },
  warn: {
    wrap: 'bg-[var(--warn-bg)] text-[var(--warn)] border-amber-200/60',
    dot: 'bg-[var(--warn)]',
  },
  info: {
    wrap: 'bg-[var(--info-bg)] text-[var(--info)] border-blue-200/60',
    dot: 'bg-[var(--info)]',
  },
}

function capitalize(label: string) {
  if (!label) return label
  return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()
}

export function StatusDotBadge({
  label,
  variant = 'neutral',
  className,
}: {
  label: string
  variant?: StatusVariant
  className?: string
}) {
  const s = styles[variant]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-md border',
        s.wrap,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', s.dot)} />
      {capitalize(label)}
    </span>
  )
}
