import { Target, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { fmt, cn } from '@/lib/utils'
import { KPIsFilial } from '@/types'

interface Props { kpi: KPIsFilial; variacaoFat?: number }

export function MetaStrip({ kpi, variacaoFat = 0 }: Props) {
  const pct      = kpi.percentualMeta ?? 0
  const faltam   = kpi.meta ? Math.max(kpi.meta - kpi.faturamento, 0) : null
  const cor      = pct >= 100 ? 'bg-[var(--success)]' : pct >= 80 ? 'bg-[var(--acc)]' : pct >= 60 ? 'bg-[var(--warn)]' : 'bg-[var(--danger)]'
  const corPct   = pct >= 100 ? 'text-[var(--success)]' : pct >= 80 ? 'text-[var(--acc)]' : pct >= 60 ? 'text-[var(--warn)]' : 'text-[var(--danger)]'

  return (
    <div className="bg-white border border-[var(--border)] rounded-[14px] p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-6">

        {/* Faturamento */}
        <div className="text-center min-w-[100px]">
          <div className="text-[13px] text-[var(--ink-ghost)] uppercase tracking-wide mb-1">Faturamento</div>
          <div className="text-[18px] font-medium text-[var(--ink)]">{fmt.currencyShort(kpi.faturamento)}</div>
          <div className={cn('text-[12px] flex items-center justify-center gap-0.5',
            variacaoFat > 0 ? 'text-[var(--success)]' : variacaoFat < 0 ? 'text-[var(--danger)]' : 'text-[var(--ink-ghost)]')}>
            {variacaoFat > 0 ? <TrendingUp className="w-3 h-3"/> : variacaoFat < 0 ? <TrendingDown className="w-3 h-3"/> : <Minus className="w-3 h-3"/>}
            {variacaoFat > 0 ? '+' : ''}{fmt.percent(variacaoFat, 1)} vs ant.
          </div>
        </div>

        <div className="w-px h-10 bg-[var(--border)]" />

        {/* Meta */}
        {kpi.meta ? (
          <>
            <div className="text-center min-w-[90px]">
              <div className="text-[13px] text-[var(--ink-ghost)] uppercase tracking-wide mb-1">Meta</div>
              <div className="text-[18px] font-medium text-[var(--ink)]">{fmt.currencyShort(kpi.meta)}</div>
              {faltam !== null && faltam > 0 && (
                <div className="text-[12px] text-[var(--ink-ghost)]">faltam {fmt.currencyShort(faltam)}</div>
              )}
              {faltam === 0 && <div className="text-[12px] text-[var(--success)]">✓ batida!</div>}
            </div>

            <div className="w-px h-10 bg-[var(--border)]" />

            {/* Barra de progresso */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2 text-[12px]">
                <span className="text-[var(--ink-ghost)]">Progresso da meta</span>
                <span className={cn('font-medium text-[12px]', corPct)}>{fmt.percent(pct, 0)}</span>
              </div>
              <div className="h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', cor)}
                  style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <div className="flex justify-between text-[13px] text-[var(--ink-ghost)] mt-1">
                <span>R$ 0</span>
                <span>{fmt.currencyShort(kpi.meta)}</span>
              </div>
            </div>

            <div className="w-px h-10 bg-[var(--border)]" />
          </>
        ) : (
          <div className="flex-1">
            <div className="text-[12px] text-[var(--ink-ghost)] text-center">Meta não cadastrada</div>
          </div>
        )}

        {/* Vendas */}
        <div className="text-center min-w-[80px]">
          <div className="text-[13px] text-[var(--ink-ghost)] uppercase tracking-wide mb-1">Qtde vendas</div>
          <div className="text-[18px] font-medium text-[var(--ink)]">{kpi.totalVendas.toLocaleString('pt-BR')}</div>
        </div>

        <div className="w-px h-10 bg-[var(--border)]" />

        {/* Peças */}
        <div className="text-center min-w-[80px]">
          <div className="text-[13px] text-[var(--ink-ghost)] uppercase tracking-wide mb-1">Peças vendidas</div>
          <div className="text-[18px] font-medium text-[var(--ink)]">{kpi.totalPecas.toLocaleString('pt-BR')}</div>
          <div className="text-[12px] text-[var(--ink-ghost)]">PA {fmt.number(kpi.pecasAtendimento, 1)}</div>
        </div>

      </div>
    </div>
  )
}
