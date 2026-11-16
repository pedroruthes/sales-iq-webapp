import { cn, fmt } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react'
import { num } from '@/lib/num'

type Destaque = 'primary' | 'success' | 'danger' | 'warn' | 'info' | 'neutral'
type Formato = 'moeda' | 'numero' | 'percentual' | 'texto'

interface KPICardProps {
  label: string
  valor: string | number
  formato?: Formato
  variacao?: number
  variacaoLabel?: string
  metaPct?: number
  destaque?: Destaque
  sufixo?: string
  className?: string
  onClick?: () => void
  /** Texto do tooltip explicativo */
  tooltip?: string
}

const BORDER: Record<Destaque, string> = {
  primary: 'border-l-[var(--acc)]',
  success: 'border-l-[var(--success)]',
  danger: 'border-l-[var(--danger)]',
  warn: 'border-l-[var(--warn)]',
  info: 'border-l-[var(--info)]',
  neutral: 'border-l-[var(--ink-ghost)]',
}

const BAR: Record<Destaque, string> = {
  primary: 'bg-[var(--acc)]',
  success: 'bg-[var(--success)]',
  danger: 'bg-[var(--danger)]',
  warn: 'bg-[var(--warn)]',
  info: 'bg-[var(--info)]',
  neutral: 'bg-[var(--ink-ghost)]',
}

function formatarValor(v: string | number, formato: Formato): string {
  if (formato === 'texto') return String(v ?? '')
  const n = num(v, NaN)
  if (!Number.isFinite(n)) return '—'
  switch (formato) {
    case 'moeda':
      return fmt.currencyShort(n)
    case 'numero':
      return n >= 100 && Number.isInteger(n) ? fmt.number(n, 0) : fmt.number(n, 1)
    case 'percentual':
      return fmt.percent(n)
    default:
      return String(n)
  }
}

export function KPICard({
  label, valor, formato = 'texto', variacao, variacaoLabel,
  metaPct, destaque = 'primary', sufixo, className, onClick, tooltip,
}: KPICardProps) {
  const varNum = variacao !== undefined ? num(variacao, NaN) : undefined
  const varPositiva = varNum !== undefined && Number.isFinite(varNum) && varNum > 0
  const varNegativa = varNum !== undefined && Number.isFinite(varNum) && varNum < 0
  const meta = metaPct !== undefined ? num(metaPct, NaN) : undefined

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white border border-[var(--border)] border-l-4 rounded-xl p-3.5 relative group',
        BORDER[destaque],
        'shadow-card transition-all duration-200',
        'hover:shadow-card2',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <div className="text-[12px] text-[var(--ink-ghost)] font-medium mb-1 flex items-center gap-1">
        <span>{label}</span>
        {tooltip && (
          <span className="relative inline-flex">
            <HelpCircle className="w-3 h-3 text-[var(--ink-ghost)] opacity-70" />
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-20 w-52 rounded-lg bg-[var(--ink)] text-white text-[11px] leading-snug px-2.5 py-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              {tooltip}
            </span>
          </span>
        )}
      </div>

      <div className={cn('text-[18px] font-medium leading-none tracking-[-0.02em]', {
        'text-[var(--acc)]': destaque === 'primary',
        'text-[var(--success)]': destaque === 'success',
        'text-[var(--danger)]': destaque === 'danger',
        'text-amber-600': destaque === 'warn',
        'text-[var(--info)]': destaque === 'info',
        'text-[var(--ink)]': destaque === 'neutral',
      })}>
        {formatarValor(valor, formato)}
        {sufixo && <span className="text-[13px] font-medium text-[var(--ink-ghost)] ml-1">{sufixo}</span>}
      </div>

      {varNum !== undefined && Number.isFinite(varNum) && (
        <div className={cn(
          'text-[12px] font-medium flex items-center gap-1 mt-2',
          varPositiva ? 'text-[var(--success)]' : varNegativa ? 'text-[var(--danger)]' : 'text-[var(--ink-ghost)]'
        )}>
          {varPositiva
            ? <TrendingUp className="w-3.5 h-3.5" />
            : varNegativa
              ? <TrendingDown className="w-3.5 h-3.5" />
              : <Minus className="w-3.5 h-3.5" />}
          {varNum > 0 ? '+' : ''}{fmt.percent(varNum, 1)}
          {variacaoLabel && <span className="text-[var(--ink-ghost)] font-normal ml-0.5">{variacaoLabel}</span>}
        </div>
      )}

      {meta !== undefined && Number.isFinite(meta) && (
        <div className="mt-3 h-1 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full', BAR[destaque])}
            style={{ width: `${Math.min(meta, 100)}%`, opacity: 0.85 }}
          />
        </div>
      )}
    </div>
  )
}
