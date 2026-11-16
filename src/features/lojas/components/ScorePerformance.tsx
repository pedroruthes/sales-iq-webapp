import { TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KPIsFilial } from '@/types'

export function ScorePerformance({ kpi }: { kpi: KPIsFilial }) {
  const scores = [
    { label: 'Meta',  val: Math.min(kpi.percentualMeta ?? 50, 100), cor: 'bg-[var(--acc)]' },
    { label: 'P.A',   val: Math.min((kpi.pecasAtendimento / 2.7) * 100, 100), cor: 'bg-[var(--info)]' },
    { label: '% PA1', val: Math.max(100 - kpi.percentualPA1 * 1.5, 0), cor: 'bg-[var(--warn)]' },
  ]

  const scoreGeral = Math.round(scores.reduce((a, s) => a + s.val, 0) / scores.length)
  const corGeral = scoreGeral >= 80 ? 'text-[var(--success)]' : scoreGeral >= 60 ? 'text-[var(--acc)]' : 'text-[var(--warn)]'

  return (
    <div className="rounded-[12px] bg-[var(--bg-page)] border border-[var(--border)] p-3">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[12px] font-medium text-[var(--ink-faint)]">Performance</span>
        <div className="flex items-center gap-1">
          <span className={cn('text-[20px] font-semibold leading-none', corGeral)}>{scoreGeral}</span>
          <TrendingUp className="w-3.5 h-3.5 text-[var(--success)]" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {scores.map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--ink-ghost)] w-9 shrink-0">{s.label}</span>
            <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
              <div className={cn('h-full rounded-full', s.cor)} style={{ width: `${s.val}%` }} />
            </div>
            <span className="text-[11px] text-[var(--ink-ghost)] w-7 text-right">{Math.round(s.val)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
