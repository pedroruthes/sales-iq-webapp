import { useState, useEffect, useCallback } from 'react'
import { Target, Building2, Users, ChevronDown, Copy, Save, Trash2, Plus, AlertTriangle, CheckCircle, Lock } from 'lucide-react'
import { DashboardLayout }  from '@/components/layout'
import { Card, SectionTitle, Badge, Button } from '@/components/ui'
import { useContentLoading, useCurrentUser } from '@/hooks/useSession'
import { useFiliais }       from '@/hooks/useFiliais'
import { fmt, cn }          from '@/lib/utils'
import axios                from 'axios'

type Aba = 'lojas' | 'vendedores'

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const ANO_ATUAL = new Date().getFullYear()

const PODE_EDITAR_FILIAL   = ['proprietario', 'gerente_grupo', 'admin', 'dono_grupo']
const PODE_EDITAR_VENDEDOR = ['proprietario', 'gerente_grupo', 'gerente_loja', 'admin', 'dono_grupo']

interface MetaFilial {
  ID?: number; CODIGO_FILIAL: string; NOME_FILIAL: string
  ANO: number; MES: number
  META_FATURAMENTO: number; META_PA: number; META_TM: number; META_TC: number; META_PM: number
  META_CRM_CONTATOS: number; META_CRM_RETORNOS: number
  editando?: boolean; salvando?: boolean
}

interface MetaVendedor {
  ID?: number; CODIGO_VENDEDOR: string; NOME_VENDEDOR: string; APELIDO_VENDEDOR: string
  DESC_CARGO: string; CODIGO_FILIAL: string; NOME_FILIAL: string
  ANO: number; MES: number
  META_FATURAMENTO: number; META_PA: number; META_TM: number
  META_CRM_CONTATOS: number; META_CRM_RETORNOS: number
  editando?: boolean; salvando?: boolean
}

const TITULO_COLUNA: Record<string, string> = {
  'P.A': 'Peças por atendimento',
  'T.M': 'Ticket médio (R$)',
  'T.C': 'Taxa de conversão (%)',
  'P.M': 'Preço médio por peça (R$)',
  'Contatos/mês': 'Contatos de CRM (WhatsApp/e-mail) a realizar no mês',
  'Retornos/mês': 'Clientes contatados que devem voltar a comprar no mês (até 15 dias após o contato)',
}

/** Dias úteis (seg–sex) no mês */
function diasUteisMes(ano: number, mes: number): number {
  const ultimo = new Date(ano, mes, 0).getDate()
  let n = 0
  for (let d = 1; d <= ultimo; d++) {
    const wd = new Date(ano, mes - 1, d).getDay()
    if (wd !== 0 && wd !== 6) n++
  }
  return Math.max(n, 1)
}

/** Meta mensal desdobrada em dia útil e semana (5 dias úteis) */
function ritmo(metaMensal: number, ano: number, mes: number): string {
  if (!metaMensal || metaMensal <= 0) return ''
  const dia = metaMensal / diasUteisMes(ano, mes)
  const f = (n: number) => (n % 1 === 0 ? String(n) : n.toFixed(1))
  return `≈ ${f(dia)}/dia · ${f(dia * 5)}/sem`
}

function InputMeta({ valor, onChange, prefixo, readonly, inteiro, title }: {
  valor: number; onChange: (v: number) => void; prefixo?: string; readonly?: boolean; inteiro?: boolean; title?: string
}) {
  const [local, setLocal] = useState(String(valor || ''))
  useEffect(() => setLocal(String(valor || '')), [valor])
  if (readonly) return (
    <span className="block w-full text-right text-[13px] text-[var(--ink-ghost)] tabular-nums" title={title}>
      {valor > 0 ? (prefixo ? fmt.currencyShort(valor) : fmt.number(valor, inteiro ? 0 : 1)) : '-'}
    </span>
  )
  return (
    <div className="relative w-full" title={title}>
      {prefixo && (
        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-[var(--ink-ghost)] leading-none">
          {prefixo}
        </span>
      )}
      <input
        type="number" min="0" step={prefixo ? '100' : inteiro ? '1' : '0.1'}
        value={local}
        onChange={e => setLocal(e.target.value)}
        onBlur={() => onChange(inteiro ? Math.round(parseFloat(local) || 0) : parseFloat(local) || 0)}
        className={cn(
          'box-border w-full h-8 text-[13px] py-1 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-md text-right tabular-nums',
          'focus:outline-none focus:border-[var(--acc)] focus:bg-white transition-colors',
          prefixo ? 'pl-7 pr-2' : 'px-2'
        )}
      />
    </div>
  )
}

