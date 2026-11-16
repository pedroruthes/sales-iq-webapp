import { useState, useEffect } from 'react'
import { Trophy, Star, Zap, Target, Users, Plus, ChevronDown,
         Medal, Crown, TrendingUp, Gift, Settings, ToggleLeft, ToggleRight } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Card, Button, Modal } from '@/components/ui'
import { useContentLoading, useCurrentUser } from '@/hooks/useSession'
import { useFiliais } from '@/hooks/useFiliais'
import { cn, fmt } from '@/lib/utils'
import axios from 'axios'

type Aba = 'ranking' | 'desafios' | 'config'

const selectChevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")"

const BADGES_INFO: Record<string, { icone: string; titulo: string; cor: string }> = {
  rainha_pa:    { icone: '👑', titulo: 'Rainha do PA',      cor: 'bg-yellow-50 border-yellow-300 text-yellow-700' },
  meta_batida:  { icone: '🎯', titulo: 'Meta Batida',       cor: 'bg-green-50 border-green-300 text-[var(--success)]' },
  melhor_semana:{ icone: '⭐', titulo: 'Melhor da Semana',  cor: 'bg-blue-50 border-blue-300 text-blue-700' },
  recuperadora: { icone: '💪', titulo: 'Recuperadora',      cor: 'bg-purple-50 border-purple-300 text-purple-700' },
  pa1_campea:   { icone: '🏆', titulo: 'Campeã em Adicional', cor: 'bg-orange-50 border-orange-300 text-orange-700' },
  top_faturamento: { icone: '💰', titulo: 'Top Faturamento', cor: 'bg-emerald-50 border-emerald-300 text-emerald-700' },
}

function badgesDoVendedor(badges: any[], v: any) {
  return badges.filter(b =>
    b.CODIGO_VENDEDOR?.trim() === v.CODIGO_VENDEDOR?.trim() &&
    b.CODIGO_FILIAL?.trim() === v.CODIGO_FILIAL_PADRAO?.trim()
  )
}

const MEDALHA = (pos: number) => {
  if (pos === 1) return { icone: '🥇', cor: 'text-yellow-500' }
  if (pos === 2) return { icone: '🥈', cor: 'text-gray-400' }
  if (pos === 3) return { icone: '🥉', cor: 'text-amber-600' }
  return { icone: `${pos}°`, cor: 'text-[var(--ink-ghost)]' }
}

