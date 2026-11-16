import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

export function SectionTitle({ label, icon: Icon, className, action }: {
  label: string
  icon?: LucideIcon
  className?: string
  action?: ReactNode
}) {
  return (
    <div className={cn('flex items-center gap-2.5 mb-4', className)}>
      {Icon && (
        <div className="w-7 h-7 rounded-[8px] bg-[var(--acc-pale)] flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-[var(--acc)]" />
        </div>
      )}
      <span className="text-[14px] font-semibold text-[var(--ink)] tracking-[-0.01em]">
        {label}
      </span>
      <div className="flex-1 h-px bg-[var(--border)]" />
      {action}
    </div>
  )
}