export default function MetasPage() {
  const user = useCurrentUser()
  const { data: filiais, isLoading: lFiliais } = useFiliais()

  const [aba,         setAba]         = useState<Aba>('lojas')
  const [ano,         setAno]         = useState(ANO_ATUAL)
  const [mesAtivo,    setMesAtivo]    = useState(new Date().getMonth() + 1)
  const [filialFiltro, setFilialFiltro] = useState<string>('todas')
  const [menuFilial,  setMenuFilial]  = useState(false)
  const [metasFilial,    setMetasFilial]    = useState<MetaFilial[]>([])
  const [metasVendedor,  setMetasVendedor]  = useState<MetaVendedor[]>([])
  const [vendedoresDaFilial, setVendedoresDaFilial] = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [salvando,  setSalvando]  = useState<string | null>(null)
  const [sucesso,   setSucesso]   = useState<string | null>(null)

  const podeEditarFilial   = PODE_EDITAR_FILIAL.includes(user.perfil ?? '')
  const podeEditarVendedor = PODE_EDITAR_VENDEDOR.includes(user.perfil ?? '')

  const carregarMetas = useCallback(async () => {
    setLoading(true)
    try {
      if (aba === 'lojas') {
        const { data } = await axios.get('/api/metas/filial', { params: { ano } })
        setMetasFilial(data.data ?? [])
      } else {
        const { data } = await axios.get('/api/metas/vendedor', { params: { ano } })
        setMetasVendedor(data.data ?? [])
      }
    } catch {}
    setLoading(false)
  }, [aba, ano])

  useEffect(() => { carregarMetas() }, [carregarMetas])

  useEffect(() => {
    if (aba === 'vendedores' && filialFiltro && filialFiltro !== 'todas') {
      axios.get('/api/metas/vendedores-filial', { params: { filial: filialFiltro } })
        .then(r => setVendedoresDaFilial(r.data.data ?? []))
    }
  }, [aba, filialFiltro])

  const salvarMetaFilial = async (meta: MetaFilial) => {
    setSalvando(`${meta.CODIGO_FILIAL}-${meta.MES}`)
    try {
      await axios.post('/api/metas/filial', {
        codigoFilial: meta.CODIGO_FILIAL, ano: meta.ANO, mes: meta.MES,
        metaFaturamento: meta.META_FATURAMENTO, metaPA: meta.META_PA,
        metaTM: meta.META_TM, metaTC: meta.META_TC, metaPM: meta.META_PM,
        metaCrmContatos: meta.META_CRM_CONTATOS || null,
        metaCrmRetornos: meta.META_CRM_RETORNOS || null,
      })
      setSucesso('Meta da loja salva!')
      setTimeout(() => setSucesso(null), 2500)
      carregarMetas()
    } catch { }
    setSalvando(null)
  }

  const salvarMetaVendedor = async (meta: MetaVendedor) => {
    setSalvando(`${meta.CODIGO_VENDEDOR}-${meta.MES}`)
    try {
      await axios.post('/api/metas/vendedor', {
        codigoVendedor: meta.CODIGO_VENDEDOR, codigoFilial: meta.CODIGO_FILIAL,
        ano: meta.ANO, mes: meta.MES,
        metaFaturamento: meta.META_FATURAMENTO, metaPA: meta.META_PA, metaTM: meta.META_TM,
        metaCrmContatos: meta.META_CRM_CONTATOS || null,
        metaCrmRetornos: meta.META_CRM_RETORNOS || null,
      })
      setSucesso('Meta do vendedor salva!')
      setTimeout(() => setSucesso(null), 2500)
      carregarMetas()
    } catch { }
    setSalvando(null)
  }

  const adicionarMetaVendedor = (vendedor: any, codigoFilial: string) => {
    const nova: MetaVendedor = {
      CODIGO_VENDEDOR: vendedor.VENDEDOR,
      NOME_VENDEDOR:   vendedor.NOME_VENDEDOR,
      APELIDO_VENDEDOR: vendedor.VENDEDOR_APELIDO,
      DESC_CARGO:      vendedor.DESC_CARGO,
      CODIGO_FILIAL:   codigoFilial,
      NOME_FILIAL:     filiais?.find(f => f.COD_FILIAL === codigoFilial)?.FILIAL ?? codigoFilial,
      ANO: ano, MES: mesAtivo,
      META_FATURAMENTO: 0, META_PA: 0, META_TM: 0, META_CRM_CONTATOS: 0, META_CRM_RETORNOS: 0,
      editando: true,
    }
    setMetasVendedor(prev => [nova, ...prev])
  }

  const deletarMeta = async (id: number, tipo: 'filial' | 'vendedor', codigoFilial?: string) => {
    if (!confirm('Excluir esta meta?')) return
    await axios.delete(`/api/metas/${tipo}`, { data: { id, codigoFilial } })
    carregarMetas()
  }

  const copiarProximoMes = async () => {
    const mesDestino = mesAtivo === 12 ? 1 : mesAtivo + 1
    const anoDestino = mesAtivo === 12 ? ano + 1 : ano
    if (!confirm(`Copiar metas de ${MESES[mesAtivo-1]} para ${MESES[mesDestino-1]}/${anoDestino}?`)) return
    try {
      await axios.post('/api/metas/copiar', { anoOrigem: ano, mesOrigem: mesAtivo, anoDestino, mesDestino })
      setSucesso('Metas copiadas!')
      setTimeout(() => setSucesso(null), 2500)
    } catch { }
  }

  const metasFilialFiltradas = metasFilial.filter(m =>
    m.MES === mesAtivo &&
    (filialFiltro === 'todas' || m.CODIGO_FILIAL === filialFiltro)
  )

  const filiaisSemMeta = (filiais ?? []).filter(f =>
    user.filiais.map(x=>x.trim()).includes(f.COD_FILIAL.trim()) &&
    (filialFiltro === 'todas' || f.COD_FILIAL === filialFiltro) &&
    !metasFilial.find(m => m.CODIGO_FILIAL === f.COD_FILIAL && m.MES === mesAtivo)
  )

  const metasVendFiltradas = metasVendedor.filter(m =>
    m.MES === mesAtivo &&
    (filialFiltro === 'todas' || m.CODIGO_FILIAL === filialFiltro)
  )

  const pageLoading = useContentLoading({
    filiaisLoading: lFiliais,
    waiting: [loading],
  })

  return (
    <DashboardLayout
      titulo="Cadastro de metas"
      subtitulo="Definição e acompanhamento de metas"
      loading={pageLoading}
      actions={
        <>
          <div className="filter-trigger !gap-1 !px-2">
            <button type="button" onClick={() => setAno(a => a-1)} className="text-[var(--ink-ghost)] hover:text-[var(--acc)] px-1 text-[14px]">&#8249;</button>
            <span className="text-[14px] font-medium text-[var(--ink-muted)] px-1">{ano}</span>
            <button type="button" onClick={() => setAno(a => a+1)} className="text-[var(--ink-ghost)] hover:text-[var(--acc)] px-1 text-[14px]">&#8250;</button>
          </div>

          <div className="relative">
            <button type="button" onClick={() => setMenuFilial(!menuFilial)}
              className="filter-trigger">
              <Building2 className="w-3.5 h-3.5 text-[var(--ink-ghost)]" />
              <span className="max-w-[140px] truncate">
                {filialFiltro === 'todas' ? 'Todas as lojas' : filiais?.find(f => f.COD_FILIAL === filialFiltro)?.FILIAL ?? filialFiltro}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--ink-ghost)]" />
            </button>
            {menuFilial && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuFilial(false)} />
                <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-[var(--border)] rounded-xl py-1 shadow-lg z-20 max-h-60 overflow-y-auto">
                  <button onClick={() => { setFilialFiltro('todas'); setMenuFilial(false) }}
                    className={cn('w-full px-3 py-2 text-[13px] text-left transition-colors',
                      filialFiltro === 'todas' ? 'bg-[var(--acc-pale)] text-[var(--acc)]' : 'text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)]')}>
                    Todas as lojas
                  </button>
                  {(filiais ?? []).filter(f => user.filiais.map(x=>x.trim()).includes(f.COD_FILIAL.trim())).map(f => (
                    <button key={f.COD_FILIAL} onClick={() => { setFilialFiltro(f.COD_FILIAL); setMenuFilial(false) }}
                      className={cn('flex items-center justify-between w-full px-3 py-2 text-[13px] text-left transition-colors',
                        filialFiltro === f.COD_FILIAL ? 'bg-[var(--acc-pale)] text-[var(--acc)]' : 'text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)]')}>
                      <span>{f.FILIAL}</span>
                      <span className="text-[13px] text-[var(--ink-ghost)]">{f.COD_FILIAL}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {podeEditarFilial && aba === 'lojas' && (
            <Button variant="secondary" size="lg" onClick={copiarProximoMes}>
              <Copy className="w-4 h-4" /> Copiar p/ prox. mes
            </Button>
          )}
        </>
      }
    >
        {sucesso && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-[var(--success)] text-white px-4 py-2.5 rounded-xl shadow-lg text-[12px] font-medium">
            <CheckCircle className="w-4 h-4" /> {sucesso}
          </div>
        )}

        <div className="flex items-center gap-1 bg-[var(--bg-subtle)] p-1 rounded-xl w-fit">
          {([
            { id: 'lojas' as Aba, label: 'Lojas', icon: Building2 },
            { id: 'vendedores' as Aba, label: 'Vendedores', icon: Users },
          ]).map(a => {
            const Icon = a.icon
            return (
              <button key={a.id} onClick={() => setAba(a.id)}
                className={cn('flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all',
                  aba === a.id ? 'bg-white text-[var(--acc)] shadow-[var(--shadow-card)]'
                               : 'text-[var(--ink-ghost)] hover:text-[var(--ink-muted)]')}>
                <Icon className="w-3.5 h-3.5" />
                {a.label}
                {a.id === 'lojas' && !podeEditarFilial && <Lock className="w-3 h-3 opacity-50" />}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {MESES.map((m, i) => {
            const num = i + 1
            const temMeta = aba === 'lojas'
              ? metasFilial.some(x => x.MES === num)
              : metasVendedor.some(x => x.MES === num)
            return (
              <button key={m} onClick={() => setMesAtivo(num)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all',
                  mesAtivo === num
                    ? 'bg-[var(--acc)] text-white shadow-sm'
                    : 'bg-white border border-[var(--border)] text-[var(--ink-ghost)] hover:border-[var(--acc-border)] hover:text-[var(--acc)]'
                )}>
                {m}
                {temMeta && mesAtivo !== num && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] inline-block" />
                )}
              </button>
            )
          })}
        </div>

        <>
            {aba === 'lojas' && (
              <div className="flex flex-col gap-3">
                {!podeEditarFilial && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-[13px] text-amber-700">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    Voce tem permissao apenas de visualizacao nas metas de lojas.
                  </div>
                )}
                <Card padding="sm">
                  <div className="flex items-center justify-between mb-3">
                    <SectionTitle label={`Metas de lojas - ${MESES[mesAtivo-1]}/${ano}`} icon={Target} className="mb-0 flex-1" />
                    <span className="text-[12px] text-[var(--ink-ghost)]">
                      {metasFilialFiltradas.length} lojas com meta · {filiaisSemMeta.length} sem meta
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px] border-collapse table-fixed">
                    <colgroup>
                      <col className="w-[18%]" />
                      <col className="w-[7%]" />
                      <col className="w-[11%]" />
                      <col className="w-[8%]" />
                      <col className="w-[9%]" />
                      <col className="w-[8%]" />
                      <col className="w-[9%]" />
                      <col className="w-[9%]" />
                      <col className="w-[9%]" />
                      <col className="w-[12%]" />
                    </colgroup>
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        {['Loja','Código','Faturamento','P.A','T.M','T.C','P.M','Contatos/mês','Retornos/mês',''].map((h, i) => (
                          <th key={h+i} title={TITULO_COLUNA[h]} className={cn(
                            'text-[11px] text-[var(--ink-ghost)] uppercase tracking-wider px-2 py-2.5 font-medium whitespace-nowrap',
                            i >= 2 && i <= 8 ? 'text-right' : i === 9 ? 'text-center' : 'text-left'
                          )}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {metasFilialFiltradas.map(meta => {
                        const key = `${meta.CODIGO_FILIAL}-${meta.MES}`
                        const isSalvando = salvando === key
                        const crm = Number(meta.META_CRM_CONTATOS ?? 0)
                        const retornos = Number(meta.META_CRM_RETORNOS ?? 0)
                        return (
                          <tr key={meta.ID ?? key} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-subtle)] transition-colors">
                            <td className="px-2 py-2.5"><div className="text-[12px] font-medium text-[var(--ink)] truncate" title={meta.NOME_FILIAL}>{meta.NOME_FILIAL}</div></td>
                            <td className="px-2 py-2.5 text-[12px] text-[var(--ink-ghost)]">{meta.CODIGO_FILIAL}</td>
                            <td className="px-2 py-2.5 align-middle">
                              <InputMeta readonly={!podeEditarFilial} valor={meta.META_FATURAMENTO} prefixo="R$"
                                onChange={v => setMetasFilial(prev => prev.map(m => m.CODIGO_FILIAL === meta.CODIGO_FILIAL && m.MES === meta.MES ? { ...m, META_FATURAMENTO: v } : m))} />
                            </td>
                            <td className="px-2 py-2.5 align-middle">
                              <InputMeta readonly={!podeEditarFilial} valor={meta.META_PA}
                                onChange={v => setMetasFilial(prev => prev.map(m => m.CODIGO_FILIAL === meta.CODIGO_FILIAL && m.MES === meta.MES ? { ...m, META_PA: v } : m))} />
                            </td>
                            <td className="px-2 py-2.5 align-middle">
                              <InputMeta readonly={!podeEditarFilial} valor={meta.META_TM} prefixo="R$"
                                onChange={v => setMetasFilial(prev => prev.map(m => m.CODIGO_FILIAL === meta.CODIGO_FILIAL && m.MES === meta.MES ? { ...m, META_TM: v } : m))} />
                            </td>
                            <td className="px-2 py-2.5 align-middle">
                              <InputMeta readonly={!podeEditarFilial} valor={meta.META_TC}
                                onChange={v => setMetasFilial(prev => prev.map(m => m.CODIGO_FILIAL === meta.CODIGO_FILIAL && m.MES === meta.MES ? { ...m, META_TC: v } : m))} />
                            </td>
                            <td className="px-2 py-2.5 align-middle">
                              <InputMeta readonly={!podeEditarFilial} valor={meta.META_PM} prefixo="R$"
                                onChange={v => setMetasFilial(prev => prev.map(m => m.CODIGO_FILIAL === meta.CODIGO_FILIAL && m.MES === meta.MES ? { ...m, META_PM: v } : m))} />
                            </td>
                            <td className="px-2 py-2.5 align-middle">
                              <InputMeta
                                readonly={!podeEditarFilial}
                                valor={crm}
                                inteiro
                                title={crm > 0 ? ritmo(crm, ano, mesAtivo) : undefined}
                                onChange={v => setMetasFilial(prev => prev.map(m => m.CODIGO_FILIAL === meta.CODIGO_FILIAL && m.MES === meta.MES ? { ...m, META_CRM_CONTATOS: v } : m))}
                              />
                            </td>
                            <td className="px-2 py-2.5 align-middle">
                              <InputMeta
                                readonly={!podeEditarFilial}
                                valor={retornos}
                                inteiro
                                title={retornos > 0 ? ritmo(retornos, ano, mesAtivo) : undefined}
                                onChange={v => setMetasFilial(prev => prev.map(m => m.CODIGO_FILIAL === meta.CODIGO_FILIAL && m.MES === meta.MES ? { ...m, META_CRM_RETORNOS: v } : m))}
                              />
                            </td>
                            <td className="px-2 py-2.5">
                              {podeEditarFilial && (
                                <div className="flex items-center justify-center gap-1">
                                  <button onClick={() => salvarMetaFilial(meta)} disabled={isSalvando}
                                    className="flex items-center gap-1 text-[12px] bg-[var(--acc-pale)] text-[var(--acc)] border border-[var(--acc-border)] hover:bg-[var(--acc)] hover:text-white rounded-lg px-2 py-1 transition-colors disabled:opacity-50">
                                    <Save className="w-3 h-3" /> {isSalvando ? '...' : 'Salvar'}
                                  </button>
                                  {meta.ID && (
                                    <button onClick={() => deletarMeta(meta.ID!, 'filial', meta.CODIGO_FILIAL)}
                                      className="w-6 h-6 flex items-center justify-center text-[var(--ink-ghost)] hover:text-[var(--danger)] rounded-lg hover:bg-red-50 transition-colors">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                      {filiaisSemMeta.map(filial => (
                        <tr key={filial.COD_FILIAL} className="border-b border-[var(--border)] last:border-0 hover:bg-amber-50 transition-colors">
                          <td className="px-2 py-2.5"><div className="text-[12px] text-[var(--ink-muted)] truncate">{filial.FILIAL}</div></td>
                          <td className="px-2 py-2.5 text-[12px] text-[var(--ink-ghost)]">{filial.COD_FILIAL}</td>
                          <td colSpan={7} className="px-2 py-2.5 text-center text-[12px] text-[var(--warn)]">
                            Sem meta para {MESES[mesAtivo-1]}/{ano}
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            {podeEditarFilial && (
                              <button onClick={() => {
                                const nova: MetaFilial = {
                                  CODIGO_FILIAL: filial.COD_FILIAL, NOME_FILIAL: filial.FILIAL,
                                  ANO: ano, MES: mesAtivo,
                                  META_FATURAMENTO: 0, META_PA: 2.7, META_TM: 0, META_TC: 0, META_PM: 0,
                                  META_CRM_CONTATOS: 0, META_CRM_RETORNOS: 0,
                                }
                                setMetasFilial(prev => [...prev, nova])
                              }}
                                className="inline-flex items-center gap-1 text-[12px] text-[var(--acc)] hover:bg-[var(--acc-pale)] rounded-lg px-2 py-1 transition-colors">
                                <Plus className="w-3 h-3" /> Adicionar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </Card>
              </div>
            )}

            {aba === 'vendedores' && (
              <div className="flex flex-col gap-3">
                {!podeEditarVendedor && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-[13px] text-amber-700">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    Voce tem permissao apenas de visualizacao.
                  </div>
                )}
                {podeEditarVendedor && filialFiltro !== 'todas' && vendedoresDaFilial.length > 0 && (
                  <Card padding="sm">
                    <SectionTitle label="Adicionar meta para vendedor" icon={Plus} />
                    <div className="flex flex-wrap gap-2">
                      {vendedoresDaFilial
                        .filter(v => !metasVendFiltradas.some(m => m.CODIGO_VENDEDOR === v.VENDEDOR && m.CODIGO_FILIAL === filialFiltro))
                        .map(v => (
                          <button key={v.VENDEDOR} onClick={() => adicionarMetaVendedor(v, filialFiltro)}
                            className="flex items-center gap-1.5 text-[12px] bg-white border border-[var(--border)] hover:border-[var(--acc-border)] hover:text-[var(--acc)] rounded-lg px-3 py-1.5 transition-colors">
                            <div className="w-5 h-5 rounded-full bg-[var(--acc-pale)] text-[var(--acc)] flex items-center justify-center text-[13px] font-medium shrink-0">
                              {v.NOME_VENDEDOR.charAt(0)}
                            </div>
                            {v.VENDEDOR_APELIDO || v.NOME_VENDEDOR}
                            <Plus className="w-3 h-3" />
                          </button>
                        ))}
                    </div>
                  </Card>
                )}
                {filialFiltro === 'todas' && podeEditarVendedor && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-[13px] text-blue-700">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Selecione uma loja especifica para adicionar metas de vendedores.
                  </div>
                )}
                <Card padding="sm">
                  <div className="flex items-center justify-between mb-3">
                    <SectionTitle label={`Metas de vendedores - ${MESES[mesAtivo-1]}/${ano}`} icon={Users} className="mb-0 flex-1" />
                    <span className="text-[12px] text-[var(--ink-ghost)]">{metasVendFiltradas.length} registros</span>
                  </div>
                  {metasVendFiltradas.length === 0 ? (
                    <div className="text-center py-8 text-[13px] text-[var(--ink-ghost)]">
                      Nenhuma meta de vendedor para {MESES[mesAtivo-1]}/{ano}
                      {filialFiltro === 'todas' ? ' - selecione uma loja para adicionar' : ''}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] border-collapse table-fixed">
                      <colgroup>
                        <col className="w-[18%]" />
                        <col className="w-[12%]" />
                        <col className="w-[14%]" />
                        <col className="w-[12%]" />
                        <col className="w-[8%]" />
                        <col className="w-[10%]" />
                        <col className="w-[9%]" />
                        <col className="w-[9%]" />
                        <col className="w-[8%]" />
                      </colgroup>
                      <thead>
                        <tr className="border-b border-[var(--border)]">
                          {['Vendedor','Cargo','Loja','Faturamento','P.A','T.M','Contatos/mês','Retornos/mês',''].map((h, i) => (
                            <th key={h+i} title={TITULO_COLUNA[h]} className={cn(
                              'text-[11px] text-[var(--ink-ghost)] uppercase tracking-wider px-2 py-2.5 font-medium whitespace-nowrap',
                              i >= 3 && i <= 7 ? 'text-right' : i === 8 ? 'text-center' : 'text-left'
                            )}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {metasVendFiltradas.map(meta => {
                          const key = `${meta.CODIGO_VENDEDOR}-${meta.CODIGO_FILIAL}-${meta.MES}`
                          const isSalvando = salvando === `${meta.CODIGO_VENDEDOR}-${meta.MES}`
                          const crm = Number(meta.META_CRM_CONTATOS ?? 0)
                          const retornos = Number(meta.META_CRM_RETORNOS ?? 0)
                          return (
                            <tr key={meta.ID ?? key} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-subtle)] transition-colors">
                              <td className="px-2 py-2.5">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded-full bg-[var(--acc-pale)] flex items-center justify-center text-[13px] font-medium text-[var(--acc)] shrink-0">
                                    {meta.NOME_VENDEDOR.charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-[12px] font-medium text-[var(--ink)] truncate">{meta.APELIDO_VENDEDOR || meta.NOME_VENDEDOR}</div>
                                    {meta.APELIDO_VENDEDOR !== meta.NOME_VENDEDOR && (
                                      <div className="text-[11px] text-[var(--ink-ghost)] truncate">{meta.NOME_VENDEDOR}</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-2 py-2.5 text-[12px] text-[var(--ink-ghost)] truncate">{meta.DESC_CARGO || '-'}</td>
                              <td className="px-2 py-2.5 text-[12px] text-[var(--ink-ghost)] truncate">{meta.NOME_FILIAL}</td>
                              <td className="px-2 py-2.5 align-middle">
                                <InputMeta readonly={!podeEditarVendedor} valor={meta.META_FATURAMENTO} prefixo="R$"
                                  onChange={v => setMetasVendedor(prev => prev.map(m => m.CODIGO_VENDEDOR === meta.CODIGO_VENDEDOR && m.CODIGO_FILIAL === meta.CODIGO_FILIAL && m.MES === meta.MES ? { ...m, META_FATURAMENTO: v } : m))} />
                              </td>
                              <td className="px-2 py-2.5 align-middle">
                                <InputMeta readonly={!podeEditarVendedor} valor={meta.META_PA}
                                  onChange={v => setMetasVendedor(prev => prev.map(m => m.CODIGO_VENDEDOR === meta.CODIGO_VENDEDOR && m.CODIGO_FILIAL === meta.CODIGO_FILIAL && m.MES === meta.MES ? { ...m, META_PA: v } : m))} />
                              </td>
                              <td className="px-2 py-2.5 align-middle">
                                <InputMeta readonly={!podeEditarVendedor} valor={meta.META_TM} prefixo="R$"
                                  onChange={v => setMetasVendedor(prev => prev.map(m => m.CODIGO_VENDEDOR === meta.CODIGO_VENDEDOR && m.CODIGO_FILIAL === meta.CODIGO_FILIAL && m.MES === meta.MES ? { ...m, META_TM: v } : m))} />
                              </td>
                              <td className="px-2 py-2.5 align-middle">
                                <InputMeta
                                  readonly={!podeEditarVendedor}
                                  valor={crm}
                                  inteiro
                                  title={crm > 0 ? ritmo(crm, ano, mesAtivo) : undefined}
                                  onChange={v => setMetasVendedor(prev => prev.map(m => m.CODIGO_VENDEDOR === meta.CODIGO_VENDEDOR && m.CODIGO_FILIAL === meta.CODIGO_FILIAL && m.MES === meta.MES ? { ...m, META_CRM_CONTATOS: v } : m))}
                                />
                              </td>
                              <td className="px-2 py-2.5 align-middle">
                                <InputMeta
                                  readonly={!podeEditarVendedor}
                                  valor={retornos}
                                  inteiro
                                  title={retornos > 0 ? ritmo(retornos, ano, mesAtivo) : undefined}
                                  onChange={v => setMetasVendedor(prev => prev.map(m => m.CODIGO_VENDEDOR === meta.CODIGO_VENDEDOR && m.CODIGO_FILIAL === meta.CODIGO_FILIAL && m.MES === meta.MES ? { ...m, META_CRM_RETORNOS: v } : m))}
                                />
                              </td>
                              <td className="px-2 py-2.5">
                                {podeEditarVendedor && (
                                  <div className="flex items-center justify-center gap-1">
                                    <button onClick={() => salvarMetaVendedor(meta)} disabled={isSalvando}
                                      className="flex items-center gap-1 text-[12px] bg-[var(--acc-pale)] text-[var(--acc)] border border-[var(--acc-border)] hover:bg-[var(--acc)] hover:text-white rounded-lg px-2 py-1 transition-colors disabled:opacity-50">
                                      <Save className="w-3 h-3" /> {isSalvando ? '...' : 'Salvar'}
                                    </button>
                                    {meta.ID && (
                                      <button onClick={() => deletarMeta(meta.ID!, 'vendedor', meta.CODIGO_FILIAL)}
                                        className="w-6 h-6 flex items-center justify-center text-[var(--ink-ghost)] hover:text-[var(--danger)] rounded-lg hover:bg-red-50 transition-colors">
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    </div>
                  )}
                </Card>
              </div>
            )}
          </>
    </DashboardLayout>
  )
}
