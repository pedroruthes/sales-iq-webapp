import { cn } from '@/lib/utils'

export interface TamanhoEstoque {
  tamanho: string
  qtde: number
  vendido?: number
}

type Props = {
  grade?: TamanhoEstoque[] | null
  /** Se informado, só exibe esses tamanhos (filtro externo). */
  filtroTamanhos?: string[]
  compact?: boolean
  className?: string
}

function nivel(qtde: number) {
  if (qtde <= 0) return 'zero' as const
  if (qtde <= 2) return 'baixo' as const
  if (qtde <= 8) return 'ok' as const
  return 'alto' as const
}

const NIVEL_CLS = {
  zero: 'bg-[var(--danger-bg)] border-red-200 text-[var(--danger)]',
  baixo: 'bg-[var(--warn-bg)] border-amber-200 text-[var(--warn)]',
  ok: 'bg-white border-[var(--border)] text-[var(--ink)]',
  alto: 'bg-[var(--success-bg)] border-green-200 text-[var(--success)]',
}

export function GradeTamanhos({ grade, filtroTamanhos, compact, className }: Props) {
  const lista = (grade ?? []).filter((g) => {
    if (!filtroTamanhos?.length) return true
    return filtroTamanhos.some(
      (t) => t.trim().toUpperCase() === String(g.tamanho).trim().toUpperCase()
    )
  })

  if (!lista.length) {
    return <span className="text-[12px] text-[var(--ink-ghost)]">—</span>
  }

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {lista.map((g) => {
        const nv = nivel(g.qtde)
        const title =
          g.vendido != null
            ? `${g.tamanho}: ${g.qtde} em estoque · ${g.vendido} vendido(s)`
            : `${g.tamanho}: ${g.qtde} em estoque`
        return (
          <span
            key={g.tamanho}
            title={title}
            className={cn(
              'inline-flex flex-col items-center justify-center rounded-md border font-medium tabular-nums',
              compact ? 'min-w-[28px] px-1 py-0.5' : 'min-w-[36px] px-1.5 py-1',
              NIVEL_CLS[nv]
            )}
          >
            <span className={cn('leading-none', compact ? 'text-[9px] opacity-80' : 'text-[10px] opacity-70')}>
              {g.tamanho}
            </span>
            <span className={cn('leading-none mt-0.5', compact ? 'text-[11px]' : 'text-[12px]')}>
              {g.qtde}
            </span>
            {g.vendido != null && !compact && (
              <span className="text-[9px] opacity-60 leading-none mt-0.5">↑{g.vendido}</span>
            )}
          </span>
        )
      })}
    </div>
  )
}

/** Chips de filtro de tamanho a partir das grades presentes nos dados. */
export function coletarTamanhos(grades: (TamanhoEstoque[] | null | undefined)[]): string[] {
  const set = new Set<string>()
  for (const g of grades) {
    for (const item of g ?? []) {
      const t = String(item.tamanho ?? '').trim()
      if (t) set.add(t)
    }
  }
  return Array.from(set).sort((a, b) => {
    const na = Number(a)
    const nb = Number(b)
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb
    return a.localeCompare(b, 'pt-BR', { numeric: true })
  })
}
