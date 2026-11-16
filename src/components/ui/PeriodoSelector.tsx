import { useState } from 'react'
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns'
import { Calendar, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Periodo { label: string; inicio: Date; fim: Date }

function getOpcoes(): Periodo[] {
  const h = new Date()
  return [
    { label: 'Mês atual',     inicio: startOfMonth(h),              fim: endOfMonth(h)              },
    { label: 'Mês anterior',  inicio: startOfMonth(subMonths(h,1)), fim: endOfMonth(subMonths(h,1)) },
    { label: '2 meses atrás', inicio: startOfMonth(subMonths(h,2)), fim: endOfMonth(subMonths(h,2)) },
    { label: '3 meses atrás', inicio: startOfMonth(subMonths(h,3)), fim: endOfMonth(subMonths(h,3)) },
    { label: 'Ano atual',     inicio: startOfYear(h),               fim: endOfYear(h)               },
  ]
}

export function PeriodoSelector({
  value, onChange,
}: {
  value?: Periodo
  onChange: (p: Periodo) => void
}) {
  const [open, setOpen] = useState(false)
  const opcoes = getOpcoes()
  const label = value?.label ?? 'Selecionar período'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="filter-trigger"
      >
        <Calendar className="w-3.5 h-3.5" />
        <span className="capitalize font-medium">{label}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 w-52 max-w-[calc(100vw-1.5rem)] max-h-[min(320px,70vh)] overflow-y-auto bg-white border border-[var(--border)] rounded-xl py-1.5 shadow-card2 z-20">
            {opcoes.map(p => (
              <button
                type="button"
                key={p.label}
                onClick={() => { onChange(p); setOpen(false) }}
                className={cn(
                  'flex items-center justify-between w-full px-3.5 py-2.5 text-[13px] transition-colors',
                  value?.label === p.label
                    ? 'bg-[var(--acc-pale)] text-[var(--acc)] font-medium'
                    : 'text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)]'
                )}
              >
                {p.label}
                {value?.label === p.label && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
