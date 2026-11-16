import { useState } from 'react'
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui'
import { fmt, cn, upperNome } from '@/lib/utils'

interface Cliente {
  CODIGO_CLIENTE: string; CLIENTE_VAREJO: string; FILIAL: string
  totalGasto: number; totalVendas: number; ticketMedio: number; ultimaCompra: string
}

const PAGE_SIZE = 10

export function RankingClientes({ dados }: { dados: Cliente[] }) {
  const [page, setPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(dados.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages - 1)
  const slice = dados.slice(pageSafe * PAGE_SIZE, pageSafe * PAGE_SIZE + PAGE_SIZE)
  const maxGasto = dados[0]?.totalGasto ?? 1

  return (
    <Card>
      <SectionTitle label="Ranking — melhores clientes" icon={Trophy} />
      <div className="flex flex-col gap-1">
        {dados.length === 0 && (
          <div className="text-[12px] text-[var(--ink-ghost)] py-6 text-center">
            Nenhuma venda com cliente identificado no período
          </div>
        )}
        {slice.map((c, idx) => {
          const i = pageSafe * PAGE_SIZE + idx
          return (
            <div key={c.CODIGO_CLIENTE} className="flex items-center gap-3 py-2 hover:bg-[var(--bg-subtle)] rounded-lg px-2 transition-colors cursor-pointer">
              <div className={cn(
                'w-6 h-6 rounded-md flex items-center justify-center text-[12px] font-medium border shrink-0',
                i === 0 ? 'bg-amber-100 text-amber-700 border-amber-300'
                : i === 1 ? 'bg-slate-100 text-slate-600 border-slate-200'
                : i === 2 ? 'bg-orange-100 text-orange-600 border-orange-200'
                : 'bg-[var(--bg-subtle)] text-[var(--ink-ghost)] border-[var(--border)]'
              )}>{i + 1}</div>

              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-[var(--ink)] truncate">
                  {upperNome(c.CLIENTE_VAREJO)}
                </div>
                <div className="h-1.5 bg-[var(--bg-subtle)] rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--acc)] opacity-60"
                    style={{ width: `${(c.totalGasto / maxGasto) * 100}%` }}
                  />
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[12px] font-medium text-[var(--acc)]">{fmt.currencyShort(c.totalGasto)}</div>
                <div className="text-[13px] text-[var(--ink-ghost)]">{c.totalVendas}x · TM {fmt.currencyShort(c.ticketMedio)}</div>
              </div>
            </div>
          )
        })}
      </div>

      {dados.length > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
          <span className="text-[12px] text-[var(--ink-ghost)]">
            {pageSafe * PAGE_SIZE + 1}–{Math.min((pageSafe + 1) * PAGE_SIZE, dados.length)} de {dados.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={pageSafe <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="filter-trigger !h-9 !px-3 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[12px] text-[var(--ink-muted)] min-w-[4rem] text-center">
              {pageSafe + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={pageSafe >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="filter-trigger !h-9 !px-3 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}
