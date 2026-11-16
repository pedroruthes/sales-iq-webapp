import { useState, useEffect, useMemo } from 'react'
import { Sparkles, AlertTriangle, Lightbulb, BookOpen,
         Calendar, ChevronDown, Brain, TrendingUp, TrendingDown,
         Save, Clock, Target, ArrowUp, Zap, BarChart3, ClipboardList } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Card, Button, Modal } from '@/components/ui'
import { useContentLoading, useCurrentUser } from '@/hooks/useSession'
import { useFiliais } from '@/hooks/useFiliais'
import { cn, fmt } from '@/lib/utils'
import { format, subMonths, subYears, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import axios from 'axios'
import { ConfrontoAcoes } from '@/features/ia/components/ConfrontoAcoes'
import type { ContextoOperacional } from '@/lib/queries/ia-contexto'

type Periodo = 'mes_atual' | 'mes_anterior' | 'ano_anterior'
type Status  = 'idle' | 'loading' | 'done' | 'error'
type Aba     = 'analise' | 'historico' | 'projecoes'

const selectChevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")"

interface InsightBloco { tipo: string; modulo?: string; icone: string; titulo: string; texto: string; acao?: string }
interface AnaliseIA {
  resumo: string; blocos: InsightBloco[]; diario?: string; geradoEm: string; periodo: string
  contexto?: ContextoOperacional
}

const MODULO_LABEL: Record<string, string> = {
  vendas: 'Vendas', diario: 'Diário', transferencia: 'Transferência', score: 'Score',
  gamificacao: 'Gamificação', crm: 'CRM', pdca: 'PDCA',
}

const COR: Record<string,string> = {
  alerta:   'border-l-[var(--danger)] bg-red-50',
  positivo: 'border-l-[var(--success)] bg-green-50',
  neutro:   'border-l-[var(--acc)] bg-[var(--acc-pale)]',
  sugestao: 'border-l-amber-400 bg-amber-50',
}
const TITULO_COR: Record<string,string> = {
  alerta: 'text-[var(--danger)]', positivo: 'text-[var(--success)]',
  neutro: 'text-[var(--acc)]',    sugestao: 'text-amber-600',
}
const MSGS = [
  'Analisando indicadores de vendas...',
  'Comparando com período anterior...',
  'Verificando alertas...',
  'Cruzando com diário de ações...',
  'Medindo retorno do CRM e das transferências...',
  'Comparando score, gamificação e PDCA com a venda...',
  'Gerando sugestões...',
]

function ModalCriarPDCA({ bloco, filiais, filiaisAcess, criadoPor, onClose, onSalvo }: {
  bloco: InsightBloco; filiais: string[]; filiaisAcess: any[]
  criadoPor: string; onClose: () => void; onSalvo: () => void
}) {
  const [titulo,    setTitulo]    = useState(bloco.titulo)
  const [descricao, setDescricao] = useState(bloco.acao ?? bloco.texto)
  const [filial,    setFilial]    = useState(filiais[0] ?? '')
  const [prazo,     setPrazo]     = useState('')
  const [responsavel, setResponsavel] = useState('')
  const [salvando,  setSalvando]  = useState(false)

  const salvar = async () => {
    setSalvando(true)
    try {
      await axios.post('/api/pdca', {
        titulo, descricao, codigoFilial: filial,
        origem: 'ia', categoria: 'Meta de indicador',
        responsavel, prazo, criadoPor,
      })
      onSalvo()
    } catch {}
    finally { setSalvando(false) }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-[var(--acc)]" />
          Criar PDCA a partir da sugestão da IA
        </span>
      }
      size="md"
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="md" onClick={salvar} disabled={!titulo || salvando} loading={salvando}>
            <ClipboardList className="w-3.5 h-3.5" />
            Criar PDCA
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <span className="text-[13px] text-amber-700">{bloco.acao}</span>
        </div>
        <div>
          <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">Título do PDCA</label>
          <input value={titulo} onChange={e => setTitulo(e.target.value)}
            className="input-base mt-1" />
        </div>
        <div>
          <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">Descrição</label>
          <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={2}
            className="input-base mt-1 !h-auto py-3 resize-none" />
        </div>
        {filiaisAcess.length > 1 && (
          <div>
            <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">Loja</label>
            <select value={filial} onChange={e => setFilial(e.target.value)}
              style={{ backgroundImage: selectChevron }}
              className="select-base mt-1">
              {filiaisAcess.map(f => <option key={f.COD_FILIAL} value={f.COD_FILIAL.trim()}>{f.FILIAL}</option>)}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">Responsável</label>
            <input value={responsavel} onChange={e => setResponsavel(e.target.value)}
              placeholder="Nome do responsável"
              className="input-base mt-1" />
          </div>
          <div>
            <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">Prazo</label>
            <input type="date" value={prazo} onChange={e => setPrazo(e.target.value)}
              className="input-base mt-1" />
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default function IAPage() {
  const user = useCurrentUser()
  const { data: filiais, isLoading: lFiliais } = useFiliais()
  const [aba,        setAba]        = useState<Aba>('analise')
  const [filialSel,  setFilialSel]  = useState('')
  const [menuFilial, setMenuFilial] = useState(false)
  const [periodo,    setPeriodo]    = useState<Periodo>('mes_atual')
  const [status,     setStatus]     = useState<Status>('idle')
  const [erroIA,     setErroIA]     = useState('')
  const [analise,    setAnalise]    = useState<AnaliseIA | null>(null)
  const [kpisAtuais, setKpisAtuais] = useState<any>(null)
  const [msgLoad,    setMsgLoad]    = useState(MSGS[0])
  const [salvando,   setSalvando]   = useState(false)
  const [salvoOk,    setSalvoOk]    = useState(false)
  const [historico,  setHistorico]  = useState<any[]>([])
  const [projecoes,  setProjecoes]  = useState<any>(null)
  const [loadProj,   setLoadProj]   = useState(false)
  const [analiseExp, setAnaliseExp]  = useState<any>(null)
  const [pdcaBloco,  setPdcaBloco]   = useState<InsightBloco | null>(null)
  const [erroSalvar, setErroSalvar] = useState('')
  const [focoPrompt, setFocoPrompt] = useState('')

  useEffect(() => {
    try {
      const p = sessionStorage.getItem('salesiq-ia-prompt')
      if (p) {
        setFocoPrompt(p)
        sessionStorage.removeItem('salesiq-ia-prompt')
      }
    } catch { /* ignore */ }
  }, [])

  const filiaisAcesso = useMemo(() => {
    const fromApi = (filiais ?? []).map((f) => String(f.COD_FILIAL).trim()).filter(Boolean)
    const fromJwt = user.filiais.map((f) => String(f).trim()).filter(Boolean)
    if (user.isAdmin || user.isProprietario || user.isDono) {
      return fromApi.length ? fromApi : fromJwt
    }
    if (!fromJwt.length) return fromApi
    if (!fromApi.length) return fromJwt
    return fromApi.filter((c) => fromJwt.includes(c))
  }, [filiais, user.filiais, user.isAdmin, user.isProprietario, user.isDono])

  const filiaisAcess = useMemo(() => {
    const set = new Set(filiaisAcesso)
    return (filiais ?? []).filter((f) => set.has(String(f.COD_FILIAL).trim()))
  }, [filiais, filiaisAcesso])

  const filiaisParam = filialSel ? [filialSel] : filiaisAcesso
  const nomeFilial   = filialSel
    ? filiaisAcess.find(f => f.COD_FILIAL.trim() === filialSel)?.FILIAL ?? filialSel
    : (user.isProprietario || user.isSupervisora || user.isAdmin) ? 'Todas as lojas' : user.filialPadrao ?? 'Loja'

  const getDatas = () => {
    const hoje = new Date()
    if (periodo === 'mes_atual')    return { inicio: startOfMonth(hoje), fim: endOfMonth(hoje), label: format(hoje,'MMMM/yyyy',{locale:ptBR}) }
    if (periodo === 'mes_anterior') { const a=subMonths(hoje,1); return { inicio:startOfMonth(a), fim:endOfMonth(a), label:format(a,'MMMM/yyyy',{locale:ptBR}) } }
    const a=subYears(hoje,1); return { inicio:startOfMonth(a), fim:endOfMonth(a), label:format(a,'MMMM/yyyy',{locale:ptBR})+' (ano anterior)' }
  }

  // Carregar histórico / projeções ao abrir aba
  useEffect(() => {
    if (!filiaisParam.length) return
    if (aba === 'historico') {
      axios.get(`/api/ia/historico?filiais=${filiaisParam.join(',')}`)
        .then(r => setHistorico(r.data.data ?? []))
        .catch(() => setHistorico([]))
    }
    if (aba === 'projecoes') {
      setLoadProj(true)
      setProjecoes(null)
      axios.get(`/api/ia/projecoes?filiais=${filiaisParam.join(',')}`)
        .then(r => setProjecoes(r.data.data))
        .catch(() => setProjecoes(null))
        .finally(() => setLoadProj(false))
    }
  }, [aba, filialSel, filiaisAcesso.join(',')])

  const MAX_FILIAIS_SEM_SELECAO = 5

  const pageLoading = useContentLoading({
    filiaisLoading: lFiliais,
  })

  const gerar = async () => {
    if (!filialSel && filiaisAcesso.length > MAX_FILIAIS_SEM_SELECAO) {
      alert(`Você tem ${filiaisAcesso.length} lojas. Selecione uma loja específica para gerar a análise e evitar timeout.`)
      return
    }
    setStatus('loading'); setAnalise(null); setSalvoOk(false); setErroIA(''); setErroSalvar('')
    let idx = 0; setMsgLoad(MSGS[0])
    const t = setInterval(() => { idx=(idx+1)%MSGS.length; setMsgLoad(MSGS[idx]) }, 2500)
    try {
      const { inicio, fim, label } = getDatas()
      const r = await axios.post('/api/diario/insights', {
        filiais: filiaisParam, dataInicio: inicio.toISOString(),
        dataFim: fim.toISOString(), periodo: label, nomeFilial, perfil: user.perfil,
        foco: focoPrompt || undefined,
      })
      setAnalise(r.data)
      setKpisAtuais(r.data.kpis ?? null)
      setStatus('done')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      setErroIA(err?.response?.data?.error ?? 'Erro ao gerar análise')
      setStatus('error')
    }
    finally { clearInterval(t) }
  }

  const salvar = async () => {
    if (!analise) return
    setSalvando(true)
    setErroSalvar('')
    try {
      const { inicio, fim } = getDatas()
      await axios.post('/api/ia/salvar', {
        analise, filiais: filiaisParam,
        dataInicio: inicio.toISOString(), dataFim: fim.toISOString(),
        nomeFilial, kpis: kpisAtuais,
      })
      setSalvoOk(true)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      setErroSalvar(err?.response?.data?.error ?? 'Erro ao salvar análise')
    }
    finally { setSalvando(false) }
  }

  const { label: periodoLabel } = getDatas()

  return (
    <DashboardLayout
      loading={pageLoading}
      titulo="IA & Insights"
      subtitulo="Análise automática com inteligência artificial"
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
          {aba === 'analise' && (
            <>
              <div className="flex items-center gap-1 bg-[var(--bg-subtle)] p-1 rounded-lg">
                {([
                  { id:'mes_atual' as Periodo, label:'Mês atual' },
                  { id:'mes_anterior' as Periodo, label:'Mês anterior' },
                  { id:'ano_anterior' as Periodo, label:'Ano -1' },
                ]).map(op => (
                  <button key={op.id} onClick={() => { setPeriodo(op.id); setStatus('idle') }}
                    className={cn('px-3 py-1 rounded-md text-[12px] font-medium transition-all',
                      periodo===op.id ? 'bg-white text-[var(--acc)] shadow-[var(--shadow-card)]' : 'text-[var(--ink-ghost)] hover:text-[var(--ink-muted)]')}>
                    {op.label}
                  </button>
                ))}
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={gerar}
                disabled={status==='loading' || (!filialSel && filiaisAcesso.length > MAX_FILIAIS_SEM_SELECAO)}
                loading={status==='loading'}
              >
                {status!=='loading' && <Sparkles className="w-4 h-4" />}
                {status==='loading' ? 'Analisando...' : status==='done' ? 'Atualizar' : 'Gerar análise'}
              </Button>
            </>
          )}
        </>
      }
    >
        {!filialSel && filiaisAcesso.length > MAX_FILIAIS_SEM_SELECAO && aba === 'analise' && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <span className="text-[13px] text-amber-700">
              Você tem {filiaisAcesso.length} lojas. Selecione uma loja no filtro acima para gerar a análise.
            </span>
          </div>
        )}

        {focoPrompt && aba === 'analise' && (
          <div className="flex items-start gap-2 bg-[var(--acc-pale)] border border-[var(--acc-border)] rounded-xl px-3 py-2.5">
            <Lightbulb className="w-4 h-4 text-[var(--acc)] shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium text-[var(--acc)] uppercase tracking-wide">Foco da análise</div>
              <div className="text-[13px] text-[var(--ink-muted)] mt-0.5">{focoPrompt}</div>
            </div>
            <button
              type="button"
              onClick={() => setFocoPrompt('')}
              className="text-[12px] text-[var(--ink-ghost)] hover:text-[var(--ink)] shrink-0"
            >
              limpar
            </button>
          </div>
        )}

        {/* Abas */}
        <div className="flex gap-1 bg-[var(--bg-subtle)] p-1 rounded-xl w-fit">
          {([
            { id:'analise' as Aba,   icon: Brain,    label:'Análise IA' },
            { id:'projecoes' as Aba, icon: Target,   label:'Projeções' },
            { id:'historico' as Aba, icon: Clock,    label:'Histórico' },
          ]).map(a => (
            <button key={a.id} onClick={() => setAba(a.id)}
              className={cn('flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all',
                aba===a.id ? 'bg-white text-[var(--acc)] shadow-[var(--shadow-card)]' : 'text-[var(--ink-ghost)] hover:text-[var(--ink-muted)]')}>
              <a.icon className="w-3.5 h-3.5" /> {a.label}
            </button>
          ))}
        </div>

        {/* ═══════════════ ABA ANÁLISE ═══════════════ */}
        {aba === 'analise' && (
          <>
            {status==='idle' && (
              <Card>
                <div className="py-12 flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--acc-pale)] flex items-center justify-center">
                    <Brain className="w-8 h-8 text-[var(--acc)]" />
                  </div>
                  <div>
                    <div className="text-[14px] font-medium text-[var(--ink)] mb-1">Pronto para analisar</div>
                    <div className="text-[12px] text-[var(--ink-ghost)] max-w-[380px] leading-relaxed">
                      Análise de <strong>{nomeFilial}</strong> em <strong>{periodoLabel}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[12px] text-[var(--ink-ghost)]">
                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> KPIs e metas</span>
                    <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Alertas</span>
                    <span className="flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Sugestoes</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> Diário, CRM, transferências, score, gamificação e PDCA x resultado</span>
                  </div>
                  <Button variant="primary" size="lg" onClick={gerar} className="mt-2">
                    <Sparkles className="w-4 h-4" /> Gerar análise agora
                  </Button>
                </div>
              </Card>
            )}

            {status==='loading' && (
              <Card>
                <div className="py-12 flex flex-col items-center gap-4 text-center">
                  <Brain className="w-10 h-10 text-[var(--acc)] animate-pulse" />
                  <div>
                    <div className="text-[13px] font-medium text-[var(--ink)] mb-1">IA analisando...</div>
                    <div className="text-[13px] text-[var(--ink-ghost)] animate-pulse">{msgLoad}</div>
                  </div>
                  <div className="flex gap-1.5">
                    {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-[var(--acc)] animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}
                  </div>
                </div>
              </Card>
            )}

            {status==='error' && (
              <Card>
                <div className="py-8 flex flex-col items-center gap-3 text-center">
                  <AlertTriangle className="w-8 h-8 text-[var(--danger)]" />
                  <div className="text-[13px] font-medium">Erro ao gerar análise</div>
                  <div className="text-[13px] text-[var(--ink-ghost)] max-w-md px-4">
                    {erroIA || 'Tente novamente em instantes.'}
                  </div>
                  <button onClick={gerar} className="text-[13px] text-[var(--acc)] hover:underline">Tentar novamente</button>
                </div>
              </Card>
            )}

            {status==='done' && analise && (
              <>
                <div className="flex items-center justify-between px-1">
                  <div className="text-[13px] text-[var(--ink-ghost)] flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <strong className="text-[var(--ink-muted)]">{analise.periodo}</strong> · {nomeFilial} · {analise.geradoEm}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[13px] bg-[var(--acc-pale)] text-[var(--acc)] border border-[var(--acc-border)] px-2 py-0.5 rounded-full">
                      <Sparkles className="w-2.5 h-2.5" /> IA ativa
                    </span>
                    <button onClick={salvar} disabled={salvando || salvoOk}
                      className={cn('flex items-center gap-1.5 px-3 h-7 rounded-lg text-[12px] font-medium transition-all border',
                        salvoOk
                          ? 'bg-green-50 text-[var(--success)] border-green-200'
                          : 'bg-white text-[var(--ink-muted)] border-[var(--border)] hover:border-[var(--acc-border)] hover:text-[var(--acc)]')}>
                      <Save className="w-3 h-3" />
                      {salvando ? 'Salvando...' : salvoOk ? 'Salvo!' : 'Salvar análise'}
                    </button>
                  </div>
                </div>
                {erroSalvar && (
                  <div className="text-[12px] text-[var(--danger)] px-1">{erroSalvar}</div>
                )}

                <Card padding="sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--acc)] flex items-center justify-center shrink-0">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-[12px] text-[var(--acc)] font-medium uppercase tracking-wider mb-1.5">Resumo executivo</div>
                      <p className="text-[13px] text-[var(--ink-muted)] leading-relaxed">{analise.resumo}</p>
                    </div>
                  </div>
                </Card>

                {analise.contexto && <ConfrontoAcoes contexto={analise.contexto} />}

                <div className="flex flex-col gap-2.5">
                  {analise.blocos.map((b, i) => (
                    <div key={i} className={cn('border-l-4 rounded-r-xl px-4 py-3.5', COR[b.tipo] ?? COR.neutro)}>
                      <div className="flex items-start gap-2.5">
                        <span className="text-[18px] shrink-0 mt-0.5">{b.icone}</span>
                        <div className="flex-1">
                          <div className={cn('text-[12px] font-medium mb-1 flex items-center gap-2', TITULO_COR[b.tipo] ?? TITULO_COR.neutro)}>
                            {b.titulo}
                            {b.modulo && MODULO_LABEL[b.modulo] && (
                              <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-white/70 border border-[var(--border)] text-[var(--ink-ghost)]">
                                {MODULO_LABEL[b.modulo]}
                              </span>
                            )}
                          </div>
                          <p className="text-[12px] text-[var(--ink-muted)] leading-relaxed">{b.texto}</p>
                          {b.acao && (
                            <div className="mt-2 flex items-start justify-between gap-2">
                              <div className="flex items-start gap-1.5 flex-1">
                                <Lightbulb className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                                <span className="text-[13px] text-amber-700 font-medium">{b.acao}</span>
                              </div>
                              <button onClick={() => setPdcaBloco(b)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-[var(--acc)] hover:opacity-90 rounded-lg text-[13px] text-white font-medium shrink-0 transition-all">
                                <ClipboardList className="w-2.5 h-2.5" /> Criar PDCA
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {analise.diario && (
                  <Card padding="sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <div className="text-[12px] text-amber-600 font-medium uppercase tracking-wider mb-1.5">Análise do Diário de Ações</div>
                        <p className="text-[12px] text-[var(--ink-muted)] leading-relaxed">{analise.diario}</p>
                      </div>
                    </div>
                  </Card>
                )}

                <div className="text-[12px] text-[var(--ink-ghost)] text-center leading-relaxed">
                  Análise gerada por IA. Os insights são sugestões — valide com o contexto da sua equipe.
                </div>
              </>
            )}
          </>
        )}

        {/* ═══════════════ ABA PROJEÇÕES ═══════════════ */}
        {aba === 'projecoes' && (
          <>
            {loadProj && (
              <Card>
                <div className="py-10 flex flex-col items-center gap-3">
                  <Target className="w-8 h-8 text-[var(--acc)] animate-pulse" />
                  <div className="text-[12px] text-[var(--ink-ghost)]">Calculando projeções...</div>
                </div>
              </Card>
            )}
            {!loadProj && !projecoes && (
              <Card>
                <div className="py-10 flex flex-col items-center gap-3 text-center">
                  <Target className="w-8 h-8 text-[var(--ink-ghost)]" />
                  <div className="text-[13px] font-medium text-[var(--ink)]">Sem dados de projeção</div>
                  <div className="text-[13px] text-[var(--ink-ghost)]">Verifique se há metas cadastradas para o mês atual</div>
                </div>
              </Card>
            )}
            {!loadProj && projecoes && (
              <div className="flex flex-col gap-4">
                {/* Progresso da meta */}
                <Card padding="sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-4 h-4 text-[var(--acc)]" />
                    <span className="text-[12px] font-medium text-[var(--ink)]">Progresso da meta — {format(new Date(),'MMMM/yyyy',{locale:ptBR})}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4 sm:grid-cols-4">
                    <div className="bg-[var(--bg-subtle)] rounded-xl p-3 text-center">
                      <div className="text-[13px] text-[var(--ink-ghost)] mb-1">Faturado</div>
                      <div className="text-[15px] font-medium text-[var(--ink)]">{fmt.currency(projecoes.faturamento)}</div>
                    </div>
                    <div className="bg-[var(--bg-subtle)] rounded-xl p-3 text-center">
                      <div className="text-[13px] text-[var(--ink-ghost)] mb-1">Meta</div>
                      <div className="text-[15px] font-medium text-[var(--ink)]">
                        {projecoes.metaFaturamento > 0 ? fmt.currency(projecoes.metaFaturamento) : '—'}
                      </div>
                    </div>
                    <div className="bg-[var(--bg-subtle)] rounded-xl p-3 text-center">
                      <div className="text-[13px] text-[var(--ink-ghost)] mb-1">Dias passados</div>
                      <div className="text-[15px] font-medium text-[var(--ink)]">{projecoes.diasPassados ?? Math.max((projecoes.diaAtual ?? 1) - 1, 1)} de {projecoes.diasMes}</div>
                    </div>
                    <div className="bg-[var(--bg-subtle)] rounded-xl p-3 text-center">
                      <div className="text-[13px] text-[var(--ink-ghost)] mb-1">Dias restantes</div>
                      <div className="text-[15px] font-medium text-[var(--acc)]">{projecoes.diasRestantes}</div>
                    </div>
                  </div>

                  {projecoes.metaFaturamento > 0 && (
                    <>
                      <div className="flex items-center justify-between text-[12px] text-[var(--ink-ghost)] mb-1.5">
                        <span>Atingimento atual</span>
                        <span className={cn('font-medium text-[12px]',
                          projecoes.pctMeta >= 100 ? 'text-[var(--success)]' :
                          projecoes.pctMeta >= 80  ? 'text-amber-600' : 'text-[var(--danger)]')}>
                          {projecoes.pctMeta?.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-3 bg-[var(--bg-subtle)] rounded-full overflow-hidden mb-4">
                        <div className={cn('h-full rounded-full transition-all',
                          projecoes.pctMeta >= 100 ? 'bg-[var(--success)]' :
                          projecoes.pctMeta >= 80  ? 'bg-amber-400' : 'bg-[var(--danger)]')}
                          style={{ width: `${Math.min(projecoes.pctMeta ?? 0, 100)}%` }} />
                      </div>
                    </>
                  )}

                  {/* Projeção final */}
                  <div className={cn('rounded-xl p-4 border',
                    projecoes.projecaoFinal >= projecoes.metaFaturamento
                      ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[12px] text-[var(--ink-ghost)] mb-0.5">Projeção de fechamento (tendência atual)</div>
                        <div className="text-[18px] font-medium text-[var(--ink)]">{fmt.currency(projecoes.projecaoFinal)}</div>
                        <div className="text-[13px] text-[var(--ink-ghost)] mt-0.5">
                          Média diária atual: {fmt.currency(projecoes.mediaFatDia)}/dia
                        </div>
                      </div>
                      {projecoes.metaFaturamento > 0 && (
                        <div className="text-right">
                          {projecoes.projecaoFinal >= projecoes.metaFaturamento ? (
                            <div className="flex items-center gap-1 text-[var(--success)]">
                              <TrendingUp className="w-5 h-5" />
                              <span className="text-[13px] font-medium">Vai bater!</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[var(--danger)]">
                              <TrendingDown className="w-5 h-5" />
                              <span className="text-[13px] font-medium">Em risco</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {projecoes.fatFaltante > 0 && projecoes.diasRestantes > 0 && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="text-[13px] text-amber-700">
                        <strong>Para bater a meta:</strong> precisa faturar{' '}
                        <strong>{fmt.currency(projecoes.fatDiaNeces)}/dia</strong> nos próximos{' '}
                        <strong>{projecoes.diasRestantes} dias</strong>
                        {' '}(falta {fmt.currency(projecoes.fatFaltante)})
                      </div>
                    </div>
                  )}
                </Card>

                {/* Cenários de PA */}
                <Card padding="sm">
                  <div className="flex items-center gap-2 mb-4">
                    <ArrowUp className="w-4 h-4 text-[var(--acc)]" />
                    <span className="text-[12px] font-medium text-[var(--ink)]">Simulacao — Impacto de melhorar o PA</span>
                  </div>
                  <div className="text-[13px] text-[var(--ink-ghost)] mb-3">
                    PA atual: <strong className="text-[var(--ink)]">{projecoes.pa}</strong> peças/venda |
                    TM atual: <strong className="text-[var(--ink)]">{fmt.currency(projecoes.tm)}</strong> |
                    Total vendas: <strong className="text-[var(--ink)]">{projecoes.totalVendas}</strong>
                  </div>
                  <div className="flex flex-col gap-2">
                    {projecoes.cenarios?.map((c: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 bg-[var(--bg-subtle)] rounded-xl p-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--acc-pale)] flex items-center justify-center shrink-0">
                          <Zap className="w-4 h-4 text-[var(--acc)]" />
                        </div>
                        <div className="flex-1">
                          <div className="text-[13px] font-medium text-[var(--ink)]">
                            PA sobe para {c.paProj} (+{c.delta} peca/venda)
                          </div>
                          <div className="text-[12px] text-[var(--ink-ghost)]">
                            Faturamento adicional estimado: <strong className="text-[var(--success)]">+{fmt.currency(c.fatAdicional)}</strong>
                            {projecoes.metaFaturamento > 0 && ` → meta ficaria em ${c.pctProj}%`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-[12px] text-[var(--ink-ghost)] leading-relaxed">
                    Calculo baseado nas vendas ja realizadas no mes. Quanto maior o PA, maior a receita por atendimento.
                  </div>
                </Card>

                {/* KPIs vs meta */}
                {(projecoes.metaPA || projecoes.metaTM) && (
                  <Card padding="sm">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="w-4 h-4 text-[var(--acc)]" />
                      <span className="text-[12px] font-medium text-[var(--ink)]">KPIs vs Meta</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {projecoes.metaPA && (
                        <div className="bg-[var(--bg-subtle)] rounded-xl p-3">
                          <div className="text-[12px] text-[var(--ink-ghost)] mb-1">PA atual vs meta</div>
                          <div className="flex items-end gap-2">
                            <span className="text-[16px] font-medium text-[var(--ink)]">{projecoes.pa}</span>
                            <span className="text-[13px] text-[var(--ink-ghost)] mb-0.5">/ meta {projecoes.metaPA}</span>
                          </div>
                          <div className="h-1.5 bg-white rounded-full mt-2 overflow-hidden">
                            <div className={cn('h-full rounded-full', projecoes.pa >= projecoes.metaPA ? 'bg-[var(--success)]' : 'bg-[var(--danger)]')}
                              style={{ width: `${Math.min((projecoes.pa/projecoes.metaPA)*100,100)}%` }} />
                          </div>
                        </div>
                      )}
                      {projecoes.metaTM && (
                        <div className="bg-[var(--bg-subtle)] rounded-xl p-3">
                          <div className="text-[12px] text-[var(--ink-ghost)] mb-1">TM atual vs meta</div>
                          <div className="flex items-end gap-2">
                            <span className="text-[16px] font-medium text-[var(--ink)]">{fmt.currency(projecoes.tm)}</span>
                            <span className="text-[13px] text-[var(--ink-ghost)] mb-0.5">/ {fmt.currency(projecoes.metaTM)}</span>
                          </div>
                          <div className="h-1.5 bg-white rounded-full mt-2 overflow-hidden">
                            <div className={cn('h-full rounded-full', projecoes.tm >= projecoes.metaTM ? 'bg-[var(--success)]' : 'bg-[var(--danger)]')}
                              style={{ width: `${Math.min((projecoes.tm/projecoes.metaTM)*100,100)}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </>
        )}

        {/* ═══════════════ ABA HISTÓRICO ═══════════════ */}
        {aba === 'historico' && (
          <>
            {historico.length === 0 ? (
              <Card>
                <div className="py-10 flex flex-col items-center gap-3 text-center">
                  <Clock className="w-8 h-8 text-[var(--ink-ghost)]" />
                  <div className="text-[13px] font-medium text-[var(--ink)]">Nenhuma análise salva ainda</div>
                  <div className="text-[13px] text-[var(--ink-ghost)]">Gere uma análise e clique em "Salvar análise"</div>
                  <button onClick={() => setAba('analise')}
                    className="text-[13px] text-[var(--acc)] hover:underline">Ir para Análise IA</button>
                </div>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {historico.map((h: any) => (
                  <div key={h.ID} className="bg-white border border-[var(--border)] rounded-xl p-4 hover:border-[var(--acc-border)] transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="text-[12px] font-medium text-[var(--ink)]">{h.PERIODO_LABEL} — {h.NOME_FILIAL}</div>
                        <div className="text-[12px] text-[var(--ink-ghost)] mt-0.5">Gerada em {h.CRIADO_EM} por {h.CRIADO_POR}</div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-[13px] text-[var(--ink-ghost)]">
                        {h.FATURAMENTO && <span>{fmt.currency(h.FATURAMENTO)}</span>}
                        {h.META_PCT && <span className={cn('font-medium', h.META_PCT >= 100 ? 'text-[var(--success)]' : h.META_PCT >= 80 ? 'text-amber-600' : 'text-[var(--danger)]')}>{h.META_PCT?.toFixed(1)}%</span>}
                      </div>
                    </div>
                    <p className="text-[13px] text-[var(--ink-muted)] leading-relaxed line-clamp-2">{h.RESUMO}</p>
                    {h.BLOCOS_JSON && (
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex gap-1.5 flex-wrap">
                          {(JSON.parse(h.BLOCOS_JSON) as InsightBloco[]).slice(0,3).map((b,i) => (
                            <span key={i} className={cn('text-[13px] px-2 py-0.5 rounded-full border font-medium',
                              b.tipo==='alerta'   ? 'bg-red-50 text-[var(--danger)] border-red-200' :
                              b.tipo==='positivo' ? 'bg-green-50 text-[var(--success)] border-green-200' :
                              b.tipo==='sugestao' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-[var(--acc-pale)] text-[var(--acc)] border-[var(--acc-border)]')}>
                              {b.icone} {b.titulo}
                            </span>
                          ))}
                        </div>
                        <button onClick={() => setAnaliseExp(h)}
                          className="text-[12px] text-[var(--acc)] hover:underline shrink-0 ml-2">
                          Ver completo
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      {/* Modal criar PDCA a partir de bloco da IA */}
      {pdcaBloco && (
        <ModalCriarPDCA
          bloco={pdcaBloco}
          filiais={filiaisParam}
          filiaisAcess={filiaisAcess}
          criadoPor={user.email ?? ''}
          onClose={() => setPdcaBloco(null)}
          onSalvo={() => { setPdcaBloco(null); alert('PDCA criado! Acesse o menu PDCA Digital.') }}
        />
      )}

      {/* Modal análise completa do histórico */}
      <Modal
        open={!!analiseExp}
        onClose={() => setAnaliseExp(null)}
        title={analiseExp ? `${analiseExp.PERIODO_LABEL} — ${analiseExp.NOME_FILIAL}` : undefined}
        subtitle={analiseExp ? `Gerada em ${analiseExp.CRIADO_EM} por ${analiseExp.CRIADO_POR}` : undefined}
        size="xl"
      >
        {analiseExp && (
          <div className="flex flex-col gap-4">
            {/* Resumo */}
            <div className="bg-[var(--acc-pale)] rounded-xl p-4 flex items-start gap-3">
              <Brain className="w-5 h-5 text-[var(--acc)] shrink-0 mt-0.5" />
              <div>
                <div className="text-[12px] text-[var(--acc)] font-medium uppercase tracking-wider mb-1">Resumo executivo</div>
                <p className="text-[13px] text-[var(--ink-muted)] leading-relaxed">{analiseExp.RESUMO}</p>
              </div>
            </div>
            {/* Blocos */}
            {analiseExp.BLOCOS_JSON && (
              <div className="flex flex-col gap-2.5">
                {(JSON.parse(analiseExp.BLOCOS_JSON) as InsightBloco[]).map((b, i) => (
                  <div key={i} className={cn('border-l-4 rounded-r-xl px-4 py-3.5', COR[b.tipo] ?? COR.neutro)}>
                    <div className="flex items-start gap-2.5">
                      <span className="text-[18px] shrink-0 mt-0.5">{b.icone}</span>
                      <div className="flex-1">
                        <div className={cn('text-[12px] font-medium mb-1', TITULO_COR[b.tipo] ?? TITULO_COR.neutro)}>{b.titulo}</div>
                        <p className="text-[12px] text-[var(--ink-muted)] leading-relaxed">{b.texto}</p>
                        {b.acao && (
                          <div className="mt-2 flex items-start gap-1.5">
                            <Lightbulb className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                            <span className="text-[13px] text-amber-700 font-medium">{b.acao}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Diário */}
            {analiseExp.DIARIO_ANALISE && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <BookOpen className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[12px] text-amber-600 font-medium uppercase tracking-wider mb-1">Análise do Diário de Ações</div>
                  <p className="text-[12px] text-[var(--ink-muted)] leading-relaxed">{analiseExp.DIARIO_ANALISE}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}
