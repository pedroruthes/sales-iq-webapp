import { Package, ExternalLink } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui'
import { fmt, cn } from '@/lib/utils'
import Link from '@/lib/Link'

interface ItemABC { PRODUTO: string; DESC_PRODUTO: string; faturamento: number; curva: string }
interface Props { abc?: ItemABC[]; parados?: number; giroMedio?: number }

const CURVA_COR: Record<string,string> = {
  A: 'bg-[var(--success-bg)] text-[var(--success)]',
  B: 'bg-[var(--warn-bg)] text-[var(--warn)]',
  C: 'bg-[var(--bg-subtle)] text-[var(--ink-ghost)]',
}

export function EstoqueMini({ abc = [], parados = 0, giroMedio = 0 }: Props) {
  const topABC = abc.slice(0, 4)
  const maxFat = topABC[0]?.faturamento ?? 1

  return (
    <Card padding="sm">
      <div className="flex items-center justify-between mb-3">
        <SectionTitle label="Estoque — resumo" icon={Package} className="mb-0 flex-1" />
        <Link href="/dashboard/estoque" className="text-[12px] text-[var(--acc)] flex items-center gap-1">
          ver tudo <ExternalLink className="w-2.5 h-2.5" />
        </Link>
      </div>

      {/* 3 KPIs mini */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-[var(--bg-subtle)] rounded-lg p-2 text-center">
          <div className="text-[12px] text-[var(--ink-ghost)] uppercase mb-1">Parados</div>
          <div className={cn('text-[16px] font-medium', parados > 30 ? 'text-[var(--danger)]' : 'text-[var(--ink)]')}>
            {parados}
          </div>
        </div>
        <div className="bg-[var(--bg-subtle)] rounded-lg p-2 text-center">
          <div className="text-[12px] text-[var(--ink-ghost)] uppercase mb-1">Giro médio</div>
          <div className={cn('text-[16px] font-medium', giroMedio >= 5 ? 'text-[var(--success)]' : giroMedio >= 2 ? 'text-[var(--warn)]' : 'text-[var(--danger)]')}>
            {fmt.number(giroMedio, 1)}x
          </div>
        </div>
        <div className="bg-[var(--bg-subtle)] rounded-lg p-2 text-center">
          <div className="text-[12px] text-[var(--ink-ghost)] uppercase mb-1">Curva A</div>
          <div className="text-[16px] font-medium text-[var(--success)]">
            {abc.filter(d => d.curva === 'A').length}
          </div>
        </div>
      </div>

      {/* Top ABC */}
      <div className="text-[13px] text-[var(--ink-ghost)] uppercase tracking-wide mb-2">Curva ABC — top produtos</div>
      <div className="flex flex-col gap-1.5">
        {topABC.map(item => (
          <div key={item.PRODUTO} className="flex items-center gap-2">
            <span className={cn('text-[13px] font-medium w-5 text-center rounded px-1 py-0.5', CURVA_COR[item.curva])}>
              {item.curva}
            </span>
            <span className="flex-1 text-[13px] text-[var(--ink-muted)] truncate">{item.DESC_PRODUTO || item.PRODUTO}</span>
            <div className="w-16 h-1.5 bg-[var(--bg-subtle)] rounded overflow-hidden">
              <div className="h-full bg-[var(--acc)] opacity-60 rounded"
                style={{ width: `${(item.faturamento/maxFat)*100}%` }} />
            </div>
            <span className="text-[12px] font-medium text-[var(--ink)] min-w-[40px] text-right">
              {fmt.currencyShort(item.faturamento)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
