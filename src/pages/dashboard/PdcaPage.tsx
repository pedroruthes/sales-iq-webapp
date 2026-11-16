import { useState, useEffect } from 'react'
import { Plus, ClipboardList, Play, CheckSquare, Zap, ChevronDown,
         ChevronRight, Brain, Target, TrendingUp, TrendingDown,
         Clock, CheckCircle, XCircle, AlertTriangle, Lightbulb } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Card, Button, Modal } from '@/components/ui'
import { useContentLoading, useCurrentUser } from '@/hooks/useSession'
import { useFiliais } from '@/hooks/useFiliais'
import { cn, fmt } from '@/lib/utils'
import axios from 'axios'

type Status = 'todos' | 'planejado' | 'em_execucao' | 'checando' | 'concluido' | 'cancelado'

const selectChevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")"

const STATUS_INFO: Record<string, { label: string; cor: string; icon: any }> = {
  planejado:    { label: 'Planejado',    cor: 'bg-blue-50 text-blue-700 border-blue-200',   icon: ClipboardList },
  em_execucao:  { label: 'Em execucao', cor: 'bg-amber-50 text-amber-700 border-amber-200', icon: Play },
  checando:     { label: 'Checando',    cor: 'bg-purple-50 text-purple-700 border-purple-200', icon: CheckSquare },
  concluido:    { label: 'Concluido',   cor: 'bg-green-50 text-[var(--success)] border-green-200', icon: CheckCircle },
  cancelado:    { label: 'Cancelado',   cor: 'bg-gray-50 text-gray-500 border-gray-200',    icon: XCircle },
}

const ETAPAS = [
  { id: 'P', label: 'Planejar',  cor: 'bg-blue-500',   desc: 'Definir acao e meta' },
  { id: 'D', label: 'Fazer',     cor: 'bg-amber-500',  desc: 'Executar e registrar' },
  { id: 'C', label: 'Checar',    cor: 'bg-purple-500', desc: 'Medir resultado' },
  { id: 'A', label: 'Agir',      cor: 'bg-green-500',  desc: 'Avaliar e ajustar' },
]

const CATEGORIAS = [
  'Treinamento equipe', 'Campanha promocional', 'Gestao de estoque',
  'Atendimento ao cliente', 'Visual merchandising', 'Meta de indicador',
  'Processo interno', 'Outro'
]

const INDICADORES = [
  { id: 'PA', label: 'P.A (Pecas/Atendimento)' },
  { id: 'TM', label: 'T.M (Ticket Medio)' },
  { id: 'FATURAMENTO', label: 'Faturamento' },
  { id: 'PA1', label: '% PA1 (Vendas unitarias)' },
  { id: 'CRM_CONTATOS', label: 'Contatos CRM (meta)' },
  { id: 'CRM_REATIVACAO', label: '% Fat. reativados' },
]

