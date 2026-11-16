import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card } from '@/components/ui'
import { ComparativoItem } from '@/types'
import { fmt, cn } from '@/lib/utils'

const MONETARIO  = new Set(['Faturamento','Ticket Médio','Preço Médio'])
const INVERTIDO  = new Set(['% PA 1 peça','% Sem vínculo'])

function fmtVal(ind: string, v: number) {
  if (MONETARIO.has(ind))         return fmt.currency(v)
  if (ind.includes('%'))          return fmt.percent(v)
  if (ind === 'Peças / Atend.')   return fmt.number(v, 1)
  return fmt.number(v, 0)
}

export function TabelaComparativo({ dados }: { dados: ComparativoItem[] }) {
  return (
    <Card>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="text-[13px] text-[var(--ink-ghost)] uppercase tracking-wider pb-2 font-medium text-left">Indicador</th>
            <th className="text-[13px] text-[var(--ink-ghost)] uppercase tracking-wider pb-2 font-medium text-right">Atual</th>
            <th className="text-[13px] text-[var(--ink-ghost)] uppercase tracking-wider pb-2 font-medium text-right">Anterior</th>
            <th className="text-[13px] text-[var(--ink-ghost)] uppercase tracking-wider pb-2 font-medium text-right">Δ</th>
          </tr>
        </thead>
        <tbody>
          {dados?.map(row => {
            const inv = INVERTIDO.has(row.indicador)
            const pos = inv ? row.variacao < 0 : row.variacao > 0
            const cor = row.variacao === 0 ? 'text-[var(--ink-ghost)]' : pos ? 'text-[var(--success)]' : 'text-[var(--danger)]'
            return (
              <tr key={row.indicador} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-subtle)]">
                <td className="py-2.5 text-[13px] text-[var(--ink-faint)]">{row.indicador}</td>
                <td className="py-2.5 text-[12px] font-medium text-[var(--ink)] text-right">{fmtVal(row.indicador, row.valorAtual)}</td>
                <td className="py-2.5 text-[13px] text-[var(--ink-ghost)] text-right">{fmtVal(row.indicador, row.valorAnterior)}</td>
                <td className="py-2.5 text-right">
                  <div className={cn('flex items-center justify-end gap-1 text-[12px] font-medium', cor)}>
                    {row.variacao > 0 ? <TrendingUp className="w-3 h-3" /> : row.variacao < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {row.variacao > 0 ? '+' : ''}{fmt.percent(row.variacao, 1)}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Card>
  )
}
