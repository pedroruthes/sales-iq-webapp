import { Target } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui'
import { KPIsVendedor } from '@/types'
import { fmt, cn } from '@/lib/utils'

export function VendedorMetaBar({ dados }: { dados: KPIsVendedor[] }) {
  const comMeta = dados.filter(v => v.meta && v.meta > 0)
  if (!comMeta.length) return null

  return (
    <Card>
      <SectionTitle label="Progresso vs meta — faturamento" icon={Target} />
      <div className="flex flex-col gap-4">
        {comMeta.map(v => {
          const pct  = v.percentualMeta ?? 0
          const cor  = pct >= 100 ? 'bg-[var(--success)]' : pct >= 80 ? 'bg-[var(--warn)]' : 'bg-[var(--danger)]'
          const corT = pct >= 100 ? 'text-[var(--success)]' : pct >= 80 ? 'text-[var(--warn)]' : 'text-[var(--danger)]'

          return (
            <div key={v.codigoVendedor}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-medium text-[var(--ink)]">
                  {v.apelidoVendedor || v.nomeVendedor}
                </span>
                <div className="flex items-center gap-2 text-[13px]">
                  <span className="text-[var(--ink-ghost)]">{fmt.currencyShort(v.faturamento)}</span>
                  <span className="text-[var(--ink-ghost)]">/</span>
                  <span className="text-[var(--ink-muted)]">{fmt.currencyShort(v.meta!)}</span>
                  <span className={cn('font-medium', corT)}>{fmt.percent(pct)}</span>
                </div>
              </div>
              <div className="h-2.5 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', cor)}
                  style={{ width: `${Math.min(pct, 100)}%`, opacity: 0.85 }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