export default function PDCAPage() {
  const user    = useCurrentUser()
  const { data: filiais, isLoading: lFiliais } = useFiliais()
  const [filtroStatus, setFiltroStatus] = useState<Status>('todos')
  const [filialSel,    setFilialSel]    = useState('')
  const [menuFilial,   setMenuFilial]   = useState(false)
  const [pdcas,        setPdcas]        = useState<any[]>([])
  const [loading,      setLoading]      = useState(true)
  const [expandido,    setExpandido]    = useState<number | null>(null)
  const [modal,        setModal]        = useState(false)
  const [modalEtapa,   setModalEtapa]   = useState<{ id: number; etapa: string } | null>(null)
  const [avaliando,    setAvaliando]    = useState<number | null>(null)
  const [form, setForm] = useState({
    titulo: '', descricao: '', categoria: '', indicadorFoco: '',
    metaEsperada: '', valorBaseline: '', responsavel: '', prazo: '', codigoFilial: ''
  })

  const filiaisAcess = (filiais ?? []).filter(f => user.filiais.includes(f.COD_FILIAL.trim()))
  const filiaisParam = filialSel ? [filialSel] : user.filiais
  const nomeFilial   = filialSel
    ? filiaisAcess.find(f => f.COD_FILIAL.trim() === filialSel)?.FILIAL ?? filialSel
    : 'Todas as lojas'

  const carregar = async () => {
    setLoading(true)
    try {
      const params: any = { filiais: filiaisParam.join(',') }
      if (filtroStatus !== 'todos') params.status = filtroStatus
      const r = await axios.get('/api/pdca', { params })
      setPdcas(r.data.data ?? [])
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { if (user.filiais.length) carregar() }, [filialSel, filtroStatus, user.filiais])

  // Sugere baseline/meta ao escolher indicador CRM
  useEffect(() => {
    if (!form.indicadorFoco.startsWith('CRM_') || !modal) return
    const filial = form.codigoFilial || filiaisParam[0]
    if (!filial) return
    axios.get('/api/crm/kpis', { params: { filiais: filial } })
      .then(r => {
        const resumo = r.data?.resumo
        if (!resumo) return
        if (form.indicadorFoco === 'CRM_CONTATOS') {
          setForm(f => ({
            ...f,
            valorBaseline: f.valorBaseline || String(resumo.contatosRealizados ?? 0),
            metaEsperada: f.metaEsperada || String(resumo.metaContatos || Math.ceil((resumo.contatosRealizados || 0) * 1.2) || ''),
          }))
        } else if (form.indicadorFoco === 'CRM_REATIVACAO') {
          const pct = resumo.percentualFatReativados
          setForm(f => ({
            ...f,
            valorBaseline: f.valorBaseline || (pct != null ? String(Number(pct).toFixed(1)) : '0'),
            metaEsperada: f.metaEsperada || (pct != null ? String(Math.min(Number(pct) + 5, 100).toFixed(1)) : '10'),
          }))
        }
      })
      .catch(() => {})
  }, [form.indicadorFoco, form.codigoFilial, modal])

  const [erroForm, setErroForm] = useState('')

  const salvarPDCA = async () => {
    if (!form.titulo) { setErroForm('Titulo obrigatorio'); return }
    if (!form.indicadorFoco) { setErroForm('Selecione o indicador foco para poder acompanhar o resultado'); return }
    if (!form.valorBaseline) { setErroForm('Informe o valor atual do indicador (baseline) para comparar depois'); return }
    if (!form.metaEsperada) { setErroForm('Informe a meta esperada para avaliar se o PDCA funcionou'); return }
    setErroForm('')
    const filial = form.codigoFilial || filiaisParam[0]
    await axios.post('/api/pdca', { ...form, codigoFilial: filial, criadoPor: user.email })
    setModal(false)
    setForm({ titulo:'',descricao:'',categoria:'',indicadorFoco:'',metaEsperada:'',valorBaseline:'',responsavel:'',prazo:'',codigoFilial:'' })
    carregar()
  }

  const atualizarEtapa = async (id: number, etapa: string, dados: any) => {
    await axios.patch('/api/pdca', { id, etapa, dados })
    setModalEtapa(null)
    carregar()
  }

  const avaliarComIA = async (pdca: any) => {
    setAvaliando(pdca.ID)
    try {
      await axios.post('/api/pdca/avaliar', {
        id: pdca.ID, titulo: pdca.TITULO,
        indicador: pdca.INDICADOR_FOCO, baseline: pdca.VALOR_BASELINE,
        metaEsperada: pdca.META_ESPERADA, resultado: pdca.VALOR_RESULTADO,
        descricaoAcao: pdca.DESCRICAO_ACAO,
      })
      carregar()
    } catch {}
    finally { setAvaliando(null) }
  }

  const contadores = {
    planejado:   pdcas.filter(p => p.STATUS === 'planejado').length,
    em_execucao: pdcas.filter(p => p.STATUS === 'em_execucao').length,
    checando:    pdcas.filter(p => p.STATUS === 'checando').length,
    concluido:   pdcas.filter(p => p.STATUS === 'concluido').length,
  }

  const pageLoading = useContentLoading({
    filiaisLoading: lFiliais,
    filiaisQuery: user.filiais,
    waiting: user.filiais.length > 0 ? [loading] : [],
  })

  return (
    <DashboardLayout
      titulo="PDCA Digital"
      subtitulo="Ciclo de melhoria contínua"
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
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-[var(--border)] rounded-xl py-1 shadow-lg z-20">
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
          <Button variant="primary" size="lg" onClick={() => setModal(true)}>
            <Plus className="w-4 h-4" /> Novo PDCA
          </Button>
        </>
      }
    >
        {/* Fluxo PDCA visual */}
        <div className="flex items-center gap-2 flex-wrap">
          {ETAPAS.map((e, i) => (
            <div key={e.id} className="flex items-center gap-2">
              <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg text-white text-[13px] font-medium cursor-pointer hover:opacity-90',
                e.cor, filtroStatus === (i===0?'planejado':i===1?'em_execucao':i===2?'checando':'concluido') ? 'ring-2 ring-offset-1 ring-[var(--acc)]' : '')}
                onClick={() => setFiltroStatus(i===0?'planejado':i===1?'em_execucao':i===2?'checando':'concluido' as Status)}>
                <span className="font-bold">{e.id}</span>
                <span>{e.label}</span>
                <span className="bg-white/20 px-1.5 rounded text-[12px]">
                  {i===0?contadores.planejado:i===1?contadores.em_execucao:i===2?contadores.checando:contadores.concluido}
                </span>
              </div>
              {i < 3 && <ChevronRight className="w-4 h-4 text-[var(--ink-ghost)]" />}
            </div>
          ))}
          <button onClick={() => setFiltroStatus('cancelado' as Status)}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-all',
              filtroStatus==='cancelado' ? 'bg-gray-100 text-gray-600 border-gray-300' : 'bg-white text-[var(--ink-ghost)] border-[var(--border)]')}>
            Cancelados ({pdcas.filter(p => p.STATUS === 'cancelado').length})
          </button>
          <button onClick={() => setFiltroStatus('todos')}
            className={cn('px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-all',
              filtroStatus==='todos' ? 'bg-[var(--acc-pale)] text-[var(--acc)] border-[var(--acc-border)]' : 'bg-white text-[var(--ink-ghost)] border-[var(--border)]')}>
            Todos ({pdcas.length})
          </button>
        </div>

        {/* Lista de PDCAs */}
        {pdcas.length === 0 ? (
          <Card>
            <div className="py-12 flex flex-col items-center gap-4 text-center">
              <ClipboardList className="w-10 h-10 text-[var(--ink-ghost)]" />
              <div>
                <div className="text-[14px] font-medium text-[var(--ink)] mb-1">Nenhum PDCA ainda</div>
                <div className="text-[12px] text-[var(--ink-ghost)]">
                  Crie um ciclo de melhoria manualmente ou gere pela tela de IA & Insights
                </div>
              </div>
              <Button variant="primary" size="lg" onClick={() => setModal(true)}>
                <Plus className="w-4 h-4" /> Criar primeiro PDCA
              </Button>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {pdcas.map(p => {
              const st   = STATUS_INFO[p.STATUS] ?? STATUS_INFO.planejado
              const StIcon = st.icon
              const aberto = expandido === p.ID
              const etapaAtual = p.STATUS === 'planejado' ? 'P' : p.STATUS === 'em_execucao' ? 'D' : p.STATUS === 'checando' ? 'C' : 'A'

              return (
                <div key={p.ID} className="bg-white border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--acc-border)] transition-colors">
                  {/* Linha do status colorida */}
                  <div className={cn('h-1', p.STATUS==='planejado'?'bg-blue-400':p.STATUS==='em_execucao'?'bg-amber-400':p.STATUS==='checando'?'bg-purple-400':p.STATUS==='concluido'?'bg-[var(--success)]':'bg-gray-300')} />

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Etapa atual */}
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-white text-[13px] font-bold shrink-0',
                          p.STATUS==='planejado'?'bg-blue-500':p.STATUS==='em_execucao'?'bg-amber-500':p.STATUS==='checando'?'bg-purple-500':'bg-[var(--success)]')}>
                          {etapaAtual}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-[var(--ink)] truncate">{p.TITULO}</div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className={cn('text-[13px] px-2 py-0.5 rounded-full border font-medium', st.cor)}>
                              {st.label}
                            </span>
                            {p.CATEGORIA && <span className="text-[12px] text-[var(--ink-ghost)]">{p.CATEGORIA}</span>}
                            {p.INDICADOR_FOCO && <span className="text-[12px] text-[var(--acc)]">foco: {p.INDICADOR_FOCO}</span>}
                            {p.NOME_FILIAL && <span className="text-[12px] text-[var(--ink-ghost)]">{p.NOME_FILIAL}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {p.PRAZO && (
                          <div className="flex items-center gap-1 text-[12px] text-[var(--ink-ghost)]">
                            <Clock className="w-3 h-3" /> {p.PRAZO}
                          </div>
                        )}
                        <button onClick={() => setExpandido(aberto ? null : p.ID)}
                          className="p-1 hover:bg-[var(--bg-subtle)] rounded-lg transition-colors">
                          <ChevronDown className={cn('w-4 h-4 text-[var(--ink-ghost)] transition-transform', aberto && 'rotate-180')} />
                        </button>
                      </div>
                    </div>

                    {/* Alerta estrutura incompleta */}
                    {(!p.INDICADOR_FOCO || !p.VALOR_BASELINE || !p.META_ESPERADA) && p.STATUS !== 'cancelado' && p.STATUS !== 'concluido' && (
                      <div className="flex items-center gap-2 mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="text-[12px] text-amber-700">
                          PDCA incompleto — falta:
                          {!p.INDICADOR_FOCO && ' indicador'}{!p.VALOR_BASELINE && ' baseline'}{!p.META_ESPERADA && ' meta'}
                          . A IA nao conseguira avaliar o resultado sem esses dados.
                        </span>
                      </div>
                    )}

                    {/* Progresso das etapas */}
                    <div className="flex items-center gap-1 mt-3">
                      {['P','D','C','A'].map((e, i) => {
                        const ativas = ['planejado','em_execucao','checando','concluido']
                        const idxAtual = ativas.indexOf(p.STATUS)
                        const feito = i <= idxAtual
                        return (
                          <div key={e} className="flex items-center gap-1">
                            <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold border',
                              feito ? 'bg-[var(--acc)] text-white border-[var(--acc)]' : 'bg-white text-[var(--ink-ghost)] border-[var(--border)]')}>
                              {e}
                            </div>
                            {i < 3 && <div className={cn('w-6 h-0.5', feito && i < idxAtual ? 'bg-[var(--acc)]' : 'bg-[var(--border)]')} />}
                          </div>
                        )
                      })}
                      {p.RESPONSAVEL && (
                        <span className="ml-auto text-[12px] text-[var(--ink-ghost)]">Resp: {p.RESPONSAVEL}</span>
                      )}
                    </div>

                    {/* Detalhe expandido */}
                    {aberto && (
                      <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-col gap-3">
                        {/* P - Plano */}
                        <div className="bg-blue-50 rounded-xl p-3">
                          <div className="text-[12px] text-blue-600 font-medium uppercase tracking-wider mb-1">P — Plano</div>
                          <div className="text-[12px] text-[var(--ink-muted)]">{p.DESCRICAO || p.TITULO}</div>
                          {p.VALOR_BASELINE && p.META_ESPERADA && (
                            <div className="text-[13px] text-[var(--ink-ghost)] mt-1">
                              Baseline: <strong>{p.VALOR_BASELINE}</strong> → Meta: <strong>{p.META_ESPERADA}</strong>
                            </div>
                          )}
                        </div>

                        {/* D - Execucao */}
                        {p.DESCRICAO_ACAO ? (
                          <div className="bg-amber-50 rounded-xl p-3">
                            <div className="text-[12px] text-amber-600 font-medium uppercase tracking-wider mb-1">D — Execucao</div>
                            <div className="text-[12px] text-[var(--ink-muted)]">{p.DESCRICAO_ACAO}</div>
                            {p.DATA_EXECUCAO && <div className="text-[12px] text-[var(--ink-ghost)] mt-1">Em {p.DATA_EXECUCAO}</div>}
                          </div>
                        ) : p.STATUS === 'planejado' && (
                          <button onClick={() => setModalEtapa({ id: p.ID, etapa: 'D' })}
                            className="flex items-center gap-2 px-3 py-2 border border-dashed border-amber-300 rounded-xl text-[13px] text-amber-600 hover:bg-amber-50 transition-colors">
                            <Play className="w-3.5 h-3.5" /> Registrar execucao
                          </button>
                        )}

                        {/* C - Resultado */}
                        {p.VALOR_RESULTADO ? (
                          <div className="bg-purple-50 rounded-xl p-3">
                            <div className="text-[12px] text-purple-600 font-medium uppercase tracking-wider mb-1">C — Resultado</div>
                            <div className="flex items-center gap-3">
                              <div className="text-[18px] font-medium text-[var(--ink)]">{p.VALOR_RESULTADO}</div>
                              {p.VALOR_BASELINE && (
                                <div className={cn('flex items-center gap-1 text-[12px] font-medium',
                                  p.VALOR_RESULTADO > p.VALOR_BASELINE ? 'text-[var(--success)]' : 'text-[var(--danger)]')}>
                                  {p.VALOR_RESULTADO > p.VALOR_BASELINE
                                    ? <TrendingUp className="w-4 h-4" />
                                    : <TrendingDown className="w-4 h-4" />}
                                  {((p.VALOR_RESULTADO - p.VALOR_BASELINE) / p.VALOR_BASELINE * 100).toFixed(1)}%
                                </div>
                              )}
                            </div>
                          </div>
                        ) : p.STATUS === 'em_execucao' && (
                          <button onClick={() => setModalEtapa({ id: p.ID, etapa: 'C' })}
                            className="flex items-center gap-2 px-3 py-2 border border-dashed border-purple-300 rounded-xl text-[13px] text-purple-600 hover:bg-purple-50 transition-colors">
                            <CheckSquare className="w-3.5 h-3.5" /> Registrar resultado
                          </button>
                        )}

                        {/* A - Avaliacao */}
                        {p.AVALIACAO_IA ? (
                          <div className="bg-green-50 rounded-xl p-3">
                            <div className="text-[12px] text-[var(--success)] font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                              <Brain className="w-3 h-3" /> A — Avaliacao IA
                            </div>
                            <div className="text-[12px] text-[var(--ink-muted)]">{p.AVALIACAO_IA}</div>
                            {p.PROXIMA_ACAO && (
                              <div className="mt-2 flex items-start gap-1.5">
                                <Lightbulb className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                                <span className="text-[13px] text-amber-700 font-medium">{p.PROXIMA_ACAO}</span>
                              </div>
                            )}
                          </div>
                        ) : p.STATUS === 'checando' && p.VALOR_RESULTADO && (
                          <button onClick={() => avaliarComIA(p)} disabled={avaliando === p.ID}
                            className="flex items-center gap-2 px-3 py-2 border border-dashed border-green-300 rounded-xl text-[13px] text-[var(--success)] hover:bg-green-50 transition-colors disabled:opacity-60">
                            <Brain className={cn('w-3.5 h-3.5', avaliando===p.ID && 'animate-pulse')} />
                            {avaliando===p.ID ? 'IA avaliando...' : 'Avaliar com IA'}
                          </button>
                        )}

                        {/* Acoes */}
                        <div className="flex gap-2 pt-1">
                          {p.STATUS !== 'concluido' && p.STATUS !== 'cancelado' && (
                            <button onClick={() => {
                              if (window.confirm('Tem certeza que deseja cancelar este PDCA?\n\n"' + p.TITULO + '"')) {
                                atualizarEtapa(p.ID, 'status', { status: 'cancelado' })
                              }
                            }}
                              className="text-[12px] text-[var(--ink-ghost)] hover:text-[var(--danger)] transition-colors">
                              Cancelar PDCA
                            </button>
                          )}
                        {p.STATUS === 'cancelado' && (
                            <button onClick={() => {
                              if (window.confirm('Reativar este PDCA?')) {
                                atualizarEtapa(p.ID, 'status', { status: 'planejado' })
                              }
                            }}
                              className="text-[12px] text-[var(--ink-ghost)] hover:text-[var(--success)] transition-colors">
                              Reativar PDCA
                            </button>
                          )}
                        {(p.STATUS === 'concluido' || p.AVALIACAO_IA) && (
                            <button onClick={() => {
                              setForm({
                                titulo: p.TITULO + ' (novo ciclo)',
                                descricao: p.PROXIMA_ACAO ?? p.DESCRICAO ?? '',
                                categoria: p.CATEGORIA ?? '',
                                indicadorFoco: p.INDICADOR_FOCO ?? '',
                                metaEsperada: '',
                                valorBaseline: p.VALOR_RESULTADO ? String(p.VALOR_RESULTADO) : '',
                                responsavel: p.RESPONSAVEL ?? '',
                                prazo: '',
                                codigoFilial: p.CODIGO_FILIAL ?? '',
                              })
                              setModal(true)
                            }}
                              className="flex items-center gap-1 text-[12px] text-[var(--acc)] hover:underline transition-colors">
                              Iniciar novo ciclo
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      {/* Modal novo PDCA */}
      <Modal
        open={!!modal}
        onClose={() => { setModal(false); setErroForm('') }}
        title="Novo ciclo PDCA"
        size="md"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => { setModal(false); setErroForm('') }}>
              Cancelar
            </Button>
            <Button variant="primary" size="md" onClick={salvarPDCA}>
              Criar PDCA
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {/* Filial */}
          {filiaisAcess.length > 1 && (
            <div>
              <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">Loja</label>
              <select value={form.codigoFilial} onChange={e => setForm(f=>({...f, codigoFilial:e.target.value}))}
                style={{ backgroundImage: selectChevron }}
                className="select-base mt-1">
                <option value="">Selecionar loja</option>
                {filiaisAcess.map(f => <option key={f.COD_FILIAL} value={f.COD_FILIAL.trim()}>{f.FILIAL}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">Titulo da acao *</label>
            <input value={form.titulo} onChange={e => setForm(f=>({...f, titulo:e.target.value}))}
              placeholder="Ex: Treinamento de tecnicas de adicional"
              className="input-base mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">Categoria</label>
              <select value={form.categoria} onChange={e => setForm(f=>({...f, categoria:e.target.value}))}
                style={{ backgroundImage: selectChevron }}
                className="select-base mt-1">
                <option value="">Selecionar</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">Indicador foco</label>
              <select value={form.indicadorFoco} onChange={e => setForm(f=>({...f, indicadorFoco:e.target.value}))}
                style={{ backgroundImage: selectChevron }}
                className="select-base mt-1">
                <option value="">Nenhum</option>
                {INDICADORES.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">Descricao</label>
            <textarea value={form.descricao} onChange={e => setForm(f=>({...f, descricao:e.target.value}))}
              rows={2} placeholder="Detalhe o que sera feito..."
              className="input-base mt-1 !h-auto py-3 resize-none" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">Baseline atual</label>
              <input type="number" value={form.valorBaseline} onChange={e => setForm(f=>({...f, valorBaseline:e.target.value}))}
                placeholder="2.1"
                className="input-base mt-1" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">Meta esperada</label>
              <input type="number" value={form.metaEsperada} onChange={e => setForm(f=>({...f, metaEsperada:e.target.value}))}
                placeholder="2.5"
                className="input-base mt-1" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">Prazo</label>
              <input type="date" value={form.prazo} onChange={e => setForm(f=>({...f, prazo:e.target.value}))}
                className="input-base mt-1" />
            </div>
          </div>
          <div>
            <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">Responsavel</label>
            <input value={form.responsavel} onChange={e => setForm(f=>({...f, responsavel:e.target.value}))}
              placeholder="Nome do responsavel"
              className="input-base mt-1" />
          </div>
          {erroForm && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 text-[var(--danger)] shrink-0 mt-0.5" />
              <span className="text-[13px] text-[var(--danger)]">{erroForm}</span>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal etapa D ou C */}
      {modalEtapa && (
        <EtapaModal etapa={modalEtapa.etapa} onClose={() => setModalEtapa(null)}
          onSalvar={dados => atualizarEtapa(modalEtapa.id, modalEtapa.etapa, dados)} />
      )}
    </DashboardLayout>
  )
}

function EtapaModal({ etapa, onClose, onSalvar }: { etapa: string; onClose: () => void; onSalvar: (d: any) => void }) {
  const [descricao, setDescricao]   = useState('')
  const [resultado, setResultado]   = useState('')

  return (
    <Modal
      open
      onClose={onClose}
      title={etapa === 'D' ? 'D — Registrar execucao' : 'C — Registrar resultado'}
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => onSalvar(etapa==='D' ? { descricaoAcao: descricao } : { valorResultado: parseFloat(resultado) })}
          >
            Salvar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {etapa === 'D' ? (
          <div>
            <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">O que foi feito?</label>
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)}
              rows={3} placeholder="Descreva as acoes executadas..."
              className="input-base mt-1 !h-auto py-3 resize-none" />
          </div>
        ) : (
          <div>
            <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">Valor do indicador agora</label>
            <input type="number" step="0.01" value={resultado} onChange={e => setResultado(e.target.value)}
              placeholder="Ex: 2.4"
              className="input-base mt-1" />
            <div className="text-[12px] text-[var(--ink-ghost)] mt-1">Informe o valor atual do indicador que estava sendo monitorado</div>
          </div>
        )}
      </div>
    </Modal>
  )
}
