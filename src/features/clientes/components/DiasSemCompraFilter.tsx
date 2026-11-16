import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DiasRange = {
  diasMin: number
  diasMax: number
  presetId: string
}

export const DIAS_PRESETS: {
  id: string
  label: string
  diasMin: number
  diasMax: number
}[] = [
  { id: '30', label: '30d+', diasMin: 30, diasMax: 9999 },
  { id: '45', label: '45d+', diasMin: 45, diasMax: 9999 },
  { id: '60', label: '60d+', diasMin: 60, diasMax: 9999 },
  { id: '90', label: '90d+', diasMin: 90, diasMax: 9999 },
  { id: '120', label: '120d+', diasMin: 120, diasMax: 9999 },
  { id: '180', label: '180d+', diasMin: 180, diasMax: 9999 },
  { id: '45-90', label: '45–90d', diasMin: 45, diasMax: 90 },
  { id: '90-180', label: '90–180d', diasMin: 90, diasMax: 180 },
]

export const DEFAULT_DIAS_RANGE: DiasRange = {
  presetId: '60',
  diasMin: 60,
  diasMax: 9999,
}

interface Props {
  value: DiasRange
  onChange: (v: DiasRange) => void
  className?: string
  compact?: boolean
}

export function DiasSemCompraFilter({ value, onChange, className, compact }: Props) {
  const [customMin, setCustomMin] = useState(String(value.diasMin || 60))
  const [customMax, setCustomMax] = useState(
    value.diasMax >= 9999 ? '' : String(value.diasMax)
  )
  const isCustom = value.presetId === 'custom'

  const applyCustom = () => {
    const min = Math.max(1, parseInt(customMin, 10) || 1)
    const maxRaw = customMax.trim() === '' ? 9999 : parseInt(customMax, 10)
    const max = Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : 9999
    onChange({
      presetId: 'custom',
      diasMin: Math.min(min, max === 9999 ? min : max),
      diasMax: Math.max(min, max),
    })
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {DIAS_PRESETS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onChange({ presetId: p.id, diasMin: p.diasMin, diasMax: p.diasMax })}
          className={cn(
            'text-[12px] px-2 py-1 rounded-md border transition-colors',
            value.presetId === p.id
              ? 'bg-[var(--acc-pale)] text-[var(--acc)] border-[var(--acc-border)] font-medium'
              : 'bg-white text-[var(--ink-ghost)] border-[var(--border)] hover:border-[var(--acc-border)]'
          )}
        >
          {p.label}
        </button>
      ))}

      <button
        type="button"
        onClick={() => {
          onChange({
            presetId: 'custom',
            diasMin: parseInt(customMin, 10) || 60,
            diasMax: customMax.trim() === '' ? 9999 : parseInt(customMax, 10) || 9999,
          })
        }}
        className={cn(
          'text-[12px] px-2 py-1 rounded-md border transition-colors inline-flex items-center gap-1',
          isCustom
            ? 'bg-[var(--acc-pale)] text-[var(--acc)] border-[var(--acc-border)] font-medium'
            : 'bg-white text-[var(--ink-ghost)] border-[var(--border)] hover:border-[var(--acc-border)]'
        )}
      >
        <SlidersHorizontal className="w-3 h-3" />
        Personalizado
      </button>

      {isCustom && (
        <div
          className={cn(
            'flex items-center gap-1.5 text-[12px]',
            compact ? 'w-full mt-1' : 'ml-1'
          )}
        >
          <span className="text-[var(--ink-ghost)]">de</span>
          <input
            type="number"
            min={1}
            value={customMin}
            onChange={(e) => setCustomMin(e.target.value)}
            onBlur={applyCustom}
            onKeyDown={(e) => e.key === 'Enter' && applyCustom()}
            className="w-14 h-7 px-1.5 rounded-md border border-[var(--border)] bg-white text-[var(--ink)]"
          />
          <span className="text-[var(--ink-ghost)]">até</span>
          <input
            type="number"
            min={1}
            placeholder="∞"
            value={customMax}
            onChange={(e) => setCustomMax(e.target.value)}
            onBlur={applyCustom}
            onKeyDown={(e) => e.key === 'Enter' && applyCustom()}
            className="w-14 h-7 px-1.5 rounded-md border border-[var(--border)] bg-white text-[var(--ink)]"
          />
          <span className="text-[var(--ink-ghost)]">dias</span>
          <button
            type="button"
            onClick={applyCustom}
            className="h-7 px-2 rounded-md bg-[var(--acc)] text-white text-[11px] font-medium"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  )
}

export function labelDiasRange(r: DiasRange): string {
  if (r.diasMax >= 9999) return `${r.diasMin}d+`
  return `${r.diasMin}–${r.diasMax}d`
}
