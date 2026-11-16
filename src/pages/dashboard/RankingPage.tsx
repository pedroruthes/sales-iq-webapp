import { useState } from 'react'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { DashboardLayout }    from '@/components/layout'
import { ErrorBox, FiltroBar, Card, SectionTitle, Badge, type Periodo } from '@/components/ui'
import { useKPIsFilial }      from '@/features/vendas/hooks/useVendasData'
import { useFiliaisAtivas }   from '@/hooks/useFiliaisAtivas'
import { useContentLoading }  from '@/hooks/useSession'
import { getMesAtual, fmt, cn } from '@/lib/utils'
import Link from '@/lib/Link'

type Ordenar = 'faturamento' | 'ticketMedio' | 'pecasAtendimento' | 'percentualMeta' | 'percentualPA1'

const COLUNAS: { key: Ordenar; label: string }[] = [
  { key: 'faturamento',       label: 'Faturamento' },
  { key: 'ticketMedio',       label: 'T.M' },
  { key: 'pecasAtendimento',  label: 'P.A' },
  { key: 'percentualMeta',    label: '% Meta' },
  { key: 'percentualPA1',     label: '% PA1' },
]

export default function RankingPage() {
  const { filiaisAtivas } = useFiliaisAtivas()
  const [periodo,  setPeriodo]  = useState<Periodo>({ label: 'Mês atual', ...getMesAtual() })
  const [ordenar,  setOrdenar]  = useState<Ordenar>('faturamento')
  const [crescente, setCrescente] = useState(false)

  const periodoAnt = {
    inicio: startOfMonth(subMonths(periodo.inicio, 1)),
    fim:    endOfMonth(subMonths(periodo.inicio, 1)),
  }

  const { data: kpisAt, error } = useKPIsFilial(filiaisAtivas, periodo.inicio, periodo.fim)
  const { data: kpisAnt }        = useKPIsFilial(filiaisAtivas, periodoAnt.inicio, periodoAnt.fim)

  const hasScope = filiaisAtivas.length > 0
  const loading = useContentLoading({
    filiaisQuery: filiaisAtivas,
    waiting: hasScope ? [kpisAt === undefined, kpisAnt === undefined] : [],
  })

  if (error) return <DashboardLayout titulo="Ranking de lojas"><ErrorBox /></DashboardLayout>

  const sorted = [...(kpisAt ?? [])].sort((a, b) => {
    const va = (a as any)[ordenar] ?? 0
    const vb = (b as any)[ordenar] ?? 0
    // PA1: menor é melhor — inverte
    if (ordenar === 'percentualPA1') return crescente ? vb - va : va - vb
    return crescente ? va - vb : vb - va
  })

  const maxFat = Math.max(...(sorted.map(k => k.faturamento)), 1)

  // Médias da rede
  const tv = sorted.reduce((a, k) => a + k.totalVendas, 0) || 1
  const mediaTM  = sorted.reduce((a, k) => a + k.faturamento, 0) / tv
  const mediaPA  = sorted.reduce((a, k) => a + k.pecasAtendimento * k.totalVendas, 0) / tv
  const mediaPA1 = sorted.reduce((a, k) => a + k.percentualPA1 * k.totalVendas, 0) / tv

  const toggle = (col: Ordenar) => {
    if (ordenar === col) setCrescente(!crescente)
    else { setOrdenar(col); setCrescente(false) }
  }

  return (
    <DashboardLayout
      titulo="Ranking de lojas"
      subtitulo="Comparativo de performance entre filiais"
      loading={loading}
      actions={
        <FiltroBar periodo={periodo} onPeriodoChange={setPeriodo} />
      }
    >
      {/* KPIs médias da rede */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Faturamento total',  valor: fmt.currencyShort(sorted.reduce((a,k) => a + k.faturamento, 0)), destaque: 'primary' },
          { label: 'T.M médio rede',     valor: fmt.currencyShort(mediaTM), destaque: 'info' },
          { label: 'P.A médio rede',     valor: fmt.number(mediaPA, 1), destaque: mediaPA >= 2.7 ? 'success' : mediaPA >= 2.0 ? 'warn' : 'danger' },
          { label: '% PA1 médio rede',   valor: fmt.percent(mediaPA1), destaque: mediaPA1 <= 30 ? 'success' : mediaPA1 <= 40 ? 'warn' : 'danger' },
          { label: 'Lojas ativas',       valor: String(sorted.length), destaque: 'neutral' },
        ].map(item => (
          <div key={item.label} className={cn('bg-white border rounded-[14px] p-3.5 shadow-[var(--shadow-card)] relative overflow-hidden',
            item.destaque === 'success' ? 'border-green-200' : item.destaque === 'danger' ? 'border-red-200' : item.destaque === 'warn' ? 'border-amber-200' : 'border-[var(--border)]')}>
            <div className={cn('absolute top-0 left-0 right-0 h-[3px] rounded-t-[14px]',
              item.destaque === 'success' ? 'bg-[var(--success)]' : item.destaque === 'danger' ? 'bg-[var(--danger)]' : item.destaque === 'warn' ? 'bg-[var(--warn)]' : item.destaque === 'info' ? 'bg-[var(--info)]' : 'bg-[var(--acc)]')} />
            <div className="text-[9px] text-[var(--ink-ghost)] uppercase tracking-wide mb-2">{item.label}</div>
            <div className="text-[20px] font-medium text-[var(--ink)]">{item.valor}</div>
          </div>
        ))}
      </div>

      {/* Tabela ranking */}
      <Card padding="sm">
        <SectionTitle label="Ranking — clique no cabeçalho para ordenar" icon={Trophy} />
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-[9px] text-[var(--ink-ghost)] uppercase tracking-wider px-3 py-2.5 font-medium text-left w-8">#</th>
                <th className="text-[9px] text-[var(--ink-ghost)] uppercase tracking-wider px-3 py-2.5 font-medium text-left">Loja</th>
                {COLUNAS.map(col => (
                  <th key={col.key}
                    onClick={() => toggle(col.key)}
                    className={cn('text-[9px] uppercase tracking-wider px-3 py-2.5 font-medium text-right cursor-pointer select-none hover:text-[var(--acc)] transition-colors',
                      ordenar === col.key ? 'text-[var(--acc)]' : 'text-[var(--ink-ghost)]')}>
                    {col.label} {ordenar === col.key ? (crescente ? '↑' : '↓') : ''}
                  </th>
                ))}
                <th className="text-[9px] text-[var(--ink-ghost)] uppercase tracking-wider px-3 py-2.5 font-medium text-right">vs Ant.</th>
                <th className="text-[9px] text-[var(--ink-ghost)] uppercase tracking-wider px-3 py-2.5 font-medium text-center w-20">Ação</th>
              </tr>
            </thead>
            <tbody>
              {/* Linha de média */}
              <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
                <td className="px-3 py-2 text-[9px] text-[var(--ink-ghost)]">—</td>
                <td className="px-3 py-2 text-[10px] font-medium text-[var(--ink-ghost)] italic">Média da rede</td>
                <td className="px-3 py-2 text-[10px] text-[var(--ink-ghost)] text-right">{fmt.currencyShort(sorted.reduce((a,k)=>a+k.faturamento,0)/sorted.length)}</td>
                <td className="px-3 py-2 text-[10px] text-[var(--ink-ghost)] text-right">{fmt.currencyShort(mediaTM)}</td>
                <td className="px-3 py-2 text-[10px] text-[var(--ink-ghost)] text-right">{fmt.number(mediaPA,1)}</td>
                <td className="px-3 py-2 text-[10px] text-[var(--ink-ghost)] text-right">—</td>
                <td className="px-3 py-2 text-[10px] text-[var(--ink-ghost)] text-right">{fmt.percent(mediaPA1)}</td>
                <td /><td />
              </tr>

              {sorted.map((k, i) => {
                const ant = kpisAnt?.find(a => a.codigoFilial === k.codigoFilial)
                const varFat = ant && ant.faturamento > 0
                  ? ((k.faturamento - ant.faturamento) / ant.faturamento) * 100
                  : 0

                return (
                  <tr key={k.codigoFilial} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-subtle)] transition-colors">
                    <td className="px-3 py-3">
                      <div className={cn('w-6 h-6 rounded text-[10px] font-medium flex items-center justify-center',
                        i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-500' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-[var(--bg-subtle)] text-[var(--ink-ghost)]')}>
                        {i+1}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-[12px] font-medium text-[var(--ink)]">{k.nomeFilial}</div>
                      <div className="h-1.5 bg-[var(--bg-subtle)] rounded mt-1 w-24 overflow-hidden">
                        <div className="h-full bg-[var(--acc)] opacity-50 rounded" style={{ width: `${(k.faturamento/maxFat)*100}%` }} />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="text-[12px] font-medium text-[var(--acc)]">{fmt.currencyShort(k.faturamento)}</div>
                      {k.percentualMeta && (
                        <div className={cn('text-[9px]', k.percentualMeta >= 100 ? 'text-[var(--success)]' : k.percentualMeta >= 80 ? 'text-[var(--warn)]' : 'text-[var(--danger)]')}>
                          meta: {fmt.percent(k.percentualMeta, 0)}
                        </div>
                      )}
                    </td>
                    <td className={cn('px-3 py-3 text-right text-[12px]',
                      k.ticketMedio >= mediaTM ? 'text-[var(--success)]' : 'text-[var(--ink-muted)]')}>
                      {fmt.currencyShort(k.ticketMedio)}
                    </td>
                    <td className={cn('px-3 py-3 text-right text-[12px] font-medium',
                      k.pecasAtendimento >= 2.7 ? 'text-[var(--success)]' : k.pecasAtendimento >= 2.0 ? 'text-[var(--warn)]' : 'text-[var(--danger)]')}>
                      {fmt.number(k.pecasAtendimento, 1)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {k.percentualMeta !== null && k.percentualMeta !== undefined ? (
                        <Badge variant={k.percentualMeta >= 100 ? 'success' : k.percentualMeta >= 80 ? 'warn' : 'danger'}>
                          {fmt.percent(k.percentualMeta, 0)}
                        </Badge>
                      ) : <span className="text-[var(--ink-ghost)] text-[11px]">—</span>}
                    </td>
                    <td className={cn('px-3 py-3 text-right text-[12px]',
                      k.percentualPA1 <= 30 ? 'text-[var(--success)]' : k.percentualPA1 <= 40 ? 'text-[var(--warn)]' : 'text-[var(--danger)]')}>
                      {fmt.percent(k.percentualPA1)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className={cn('text-[11px] flex items-center justify-end gap-0.5',
                        varFat > 0 ? 'text-[var(--success)]' : varFat < 0 ? 'text-[var(--danger)]' : 'text-[var(--ink-ghost)]')}>
                        {varFat > 0 ? <TrendingUp className="w-3 h-3"/> : varFat < 0 ? <TrendingDown className="w-3 h-3"/> : <Minus className="w-3 h-3"/>}
                        {varFat !== 0 ? `${varFat > 0 ? '+' : ''}${fmt.percent(varFat, 1)}` : '—'}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Link
                        href={`/dashboard/lojas?filial=${k.codigoFilial}`}
                        className="text-[10px] text-[var(--acc)] hover:underline">
                        ver loja
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  )
}
