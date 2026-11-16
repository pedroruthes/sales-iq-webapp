import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/ui'

export interface RowAction {
  id: string
  label: string
  description?: string
  icon: ReactNode
  onClick: () => void
  tone?: 'default' | 'accent' | 'warn' | 'danger'
  disabled?: boolean
}

const toneStyles: Record<NonNullable<RowAction['tone']>, string> = {
  default: 'hover:bg-[var(--bg-subtle)]',
  accent: 'hover:bg-[var(--acc-pale)]',
  warn: 'hover:bg-amber-50',
  danger: 'hover:bg-red-50',
}

const iconTone: Record<NonNullable<RowAction['tone']>, string> = {
  default: 'bg-[var(--bg-subtle)] text-[var(--ink-muted)]',
  accent: 'bg-[var(--acc-pale)] text-[var(--acc)]',
  warn: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-[var(--danger)]',
}

export function RowActionsMenu({
  title,
  subtitle,
  actions,
  align = 'right',
}: {
  title: string
  subtitle?: string
  actions: RowAction[]
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const run = (action: RowAction) => {
    if (action.disabled) return
    setOpen(false)
    // defer so modal closes before next modal opens
    requestAnimationFrame(() => action.onClick())
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen(true)}
        className={cn(
          'p-2 rounded-[10px] transition-colors',
          open ? 'bg-[var(--bg-subtle)]' : 'hover:bg-[var(--bg-subtle)]'
        )}
        title="Ações"
      >
        <MoreVertical className="w-4 h-4 text-[var(--ink-ghost)]" />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="md"
        title={title}
        subtitle={subtitle}
        zIndex={55}
        className={align === 'left' ? undefined : undefined}
      >
        <div id={menuId} className="flex flex-col gap-1 -mx-1">
          {actions.map((action) => {
            const tone = action.tone ?? 'default'
            return (
              <button
                key={action.id}
                type="button"
                disabled={action.disabled}
                onClick={() => run(action)}
                className={cn(
                  'flex items-start gap-3 w-full text-left px-3 py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:pointer-events-none',
                  toneStyles[tone]
                )}
              >
                <span
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                    iconTone[tone]
                  )}
                >
                  {action.icon}
                </span>
                <span className="min-w-0 pt-0.5">
                  <span className="block text-[13px] font-medium text-[var(--ink)] leading-snug">
                    {action.label}
                  </span>
                  {action.description && (
                    <span className="block text-[12px] text-[var(--ink-ghost)] mt-0.5 leading-snug">
                      {action.description}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </Modal>
    </>
  )
}
