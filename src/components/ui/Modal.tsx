import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose?: () => void
  title?: ReactNode
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  headerAccent?: boolean
  preventClose?: boolean
  zIndex?: number
  className?: string
  /** Classes extras no body (área de conteúdo) */
  bodyClassName?: string
}

const sizes = {
  sm: 'max-w-[420px]',
  md: 'max-w-[560px]',
  lg: 'max-w-[640px]',
  xl: 'max-w-[880px]',
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  headerAccent = false,
  preventClose = false,
  zIndex = 50,
  className,
  bodyClassName,
}: ModalProps) {
  if (!open) return null

  const handleBackdrop = () => {
    if (!preventClose && onClose) onClose()
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex }}>
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" onClick={handleBackdrop} />
      <div
        className={cn(
          'relative bg-white rounded-2xl shadow-[var(--shadow-card2)] w-full max-h-[90vh] flex flex-col border border-[var(--border)]',
          sizes[size],
          className
        )}
      >
        {title && (
          <div
            className={cn(
              'flex items-start justify-between gap-3 px-6 py-4 border-b border-[var(--border)] shrink-0 rounded-t-2xl',
              headerAccent && 'bg-[var(--acc)] border-transparent'
            )}
          >
            <div className="min-w-0">
              <div className={cn('text-[15px] font-semibold tracking-[-0.01em]', headerAccent ? 'text-white' : 'text-[var(--ink)]')}>
                {title}
              </div>
              {subtitle && (
                <div className={cn('text-[13px] mt-0.5', headerAccent ? 'text-white/80' : 'text-[var(--ink-faint)]')}>
                  {subtitle}
                </div>
              )}
            </div>
            {onClose && !preventClose && (
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'shrink-0 p-2 rounded-lg transition-colors',
                  headerAccent
                    ? 'text-white/70 hover:bg-white/10'
                    : 'text-[var(--ink-ghost)] hover:bg-[var(--bg-subtle)]'
                )}
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className={cn('px-6 py-5 overflow-y-auto flex-1', bodyClassName)}>{children}</div>
        {footer && (
          <div className="px-6 py-3.5 flex items-center justify-end gap-2 shrink-0 border-t border-[var(--border)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
