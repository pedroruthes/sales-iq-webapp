import { cn, fmt } from '@/lib/utils'

interface Item { pa: string; total: number; percentual: number }

const COR: Record<string,string>  = { '1':'bg-[var(--danger)]','2':'bg-[var(--warn)]','3':'bg-[var(--success)]','4':'bg-[var(--acc)]','5+':'bg-[var(--info)]' }
const TEXT: Record<string,string> = { '1':'text-[var(--danger)]','2':'text-[var(--warn)]','3':'text-[var(--success)]','4':'text-[var(--acc)]','5+':'text-[var(--info)]' }

export function PAChart({ dados }: { dados: Item[] }) {
  const max = Math.max(...(dados?.map(d => d.percentual) ?? [1]))

  if (!dados?.length) return (
    <div className="flex items-center justify-center h-28 text-[13px] text-[var(--ink-ghost)]">Sem dados</div>
  )

  return (
    <div className="flex flex-col gap-2.5">
      {dados.map(item => (
        <div key={item.pa} className="flex items-center gap-3">
          <div className={cn('text-[13px] font-medium min-w-[16px] text-right', TEXT[item.pa])}>{item.pa}</div>
          <div className="flex-1 h-[13px] bg-[var(--bg-subtle)] rounded-md overflow-hidden">
            <div
              className={cn('h-full rounded-md flex items-center justify-end pr-1.5 transition-all', COR[item.pa])}
              style={{ width: `${(item.percentual / max) * 100}%`, opacity: 0.85 }}
            >
              {item.percentual > 12 && (
                <span className="text-[12px] font-medium text-white">{fmt.percent(item.percentual, 0)}</span>
              )}
            </div>
          </div>
          <div className="text-right min-w-[52px]">
            <div className={cn('text-[13px] font-medium', TEXT[item.pa])}>{fmt.percent(item.percentual, 1)}</div>
            <div className="text-[13px] text-[var(--ink-ghost)]">{item.total.toLocaleString('pt-BR')} vd</div>
          </div>
        </div>
      ))}
      {(dados.find(d => d.pa === '1')?.percentual ?? 0) > 35 && (
        <div className="mt-1 text-[12px] text-[var(--danger)] bg-[var(--danger-bg)] border border-red-200 rounded-lg px-3 py-2">
          ⚠ Alto índice de vendas com 1 peça — oportunidade de adicional
        </div>
      )}
    </div>
  )
}
