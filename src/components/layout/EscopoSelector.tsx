import { useCallback, useEffect, useMemo, useState } from 'react'
import { Building2, Check, ChevronDown, Layers } from 'lucide-react'
import { useFiliais } from '@/hooks/useFiliais'
import { useCurrentUser } from '@/hooks/useSession'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'salesiq-escopo-filial'

/** Prefixo para escopo de grupo (todas as lojas do tenant) */
export const ESCOPO_GRUPO_PREFIX = 'g:'

export function isEscopoGrupo(codigo: string): boolean {
  return codigo.startsWith(ESCOPO_GRUPO_PREFIX)
}

export function parseEscopoGrupo(codigo: string): number | null {
  if (!isEscopoGrupo(codigo)) return null
  const n = parseInt(codigo.slice(ESCOPO_GRUPO_PREFIX.length), 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function escopoGrupo(tenantId: number): string {
  return `${ESCOPO_GRUPO_PREFIX}${tenantId}`
}

export function useEscopoFilial() {
  const [codigo, setCodigo] = useState<string>('')

  useEffect(() => {
    try {
      setCodigo(localStorage.getItem(STORAGE_KEY) ?? '')
    } catch { /* ignore */ }
  }, [])

  const setEscopo = useCallback((cod: string) => {
    setCodigo(cod)
    try {
      if (cod) localStorage.setItem(STORAGE_KEY, cod)
      else localStorage.removeItem(STORAGE_KEY)
    } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent('salesiq:escopo', { detail: cod }))
  }, [])

  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail
      setCodigo(detail ?? '')
    }
    window.addEventListener('salesiq:escopo', onChange)
    return () => window.removeEventListener('salesiq:escopo', onChange)
  }, [])

  return { codigo, setEscopo }
}

