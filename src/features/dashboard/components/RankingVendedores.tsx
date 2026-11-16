import { Card, SectionTitle } from '@/components/ui'
import { Medal, ExternalLink } from 'lucide-react'
import { fmt, cn, upperNome } from '@/lib/utils'
import { num } from '@/lib/num'
import Link from '@/lib/Link'

interface Vendedor {
  codigoVendedor: string
  nomeVendedor: string
  apelidoVendedor: string
  codigoFilial: string
  nomeFilial?: string
  faturamento: number
  pecasAtendimento: number
  ticketMedio?: number
  percentualPA1: number
  percentualMeta?: number | null
}

const RANK_STYLE = [
  { badge: 'bg-amber-400 text-white', bar: 'bg-amber-400' },
  { badge: 'bg-slate-400 text-white', bar: 'bg-slate-400' },
  { badge: 'bg-orange-400 text-white', bar: 'bg-orange-400' },
]

export function RankingVendedores({ dados, top = 5 }: { dados: Vendedor[]; top?: number }) {
  const lista = [...dados]
    .sort((a, b) => num(b.faturamento) - num(a.faturamento))
    .slice(0, top)

  const maxFat = Math.max(...lista.map((v) => num(v.faturamento)), 1)

  if (!lista.length) {
    return (
      <Card padding="sm">
        <SectionTitle label="Top vendedores" icon={Medal} />
        <div className="py-6 text-center text-[13px] text-[var(--ink-ghost)]">Sem vendas no período</div>
      </Card>
    )
  }

  return (
    <Card padding="sm">
      <div className="flex items-center justify-between mb-2.5">
        <SectionTitle label="Top vendedores" icon={Medal} className="mb-0 flex-1" />
        <Link
          href="/dashboard/vendedores"
          className="text-[11px] text-[var(--acc)] hover:text-[var(--acc-light)] flex items-center gap-1"
        >
          ver todos <ExternalLink className="w-2.5 h-2.5" />
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {lista.map((v, i) => {
          const nome = upperNome(v.apelidoVendedor || v.nomeVendedor || v.codigoVendedor || '?')
          const fat = num(v.faturamento)
          const pa = num(v.pecasAtendimento)
          const pctBar = Math.max(6, (fat / maxFat) * 100)
          const estilo = RANK_STYLE[i]

          return (
            <div key={`${v.codigoVendedor}-${v.codigoFilial}-${i}`} className="flex items-center gap-2">
              <div
                className={cn(
                  'w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0',
                  estilo ? estilo.badge : 'bg-[var(--bg-subtle)] text-[var(--ink-ghost)]'
                )}
              >
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-[12px] font-medium text-[var(--ink)] truncate">{nome}</span>
                  <span className="text-[12px] font-semibold text-[var(--ink)] tabular-nums shrink-0">
                    {fmt.currencyShort(fat)}
                  </span>
                </div>
                <div className="h-1.5 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', estilo ? estilo.bar : 'bg-[var(--acc)]')}
                    style={{ width: `${pctBar}%`, opacity: i < 3 ? 0.95 : 0.65 }}
                  />
                </div>
                <div className="text-[10px] text-[var(--ink-ghost)] mt-0.5 truncate">
                  PA {fmt.number(pa, 1)}
                  {v.nomeFilial ? ` · ${v.nomeFilial}` : ''}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
