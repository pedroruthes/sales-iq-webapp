import { Unlink, AlertTriangle } from 'lucide-react'
import { Card, SectionTitle, Badge } from '@/components/ui'
import { fmt, cn, upperNome } from '@/lib/utils'

interface Item {
  codigoVendedor: string; nomeVendedor: string; codigoFilial: string
  totalVendas: number; semVinculo: number; pctSemVinculo: number
}

export function SemVinculoChart({ dados }: { dados: Item[] }) {
  const maxPct = Math.max(...(dados?.map(d => d.pctSemVinculo) ?? [1]))

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <SectionTitle label="Vendas sem vínculo — por vendedor" icon={Unlink} className="mb-0 flex-1" />
        <Badge variant="warn">meta: &lt;10%</Badge>
      </div>

      <div className="flex flex-col gap-2.5">
        {dados?.map(item => (
          <div key={`${item.codigoVendedor}-${item.codigoFilial}`} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[12px] font-medium text-[var(--ink-faint)] shrink-0">
              {upperNome(item.nomeVendedor).charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13px] font-medium text-[var(--ink)] truncate">{upperNome(item.nomeVendedor)}</span>
                <span className={cn(
                  'text-[13px] font-medium',
                  item.pctSemVinculo > 25 ? 'text-[var(--danger)]'
                  : item.pctSemVinculo > 10 ? 'text-[var(--warn)]'
                  : 'text-[var(--success)]'
                )}>
                  {fmt.percent(item.pctSemVinculo)}
                </span>
              </div>
              <div className="h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all',
                    item.pctSemVinculo > 25 ? 'bg-[var(--danger)]'
                    : item.pctSemVinculo > 10 ? 'bg-[var(--warn)]'
                    : 'bg-[var(--success)]'
                  )}
                  style={{ width: `${(item.pctSemVinculo / Math.max(maxPct, 30)) * 100}%`, opacity: 0.8 }}
                />
              </div>
              <div className="text-[13px] text-[var(--ink-ghost)] mt-0.5">
                {item.semVinculo} de {item.totalVendas} vendas sem cliente vinculado
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
