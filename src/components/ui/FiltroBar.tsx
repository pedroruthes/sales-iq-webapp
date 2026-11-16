import { useState } from 'react'
import { ChevronDown, Check, Calendar, Building2, Download } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { getOpcoesPeriodo, periodoPersonalizado, type Periodo } from '@/hooks/useFiltros'
import { Filial } from '@/types'

interface FiltroBarProps {
  periodo: Periodo
  onPeriodoChange: (p: Periodo) => void
  filiais?: Filial[]
  filialSelecionada?: string
  onFilialChange?: (cod: string) => void
  labelFilial?: string
  onExportar?: () => void
  exportando?: boolean
  extra?: React.ReactNode
}

export function FiltroBar({
  periodo, onPeriodoChange,
  filiais, filialSelecionada, onFilialChange, labelFilial = 'Loja',
  onExportar, exportando = false,
  extra,
}: FiltroBarProps) {
  const [abrirPeriodo, setAbrirPeriodo] = useState(false)
  const [abrirFilial, setAbrirFilial] = useState(false)
  const [iniCustom, setIniCustom] = useState(format(periodo.inicio, 'yyyy-MM-dd'))
  const [fimCustom, setFimCustom] = useState(format(periodo.fim, 'yyyy-MM-dd'))
  const opcoes = getOpcoesPeriodo()
  const filialAtual = filiais?.find(f => f.COD_FILIAL === filialSelecionada)
  const isCustom = !opcoes.some(o => o.label === periodo.label)
  const customInvalido = !!fimCustom && !!iniCustom && fimCustom < iniCustom

  const triggerCls = 'filter-trigger'

  const aplicarCustom = () => {
    const p = periodoPersonalizado(iniCustom, fimCustom)
    if (!p) return
    onPeriodoChange(p)
    setAbrirPeriodo(false)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filiais && onFilialChange && (
        <div className="relative">
          <button
            type="button"
            onClick={() => { setAbrirFilial(!abrirFilial); setAbrirPeriodo(false) }}
            className={triggerCls}
          >
            <Building2 className="w-3.5 h-3.5 text-[var(--ink-ghost)]" />
            <span className="max-w-[160px] truncate font-medium">
              {filialAtual?.FILIAL ?? filialAtual?.COD_FILIAL ?? (!filialSelecionada ? 'Todas as lojas' : `Selecionar ${labelFilial}`)}
            </span>
            <ChevronDown className={cn('w-3.5 h-3.5 text-[var(--ink-ghost)] transition-transform', abrirFilial && 'rotate-180')} />
          </button>

          {abrirFilial && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setAbrirFilial(false)} />
              <div className="absolute left-0 top-full mt-1.5 w-72 bg-white border border-[var(--border)] rounded-xl py-1.5 shadow-card2 z-20 max-h-64 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => { onFilialChange(''); setAbrirFilial(false) }}
                  className={cn(
                    'flex items-center gap-2 w-full px-3.5 py-2.5 text-[13px] transition-colors text-left border-b border-[var(--border)]',
                    !filialSelecionada
                      ? 'bg-[var(--acc-pale)] text-[var(--acc)] font-medium'
                      : 'text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)]'
                  )}
                >
                  <span className="flex-1">Todas as lojas</span>
                  {!filialSelecionada && <Check className="w-3.5 h-3.5 shrink-0 text-[var(--acc)]" />}
                </button>
                {filiais.map(f => (
                  <button
                    type="button"
                    key={f.COD_FILIAL}
                    onClick={() => { onFilialChange(f.COD_FILIAL); setAbrirFilial(false) }}
                    className={cn(
                      'flex items-center gap-2 w-full px-3.5 py-2.5 text-[13px] transition-colors text-left',
                      f.COD_FILIAL === filialSelecionada
                        ? 'bg-[var(--acc-pale)] text-[var(--acc)] font-medium'
                        : 'text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)]'
                    )}
                  >
                    <span className="flex-1 truncate">{f.FILIAL || f.COD_FILIAL}</span>
                    <span className="text-[11px] text-[var(--ink-ghost)] shrink-0">{f.COD_FILIAL}</span>
                    {f.COD_FILIAL === filialSelecionada && <Check className="w-3.5 h-3.5 shrink-0 text-[var(--acc)]" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setAbrirPeriodo(!abrirPeriodo)
            setAbrirFilial(false)
            setIniCustom(format(periodo.inicio, 'yyyy-MM-dd'))
            setFimCustom(format(periodo.fim, 'yyyy-MM-dd'))
          }}
          className={triggerCls}
        >
          <Calendar className="w-3.5 h-3.5 text-[var(--ink-ghost)]" />
          <span className="font-medium capitalize">{periodo.label}</span>
          <ChevronDown className={cn('w-3.5 h-3.5 text-[var(--ink-ghost)] transition-transform', abrirPeriodo && 'rotate-180')} />
        </button>

        {abrirPeriodo && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setAbrirPeriodo(false)} />
            <div className="absolute right-0 top-full mt-1.5 w-[280px] max-w-[calc(100vw-1.5rem)] bg-white border border-[var(--border)] rounded-xl shadow-card2 z-20 flex flex-col max-h-[min(420px,70vh)] overflow-hidden">
              <div className="overflow-y-auto py-1.5 min-h-0 flex-1">
                {opcoes.map(op => (
                  <button
                    type="button"
                    key={op.label}
                    onClick={() => { onPeriodoChange(op); setAbrirPeriodo(false) }}
                    className={cn(
                      'flex items-center justify-between w-full px-3.5 py-2.5 text-[13px] transition-colors',
                      periodo.label === op.label
                        ? 'bg-[var(--acc-pale)] text-[var(--acc)] font-medium'
                        : 'text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)]'
                    )}
                  >
                    {op.label}
                    {periodo.label === op.label && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
              <div className="border-t border-[var(--border)] pt-2 px-3 pb-2.5 shrink-0 bg-white">
                <div className={cn('text-[12px] mb-1.5 font-medium', isCustom ? 'text-[var(--acc)]' : 'text-[var(--ink-ghost)]')}>
                  Personalizado
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-2 text-[12px] text-[var(--ink-muted)]">
                    <span className="w-8 shrink-0">De</span>
                    <input
                      type="date"
                      value={iniCustom}
                      onChange={(e) => setIniCustom(e.target.value)}
                      className="input-base !h-8 !text-[12px] flex-1 min-w-0"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-[12px] text-[var(--ink-muted)]">
                    <span className="w-8 shrink-0">Até</span>
                    <input
                      type="date"
                      value={fimCustom}
                      min={iniCustom}
                      onChange={(e) => setFimCustom(e.target.value)}
                      className={cn('input-base !h-8 !text-[12px] flex-1 min-w-0', customInvalido && '!border-[var(--danger)]')}
                    />
                  </label>
                  {customInvalido && (
                    <span className="text-[11px] text-[var(--danger)]">A data final não pode ser anterior ao início</span>
                  )}
                  <button
                    type="button"
                    disabled={customInvalido || !iniCustom || !fimCustom}
                    onClick={aplicarCustom}
                    className="mt-1 h-8 rounded-lg text-[12px] font-medium bg-[var(--acc)] text-white disabled:opacity-40 hover:opacity-90"
                  >
                    Aplicar período
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {extra}

      {onExportar && (
        <button
          type="button"
          onClick={onExportar}
          disabled={exportando}
          className={cn(triggerCls, 'text-[var(--ink-faint)] hover:text-[var(--acc)] disabled:opacity-50')}
        >
          <Download className="w-3.5 h-3.5" />
          {exportando ? 'Exportando...' : 'Exportar'}
        </button>
      )}
    </div>
  )
}
