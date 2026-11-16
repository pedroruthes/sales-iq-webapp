import { useEffect, useState } from 'react'
import axios from 'axios'
import { Target, PhoneCall, UserCheck, Store } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui'
import { fmt, cn } from '@/lib/utils'
import type { CrmMetasContato, CrmMetaLinha, CrmPeriodo } from '@/lib/queries/crm'

type Periodo = 'dia' | 'semana' | 'mes'

const PERIODOS: { id: Periodo; label: string }[] = [
  { id: 'dia', label: 'Hoje' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes', label: 'Mês' },
]

function pct(realizado: number, meta: number): number | null {
  return meta > 0 ? (realizado / meta) * 100 : null
}

function corPct(p: number | null) {
  if (p == null) return 'text-[var(--ink-ghost)]'
  if (p >= 100) return 'text-[var(--success)]'
  if (p >= 80) return 'text-[var(--acc)]'
  return 'text-[var(--danger)]'
}

function bgPct(p: number | null) {
  if (p == null) return 'bg-[var(--border)]'
  if (p >= 100) return 'bg-[var(--success)]'
  if (p >= 80) return 'bg-[var(--acc)]'
  return 'bg-[var(--warn)]'
}

function arred(n: number) {
  return n % 1 === 0 ? fmt.number(n) : fmt.number(n, 1)
}

function Barra({ realizado, meta }: { realizado: number; meta: number }) {
  const p = pct(realizado, meta)
  return (
    <div className="h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
      <div className={cn('h-full rounded-full', bgPct(p))} style={{ width: `${Math.min(p ?? 0, 100)}%` }} />
    </div>
  )
}

function CelulaMeta({ real, meta }: { real: number; meta: number }) {
  const p = pct(real, meta)
  return (
    <div className="flex flex-col items-end gap-0.5 min-w-[84px]">
      <div className="text-[13px] text-[var(--ink)]">
        <span className={cn('font-medium', corPct(p))}>{fmt.number(real)}</span>
        <span className="text-[var(--ink-ghost)]"> / {meta > 0 ? arred(meta) : '—'}</span>
      </div>
      {meta > 0 && <div className="w-full"><Barra realizado={real} meta={meta} /></div>}
    </div>
  )
}

/** Situação do mês frente ao ritmo esperado até hoje */
function ritmoMes(l: CrmMetaLinha) {
  const alvos = [
    l.metaContatos.mes > 0 ? l.contatos.mes / Math.max(l.esperadoContatos, 1) : null,
    l.metaRetornos.mes > 0 ? l.retornos.mes / Math.max(l.esperadoRetornos, 1) : null,
  ].filter((x): x is number => x != null)
  if (!alvos.length) return null
  return Math.min(...alvos) * 100
}

export function MetaContatoRetorno({ filiais, versao = 0 }: { filiais: string[]; versao?: number }) {
  const [dados, setDados] = useState<CrmMetasContato | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [periodo, setPeriodo] = useState<Periodo>('dia')
  const chave = filiais.join(',')

  useEffect(() => {
    if (!chave) { setDados(null); setCarregando(false); return }
    setCarregando(prev => prev || !dados)
    axios.get('/api/crm/metas', { params: { filiais: chave } })
      .then(r => setDados(r.data))
      .catch(() => setDados(null))
      .finally(() => setCarregando(false))
  }, [chave, versao])

  const v = (p: CrmPeriodo) => p[periodo]
  const lojas = dados?.lojas ?? []
  const vendedores = dados?.vendedores ?? []
  const semMeta = lojas.every(l => !l.metaContatos.mes && !l.metaRetornos.mes)

  return (
    <Card padding="sm">
      <div className="flex items-center justify-between gap-3 mb-3">
        <SectionTitle label="Meta de contato e retorno x resultado da loja" icon={Target} className="mb-0 flex-1" />
        <div className="flex items-center gap-1 bg-[var(--bg-subtle)] p-1 rounded-lg">
          {PERIODOS.map(p => (
            <button key={p.id} type="button" onClick={() => setPeriodo(p.id)}
              className={cn('px-3 py-1 rounded-md text-[12px] font-medium transition-all',
                periodo === p.id ? 'bg-white text-[var(--acc)] shadow-[var(--shadow-card)]' : 'text-[var(--ink-ghost)] hover:text-[var(--ink-muted)]')}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {carregando ? (
        <div className="text-center py-6 text-[13px] text-[var(--ink-ghost)]">Carregando…</div>
      ) : !dados ? (
        <div className="text-center py-6 text-[13px] text-[var(--ink-ghost)]">Não foi possível carregar as metas de CRM.</div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-[12px] text-[var(--ink-ghost)]">
            Retorno = cliente contatado que comprou na loja em até {dados.janelaRetornoDias} dias após o contato.
            Metas diária e semanal derivadas da meta mensal pelos dias úteis
            ({dados.diasUteis.mes} no mês · {dados.diasUteis.semana} nesta semana · {dados.diasUteis.ateHoje} até hoje).
            {semMeta && ' Cadastre as metas "Contatos/mês" e "Retornos/mês" em Cadastro de metas.'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {lojas.map(l => {
              const ritmo = ritmoMes(l)
              return (
                <div key={l.codigoFilial} className="border border-[var(--border)] rounded-xl p-3 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Store className="w-3.5 h-3.5 text-[var(--ink-ghost)] shrink-0" />
                      <span className="text-[13px] font-medium text-[var(--ink)] truncate">{l.nomeFilial}</span>
                    </div>
                    {ritmo != null && (
                      <span className={cn('text-[11px] px-2 py-0.5 rounded-full border',
                        ritmo >= 100 ? 'bg-green-50 text-green-700 border-green-200'
                          : ritmo >= 80 ? 'bg-[var(--acc-pale)] text-[var(--acc)] border-[var(--acc-border)]'
                            : 'bg-red-50 text-red-700 border-red-200')}>
                        {ritmo >= 100 ? 'no ritmo' : `${fmt.number(ritmo)}% do ritmo`}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="text-[11px] text-[var(--ink-ghost)] flex items-center gap-1"><PhoneCall className="w-3 h-3" /> Contatos</div>
                      <div className="text-[15px] font-medium text-[var(--ink)]">
                        {fmt.number(v(l.contatos))}
                        <span className="text-[12px] text-[var(--ink-ghost)] font-normal"> / {v(l.metaContatos) > 0 ? arred(v(l.metaContatos)) : '—'}</span>
                      </div>
                      <Barra realizado={v(l.contatos)} meta={v(l.metaContatos)} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="text-[11px] text-[var(--ink-ghost)] flex items-center gap-1"><UserCheck className="w-3 h-3" /> Retornos</div>
                      <div className="text-[15px] font-medium text-[var(--ink)]">
                        {fmt.number(v(l.retornos))}
                        <span className="text-[12px] text-[var(--ink-ghost)] font-normal"> / {v(l.metaRetornos) > 0 ? arred(v(l.metaRetornos)) : '—'}</span>
                      </div>
                      <Barra realizado={v(l.retornos)} meta={v(l.metaRetornos)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border)] text-[11px]">
                    <div>
                      <div className="text-[var(--ink-ghost)]">Fat. loja (mês)</div>
                      <div className="text-[12px] font-medium text-[var(--ink)]">{fmt.currencyShort(l.faturamento)}</div>
                      {l.pctMetaFaturamento != null && (
                        <div className={corPct(l.pctMetaFaturamento)}>{fmt.number(l.pctMetaFaturamento)}% da meta</div>
                      )}
                    </div>
                    <div>
                      <div className="text-[var(--ink-ghost)]">Fat. via CRM</div>
                      <div className="text-[12px] font-medium text-[var(--info)]">{fmt.currencyShort(l.fatRetornos)}</div>
                      {l.participacaoCrm != null && (
                        <div className="text-[var(--ink-ghost)]">{fmt.number(l.participacaoCrm, 1)}% da loja</div>
                      )}
                    </div>
                    <div>
                      <div className="text-[var(--ink-ghost)]">Conversão</div>
                      <div className="text-[12px] font-medium text-[var(--ink)]">
                        {l.conversao != null ? `${fmt.number(l.conversao, 1)}%` : '—'}
                      </div>
                      <div className="text-[var(--ink-ghost)]">contato → compra</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {vendedores.length === 0 ? (
            <div className="text-center py-4 text-[13px] text-[var(--ink-ghost)]">
              Nenhum vendedor com meta de CRM ou contato registrado neste mês.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {['Vendedor', 'Loja', 'Contatos', 'Retornos', 'Conversão', 'Fat. via CRM', 'Fat. vendedor', 'Ritmo do mês'].map((h, i) => (
                      <th key={h} className={cn('text-[12px] text-[var(--ink-ghost)] uppercase tracking-wider px-3 py-2 font-medium whitespace-nowrap',
                        i < 2 ? 'text-left' : 'text-right')}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vendedores.map(vd => {
                    const ritmo = ritmoMes(vd)
                    return (
                      <tr key={`${vd.codigoFilial}-${vd.codigoVendedor}`} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-subtle)]">
                        <td className="px-3 py-2 text-[13px] text-[var(--ink)]">{String(vd.nomeVendedor ?? '').toLocaleUpperCase('pt-BR')}</td>
                        <td className="px-3 py-2 text-[12px] text-[var(--ink-ghost)]">{vd.nomeFilial}</td>
                        <td className="px-3 py-2 text-right"><CelulaMeta real={v(vd.contatos)} meta={v(vd.metaContatos)} /></td>
                        <td className="px-3 py-2 text-right"><CelulaMeta real={v(vd.retornos)} meta={v(vd.metaRetornos)} /></td>
                        <td className="px-3 py-2 text-right text-[13px] text-[var(--ink)]">
                          {vd.conversao != null ? `${fmt.number(vd.conversao, 1)}%` : '—'}
                        </td>
                        <td className="px-3 py-2 text-right text-[13px] text-[var(--info)]">{fmt.currencyShort(vd.fatRetornos)}</td>
                        <td className="px-3 py-2 text-right text-[13px] text-[var(--ink)]">
                          {fmt.currencyShort(vd.faturamento)}
                          {vd.pctMetaFaturamento != null && (
                            <div className={cn('text-[11px]', corPct(vd.pctMetaFaturamento))}>{fmt.number(vd.pctMetaFaturamento)}% da meta</div>
                          )}
                        </td>
                        <td className={cn('px-3 py-2 text-right text-[13px] font-medium', corPct(ritmo))}>
                          {ritmo != null ? `${fmt.number(ritmo)}%` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
