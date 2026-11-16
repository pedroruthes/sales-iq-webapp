import { Check, Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AdminFilial } from '@/types/admin'

interface FilialPickerProps {
  filiais: AdminFilial[]
  selected: string[]
  onToggle: (cod: string) => void
  emptyMessage?: string
  maxHeight?: string
}

export function FilialPicker({
  filiais,
  selected,
  onToggle,
  emptyMessage = 'Nenhuma loja disponível.',
  maxHeight = 'max-h-44',
}: FilialPickerProps) {
  if (filiais.length === 0) {
    return (
      <div className="border border-[var(--border)] rounded-lg px-3 py-6 text-center">
        <Store className="w-5 h-5 text-[var(--ink-ghost)] mx-auto mb-2 opacity-50" />
        <p className="text-[13px] text-[var(--ink-ghost)]">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={cn('border border-[var(--border)] rounded-lg overflow-y-auto', maxHeight)}>
      {filiais.map((f) => {
        const cod = String(f.COD_FILIAL ?? '').trim()
        if (!cod) return null
        const sel = selected.includes(cod)
        return (
          <button
            key={`${f._TENANT_ID ?? ''}-${cod}`}
            type="button"
            onClick={() => onToggle(cod)}
            className={cn(
              'flex items-center gap-2.5 w-full px-3 py-2.5 text-left border-b border-[var(--border)] last:border-0 transition-colors',
              sel ? 'bg-[var(--acc-pale)]' : 'hover:bg-[var(--bg-subtle)]'
            )}
          >
            <div
              className={cn(
                'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                sel ? 'bg-[var(--acc)] border-[var(--acc)]' : 'border-[var(--border-md)]'
              )}
            >
              {sel && <Check className="w-2.5 h-2.5 text-white" />}
            </div>
            <span className="text-[13px] text-[var(--ink-muted)] flex-1 truncate">{f.FILIAL || cod}</span>
            <span className="text-[13px] font-mono text-[var(--ink-ghost)]">{cod}</span>
          </button>
        )
      })}
    </div>
  )
}
