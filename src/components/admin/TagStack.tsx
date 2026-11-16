import { cn } from '@/lib/utils'

export function TagStack({
  labels,
  max = 2,
  className,
}: {
  labels: string[]
  max?: number
  className?: string
}) {
  if (labels.length === 0) {
    return <span className="text-[13px] text-[var(--ink-ghost)]">—</span>
  }

  const shown = labels.slice(0, max)
  const extra = labels.length - shown.length

  return (
    <div
      className={cn('flex items-center gap-1.5 min-w-0', className)}
      title={labels.join(', ')}
    >
      {shown.map((label, i) => (
        <span
          key={`${label}-${i}`}
          title={label}
          className="max-w-[160px] truncate px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--bg-subtle)] text-[var(--ink-muted)] border border-[var(--border)]"
        >
          {label}
        </span>
      ))}
      {extra > 0 && (
        <span
          className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--acc-pale)] text-[var(--acc)] border border-[var(--acc-border)]"
          title={labels.slice(max).join(', ')}
        >
          +{extra}
        </span>
      )}
    </div>
  )
}