export function EscopoSelector() {
  const user = useCurrentUser()
  const { data: filiais } = useFiliais()
  const { codigo, setEscopo } = useEscopoFilial()
  const [open, setOpen] = useState(false)

  // Quem tem mais de uma loja no JWT (ou admin) pode escolher escopo
  const podeEscolher =
    user.isAdmin ||
    user.filiais.length > 1 ||
    user.isProprietario ||
    user.isSupervisora

  const lista = filiais ?? []

  const grupos = useMemo(() => {
    const map = new Map<number, { id: number; nome: string; filiais: typeof lista }>()
    for (const f of lista) {
      const tid = Number(f._TENANT_ID) || 0
      if (!tid) continue
      const atual = map.get(tid)
      const nome = f._TENANT_NOME?.trim() || `Grupo ${tid}`
      if (!atual) {
        map.set(tid, { id: tid, nome, filiais: [f] })
      } else {
        atual.filiais.push(f)
        if (f._TENANT_NOME?.trim()) atual.nome = f._TENANT_NOME.trim()
      }
    }
    return [...map.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [lista])

  const tenantIdEscopo = parseEscopoGrupo(codigo)
  const selecionada = useMemo(
    () =>
      tenantIdEscopo
        ? undefined
        : lista.find(f => String(f.COD_FILIAL).trim() === String(codigo).trim()),
    [lista, codigo, tenantIdEscopo]
  )
  const grupoSelecionado = useMemo(
    () => (tenantIdEscopo ? grupos.find(g => g.id === tenantIdEscopo) : undefined),
    [grupos, tenantIdEscopo]
  )

  useEffect(() => {
    if (!podeEscolher && user.filialPadrao && !codigo) {
      setEscopo(user.filialPadrao)
    }
  }, [podeEscolher, user.filialPadrao, codigo, setEscopo])

  const eyebrow = grupos.length > 1 || user.isAdmin
    ? 'Grupo / escopo'
    : podeEscolher
      ? 'Lojas ativas'
      : 'Loja ativa'

  const valueLabel = selecionada
    ? (selecionada.FILIAL || selecionada.COD_FILIAL)
    : grupoSelecionado
      ? `${grupoSelecionado.nome} (todas)`
      : podeEscolher
        ? (user.isAdmin || grupos.length > 1 ? 'Todas as lojas' : 'Todas as minhas lojas')
        : (lista.find(f => f.COD_FILIAL === user.filialPadrao)?.FILIAL
            ?? user.filialPadrao
            ?? 'Selecionar')

  const Icon = grupos.length > 1 || user.isAdmin || grupoSelecionado ? Layers : Building2
  const mostrarGrupos = grupos.length > 0

  return (
    <div className="px-3 pt-3 pb-2 relative">
      <button
        type="button"
        onClick={() => podeEscolher && setOpen(!open)}
        className={cn(
          'w-full text-left rounded-[12px] px-3 py-2.5 transition-colors',
          'hover:bg-[var(--bg-subtle)]',
          open && 'bg-[var(--bg-subtle)]',
          podeEscolher ? 'cursor-pointer' : 'cursor-default'
        )}
      >
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-[9px] bg-[var(--acc-pale)] flex items-center justify-center shrink-0 mt-0.5">
            <Icon className="w-4 h-4 text-[var(--acc)]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-medium text-[var(--ink-ghost)] leading-normal">{eyebrow}</div>
            <div className="text-[13px] font-semibold text-[var(--ink)] truncate leading-snug mt-0.5 flex items-center gap-1.5">
              <span className="truncate">{valueLabel}</span>
              {selecionada?.IS_DEMO && (
                <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                  Demo
                </span>
              )}
            </div>
          </div>
          {podeEscolher && (
            <ChevronDown className={cn(
              'w-3.5 h-3.5 text-[var(--ink-ghost)] shrink-0 mt-1 transition-transform',
              open && 'rotate-180'
            )} />
          )}
        </div>
      </button>

      {open && podeEscolher && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-3 top-full mt-2 w-72 z-40 bg-white border border-[var(--border)] rounded-2xl shadow-[var(--shadow-card2)] overflow-hidden">
            <div className="px-3.5 py-2.5 border-b border-[var(--border)]">
              <div className="text-[12px] font-medium text-[var(--ink-ghost)]">Selecionar escopo</div>
            </div>
            <div className="max-h-72 overflow-y-auto py-1">
              <button
                type="button"
                onClick={() => { setEscopo(''); setOpen(false) }}
                className={cn(
                  'flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[13px] text-left transition-colors',
                  !codigo
                    ? 'bg-[var(--acc-pale)] text-[var(--acc)] font-medium'
                    : 'text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)]'
                )}
              >
                <Layers className="w-4 h-4 shrink-0" />
                <span className="flex-1">Todas as lojas</span>
                {!codigo && <Check className="w-4 h-4 shrink-0" />}
              </button>

              {mostrarGrupos && grupos.map(g => {
                const valor = escopoGrupo(g.id)
                const ativo = codigo === valor
                return (
                  <div key={`grupo-${g.id}`}>
                    <button
                      type="button"
                      onClick={() => { setEscopo(valor); setOpen(false) }}
                      className={cn(
                        'flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[13px] text-left transition-colors',
                        ativo
                          ? 'bg-[var(--acc-pale)] text-[var(--acc)] font-medium'
                          : 'text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)]'
                      )}
                    >
                      <Layers className="w-4 h-4 shrink-0 opacity-70" />
                      <span className="flex-1 truncate min-w-0">
                        {g.nome}
                        <span className="text-[11px] text-[var(--ink-ghost)] font-normal ml-1">
                          ({g.filiais.length} lojas)
                        </span>
                      </span>
                      {ativo && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                    {g.filiais.map(f => {
                      const cod = String(f.COD_FILIAL).trim()
                      const sel = !tenantIdEscopo && (cod === codigo || String(f.COD_FILIAL).trim() === String(codigo).trim())
                      return (
                        <button
                          type="button"
                          key={`${f._TENANT_ID ?? ''}-${cod}`}
                          onClick={() => { setEscopo(cod); setOpen(false) }}
                          className={cn(
                            'flex items-center gap-2.5 w-full pl-9 pr-3.5 py-2 text-[13px] text-left transition-colors',
                            sel
                              ? 'bg-[var(--acc-pale)] text-[var(--acc)] font-medium'
                              : 'text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)]'
                          )}
                        >
                          <Building2 className="w-3.5 h-3.5 shrink-0 opacity-50" />
                          <span className="flex-1 truncate min-w-0">{f.FILIAL || cod}</span>
                          {f.IS_DEMO && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                              Demo
                            </span>
                          )}
                          <span className="text-[11px] text-[var(--ink-ghost)] shrink-0">{cod}</span>
                          {sel && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                )
              })}

              {!mostrarGrupos && lista.map(f => (
                <button
                  type="button"
                  key={`${f._TENANT_ID ?? ''}-${f.COD_FILIAL}`}
                  onClick={() => { setEscopo(String(f.COD_FILIAL).trim()); setOpen(false) }}
                  className={cn(
                    'flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[13px] text-left transition-colors',
                    f.COD_FILIAL === codigo || String(f.COD_FILIAL).trim() === String(codigo).trim()
                      ? 'bg-[var(--acc-pale)] text-[var(--acc)] font-medium'
                      : 'text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)]'
                  )}
                >
                  <Building2 className="w-4 h-4 shrink-0 opacity-60" />
                  <span className="flex-1 truncate min-w-0">{f.FILIAL || f.COD_FILIAL}</span>
                  {f.IS_DEMO && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                      Demo
                    </span>
                  )}
                  <span className="text-[11px] text-[var(--ink-ghost)] shrink-0">{f.COD_FILIAL}</span>
                  {(f.COD_FILIAL === codigo || String(f.COD_FILIAL).trim() === String(codigo).trim()) && <Check className="w-4 h-4 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
