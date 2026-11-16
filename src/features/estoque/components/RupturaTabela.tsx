import { XCircle } from 'lucide-react'
import { Card, SectionTitle, Badge } from '@/components/ui'
import { fmt, cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { GradeTamanhos, type TamanhoEstoque } from './GradeTamanhos'
import {
  EstoqueTabelaFiltros,
  filtrarEstoqueItems,
  useEstoqueFiltros,
} from './EstoqueTabelaFiltros'

interface Item {
  PRODUTO: string; DESC_PRODUTO: string; GRUPO_PRODUTO: string
  DESC_COR_PRODUTO: string; COR_PRODUTO: string; filial: string
  qtdVendidaRecente: number; fatRecente: number
  ultimaVenda: string; estoqueAtual: number; grade?: TamanhoEstoque[] | null
}

export function RupturaTabela({ dados }: { dados: Item[] }) {
  const [filtros, setFiltros] = useEstoqueFiltros()
  const filtrados = filtrarEstoqueItems(dados, filtros)
  const fatTotal = filtrados.reduce((a, d) => a + d.fatRecente, 0)

  if (!dados.length) return (
    <Card>
      <SectionTitle label="Rupturas de estoque" icon={XCircle} />
      <div className="text-center py-8 text-[13px] text-[var(--ink-ghost)]">
        Nenhuma ruptura identificada no período
      </div>
    </Card>
  )

  return (
    <Card padding="sm">
      <div className="flex items-center justify-between mb-2">
        <SectionTitle label="Rupturas — vendendo mas zerou" icon={XCircle} className="mb-0 flex-1" />
        <Badge variant="danger">{filtrados.length} produtos</Badge>
      </div>

      <EstoqueTabelaFiltros dados={dados} value={filtros} onChange={setFiltros} />

      <div className="mb-3 px-3 py-2 bg-[var(--warn-bg)] border border-amber-200 rounded-lg text-[13px] text-[var(--warn)] flex items-center gap-2">
        <XCircle className="w-3.5 h-3.5 shrink-0" />
        {fmt.currencyShort(fatTotal)} em faturamento recente (filtro atual) — estoque zerado pode estar causando perda de vendas
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {['Produto', 'Cor', 'Grupo', 'Filial', 'Tamanhos', 'Qtd vendida', 'Fat. recente', 'Última venda', 'Estoque'].map((h, i) => (
                <th key={h} className={cn(
                  'text-[11px] text-[var(--ink-ghost)] uppercase tracking-wider px-2 py-2 font-medium',
                  i >= 5 ? 'text-right' : 'text-left'
                )}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.slice(0, 50).map(item => {
              const corLabel = item.DESC_COR_PRODUTO || item.COR_PRODUTO || '—'
              return (
                <tr key={`${item.PRODUTO}-${item.COR_PRODUTO}-${item.filial}`}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-subtle)] transition-colors">
                  <td className="px-2 py-2.5">
                    <div className="text-[13px] font-medium text-[var(--ink)]">{item.PRODUTO}</div>
                    <div className="text-[11px] text-[var(--ink-faint)] max-w-[160px] truncate">{item.DESC_PRODUTO}</div>
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="text-[12px] text-[var(--ink)]">{corLabel}</div>
                    {item.DESC_COR_PRODUTO && item.COR_PRODUTO && item.DESC_COR_PRODUTO !== item.COR_PRODUTO && (
                      <div className="text-[10px] text-[var(--ink-ghost)]">{item.COR_PRODUTO}</div>
                    )}
                  </td>
                  <td className="px-2 py-2 text-[12px] text-[var(--ink-ghost)]">{item.GRUPO_PRODUTO}</td>
                  <td className="px-2 py-2 text-[12px] text-[var(--ink-ghost)]">{item.filial}</td>
                  <td className="px-2 py-2 min-w-[160px]">
                    <GradeTamanhos grade={item.grade} filtroTamanhos={filtros.tamanhos} />
                  </td>
                  <td className="px-2 py-2 text-right text-[13px] text-[var(--ink-muted)] tabular-nums">{item.qtdVendidaRecente}</td>
                  <td className="px-2 py-2 text-right text-[13px] font-medium text-[var(--acc)] tabular-nums">{fmt.currencyShort(item.fatRecente)}</td>
                  <td className="px-2 py-2 text-[12px] text-[var(--ink-muted)] text-right whitespace-nowrap">
                    {format(new Date(item.ultimaVenda), 'dd/MM/yy', { locale: ptBR })}
                  </td>
                  <td className="px-2 py-2 text-right">
                    <Badge variant="danger">ZERO</Badge>
                  </td>
                </tr>
              )
            })}
            {!filtrados.length && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-[13px] text-[var(--ink-ghost)]">
                  Nenhum item com os filtros selecionados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
