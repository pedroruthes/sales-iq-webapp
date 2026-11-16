import { AlertTriangle, Package } from 'lucide-react'
import { Card, SectionTitle, Badge } from '@/components/ui'
import { fmt, cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Parado {
  PRODUTO: string; DESC_PRODUTO: string; GRUPO_PRODUTO: string
  ultimaVenda: string | null; diasParado: number; custo: number
}

export function ProdutosParados({ dados }: { dados: Parado[] }) {
  if (!dados.length) return (
    <Card>
      <SectionTitle label="Produtos parados" icon={Package} />
      <div className="text-center py-8 text-[13px] text-[var(--ink-ghost)]">
        Nenhum produto parado no período
      </div>
    </Card>
  )

  const faixa = (dias: number) => {
    if (dias >= 120) return { label: `${dias}d`, color: 'danger' as const }
    if (dias >= 90)  return { label: `${dias}d`, color: 'warn' as const }
    return { label: `${dias}d`, color: 'neutral' as const }
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-1">
        <SectionTitle label="Produtos parados — sem venda" icon={Package} className="mb-0 flex-1" />
        <Badge variant="danger">{dados.length} produtos</Badge>
      </div>

      <div className="mb-3 px-3 py-2 bg-[var(--danger-bg)] border border-red-200 rounded-lg text-[13px] text-[var(--danger)] flex items-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        Produtos sem movimentação podem indicar ruptura ou falta de exposição
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {['Produto','Descrição','Grupo','Última venda','Parado há','Custo médio'].map((h, i) => (
                <th key={h} className={cn(
                  'text-[13px] text-[var(--ink-ghost)] uppercase tracking-wider px-3 py-2 font-medium whitespace-nowrap',
                  i >= 3 ? 'text-right' : 'text-left'
                )}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dados.slice(0, 30).map(item => {
              const f = faixa(item.diasParado)
              return (
                <tr key={item.PRODUTO} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-subtle)] transition-colors">
                  <td className="px-3 py-2.5 text-[13px] font-medium text-[var(--ink)]">{item.PRODUTO}</td>
                  <td className="px-3 py-2.5 text-[13px] text-[var(--ink-faint)] max-w-[160px] truncate">{item.DESC_PRODUTO}</td>
                  <td className="px-3 py-2.5 text-[12px] text-[var(--ink-ghost)]">{item.GRUPO_PRODUTO}</td>
                  <td className="px-3 py-2.5 text-[13px] text-[var(--ink-muted)] text-right">
                    {item.ultimaVenda
                      ? format(new Date(item.ultimaVenda), 'dd/MM/yyyy', { locale: ptBR })
                      : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Badge variant={f.color}>{f.label}</Badge>
                  </td>
                  <td className="px-3 py-2.5 text-[13px] text-[var(--ink-muted)] text-right">
                    {item.custo > 0 ? fmt.currency(item.custo) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
