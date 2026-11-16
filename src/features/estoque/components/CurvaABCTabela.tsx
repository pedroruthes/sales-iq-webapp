import { useMemo } from 'react'
import { BarChart3 } from 'lucide-react'
import { Card, SectionTitle, Badge } from '@/components/ui'
import { fmt, cn } from '@/lib/utils'
import { GradeTamanhos, type TamanhoEstoque } from './GradeTamanhos'
import {
  EstoqueTabelaFiltros,
  filtrarEstoqueItems,
  useEstoqueFiltros,
} from './EstoqueTabelaFiltros'

interface ItemABC {
  PRODUTO: string; DESC_PRODUTO: string; GRUPO_PRODUTO: string
  COR_PRODUTO?: string; DESC_COR_PRODUTO?: string
  filial?: string
  faturamento: number; pctFaturamento: number; pctAcumulado: number
  qtdVendida: number; giro: number; curva: string; grade?: TamanhoEstoque[] | null
}

interface Props { dados: ItemABC[] }

const CURVA_STYLE: Record<string, string> = {
  A: 'bg-[var(--success-bg)] text-[var(--success)] border-green-200',
  B: 'bg-[var(--warn-bg)] text-[var(--warn)] border-amber-200',
  C: 'bg-[var(--bg-subtle)] text-[var(--ink-ghost)] border-[var(--border)]',
}

/** Recalcula Pareto 70/90 sobre o conjunto filtrado */
function recalcularABC(items: ItemABC[]): ItemABC[] {
  const ordenados = [...items].sort((a, b) => b.faturamento - a.faturamento)
  const total = ordenados.reduce((a, d) => a + d.faturamento, 0)
  if (total <= 0) {
    return ordenados.map((d) => ({
      ...d,
      pctFaturamento: 0,
      pctAcumulado: 0,
      curva: 'C',
    }))
  }
  let acum = 0
  return ordenados.map((d) => {
    const pctFat = (d.faturamento / total) * 100
    acum += d.faturamento
    const pctAcum = (acum / total) * 100
    const curva = pctAcum <= 70 ? 'A' : pctAcum <= 90 ? 'B' : 'C'
    return { ...d, pctFaturamento: pctFat, pctAcumulado: pctAcum, curva }
  })
}

