import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export const ADMIN_PAGE_SIZE = 10

export function pageItems<T>(items: T[], page: number, pageSize = ADMIN_PAGE_SIZE): T[] {
  const start = (page - 1) * pageSize
  return items.slice(start, start + pageSize)
}

export function AdminTableFooter({
  total,
  totalAll,
  page,
  pageSize = ADMIN_PAGE_SIZE,
  onPageChange,
  noun = { singular: 'item', plural: 'itens' },
}: {
  total: number
  totalAll: number
  page: number
  pageSize?: number
  onPageChange: (page: number) => void
  noun?: { singular: string; plural: string }
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const word = total === 1 ? noun.singular : noun.plural

  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
    if (totalPages <= 5) return i + 1
    if (page <= 3) return i + 1
    if (page >= totalPages - 2) return totalPages - 4 + i
    return page - 2 + i
  })

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <span className="text-[13px] text-[var(--ink-ghost)]">
        {total === 0
          ? `Nenhum ${noun.singular}`
          : total === totalAll
            ? `${from}–${to} de ${total} ${word}`
            : `${from}–${to} de ${total} ${word} (de ${totalAll})`}
      </span>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] disabled:opacity-40 hover:border-[var(--acc-border)] transition-colors"
            aria-label="Página anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-[var(--ink-ghost)]" />
          </button>
          {pages.map((pg) => (
            <button
              key={pg}
              type="button"
              onClick={() => onPageChange(pg)}
              className={cn(
                'w-8 h-8 flex items-center justify-center rounded-lg text-[12px] font-medium transition-colors',
                pg === page
                  ? 'bg-[var(--acc)] text-white'
                  : 'border border-[var(--border)] text-[var(--ink-ghost)] hover:border-[var(--acc-border)]'
              )}
            >
              {pg}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] disabled:opacity-40 hover:border-[var(--acc-border)] transition-colors"
            aria-label="Próxima página"
          >
            <ChevronRight className="w-3.5 h-3.5 text-[var(--ink-ghost)]" />
          </button>
        </div>
      )}
    </div>
  )
}
