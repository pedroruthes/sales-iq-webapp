import { Card, SectionTitle } from '@/components/ui'
import { Target } from 'lucide-react'
import { fmt, cn } from '@/lib/utils'
import { num } from '@/lib/num'
import { KPIsFilial } from '@/types'

export function MetaLojasResumo({ kpis }: { kpis: KPIsFilial[] }) {
  const comMeta = kpis.filter(
    (k) => k.percentualMeta != null && Number.isFinite(num(k.percentualMeta, NaN))
  )
  if (!comMeta.length) return null

  const acima = comMeta.filter((k) => num(k.percentualMeta) >= 100)
  const perto = comMeta.filter((k) => {
    const p = num(k.percentualMeta)
    return p >= 80 && p < 100
  })
  const abaixo = comMeta.filter((k) => num(k.percentualMeta) < 80)
  const media =
    comMeta.reduce((a, k) => a + num(k.percentualMeta), 0) / comMeta.length

  const blocos = [
    { label: 'Na meta', qtd: acima.length, cor: 'text-[var(--success)]', bg: 'bg-[var(--success-bg)]', border: 'border-[var(--success)]/30' },
    { label: '80–99%', qtd: perto.length, cor: 'text-[var(--warn)]', bg: 'bg-[var(--warn-bg)]', border: 'border-[var(--warn)]/30' },
    { label: 'Abaixo', qtd: abaixo.length, cor: 'text-[var(--danger)]', bg: 'bg-[var(--danger-bg)]', border: 'border-[var(--danger)]/30' },
  ]

  return (
    <Card padding="sm">
      <div className="flex items-center justify-between mb-3">
        <SectionTitle label="Atingimento de meta" icon={Target} className="mb-0" />
        <div className="text-[13px] font-semibold text-[var(--ink)] tabular-nums">
          {fmt.percent(media, 0)} médio
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {blocos.map((b) => (
          <div
            key={b.label}
            className={cn('rounded-xl border px-3 py-2.5', b.bg, b.border)}
          >
            <div className="text-[11px] text-[var(--ink-ghost)]">{b.label}</div>
            <div className={cn('text-[20px] font-semibold tabular-nums', b.cor)}>{b.qtd}</div>
            <div className="text-[10px] text-[var(--ink-ghost)]">
              {fmt.percent((b.qtd / comMeta.length) * 100, 0)} das lojas
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto">
        {[...comMeta]
          .sort((a, b) => num(b.percentualMeta) - num(a.percentualMeta))
          .slice(0, 6)
          .map((k) => {
            const p = num(k.percentualMeta)
            return (
              <div key={k.codigoFilial} className="flex items-center gap-2">
                <span className="text-[12px] text-[var(--ink-muted)] flex-1 truncate">
                  {k.nomeFilial}
                </span>
                <div className="w-24 h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      p >= 100 ? 'bg-[var(--success)]' : p >= 80 ? 'bg-[var(--warn)]' : 'bg-[var(--danger)]'
                    )}
                    style={{ width: `${Math.min(p, 100)}%` }}
                  />
                </div>
                <span
                  className={cn(
                    'text-[12px] font-medium w-10 text-right tabular-nums',
                    p >= 100 ? 'text-[var(--success)]' : p >= 80 ? 'text-[var(--warn)]' : 'text-[var(--danger)]'
                  )}
                >
                  {fmt.percent(p, 0)}
                </span>
              </div>
            )
          })}
      </div>
    </Card>
  )
}