export function CurvaABCTabela({ dados }: Props) {
  const [filtros, setFiltros] = useEstoqueFiltros()
  const filtradosBrutos = filtrarEstoqueItems(dados, filtros)
  const temFiltro =
    !!filtros.busca.trim() ||
    !!filtros.cor ||
    !!filtros.grupo ||
    filtros.tamanhos.length > 0

  const filtrados = useMemo(
    () => (temFiltro ? recalcularABC(filtradosBrutos) : filtradosBrutos),
    [filtradosBrutos, temFiltro]
  )

  const qtdA = filtrados.filter(d => d.curva === 'A').length
  const qtdB = filtrados.filter(d => d.curva === 'B').length
  const qtdC = filtrados.filter(d => d.curva === 'C').length
  const fatA = filtrados.filter(d => d.curva === 'A').reduce((a, d) => a + d.faturamento, 0)
  const fatB = filtrados.filter(d => d.curva === 'B').reduce((a, d) => a + d.faturamento, 0)
  const fatC = filtrados.filter(d => d.curva === 'C').reduce((a, d) => a + d.faturamento, 0)
  const fatTotal = filtrados.reduce((a, d) => a + d.faturamento, 0)
  const pct = (fat: number) => (fatTotal > 0 ? (fat / fatTotal) * 100 : 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { curva: 'A', qtd: qtdA, pct: pct(fatA), label: 'Até 70% do faturamento acumulado', cor: 'success' as const },
          { curva: 'B', qtd: qtdB, pct: pct(fatB), label: 'De 70% a 90% do acumulado', cor: 'warn' as const },
          { curva: 'C', qtd: qtdC, pct: pct(fatC), label: 'Acima de 90% do acumulado', cor: 'neutral' as const },
        ].map(({ curva, qtd, pct: pctBar, label }) => (
          <Card key={curva} padding="sm" className="text-center">
            <div className={cn('text-3xl font-medium mb-1',
              curva === 'A' ? 'text-[var(--success)]' : curva === 'B' ? 'text-[var(--warn)]' : 'text-[var(--ink-ghost)]')}>
              {curva}
            </div>
            <div className="text-[18px] font-medium text-[var(--ink)]">{qtd} SKUs</div>
            <div className="text-[12px] text-[var(--ink-ghost)] mt-1">{label}</div>
            <div className="text-[12px] font-medium text-[var(--ink-muted)] mt-0.5 tabular-nums">
              {fmt.percent(pctBar)} do fat.
            </div>
            <div className="mt-2 h-1.5 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
              <div className={cn('h-full rounded-full',
                curva === 'A' ? 'bg-[var(--success)]' : curva === 'B' ? 'bg-[var(--warn)]' : 'bg-[var(--ink-ghost)]')}
                style={{ width: `${Math.min(pctBar, 100)}%`, opacity: 0.7 }} />
            </div>
          </Card>
        ))}
      </div>

      <Card padding="sm">
        <div className="flex items-center justify-between mb-2">
          <SectionTitle
            label={temFiltro ? 'Produtos por curva (recalculado com filtros)' : 'Produtos por curva — top 200'}
            icon={BarChart3}
            className="mb-0 flex-1"
          />
          <Badge variant="neutral">{filtrados.length}</Badge>
        </div>

        <EstoqueTabelaFiltros dados={dados} value={filtros} onChange={setFiltros} />

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {['Curva','Produto','Cor','Grupo','Estoque por tamanho','Faturamento','% Fat','% Acum','Qtd','Giro/mês'].map((h, i) => (
                  <th key={h} className={cn(
                    'text-[11px] text-[var(--ink-ghost)] uppercase tracking-wider px-3 py-2 font-medium whitespace-nowrap',
                    i <= 4 ? 'text-left' : 'text-right'
                  )}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.slice(0, 100).map(item => {
                const corLabel = item.DESC_COR_PRODUTO || item.COR_PRODUTO || '—'
                return (
                  <tr key={`${item.filial ?? ''}-${item.PRODUTO}-${item.COR_PRODUTO ?? ''}`}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-subtle)] transition-colors">
                    <td className="px-3 py-2.5">
                      <span className={cn('text-[12px] font-medium px-2 py-0.5 rounded-md border', CURVA_STYLE[item.curva])}>
                        {item.curva}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-[13px] font-medium text-[var(--ink)]">{item.PRODUTO}</div>
                      <div className="text-[12px] text-[var(--ink-ghost)] truncate max-w-[160px]">{item.DESC_PRODUTO}</div>
                      {item.filial && (
                        <div className="text-[10px] text-[var(--ink-ghost)]">Loja {item.filial}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-[12px] text-[var(--ink)]">{corLabel}</div>
                      {item.DESC_COR_PRODUTO && item.COR_PRODUTO && item.DESC_COR_PRODUTO !== item.COR_PRODUTO && (
                        <div className="text-[10px] text-[var(--ink-ghost)]">{item.COR_PRODUTO}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-[var(--ink-faint)]">{item.GRUPO_PRODUTO}</td>
                    <td className="px-3 py-2.5 min-w-[180px]">
                      <GradeTamanhos grade={item.grade} filtroTamanhos={filtros.tamanhos} />
                    </td>
                    <td className="px-3 py-2.5 text-[13px] font-medium text-[var(--acc)] text-right tabular-nums">{fmt.currencyShort(item.faturamento)}</td>
                    <td className="px-3 py-2.5 text-[13px] text-[var(--ink-muted)] text-right tabular-nums">{fmt.percent(item.pctFaturamento)}</td>
                    <td className="px-3 py-2.5 text-[13px] text-[var(--ink-muted)] text-right tabular-nums">{fmt.percent(item.pctAcumulado)}</td>
                    <td className="px-3 py-2.5 text-[13px] text-[var(--ink-muted)] text-right tabular-nums">{fmt.number(item.qtdVendida, 0)}</td>
                    <td className="px-3 py-2.5 text-[13px] text-right">
                      <span className={cn(
                        item.giro >= 10 ? 'text-[var(--success)]' : item.giro >= 3 ? 'text-[var(--warn)]' : 'text-[var(--danger)]',
                        'font-medium tabular-nums'
                      )}>
                        {fmt.number(item.giro, 1)}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {!filtrados.length && (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-[13px] text-[var(--ink-ghost)]">
                    Nenhum item com os filtros selecionados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
