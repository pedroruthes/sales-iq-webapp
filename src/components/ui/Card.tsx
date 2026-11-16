import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

export function Card({ children, className, hover = false, padding = 'md' }: CardProps) {
  const pad = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' }
  return (
    <div
      className={cn(
        'bg-white border border-[var(--border)] rounded-card',
        'shadow-card',
        hover && 'transition-all duration-200 hover:shadow-card2 hover:border-[var(--acc-border)] cursor-pointer',
        pad[padding],
        className
      )}
    >
      {children}
    </div>
  )
}
