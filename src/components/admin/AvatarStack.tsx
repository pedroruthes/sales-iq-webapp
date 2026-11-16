import { cn } from '@/lib/utils'

const AVATAR_COLORS = [
  'bg-[var(--acc)]',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
]

function iniciais(nome: string) {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export interface AvatarPerson {
  id: string | number
  nome: string
}

const SIZE_CLS = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-[12px]',
  lg: 'w-10 h-10 text-[13px]',
} as const

export function AvatarStack({
  people,
  max = 4,
  size = 'md',
  className,
  showTooltip = true,
}: {
  people: AvatarPerson[]
  max?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showTooltip?: boolean
}) {
  if (people.length === 0) {
    return <span className="text-[13px] text-[var(--ink-ghost)]">—</span>
  }

  const shown = people.slice(0, max)
  const extra = people.length - shown.length
  const dim = SIZE_CLS[size]

  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex items-center -space-x-2.5">
        {shown.map((p, i) => (
          <div
            key={p.id}
            className="relative group/avatar shrink-0"
          >
            <div
              className={cn(
                'rounded-full flex items-center justify-center font-semibold text-white border-2 border-white shadow-sm',
                dim,
                AVATAR_COLORS[i % AVATAR_COLORS.length]
              )}
            >
              {iniciais(p.nome)}
            </div>
            {showTooltip && (
              <span
                role="tooltip"
                className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+6px)] z-30 whitespace-nowrap rounded-md bg-[var(--ink)] text-white text-[11px] font-medium px-2 py-1 opacity-0 scale-95 group-hover/avatar:opacity-100 group-hover/avatar:scale-100 transition-all shadow-md"
              >
                {p.nome}
              </span>
            )}
          </div>
        ))}
        {extra > 0 && (
          <div className="relative group/avatar shrink-0">
            <div
              className={cn(
                'rounded-full flex items-center justify-center font-semibold text-[var(--ink-muted)] bg-[var(--bg-subtle)] border-2 border-white shadow-sm',
                dim
              )}
            >
              +{extra}
            </div>
            {showTooltip && (
              <span
                role="tooltip"
                className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+6px)] z-30 whitespace-nowrap rounded-md bg-[var(--ink)] text-white text-[11px] font-medium px-2 py-1 opacity-0 scale-95 group-hover/avatar:opacity-100 group-hover/avatar:scale-100 transition-all shadow-md"
              >
                {people.slice(max).map((p) => p.nome).join(', ')}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
