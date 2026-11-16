import { TrendingUp, TrendingDown, Minus, Star } from 'lucide-react'
import { Card, SectionTitle, Badge } from '@/components/ui'
import { KPIsVendedor } from '@/types'
import { fmt, cn, upperNome } from '@/lib/utils'

export function VendedoresTabela({ dados }: { dados: KPIsVendedor[] }) {
  if (!dados.length) return (
    <Card><div className="py-10 text-center text-[13px] text-[var(--ink-ghost)]">Nenhum vendedor encontrado no período</div></Card>
  )

  const maxFat = dados[0]?.faturamento ?? 1

  const delta = (v: number) =>
    v > 0 ? <span className="flex items-center gap-0.5 text-[var(--success)]"><TrendingUp className="w-3 h-3"/>+{fmt.percent(v)}</span>
    : v < 0 ? <span className="flex items-center gap-0.5 text-[var(--danger)]"><TrendingDown className="w-3 h-3"/>{fmt.percent(v)}</span>
    : <span className="flex items-center gap-0.5 text-[var(--ink-ghost)]"><Minus className="w-3 h-3"/>—</span>

  return (
    <Card padding="sm">
      <SectionTitle label="Desempenho da equipe" icon={Star} />
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[var(--border)]">
            {['#','Vendedor','Faturamento','T.M','P.A','P.M','% PA1','Meta','% Meta'].map((h, i) => (
              <th key={h} className={cn(
                'text-[13px] text-[var(--ink-ghost)] uppercase tracking-wider px-3 py-2.5 font-medium',
                i <= 1 ? 'text-left' : 'text-right'
              )}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dados.map((v, i) => {
            const pctMeta = v.percentualMeta
            return (
              <tr key={v.codigoVendedor} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer">
                <td className="px-3 py-3">
                  <div className={cn(
                    'w-6 h-6 rounded-md flex items-center justify-center text-[12px] font-medium border',
                    i === 0 ? 'bg-amber-100 text-amber-700 border-amber-300'
                    : i === 1 ? 'bg-slate-100 text-slate-600 border-slate-200'
                    : i === 2 ? 'bg-orange-100 text-orange-600 border-orange-200'
                    : 'bg-[var(--bg-subtle)] text-[var(--ink-ghost)] border-[var(--border)]'
                  )}>{i + 1}</div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[var(--acc-pale)] flex items-center justify-center text-[12px] font-medium text-[var(--acc)]">
                      {upperNome(v.nomeVendedor).charAt(0)}
                    </div>
                    <div>
                      <div className="text-[12px] font-medium text-[var(--ink)]">{upperNome(v.apelidoVendedor || v.nomeVendedor)}</div>
                      <div className="text-[13px] text-[var(--ink-ghost)]">{upperNome(v.nomeVendedor)}</div>
                    </div>
                  </div>
                  {/* Barra de faturamento relativo */}
                  <div className="mt-1.5 h-1 bg-[var(--bg-subtle)] rounded-full overflow-hidden w-24">
                    <div className="h-full bg-[var(--acc)] opacity-50 rounded-full"
                      style={{ width: `${(v.faturamento / maxFat) * 100}%` }} />
                  </div>
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="text-[12px] font-medium text-[var(--acc)]">{fmt.currencyShort(v.faturamento)}</div>
                  <div className="text-[13px] text-[var(--ink-ghost)]">{v.totalVendas} vendas</div>
                </td>
                <td className="px-3 py-3 text-right text-[12px] text-[var(--ink-muted)]">{fmt.currencyShort(v.ticketMedio)}</td>
                <td className={cn('px-3 py-3 text-right text-[12px] font-medium',
                  v.pecasAtendimento >= 2.7 ? 'text-[var(--success)]'
                  : v.pecasAtendimento >= 2.0 ? 'text-[var(--warn)]'
                  : 'text-[var(--danger)]')}>
                  {fmt.number(v.pecasAtendimento, 1)}
                </td>
                <td className="px-3 py-3 text-right text-[12px] text-[var(--ink-muted)]">{fmt.currencyShort(v.precoMedio)}</td>
                <td className={cn('px-3 py-3 text-right text-[12px]',
                  v.percentualPA1 <= 30 ? 'text-[var(--success)]'
                  : v.percentualPA1 <= 40 ? 'text-[var(--warn)]'
                  : 'text-[var(--danger)]')}>
                  {fmt.percent(v.percentualPA1)}
                </td>
                <td className="px-3 py-3 text-right text-[13px] text-[var(--ink-ghost)]">
                  {v.meta ? fmt.currencyShort(v.meta) : '—'}
                </td>
                <td className="px-3 py-3 text-right">
                  {pctMeta
                    ? <Badge variant={pctMeta >= 100 ? 'success' : pctMeta >= 80 ? 'warn' : 'danger'}>
                        {fmt.percent(pctMeta)}
                      </Badge>
                    : <span className="text-[var(--ink-ghost)] text-[13px]">—</span>
                  }
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Card>
  )
}