export default function GamificacaoPage() {
  const user = useCurrentUser()
  const { data: filiais, isLoading: lFiliais } = useFiliais()
  const [aba,        setAba]        = useState<Aba>('ranking')
  const [filialSel,  setFilialSel]  = useState('')
  const [menuFilial, setMenuFilial] = useState(false)
  const [mes,        setMes]        = useState(new Date().getMonth()+1)
  const [ano,        setAno]        = useState(new Date().getFullYear())
  const [ranking,    setRanking]    = useState<any[]>([])
  const [badges,     setBadges]     = useState<any[]>([])
  const [desafios,   setDesafios]   = useState<any[]>([])
  const [configs,    setConfigs]    = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [modalDesafio, setModalDesafio] = useState(false)
  const [salvandoDesafio, setSalvandoDesafio] = useState(false)
  const [erroDesafio, setErroDesafio] = useState('')
  const [crmProgresso, setCrmProgresso] = useState<{ porVendedor: any[]; resumo: any } | null>(null)
  const [form, setForm] = useState({
    titulo: '', descricao: '', indicador: 'PA', metaValor: '',
    pontosPremio: '100', recompensaDescricao: '', dataInicio: '', dataFim: '', codigoFilial: ''
  })

  const filiaisAcess = (filiais ?? []).filter(f => user.filiais.includes(f.COD_FILIAL.trim()))
  const filiaisParam = filialSel ? [filialSel] : user.filiais
  const nomeFilial   = filialSel
    ? filiaisAcess.find(f => f.COD_FILIAL.trim() === filialSel)?.FILIAL ?? filialSel
    : 'Todas as lojas'

  const carregar = async () => {
    setLoading(true)
    try {
      const params = { filiais: filiaisParam.join(','), mes, ano }
      if (aba === 'ranking' || aba === 'desafios') {
        const r = await axios.get('/api/gamificacao/ranking', { params })
        setRanking(r.data.ranking ?? [])
        setBadges(r.data.badges ?? [])
        setDesafios(r.data.desafios ?? [])
      }
      if (aba === 'desafios' && filiaisParam.length) {
        try {
          const crm = await axios.get('/api/crm/kpis', { params: { filiais: filiaisParam.join(',') } })
          setCrmProgresso({ porVendedor: crm.data.porVendedor ?? [], resumo: crm.data.resumo })
        } catch {
          setCrmProgresso(null)
        }
      }
      if (aba === 'config' && (user.isAdmin || user.isDono)) {
        const r = await axios.get('/api/gamificacao/config')
        setConfigs(r.data.data ?? [])
      }
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { if (user.filiais.length || aba === 'config') carregar() }, [aba, filialSel, mes, ano])

  const salvarDesafio = async () => {
    setErroDesafio('')
    if (!form.titulo.trim()) { setErroDesafio('Informe o título'); return }
    if (!form.metaValor) { setErroDesafio('Informe a meta'); return }
    if (!form.dataInicio || !form.dataFim) { setErroDesafio('Informe início e fim do desafio'); return }
    if (form.dataFim < form.dataInicio) { setErroDesafio('A data fim deve ser após o início'); return }
    const filial = form.codigoFilial || filiaisParam[0]
    if (!filial) { setErroDesafio('Selecione uma loja'); return }
    setSalvandoDesafio(true)
    try {
      await axios.post('/api/gamificacao/desafios', { ...form, codigoFilial: filial, criadoPor: user.email })
      setModalDesafio(false)
      setForm({ titulo:'',descricao:'',indicador:'PA',metaValor:'',pontosPremio:'100',recompensaDescricao:'',dataInicio:'',dataFim:'',codigoFilial:'' })
      carregar()
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e)
        ? (e.response?.data?.error ?? e.message)
        : 'Erro ao criar desafio'
      setErroDesafio(String(msg))
    } finally {
      setSalvandoDesafio(false)
    }
  }

  const toggleGamif = async (config: any, ativo: boolean) => {
    await axios.post('/api/gamificacao/config', { ...config, ativo })
    carregar()
  }

  // Vendedora vê só a própria posição em destaque
  const minhaPos = user.isVendedora
    ? ranking.findIndex(r => r.CODIGO_VENDEDOR?.trim() === user.codigoVendedor?.trim())
    : -1
  const meuRanking = minhaPos >= 0 ? ranking[minhaPos] : null

  const mesesLabels = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

  const pageLoading = useContentLoading({
    filiaisLoading: lFiliais,
    filiaisQuery: user.filiais,
    waiting: aba === 'config'
      ? [loading]
      : (user.filiais.length > 0 ? [loading] : []),
  })

  return (
    <DashboardLayout
      titulo="Gamificação"
      subtitulo="Ranking, desafios e conquistas da equipe"
      loading={pageLoading}
      actions={
        <>
          {filiaisAcess.length > 1 && (
            <div className="relative">
              <button type="button" onClick={() => setMenuFilial(!menuFilial)}
                className="filter-trigger">
                <span className="max-w-[120px] truncate">{nomeFilial}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {menuFilial && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuFilial(false)} />
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-[var(--border)] rounded-xl py-1 shadow-lg z-20 max-h-60 overflow-y-auto">
                    <button onClick={() => { setFilialSel(''); setMenuFilial(false) }}
                      className={cn('w-full px-3 py-2 text-[13px] text-left', !filialSel ? 'bg-[var(--acc-pale)] text-[var(--acc)]' : 'hover:bg-[var(--bg-subtle)] text-[var(--ink-muted)]')}>
                      Todas as lojas
                    </button>
                    {filiaisAcess.map(f => (
                      <button key={f.COD_FILIAL} onClick={() => { setFilialSel(f.COD_FILIAL.trim()); setMenuFilial(false) }}
                        className={cn('w-full px-3 py-2 text-[13px] text-left', filialSel===f.COD_FILIAL.trim() ? 'bg-[var(--acc-pale)] text-[var(--acc)]' : 'hover:bg-[var(--bg-subtle)] text-[var(--ink-muted)]')}>
                        {f.FILIAL}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          <select value={mes} onChange={e => setMes(parseInt(e.target.value))}
            style={{ backgroundImage: selectChevron }}
            className="select-base !w-auto min-w-[120px]">
            {mesesLabels.map((m,i) => <option key={i+1} value={i+1}>{m} {ano}</option>)}
          </select>
          {(user.isGerenteLoja || user.isSupervisora || user.isAdmin || user.isDono) && aba === 'desafios' && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => { setErroDesafio(''); setModalDesafio(true) }}
              className="bg-gradient-to-r from-yellow-400 to-orange-500"
            >
              <Plus className="w-4 h-4" /> Novo desafio
            </Button>
          )}
        </>
      }
    >
        {/* Card da vendedora logada */}
        {user.isVendedora && meuRanking && (
          <div className="bg-gradient-to-r from-[var(--acc)] to-purple-600 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-[18px] font-bold">
                  {MEDALHA(minhaPos+1).icone}
                </div>
                <div>
                  <div className="text-[13px] text-white/70 mb-0.5">Sua posicao este mes</div>
                  <div className="text-[18px] font-medium">{meuRanking.NOME?.split(' ')[0]}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[28px] font-bold">{meuRanking.TOTAL_PONTOS}</div>
                <div className="text-[12px] text-white/70">pontos</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-white/20">
              <div className="text-center">
                <div className="text-[13px] font-medium">{meuRanking.PA?.toFixed(1)}</div>
                <div className="text-[13px] text-white/60">PA</div>
              </div>
              <div className="text-center">
                <div className="text-[13px] font-medium">{fmt.currency(meuRanking.TM ?? 0)}</div>
                <div className="text-[13px] text-white/60">TM</div>
              </div>
              <div className="text-center">
                <div className="text-[13px] font-medium">{meuRanking.TOTAL_VENDAS}</div>
                <div className="text-[13px] text-white/60">Vendas</div>
              </div>
              <div className="text-center">
                <div className="text-[13px] font-medium">{meuRanking.TOTAL_BADGES}</div>
                <div className="text-[13px] text-white/60">Badges</div>
              </div>
            </div>
          </div>
        )}

        {/* Abas */}
        <div className="flex gap-1 bg-[var(--bg-subtle)] p-1 rounded-xl w-fit">
          {([
            { id:'ranking' as Aba,  icon: Trophy,   label:'Ranking' },
            { id:'desafios' as Aba, icon: Target,   label:'Desafios' },
            ...(user.isAdmin || user.isDono ? [{ id:'config' as Aba, icon: Settings, label:'Configuracao' }] : []),
          ]).map(a => (
            <button key={a.id} onClick={() => setAba(a.id)}
              className={cn('flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all',
                aba===a.id ? 'bg-white text-[var(--acc)] shadow-[var(--shadow-card)]' : 'text-[var(--ink-ghost)] hover:text-[var(--ink-muted)]')}>
              <a.icon className="w-3.5 h-3.5" /> {a.label}
            </button>
          ))}
        </div>

        {/* ═══ ABA RANKING ═══ */}
        {aba === 'ranking' && (
          <>
            {ranking.length === 0 ? (
              <Card>
                <div className="py-10 flex flex-col items-center gap-3 text-center">
                  <Trophy className="w-10 h-10 text-[var(--ink-ghost)]" />
                  <div className="text-[13px] font-medium text-[var(--ink)]">Nenhuma vendedora cadastrada</div>
                  <div className="text-[13px] text-[var(--ink-ghost)]">Cadastre vendedoras no Admin para ver o ranking</div>
                </div>
              </Card>
            ) : (
              <div className="flex flex-col gap-2">
                {/* Top 3 destaque */}
                {ranking.length >= 3 && (
                  <div className="grid grid-cols-3 gap-3 mb-2">
                    {[ranking[1], ranking[0], ranking[2]].map((v, i) => {
                      if (!v) return null
                      const pos = i===1 ? 1 : i===0 ? 2 : 3
                      const real = i===1 ? 0 : i===0 ? 1 : 2
                      return (
                        <div key={`${v.CODIGO_VENDEDOR}-${v.CODIGO_FILIAL_PADRAO}-${real}`} className={cn('bg-white border rounded-2xl p-4 text-center flex flex-col items-center gap-2',
                          pos===1 ? 'border-yellow-300 shadow-[0_0_0_2px_rgba(234,179,8,0.2)]' : 'border-[var(--border)]',
                          pos===1 ? 'mt-0' : 'mt-4')}>
                          <div className="text-3xl">{MEDALHA(pos).icone}</div>
                          <div className="w-10 h-10 rounded-full bg-[var(--acc-pale)] flex items-center justify-center text-[14px] font-bold text-[var(--acc)]">
                            {v.NOME?.charAt(0)}
                          </div>
                          <div>
                            <div className="text-[12px] font-medium text-[var(--ink)]">{v.NOME?.split(' ')[0]}</div>
                            <div className="text-[12px] text-[var(--ink-ghost)]">{v.NOME_FILIAL}</div>
                          </div>
                          <div className="text-[18px] font-bold text-[var(--acc)]">{v.TOTAL_PONTOS}</div>
                          <div className="text-[13px] text-[var(--ink-ghost)]">pontos</div>
                          {/* Badges */}
                          <div className="flex gap-1 flex-wrap justify-center">
                            {badgesDoVendedor(badges, v).slice(0,3).map((b,bi) => (
                              <span key={bi} className="text-base" title={b.TITULO}>{b.ICONE}</span>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Lista completa */}
                {ranking.map((v, i) => {
                  const medal = MEDALHA(i+1)
                  const vBadges = badgesDoVendedor(badges, v)
                  const isEu = user.isVendedora && v.CODIGO_VENDEDOR?.trim() === user.codigoVendedor?.trim()
                  return (
                    <div key={`${v.CODIGO_VENDEDOR}-${v.CODIGO_FILIAL_PADRAO}-${i}`} className={cn('bg-white border rounded-xl p-3.5 flex items-center gap-3',
                      isEu ? 'border-[var(--acc)] bg-[var(--acc-pale)]' : 'border-[var(--border)] hover:border-[var(--acc-border)]',
                      'transition-colors')}>
                      <div className={cn('text-[16px] w-8 text-center font-bold shrink-0', medal.cor)}>
                        {medal.icone}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[var(--acc-pale)] flex items-center justify-center text-[12px] font-bold text-[var(--acc)] shrink-0">
                        {v.NOME?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-medium text-[var(--ink)] truncate">{v.NOME?.split(' ')[0]}</span>
                          {isEu && <span className="text-[13px] bg-[var(--acc)] text-white px-1.5 py-0.5 rounded-full">Voce</span>}
                          {vBadges.slice(0,4).map((b,bi) => (
                            <span key={bi} className="text-sm" title={b.TITULO}>{b.ICONE}</span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-[12px] text-[var(--ink-ghost)]">
                          <span>PA: <strong className="text-[var(--ink)]">{v.PA?.toFixed(1)}</strong></span>
                          <span>TM: <strong className="text-[var(--ink)]">{fmt.currency(v.TM??0)}</strong></span>
                          <span>Vendas: <strong className="text-[var(--ink)]">{v.TOTAL_VENDAS}</strong></span>
                          {!user.isVendedora && <span className="text-[var(--ink-ghost)]">{v.NOME_FILIAL}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[16px] font-bold text-[var(--acc)]">{v.TOTAL_PONTOS}</div>
                        <div className="text-[13px] text-[var(--ink-ghost)]">pts</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ═══ ABA DESAFIOS ═══ */}
        {aba === 'desafios' && (
          <>
            {desafios.length === 0 ? (
              <Card>
                <div className="py-10 flex flex-col items-center gap-3 text-center">
                  <Target className="w-10 h-10 text-[var(--ink-ghost)]" />
                  <div className="text-[13px] font-medium text-[var(--ink)]">Nenhum desafio ativo</div>
                  <div className="text-[13px] text-[var(--ink-ghost)]">Crie um desafio para motivar a equipe</div>
                  {(user.isGerenteLoja || user.isSupervisora || user.isAdmin || user.isDono) && (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => setModalDesafio(true)}
                      className="bg-gradient-to-r from-yellow-400 to-orange-500"
                    >
                      <Plus className="w-4 h-4" /> Criar desafio
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {desafios.map(d => {
                  const isCliente = String(d.INDICADOR || '').toUpperCase() === 'CLIENTE'
                  const metaAlvo = Number(d.META_VALOR) || 0
                  const realizado = isCliente
                    ? (crmProgresso?.resumo?.clientesReativados
                        ?? crmProgresso?.porVendedor?.reduce((a: number, v: any) => a + (v.clientesReativados || 0), 0)
                        ?? 0)
                    : null
                  const pct = isCliente && metaAlvo > 0 && realizado != null
                    ? Math.min((realizado / metaAlvo) * 100, 100)
                    : null
                  return (
                  <div key={d.ID} className="bg-gradient-to-br from-white to-yellow-50 border border-yellow-200 rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                          <Zap className="w-4 h-4 text-yellow-600" />
                        </div>
                        <span className="text-[12px] font-medium text-[var(--ink)]">{d.TITULO}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-yellow-100 px-2 py-0.5 rounded-full shrink-0">
                        <Star className="w-3 h-3 text-yellow-600" />
                        <span className="text-[12px] font-medium text-yellow-700">{d.PONTOS_PREMIO} pts</span>
                      </div>
                    </div>
                    {d.DESCRICAO && <p className="text-[13px] text-[var(--ink-ghost)] mb-3 leading-relaxed">{d.DESCRICAO}</p>}
                    <div className="flex items-center justify-between text-[12px]">
                      <div className="flex items-center gap-3 text-[var(--ink-ghost)]">
                        <span>Meta: <strong className="text-[var(--ink)]">{d.INDICADOR} {d.META_VALOR}</strong></span>
                        <span>{d.DATA_INICIO} → {d.DATA_FIM}</span>
                      </div>
                    </div>
                    {isCliente && pct != null && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[11px] text-[var(--ink-ghost)] mb-1">
                          <span>Progresso: {realizado}/{metaAlvo} clientes reativados</span>
                          <span className={cn(pct >= 100 ? 'text-[var(--success)]' : pct >= 80 ? 'text-[var(--acc)]' : '')}>
                            {fmt.number(pct, 0)}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-yellow-100 overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', pct >= 100 ? 'bg-[var(--success)]' : 'bg-yellow-500')}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {d.RECOMPENSA_DESCRICAO && (
                      <div className="mt-2 flex items-center gap-1.5 bg-green-50 rounded-lg px-2 py-1.5">
                        <Gift className="w-3 h-3 text-[var(--success)] shrink-0" />
                        <span className="text-[12px] text-[var(--success)] font-medium">{d.RECOMPENSA_DESCRICAO}</span>
                      </div>
                    )}
                  </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ═══ ABA CONFIG ═══ */}
        {aba === 'config' && (user.isAdmin || user.isDono) && (
          <div className="flex flex-col gap-4">
            <Card padding="sm">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-4 h-4 text-[var(--acc)]" />
                <span className="text-[12px] font-medium text-[var(--ink)]">Toggle de gamificacao por grupo/loja</span>
              </div>
              <div className="text-[13px] text-[var(--ink-ghost)] mb-4 leading-relaxed">
                Controle onde a gamificacao esta ativa. Quando desativada, o menu some para todos os usuarios daquele grupo/loja.
              </div>

              {/* Config global */}
              {configs.filter(c => !c.CODIGO_FILIAL).map(c => (
                <div key={c.ID} className="flex items-center justify-between py-3 border-b border-[var(--border)]">
                  <div>
                    <div className="text-[12px] font-medium text-[var(--ink)]">Padrao global</div>
                    <div className="text-[12px] text-[var(--ink-ghost)]">Aplica para todas as lojas sem config especifica</div>
                  </div>
                  <button onClick={() => toggleGamif(c, !c.ATIVO)}
                    className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-all',
                      c.ATIVO ? 'bg-green-50 text-[var(--success)] border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200')}>
                    {c.ATIVO ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    {c.ATIVO ? 'Ativo' : 'Inativo'}
                  </button>
                </div>
              ))}

              {/* Config por filial */}
              {filiaisAcess.map(f => {
                const cfg = configs.find(c => c.CODIGO_FILIAL?.trim() === f.COD_FILIAL?.trim())
                const ativo = cfg ? cfg.ATIVO : true // herda config global
                return (
                  <div key={f.COD_FILIAL} className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0">
                    <div>
                      <div className="text-[12px] font-medium text-[var(--ink)]">{f.FILIAL}</div>
                      <div className="text-[12px] text-[var(--ink-ghost)]">{f.COD_FILIAL?.trim()}</div>
                    </div>
                    <button onClick={() => toggleGamif({ ...cfg, codigoFilial: f.COD_FILIAL?.trim() }, !ativo)}
                      className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-all',
                        ativo ? 'bg-green-50 text-[var(--success)] border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200')}>
                      {ativo ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      {ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>
                )
              })}
            </Card>

            {/* Pesos de pontuacao - editavel */}
            {configs.filter(c => !c.CODIGO_FILIAL)[0] && (
              <Card padding="sm">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-[12px] font-medium text-[var(--ink)]">Pesos de pontuacao (config global)</span>
                </div>
                <div className="flex flex-col gap-3">
                  {[
                    { key: 'PONTOS_PA',      label: 'Por 0.1 acima meta PA',  icon: '📈' },
                    { key: 'PONTOS_TM',      label: 'Por R$10 acima meta TM', icon: '💵' },
                    { key: 'PONTOS_VENDA',   label: 'Por venda realizada',     icon: '🛍️' },
                    { key: 'PONTOS_CLIENTE', label: 'Por cliente recuperado',  icon: '💪' },
                    { key: 'PONTOS_META',    label: 'Por bater meta mensal',   icon: '🎯' },
                  ].map(p => {
                    const cfgGlobal = configs.find(c => !c.CODIGO_FILIAL)
                    return (
                      <div key={p.key} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{p.icon}</span>
                          <span className="text-[13px] text-[var(--ink-ghost)]">{p.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number" min="0" step="1"
                            defaultValue={cfgGlobal?.[p.key] ?? 0}
                            id={`peso-${p.key}`}
                            className="w-16 h-8 px-2 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg text-[12px] text-center focus:outline-none focus:border-[var(--acc)]"
                          />
                          <span className="text-[13px] text-[var(--ink-ghost)]">pts</span>
                        </div>
                      </div>
                    )
                  })}
                  <Button
                    variant="primary"
                    size="lg"
                    className="mt-2 w-full bg-gradient-to-r from-yellow-400 to-orange-500"
                    onClick={async () => {
                      const cfgGlobal = configs.find((c: any) => !c.CODIGO_FILIAL)
                      const getPeso = (key: string) => parseInt((document.getElementById(`peso-${key}`) as HTMLInputElement)?.value || '0')
                      await axios.post('/api/gamificacao/config', {
                        ...cfgGlobal,
                        ativo:          cfgGlobal?.ATIVO ?? true,
                        pontos_pa:      getPeso('PONTOS_PA'),
                        pontos_tm:      getPeso('PONTOS_TM'),
                        pontos_venda:   getPeso('PONTOS_VENDA'),
                        pontos_cliente: getPeso('PONTOS_CLIENTE'),
                        pontos_meta:    getPeso('PONTOS_META'),
                      })
                      carregar()
                    }}
                  >
                    Salvar configuracao de pontos
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

            {/* Modal novo desafio */}
      <Modal
        open={!!modalDesafio}
        onClose={() => setModalDesafio(false)}
        title={
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            Novo desafio
          </span>
        }
        size="md"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setModalDesafio(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={salvarDesafio}
              disabled={!form.titulo || !form.metaValor || !form.dataInicio || !form.dataFim || salvandoDesafio}
              loading={salvandoDesafio}
              className="bg-gradient-to-r from-yellow-400 to-orange-500"
            >
              Criar desafio
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {erroDesafio && (
            <div className="text-[13px] text-[var(--danger)] bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {erroDesafio}
            </div>
          )}
          {filiaisAcess.length > 1 && (
            <div>
              <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">Loja</label>
              <select value={form.codigoFilial} onChange={e => setForm(f=>({...f, codigoFilial:e.target.value}))}
                style={{ backgroundImage: selectChevron }}
                className="select-base mt-1">
                <option value="">Todas as lojas selecionadas</option>
                {filiaisAcess.map(f => <option key={f.COD_FILIAL} value={f.COD_FILIAL.trim()}>{f.FILIAL}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">Titulo *</label>
            <input value={form.titulo} onChange={e => setForm(f=>({...f, titulo:e.target.value}))}
              placeholder="Ex: Semana do PA — quem bater 2.5 ganha!"
              className="input-base mt-1" />
          </div>
          <div>
            <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">Descricao</label>
            <textarea value={form.descricao} onChange={e => setForm(f=>({...f, descricao:e.target.value}))}
              rows={2} placeholder="Detalhes do desafio..."
              className="input-base mt-1 !h-auto py-3 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">Indicador</label>
              <select value={form.indicador} onChange={e => setForm(f=>({...f, indicador:e.target.value}))}
                style={{ backgroundImage: selectChevron }}
                className="select-base mt-1">
                <option value="PA">P.A</option>
                <option value="TM">T.M</option>
                <option value="VENDAS">Vendas</option>
                <option value="PA1">% PA1</option>
                <option value="CLIENTE">Clientes recuperados</option>
              </select>
            </div>
            <div>
              <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">Meta *</label>
              <input type="number" step="0.1" value={form.metaValor} onChange={e => setForm(f=>({...f, metaValor:e.target.value}))}
                placeholder="2.5"
                className="input-base mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">Pontos</label>
              <input type="number" value={form.pontosPremio} onChange={e => setForm(f=>({...f, pontosPremio:e.target.value}))}
                className="input-base mt-1" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">Inicio *</label>
              <input type="date" value={form.dataInicio} onChange={e => setForm(f=>({...f, dataInicio:e.target.value}))}
                className="input-base mt-1" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">Fim *</label>
              <input type="date" value={form.dataFim} onChange={e => setForm(f=>({...f, dataFim:e.target.value}))}
                className="input-base mt-1" />
            </div>
          </div>
          <div>
            <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">Recompensa (opcional)</label>
            <input value={form.recompensaDescricao} onChange={e => setForm(f=>({...f, recompensaDescricao:e.target.value}))}
              placeholder="Ex: Vale presente de R$50, folga extra, almoco..."
              className="input-base mt-1" />
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
