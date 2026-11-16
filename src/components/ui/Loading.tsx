import { cn } from '@/lib/utils'

export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  return (
    <div
      className={cn(
        'border-2 border-[var(--acc-border)] border-t-[var(--acc)] rounded-full animate-spin',
        s[size],
        className
      )}
    />
  )
}

export function PageLoading({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <Spinner size="lg" />
      <span className="text-[13px] text-[var(--ink-ghost)] font-medium">{label}</span>
    </div>
  )
}
