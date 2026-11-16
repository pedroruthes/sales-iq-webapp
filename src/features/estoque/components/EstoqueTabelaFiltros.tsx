import { useMemo, useState } from 'react'
import { Search, X, Palette, Ruler, Layers, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { coletarTamanhos, type TamanhoEstoque } from './GradeTamanhos'

export type EstoqueFiltrosState = {
  busca: string
  cor: string
  grupo: string
  tamanhos: string[]
}

export const FILTROS_VAZIOS: EstoqueFiltrosState = {
  busca: '',
  cor: '',
  grupo: '',
  tamanhos: [],
}

type ItemBase = {
  PRODUTO?: string
  DESC_PRODUTO?: string
  GRUPO_PRODUTO?: string
  COR_PRODUTO?: string
  DESC_COR_PRODUTO?: string
  grade?: TamanhoEstoque[] | null
}

type Props = {
  dados: ItemBase[]
  value: EstoqueFiltrosState
  onChange: (next: EstoqueFiltrosState) => void
  className?: string
}

function FilterSelect({
  icon: Icon,
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  icon: typeof Palette
  label: string
  value: string
  placeholder: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const atual = options.find((o) => o.value === value)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="filter-trigger min-w-[160px] max-w-[220px]"
        aria-label={label}
      >
        <Icon className="w-3.5 h-3.5 text-[var(--ink-ghost)] shrink-0" />
        <span className="flex-1 truncate text-left font-medium">
          {atual?.label || placeholder}
        </span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-[var(--ink-ghost)] transition-transform shrink-0', open && 'rotate-180')} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1.5 w-64 max-h-60 overflow-y-auto bg-white border border-[var(--border)] rounded-xl py-1.5 shadow-card2 z-20">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className={cn(
                'flex items-center justify-between w-full px-3.5 py-2.5 text-[13px] transition-colors text-left',
                !value ? 'bg-[var(--acc-pale)] text-[var(--acc)] font-medium' : 'text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)]'
              )}
            >
              {placeholder}
              {!value && <Check className="w-3.5 h-3.5" />}
            </button>
            {options.map((o) => (
              <button
                type="button"
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false) }}
                className={cn(
                  'flex items-center justify-between w-full px-3.5 py-2.5 text-[13px] transition-colors text-left',
                  value === o.value
                    ? 'bg-[var(--acc-pale)] text-[var(--acc)] font-medium'
                    : 'text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)]'
                )}
              >
                <span className="truncate">{o.label}</span>
                {value === o.value && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/** Select com múltipla seleção (tamanhos) */
function FilterMultiSelect({
  icon: Icon,
  label,
  values,
  placeholder,
  options,
  onChange,
}: {
  icon: typeof Palette
  label: string
  values: string[]
  placeholder: string
  options: { value: string; label: string }[]
  onChange: (v: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = new Set(values)

  const triggerLabel = values.length === 0
    ? placeholder
    : values.length === 1
      ? (options.find((o) => o.value === values[0])?.label ?? values[0])
      : `${values.length} tamanhos`

  const toggle = (v: string) => {
    if (selected.has(v)) onChange(values.filter((x) => x !== v))
    else onChange([...values, v])
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'filter-trigger min-w-[160px] max-w-[240px]',
          values.length > 0 && 'border-[var(--acc-border)]'
        )}
        aria-label={label}
      >
        <Icon className="w-3.5 h-3.5 text-[var(--ink-ghost)] shrink-0" />
        <span className="flex-1 truncate text-left font-medium">{triggerLabel}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-[var(--ink-ghost)] transition-transform shrink-0', open && 'rotate-180')} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1.5 w-64 max-h-72 overflow-y-auto bg-white border border-[var(--border)] rounded-xl py-1.5 shadow-card2 z-20">
            <div className="flex items-center justify-between px-3.5 py-2 border-b border-[var(--border)]">
              <span className="text-[12px] text-[var(--ink-ghost)]">{values.length} selecionado(s)</span>
              {values.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-[12px] text-[var(--acc)] font-medium hover:underline"
                >
                  Limpar
                </button>
              )}
            </div>
            {options.map((o) => {
              const on = selected.has(o.value)
              return (
                <button
                  type="button"
                  key={o.value}
                  onClick={() => toggle(o.value)}
                  className={cn(
                    'flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[13px] transition-colors text-left',
                    on
                      ? 'bg-[var(--acc-pale)] text-[var(--acc)] font-medium'
                      : 'text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)]'
                  )}
                >
                  <span className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                    on ? 'bg-[var(--acc)] border-[var(--acc)]' : 'border-[var(--border)] bg-white'
                  )}>
                    {on && <Check className="w-3 h-3 text-white" />}
                  </span>
                  <span className="truncate">{o.label}</span>
                </button>
              )
            })}
            {!options.length && (
              <div className="px-3.5 py-3 text-[13px] text-[var(--ink-ghost)]">Nenhum tamanho</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export function EstoqueTabelaFiltros({ dados, value, onChange, className }: Props) {
  const cores = useMemo(() => {
    const map = new Map<string, string>()
    for (const d of dados) {
      const cod = String(d.COR_PRODUTO ?? '').trim()
      if (!cod) continue
      const label = String(d.DESC_COR_PRODUTO || d.COR_PRODUTO || cod).trim()
      if (!map.has(cod)) map.set(cod, label)
    }
    return Array.from(map.entries())
      .map(([cod, label]) => ({ value: cod, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
  }, [dados])

  const grupos = useMemo(() => {
    const set = new Set<string>()
    for (const d of dados) {
      const g = String(d.GRUPO_PRODUTO ?? '').trim()
      if (g) set.add(g)
    }
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((g) => ({ value: g, label: g }))
  }, [dados])

  const tamanhos = useMemo(
    () => coletarTamanhos(dados.map((d) => d.grade)),
    [dados]
  )

  const ativos =
    !!value.busca.trim() ||
    !!value.cor ||
    !!value.grupo ||
    value.tamanhos.length > 0

  return (
    <div className={cn('flex flex-col gap-3 mb-4', className)}>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-ghost)]" />
          <input
            type="search"
            value={value.busca}
            onChange={(e) => onChange({ ...value, busca: e.target.value })}
            placeholder="Buscar produto, descrição…"
            className="w-full h-11 pl-10 pr-4 bg-white border border-[var(--border)] rounded-[12px] text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-ghost)] focus:outline-none focus:border-[var(--acc)] shadow-[var(--shadow-card)]"
          />
        </div>

        <FilterSelect
          icon={Palette}
          label="Cor"
          value={value.cor}
          placeholder="Todas as cores"
          options={cores}
          onChange={(cor) => onChange({ ...value, cor })}
        />

        <FilterSelect
          icon={Layers}
          label="Grupo"
          value={value.grupo}
          placeholder="Todos os grupos"
          options={grupos}
          onChange={(grupo) => onChange({ ...value, grupo })}
        />

        {tamanhos.length > 0 && (
          <FilterMultiSelect
            icon={Ruler}
            label="Tamanho"
            values={value.tamanhos}
            placeholder="Todos os tamanhos"
            options={tamanhos.map((t) => ({ value: t, label: t }))}
            onChange={(tamanhosSel) => onChange({ ...value, tamanhos: tamanhosSel })}
          />
        )}

        {ativos && (
          <button
            type="button"
            onClick={() => onChange(FILTROS_VAZIOS)}
            className="filter-trigger !px-3 text-[var(--ink-ghost)] hover:text-[var(--danger)]"
          >
            <X className="w-3.5 h-3.5" /> Limpar
          </button>
        )}
      </div>
    </div>
  )
}

export function filtrarEstoqueItems<T extends ItemBase>(
  dados: T[],
  f: EstoqueFiltrosState
): T[] {
  const q = f.busca.trim().toLowerCase()
  return dados.filter((item) => {
    if (f.cor && String(item.COR_PRODUTO ?? '').trim() !== f.cor) return false
    if (f.grupo && String(item.GRUPO_PRODUTO ?? '').trim() !== f.grupo) return false
    if (f.tamanhos.length) {
      const grades = item.grade ?? []
      const ok = f.tamanhos.some((t) =>
        grades.some(
          (g) =>
            String(g.tamanho).trim().toUpperCase() === t.toUpperCase() &&
            (g.qtde > 0 || (g.vendido ?? 0) > 0)
        )
      )
      if (!ok) return false
    }
    if (q) {
      const blob = [
        item.PRODUTO,
        item.DESC_PRODUTO,
        item.COR_PRODUTO,
        item.DESC_COR_PRODUTO,
        item.GRUPO_PRODUTO,
      ]
        .map((x) => String(x ?? '').toLowerCase())
        .join(' ')
      if (!blob.includes(q)) return false
    }
    return true
  })
}

export function useEstoqueFiltros() {
  return useState<EstoqueFiltrosState>(FILTROS_VAZIOS)
}
