import Link from '@/lib/Link'
import { Building2 } from 'lucide-react'
import { Card, SectionTitle, Badge } from '@/components/ui'
import { KPIsFilial } from '@/types'
import { fmt, cn, corMeta } from '@/lib/utils'

export function RankingLojas({ kpis }: { kpis: KPIsFilial[] }) {
  if (kpis.length <= 1) return null

  const medalha = (i: number) => {
    if (i === 0) return 'bg-amber-100 text-amber-700 border-amber-200'
    if (i === 1) return 'bg-slate-100 text-slate-600 border-slate-200'
    if (i === 2) return 'bg-orange-100 text-orange-600 border-orange-200'
    return 'bg-[var(--bg-subtle)] text-[var(--ink-ghost)] border-[var(--border)]'
  }

  return (
    <div>
      <SectionTitle label="Ranking de lojas — faturamento" icon={Building2} />
      <Card padding="sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {['#','Loja','Faturamento','T.M','P.A','% PA1','% Meta'].map((h, i) => (
                <th key={h} className={cn(
                  'text-[12px] text-[var(--ink-ghost)] font-medium px-4 py-3',
                  i === 0 ? 'text-center w-10' : i > 1 ? 'text-right' : 'text-left'
                )}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {kpis.map((k, i) => (
              <tr key={k.codigoFilial} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer">
                <td className="px-4 py-3 text-center">
                  <div className={cn('w-6 h-6 rounded-md flex items-center justify-center text-[12px] font-medium border mx-auto', medalha(i))}>
                    {i + 1}
                  </div>
                </td>
                <td className="px-4 py-3">
                <Link href={`/dashboard/lojas?filial=${k.codigoFilial}`}
                  className="text-[13px] font-medium text-[var(--ink)] hover:text-[var(--acc)] transition-colors">
                  {k.nomeFilial}
                </Link>
              </td>
                <td className="px-4 py-3 text-[13px] font-medium text-[var(--acc)] text-right">{fmt.currency(k.faturamento)}</td>
                <td className="px-4 py-3 text-[13px] text-[var(--ink-muted)] text-right">{fmt.currency(k.ticketMedio)}</td>
                <td className={cn('px-4 py-3 text-[13px] font-medium text-right',
                  k.pecasAtendimento >= 2.7 ? 'text-[var(--success)]' : k.pecasAtendimento >= 2.0 ? 'text-[var(--warn)]' : 'text-[var(--danger)]')}>
                  {fmt.number(k.pecasAtendimento, 1)}
                </td>
                <td className={cn('px-4 py-3 text-[13px] text-right',
                  k.percentualPA1 <= 30 ? 'text-[var(--success)]' : k.percentualPA1 <= 40 ? 'text-[var(--warn)]' : 'text-[var(--danger)]')}>
                  {fmt.percent(k.percentualPA1)}
                </td>
                <td className="px-4 py-3 text-right">
                  {k.percentualMeta
                    ? <Badge variant={k.percentualMeta >= 100 ? 'success' : k.percentualMeta >= 80 ? 'warn' : 'danger'}>
                        {fmt.percent(k.percentualMeta)}
                      </Badge>
                    : <span className="text-[var(--ink-ghost)] text-[13px]">—</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
