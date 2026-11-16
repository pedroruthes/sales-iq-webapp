import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Users, Zap, Pause, Play, PhoneCall, CheckCircle2, XCircle,
  Settings, History, LayoutList, Trash2, Clock, TrendingUp,
  AlertTriangle, ChevronDown, UserPlus, LogOut, Search,
} from 'lucide-react'
import axios from 'axios'
import { DashboardLayout } from '@/components/layout'
import { Card, Button, SectionTitle } from '@/components/ui'
import { useContentLoading, useCurrentUser } from '@/hooks/useSession'
import { useFiliais } from '@/hooks/useFiliais'
import { cn, fmt } from '@/lib/utils'

type Aba = 'balcao' | 'painel' | 'historico' | 'config'

type Participante = {
  id: number
  vendedor: string
  nome: string
  posicao: number | null
  status: 'AGUARDANDO' | 'CHAMADA' | 'EM_ATENDIMENTO' | 'AUSENTE' | 'PAUSADA'
  entrouEm: string
  chamadaEm: string | null
  inicioAtendimento: string | null
  tempoEsperaSeg: number
  tempoAtendimentoSeg: number | null
  alertaTempo: boolean
}

type Estado = {
  codigoFilial: string
  atualizadoEm: string
  config: {
    ativo: boolean
    modoRotacao: string
    reentradaAposVenda: string
    tempoLimiteChamadaSeg: number
    tempoMaxAtendimentoMin: number
    exigirCodigoVendaAlta: boolean
    valorMinCodigo: number | null
  }
  fila: Participante[]
  contadoresHoje: {
    atendimentos: number
    tempoMedioEsperaSeg: number
    naFila: number
    emAtendimento: number
    pausadas: number
  }
  ranking: {
    vendedor: string
    nome: string
    vezes: number
    vendas: number
    valor: number
    aproveitamento: number
  }[]
}

type VendedorOpt = { vendedor: string; nome: string; cargo: string; recente?: boolean }

function segundosDesde(iso: string | null | undefined, nowMs: number): number {
  if (!iso) return 0
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return 0
  return Math.max(0, Math.floor((nowMs - t) / 1000))
}
type Evento = {
  id: number
  vendedor: string
  nome: string
  tipoEvento: string
  valorVenda: number | null
  ocorridoEm: string | null
  duracaoEsperaSeg: number | null
  duracaoAtendimentoSeg: number | null
}

const selectChevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")"

function fmtTempo(seg: number) {
  const s = Math.max(0, Math.floor(seg))
  const m = Math.floor(s / 60)
  const r = s % 60
  if (m >= 60) {
    const h = Math.floor(m / 60)
    return `${h}h ${m % 60}m`
  }
  return `${m}:${String(r).padStart(2, '0')}`
}

const LABEL_EVENTO: Record<string, string> = {
  ENTROU_FILA: 'Entrou na fila',
  SAIU_FILA: 'Saiu da fila',
  FOI_CHAMADA: 'Foi chamada',
  CONFIRMOU_ATENDIMENTO: 'Confirmou atendimento',
  VENDEU: 'Vendeu',
  NAO_VENDEU: 'Sem venda',
  PERDEU_VEZ: 'Perdeu a vez',
  PAUSOU: 'Pausou',
  VOLTOU: 'Voltou da pausa',
  REMOVIDA: 'Removida pelo gerente',
}

const STATUS_COR: Record<string, string> = {
  AGUARDANDO: 'bg-slate-100 text-slate-700 border-slate-200',
  CHAMADA: 'bg-amber-100 text-amber-800 border-amber-300',
  EM_ATENDIMENTO: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  PAUSADA: 'bg-violet-100 text-violet-800 border-violet-200',
}

export default function ListaVezPage() {
  const user = useCurrentUser()
  const { data: filiais, isLoading: lFiliais } = useFiliais()
  const [aba, setAba] = useState<Aba>('balcao')
  const [filialSel, setFilialSel] = useState('')
  const [menuFilial, setMenuFilial] = useState(false)
  const [estado, setEstado] = useState<Estado | null>(null)
  const [vendedores, setVendedores] = useState<VendedorOpt[]>([])
  const [historico, setHistorico] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [erro, setErro] = useState('')
  const [msg, setMsg] = useState('')

  // Balcão
  const [vendedorSel, setVendedorSel] = useState('')
  const [vendedorNome, setVendedorNome] = useState('')
  const [buscaVend, setBuscaVend] = useState('')
  const [modoListaVend, setModoListaVend] = useState<'recentes' | 'busca'>('recentes')
  const [modoConcluir, setModoConcluir] = useState<'idle' | 'venda' | null>(null)
  const [valorDigits, setValorDigits] = useState('')
  const [nowMs, setNowMs] = useState(() => Date.now())

  // Config form
  const [cfg, setCfg] = useState({
    ativo: true,
    modoRotacao: 'SEQUENCIAL',
    reentradaAposVenda: 'FIM_DA_FILA',
    tempoLimiteChamadaSeg: 120,
    tempoMaxAtendimentoMin: 30,
    exigirCodigoVendaAlta: false,
    valorMinCodigo: 500,
  })

  const filiaisAcess = (filiais ?? []).filter((f) =>
    user.filiais.map((x) => x.trim()).includes(f.COD_FILIAL.trim())
  )
  const filial = filialSel || filiaisAcess[0]?.COD_FILIAL?.trim() || ''
  const nomeFilial =
    filiaisAcess.find((f) => f.COD_FILIAL.trim() === filial)?.FILIAL ?? filial

  const isGerente =
    user.isAdmin || user.isDono || user.isGerenteLoja || user.isSupervisora || user.isProprietario

  const euNaFila = useMemo(() => {
    if (!estado || !vendedorSel) return null
    return estado.fila.find((p) => p.vendedor === vendedorSel) ?? null
  }, [estado, vendedorSel])

  const chamada = estado?.fila.find((p) => p.status === 'CHAMADA') ?? null
  const emAtend = estado?.fila.filter((p) => p.status === 'EM_ATENDIMENTO') ?? []
  const aguardando = estado?.fila.filter((p) => p.status === 'AGUARDANDO') ?? []
  const pausadas = estado?.fila.filter((p) => p.status === 'PAUSADA') ?? []

  const countdownChamada = useMemo(() => {
    if (!chamada?.chamadaEm || !estado?.config) return null
    const limite = estado.config.tempoLimiteChamadaSeg
    const elapsed = segundosDesde(chamada.chamadaEm, nowMs)
    return Math.max(0, limite - elapsed)
  }, [chamada, estado?.config, nowMs])

  const carregarEstado = useCallback(async () => {
    if (!filial) return
    try {
      const { data } = await axios.get(`/api/fila-vez/${encodeURIComponent(filial)}/estado`)
      setEstado(data.data)
      if (data.data?.config) {
        const c = data.data.config
        setCfg({
          ativo: !!c.ativo,
          modoRotacao: c.modoRotacao || 'SEQUENCIAL',
          reentradaAposVenda: c.reentradaAposVenda || 'FIM_DA_FILA',
          tempoLimiteChamadaSeg: c.tempoLimiteChamadaSeg ?? 120,
          tempoMaxAtendimentoMin: c.tempoMaxAtendimentoMin ?? 30,
          exigirCodigoVendaAlta: !!c.exigirCodigoVendaAlta,
          valorMinCodigo: c.valorMinCodigo ?? 500,
        })
      }
      setErro('')
    } catch (e: unknown) {
      setErro(axios.isAxiosError(e) ? (e.response?.data?.error ?? e.message) : 'Erro ao carregar fila')
    }
  }, [filial])

  const carregarVendedores = useCallback(async (busca = '') => {
    if (!filial) return
    try {
      const { data } = await axios.get(`/api/fila-vez/${encodeURIComponent(filial)}/vendedores`, {
        params: busca.trim().length >= 2 ? { busca: busca.trim() } : {},
      })
      setVendedores(data.data ?? [])
      setModoListaVend(data.modo === 'busca' ? 'busca' : 'recentes')
    } catch {
      setVendedores([])
    }
  }, [filial])

  const carregarHistorico = useCallback(async () => {
    if (!filial) return
    try {
      const { data } = await axios.get(`/api/fila-vez/${encodeURIComponent(filial)}/historico`)
      setHistorico(data.data ?? [])
    } catch {
      setHistorico([])
    }
  }, [filial])

  useEffect(() => {
    if (!filialSel && filiaisAcess[0]) setFilialSel(filiaisAcess[0].COD_FILIAL.trim())
  }, [filiaisAcess, filialSel])

  useEffect(() => {
    if (!filial) return
    setLoading(true)
    setBuscaVend('')
    Promise.all([carregarEstado(), carregarVendedores('')])
      .finally(() => setLoading(false))
  }, [filial, carregarEstado, carregarVendedores])

  // Debounce busca de vendedoras
  useEffect(() => {
    if (!filial) return
    const t = setTimeout(() => {
      void carregarVendedores(buscaVend)
    }, buscaVend.trim().length >= 2 ? 250 : 0)
    return () => clearTimeout(t)
  }, [buscaVend, filial, carregarVendedores])

  useEffect(() => {
    if (aba === 'historico') void carregarHistorico()
  }, [aba, carregarHistorico])

  // Polling
  useEffect(() => {
    if (!filial) return
    const ms = aba === 'balcao' ? 2000 : 5000
    const id = setInterval(() => { void carregarEstado() }, ms)
    return () => clearInterval(id)
  }, [filial, aba, carregarEstado])

  // Tick 1s para cronômetros (espera / atendimento / countdown)
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const operar = async (acao: string, extra: Record<string, unknown> = {}) => {
    if (!filial) return
    setBusy(true)
    setErro('')
    try {
      const { data } = await axios.post(`/api/fila-vez/${encodeURIComponent(filial)}/operar`, {
        acao,
        ...extra,
      })
      if (data.data) setEstado(data.data)
      else await carregarEstado()
      setMsg('Ok')
      setTimeout(() => setMsg(''), 1500)
      if (aba === 'historico') void carregarHistorico()
    } catch (e: unknown) {
      setErro(axios.isAxiosError(e) ? (e.response?.data?.error ?? e.message) : 'Erro na operação')
    } finally {
      setBusy(false)
    }
  }

  const salvarConfig = async () => {
    if (!filial) return
    setBusy(true)
    try {
      await axios.put(`/api/fila-vez/${encodeURIComponent(filial)}/config`, cfg)
      setMsg('Configuração salva')
      setTimeout(() => setMsg(''), 2000)
      await carregarEstado()
    } catch (e: unknown) {
      setErro(axios.isAxiosError(e) ? (e.response?.data?.error ?? e.message) : 'Erro ao salvar')
    } finally {
      setBusy(false)
    }
  }

  const valorNumerico = Number(valorDigits.replace(',', '.')) || 0

  const pageLoading = useContentLoading({
    filiaisLoading: lFiliais,
    filiaisQuery: user.filiais,
    waiting: filial ? [loading] : [],
  })

  const abas: { id: Aba; label: string; icon: typeof Users }[] = [
    { id: 'balcao', label: 'Balcão', icon: Zap },
    { id: 'painel', label: 'Painel', icon: LayoutList },
    { id: 'historico', label: 'Histórico', icon: History },
    ...(isGerente ? [{ id: 'config' as Aba, label: 'Configuração', icon: Settings }] : []),
  ]

  return (
    <DashboardLayout
      titulo="Lista da Vez"
      subtitulo="Fila de atendimento por ordem de chegada"
      loading={pageLoading}
      actions={
        <>
          {filiaisAcess.length > 1 && (
            <div className="relative">
              <button type="button" onClick={() => setMenuFilial(!menuFilial)} className="filter-trigger">
                <span className="max-w-[140px] truncate">{nomeFilial}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {menuFilial && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuFilial(false)} />
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-[var(--border)] rounded-xl py-1 shadow-lg z-20 max-h-60 overflow-y-auto">
                    {filiaisAcess.map((f) => (
                      <button
                        key={f.COD_FILIAL}
                        type="button"
                        onClick={() => {
                          setFilialSel(f.COD_FILIAL.trim())
                          setMenuFilial(false)
                          setVendedorSel('')
                        }}
                        className={cn(
                          'w-full px-3 py-2 text-[13px] text-left',
                          filial === f.COD_FILIAL.trim()
                            ? 'bg-[var(--acc-pale)] text-[var(--acc)]'
                            : 'hover:bg-[var(--bg-subtle)] text-[var(--ink-muted)]'
                        )}
                      >
                        {f.FILIAL}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {msg && <span className="text-[12px] text-[var(--success)]">{msg}</span>}
        </>
      }
    >
      {!filial ? (
        <Card>
          <div className="py-12 text-center text-[13px] text-[var(--ink-ghost)]">
            Selecione uma loja para operar a Lista da Vez.
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Abas */}
          <div className="flex gap-1 p-1 bg-[var(--bg-subtle)] rounded-xl w-fit flex-wrap">
            {abas.map((a) => {
              const Icon = a.icon
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAba(a.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors',
                    aba === a.id
                      ? 'bg-white text-[var(--acc)] shadow-sm'
                      : 'text-[var(--ink-ghost)] hover:text-[var(--ink)]'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {a.label}
                </button>
              )
            })}
          </div>

          {erro && (
            <div className="text-[13px] text-[var(--danger)] bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {erro}
            </div>
          )}

          {!estado?.config?.ativo && aba !== 'config' && (
            <div className="text-[13px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              Lista da Vez desativada nesta loja. Ative em Configuração.
            </div>
          )}

          {/* ─── BALCÃO ─── */}
          {aba === 'balcao' && (
            <div className="flex flex-col gap-4 max-w-xl mx-auto w-full">
              {/* Seletor: recentes + busca por nome */}
              <Card padding="sm">
                <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">
                  Quem está operando
                </label>
                {vendedorSel ? (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-14 px-4 rounded-xl bg-[var(--acc-pale)] border border-[var(--acc-border)] flex items-center text-[16px] font-medium text-[var(--acc)]">
                      {vendedorNome || vendedorSel}
                    </div>
                    <Button
                      variant="secondary"
                      size="lg"
                      className="!h-14"
                      onClick={() => {
                        setVendedorSel('')
                        setVendedorNome('')
                        setModoConcluir(null)
                        setValorDigits('')
                      }}
                    >
                      Trocar
                    </Button>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-col gap-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-ghost)]" />
                      <input
                        value={buscaVend}
                        onChange={(e) => setBuscaVend(e.target.value)}
                        placeholder="Buscar por nome…"
                        className="input-base !h-12 !pl-10 text-[15px]"
                        autoComplete="off"
                      />
                    </div>
                    <div className="text-[11px] text-[var(--ink-ghost)] px-0.5">
                      {modoListaVend === 'busca'
                        ? 'Resultados da busca'
                        : 'Vendedoras recentes (digite o nome para buscar outras)'}
                    </div>
                    <div className="max-h-56 overflow-y-auto rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
                      {!vendedores.length ? (
                        <div className="px-3 py-6 text-center text-[13px] text-[var(--ink-ghost)]">
                          {buscaVend.trim().length >= 2
                            ? 'Nenhuma vendedora encontrada'
                            : 'Nenhuma recente — busque pelo nome'}
                        </div>
                      ) : (
                        vendedores.map((v) => (
                          <button
                            key={v.vendedor}
                            type="button"
                            onClick={() => {
                              setVendedorSel(v.vendedor)
                              setVendedorNome(v.nome)
                              setBuscaVend('')
                              setModoConcluir(null)
                              setValorDigits('')
                            }}
                            className="w-full text-left px-3.5 py-3.5 hover:bg-[var(--bg-subtle)] flex items-center gap-3 min-h-[56px]"
                          >
                            <div className="w-9 h-9 rounded-full bg-[var(--acc-pale)] text-[var(--acc)] flex items-center justify-center text-[13px] font-bold shrink-0">
                              {(v.nome || '?').slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[14px] font-medium text-[var(--ink)] truncate">{v.nome}</div>
                              <div className="text-[11px] text-[var(--ink-ghost)]">{v.vendedor}{v.cargo ? ` · ${v.cargo}` : ''}</div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </Card>

              {/* Estado chamado (qualquer um — alerta em destaque) */}
              {chamada && (
                <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-6 text-center animate-pulse">
                  <div className="text-[12px] font-semibold uppercase tracking-wider text-amber-700 mb-1">
                    Vez chamada
                  </div>
                  <div className="text-[28px] font-bold text-amber-900">{chamada.nome}</div>
                  {countdownChamada != null && (
                    <div className="text-[18px] font-mono text-amber-700 mt-2">
                      {fmtTempo(countdownChamada)} restantes
                    </div>
                  )}
                  {vendedorSel === chamada.vendedor && (
                    <Button
                      variant="primary"
                      size="lg"
                      className="mt-4 !h-14 !text-[16px] w-full bg-amber-500 hover:bg-amber-600"
                      disabled={busy}
                      loading={busy}
                      onClick={() => void operar('confirmar', { vendedor: vendedorSel })}
                    >
                      <CheckCircle2 className="w-5 h-5" /> Confirmar atendimento
                    </Button>
                  )}
                </div>
              )}

              {/* Fluxo da vendedora selecionada */}
              {!vendedorSel ? (
                <Card>
                  <div className="py-10 text-center text-[14px] text-[var(--ink-ghost)]">
                    Selecione seu nome para entrar na fila ou operar a vez.
                  </div>
                </Card>
              ) : !euNaFila ? (
                <Card padding="sm">
                  <div className="py-6 flex flex-col items-center gap-4">
                    <Users className="w-10 h-10 text-[var(--acc)] opacity-60" />
                    <div className="text-[16px] font-medium text-[var(--ink)] text-center">
                      {vendedorNome || vendedores.find((v) => v.vendedor === vendedorSel)?.nome || vendedorSel}
                    </div>
                    <div className="text-[13px] text-[var(--ink-ghost)]">Você está fora da fila</div>
                    <Button
                      variant="primary"
                      size="lg"
                      className="!h-16 !text-[17px] w-full max-w-sm"
                      disabled={busy || !estado?.config?.ativo}
                      loading={busy}
                      onClick={() => void operar('entrar', { vendedor: vendedorSel })}
                    >
                      <UserPlus className="w-5 h-5" /> Entrar na fila
                    </Button>
                  </div>
                </Card>
              ) : euNaFila.status === 'AGUARDANDO' ? (
                <Card padding="sm">
                  <div className="py-4 flex flex-col items-center gap-3">
                    <div className="text-[12px] uppercase tracking-wider text-[var(--ink-ghost)]">Sua posição</div>
                    <div className="text-[64px] font-bold text-[var(--acc)] leading-none">
                      {euNaFila.posicao ?? '—'}
                    </div>
                    <div className="text-[14px] text-[var(--ink-muted)]">
                      Esperando há {fmtTempo(segundosDesde(euNaFila.entrouEm, nowMs))}
                    </div>
                    <div className="flex gap-2 w-full max-w-sm mt-2">
                      <Button
                        variant="secondary"
                        size="lg"
                        className="!h-14 flex-1"
                        disabled={busy}
                        onClick={() => void operar('pausar', { vendedor: vendedorSel })}
                      >
                        <Pause className="w-4 h-4" /> Pausar
                      </Button>
                      <Button
                        variant="secondary"
                        size="lg"
                        className="!h-14 flex-1"
                        disabled={busy}
                        onClick={() => void operar('sair', { vendedor: vendedorSel })}
                      >
                        <LogOut className="w-4 h-4" /> Sair
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : euNaFila.status === 'PAUSADA' ? (
                <Card padding="sm">
                  <div className="py-6 flex flex-col items-center gap-4">
                    <Pause className="w-10 h-10 text-violet-500" />
                    <div className="text-[16px] font-medium">Em pausa</div>
                    <Button
                      variant="primary"
                      size="lg"
                      className="!h-14 w-full max-w-sm"
                      disabled={busy}
                      loading={busy}
                      onClick={() => void operar('voltar', { vendedor: vendedorSel })}
                    >
                      <Play className="w-5 h-5" /> Voltar à fila
                    </Button>
                  </div>
                </Card>
              ) : euNaFila.status === 'EM_ATENDIMENTO' ? (
                <Card padding="sm">
                  <div className="py-4 flex flex-col items-center gap-3">
                    <div className="text-[12px] uppercase tracking-wider text-emerald-700">Em atendimento</div>
                    <div className="text-[40px] font-mono font-bold text-emerald-700">
                      {fmtTempo(
                        euNaFila.inicioAtendimento
                          ? segundosDesde(euNaFila.inicioAtendimento, nowMs)
                          : (euNaFila.tempoAtendimentoSeg ?? 0)
                      )}
                    </div>
                    {euNaFila.alertaTempo && (
                      <div className="text-[13px] text-amber-700 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" /> Acima do tempo máximo
                      </div>
                    )}

                    {modoConcluir === 'venda' ? (
                      <div className="w-full max-w-sm mt-2">
                        <div className="text-[13px] text-[var(--ink-ghost)] mb-2 text-center">Valor da venda (R$)</div>
                        <div className="text-[32px] font-mono font-bold text-center mb-3 tabular-nums">
                          {valorDigits || '0'}
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {['1','2','3','4','5','6','7','8','9',',','0','⌫'].map((k) => (
                            <button
                              key={k}
                              type="button"
                              className="h-14 rounded-xl bg-[var(--bg-subtle)] text-[18px] font-medium hover:bg-[var(--border)] active:scale-95 transition"
                              onClick={() => {
                                if (k === '⌫') setValorDigits((d) => d.slice(0, -1))
                                else if (k === ',' && valorDigits.includes(',')) return
                                else setValorDigits((d) => (d + k).slice(0, 10))
                              }}
                            >
                              {k}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="secondary" size="lg" className="!h-14 flex-1" onClick={() => { setModoConcluir(null); setValorDigits('') }}>
                            Cancelar
                          </Button>
                          <Button
                            variant="primary"
                            size="lg"
                            className="!h-14 flex-1 bg-emerald-600"
                            disabled={busy || valorNumerico <= 0}
                            loading={busy}
                            onClick={async () => {
                              await operar('concluir', {
                                vendedor: vendedorSel,
                                vendeu: true,
                                valorVenda: valorNumerico,
                              })
                              setModoConcluir(null)
                              setValorDigits('')
                            }}
                          >
                            Confirmar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 w-full max-w-sm mt-2">
                        <Button
                          variant="primary"
                          size="lg"
                          className="!h-14 !text-[16px] bg-emerald-600"
                          disabled={busy}
                          onClick={() => setModoConcluir('venda')}
                        >
                          <CheckCircle2 className="w-5 h-5" /> Concluir com venda
                        </Button>
                        <Button
                          variant="secondary"
                          size="lg"
                          className="!h-14"
                          disabled={busy}
                          loading={busy}
                          onClick={() => void operar('concluir', { vendedor: vendedorSel, vendeu: false })}
                        >
                          <XCircle className="w-5 h-5" /> Concluir sem venda
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ) : null}

              {/* Mini fila */}
              {aguardando.length > 0 && (
                <Card padding="sm">
                  <SectionTitle label="Fila atual" icon={Users} className="mb-3" />
                  <div className="flex flex-col gap-1.5">
                    {aguardando.slice(0, 8).map((p) => (
                      <div key={p.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[var(--bg-subtle)]">
                        <span className="w-7 h-7 rounded-full bg-[var(--acc-pale)] text-[var(--acc)] text-[13px] font-bold flex items-center justify-center">
                          {p.posicao}
                        </span>
                        <span className="flex-1 text-[13px] text-[var(--ink)] truncate">{p.nome}</span>
                        <span className="text-[12px] text-[var(--ink-ghost)]">{fmtTempo(segundosDesde(p.entrouEm, nowMs) || p.tempoEsperaSeg)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ─── PAINEL ─── */}
          {aba === 'painel' && (
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Na fila', value: estado?.contadoresHoje.naFila ?? 0 },
                    { label: 'Em atendimento', value: estado?.contadoresHoje.emAtendimento ?? 0 },
                    { label: 'Atendimentos hoje', value: estado?.contadoresHoje.atendimentos ?? 0 },
                    { label: 'Espera média', value: fmtTempo(estado?.contadoresHoje.tempoMedioEsperaSeg ?? 0) },
                  ].map((k) => (
                    <div key={k.label} className="bg-[var(--bg-subtle)] rounded-xl p-3 text-center">
                      <div className="text-[12px] text-[var(--ink-ghost)] mb-1">{k.label}</div>
                      <div className="text-[18px] font-medium text-[var(--ink)]">{k.value}</div>
                    </div>
                  ))}
                </div>

                <Card padding="sm">
                  <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                    <SectionTitle label="Fila ao vivo" icon={LayoutList} className="mb-0" />
                    {isGerente && (
                      <Button
                        variant="primary"
                        size="md"
                        disabled={busy || !aguardando.length || !!chamada}
                        loading={busy}
                        onClick={() => void operar('chamar-proxima')}
                      >
                        <PhoneCall className="w-3.5 h-3.5" /> Chamar próxima
                      </Button>
                    )}
                  </div>

                  {chamada && (
                    <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[11px] uppercase text-amber-700 font-medium">Chamada</div>
                        <div className="text-[15px] font-medium text-amber-900">{chamada.nome}</div>
                      </div>
                      {countdownChamada != null && (
                        <div className="font-mono text-amber-800">{fmtTempo(countdownChamada)}</div>
                      )}
                    </div>
                  )}

                  {emAtend.map((p) => (
                    <div
                      key={p.id}
                      className={cn(
                        'mb-2 p-3 rounded-xl border flex items-center justify-between gap-2',
                        p.alertaTempo ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'
                      )}
                    >
                      <div>
                        <div className="text-[11px] uppercase font-medium text-emerald-700">Em atendimento</div>
                        <div className="text-[14px] font-medium">{p.nome}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[13px]">
                          {fmtTempo(
                            p.inicioAtendimento
                              ? segundosDesde(p.inicioAtendimento, nowMs)
                              : (p.tempoAtendimentoSeg ?? 0)
                          )}
                        </span>
                        {isGerente && (
                          <button
                            type="button"
                            title="Remover"
                            className="text-[var(--ink-ghost)] hover:text-[var(--danger)]"
                            onClick={() => {
                              if (confirm(`Remover ${p.nome} da fila?`)) void operar('remover', { vendedor: p.vendedor })
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="flex flex-col gap-1">
                    {aguardando.length === 0 && !chamada && emAtend.length === 0 && (
                      <div className="py-8 text-center text-[13px] text-[var(--ink-ghost)]">Fila vazia</div>
                    )}
                    {aguardando.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-[var(--bg-subtle)]">
                        <span className="w-8 h-8 rounded-full bg-[var(--acc-pale)] text-[var(--acc)] text-[14px] font-bold flex items-center justify-center">
                          {p.posicao}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-[var(--ink)] truncate">{p.nome}</div>
                          <div className="text-[11px] text-[var(--ink-ghost)] flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {fmtTempo(segundosDesde(p.entrouEm, nowMs) || p.tempoEsperaSeg)}
                          </div>
                        </div>
                        <span className={cn('text-[11px] px-2 py-0.5 rounded-full border', STATUS_COR[p.status])}>
                          {p.status}
                        </span>
                        {isGerente && (
                          <button
                            type="button"
                            className="text-[var(--ink-ghost)] hover:text-[var(--danger)]"
                            onClick={() => {
                              if (confirm(`Remover ${p.nome} da fila?`)) void operar('remover', { vendedor: p.vendedor })
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {pausadas.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[var(--border)]">
                      <div className="text-[12px] text-[var(--ink-ghost)] mb-2">Em pausa</div>
                      {pausadas.map((p) => (
                        <div key={p.id} className="flex items-center justify-between py-1.5 text-[13px]">
                          <span>{p.nome}</span>
                          <span className={cn('text-[11px] px-2 py-0.5 rounded-full border', STATUS_COR.PAUSADA)}>PAUSADA</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              <Card padding="sm">
                <SectionTitle label="Aproveitamento da vez (hoje)" icon={TrendingUp} className="mb-3" />
                {!estado?.ranking?.length ? (
                  <div className="py-8 text-center text-[13px] text-[var(--ink-ghost)]">Sem atendimentos hoje</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {estado.ranking.map((r, i) => (
                      <div key={r.vendedor} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-subtle)]">
                        <span className="w-6 text-[13px] font-bold text-[var(--ink-ghost)]">{i + 1}º</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium truncate">{r.nome}</div>
                          <div className="text-[11px] text-[var(--ink-ghost)]">
                            {r.vendas}/{r.vezes} vendas · {fmt.currency(r.valor)}
                          </div>
                        </div>
                        <div className={cn(
                          'text-[14px] font-bold',
                          r.aproveitamento >= 60 ? 'text-[var(--success)]' : r.aproveitamento >= 40 ? 'text-amber-600' : 'text-[var(--danger)]'
                        )}>
                          {r.aproveitamento.toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 text-[12px] text-[var(--ink-ghost)] leading-relaxed">
                  Regra: {estado?.config.modoRotacao === 'PONDERADO_SCORE' ? 'Ponderado por score' : 'Sequencial'} ·
                  Reentrada: {estado?.config.reentradaAposVenda === 'MESMA_POSICAO' ? 'mesma posição' : 'fim da fila'}
                </div>
              </Card>
            </div>
          )}

          {/* ─── HISTÓRICO ─── */}
          {aba === 'historico' && (
            <Card padding="sm">
              <SectionTitle label="Eventos de hoje" icon={History} className="mb-3" />
              {!historico.length ? (
                <div className="py-10 text-center text-[13px] text-[var(--ink-ghost)]">Nenhum evento hoje</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="text-left text-[12px] text-[var(--ink-ghost)] border-b border-[var(--border)]">
                        <th className="py-2 pr-3 font-medium">Hora</th>
                        <th className="py-2 pr-3 font-medium">Vendedora</th>
                        <th className="py-2 pr-3 font-medium">Evento</th>
                        <th className="py-2 pr-3 font-medium text-right">Valor</th>
                        <th className="py-2 font-medium text-right">Durações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historico.map((e) => (
                        <tr key={e.id} className="border-b border-[var(--border)] last:border-0">
                          <td className="py-2.5 pr-3 text-[var(--ink-ghost)] whitespace-nowrap">
                            {e.ocorridoEm ? new Date(e.ocorridoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                          </td>
                          <td className="py-2.5 pr-3 font-medium">{e.nome}</td>
                          <td className="py-2.5 pr-3">
                            {LABEL_EVENTO[e.tipoEvento] ?? (e.tipoEvento && e.tipoEvento !== 'undefined' ? e.tipoEvento : '—')}
                          </td>
                          <td className="py-2.5 pr-3 text-right">
                            {e.valorVenda != null ? fmt.currency(e.valorVenda) : '—'}
                          </td>
                          <td className="py-2.5 text-right text-[var(--ink-ghost)]">
                            {e.duracaoEsperaSeg != null && `esp ${fmtTempo(e.duracaoEsperaSeg)}`}
                            {e.duracaoAtendimentoSeg != null && ` · atd ${fmtTempo(e.duracaoAtendimentoSeg)}`}
                            {e.duracaoEsperaSeg == null && e.duracaoAtendimentoSeg == null && '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* ─── CONFIG ─── */}
          {aba === 'config' && isGerente && (
            <Card padding="sm" className="max-w-xl">
              <SectionTitle label={`Configuração — ${nomeFilial}`} icon={Settings} className="mb-4" />
              <div className="flex flex-col gap-4">
                <label className="flex items-center justify-between gap-3">
                  <span className="text-[13px] text-[var(--ink)]">Módulo ativo nesta loja</span>
                  <input
                    type="checkbox"
                    checked={cfg.ativo}
                    onChange={(e) => setCfg((c) => ({ ...c, ativo: e.target.checked }))}
                    className="w-5 h-5"
                  />
                </label>

                <div>
                  <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">Modo de rotação</label>
                  <select
                    value={cfg.modoRotacao}
                    onChange={(e) => setCfg((c) => ({ ...c, modoRotacao: e.target.value }))}
                    style={{ backgroundImage: selectChevron }}
                    className="select-base mt-1"
                  >
                    <option value="SEQUENCIAL">Sequencial (ordem de chegada)</option>
                    <option value="PONDERADO_SCORE">Ponderado por score (opcional)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">Reentrada após atendimento</label>
                  <select
                    value={cfg.reentradaAposVenda}
                    onChange={(e) => setCfg((c) => ({ ...c, reentradaAposVenda: e.target.value }))}
                    style={{ backgroundImage: selectChevron }}
                    className="select-base mt-1"
                  >
                    <option value="FIM_DA_FILA">Fim da fila</option>
                    <option value="MESMA_POSICAO">Mesma posição</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">
                      Limite para confirmar (seg)
                    </label>
                    <input
                      type="number"
                      min={15}
                      max={600}
                      value={cfg.tempoLimiteChamadaSeg}
                      onChange={(e) => setCfg((c) => ({ ...c, tempoLimiteChamadaSeg: Number(e.target.value) || 120 }))}
                      className="input-base mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">
                      Alerta atendimento (min)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={120}
                      value={cfg.tempoMaxAtendimentoMin}
                      onChange={(e) => setCfg((c) => ({ ...c, tempoMaxAtendimentoMin: Number(e.target.value) || 30 }))}
                      className="input-base mt-1"
                    />
                  </div>
                </div>

                <label className="flex items-center justify-between gap-3">
                  <span className="text-[13px] text-[var(--ink)]">Exigir código em venda alta</span>
                  <input
                    type="checkbox"
                    checked={cfg.exigirCodigoVendaAlta}
                    onChange={(e) => setCfg((c) => ({ ...c, exigirCodigoVendaAlta: e.target.checked }))}
                    className="w-5 h-5"
                  />
                </label>

                {cfg.exigirCodigoVendaAlta && (
                  <div>
                    <label className="text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">
                      Valor mínimo (R$)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={cfg.valorMinCodigo}
                      onChange={(e) => setCfg((c) => ({ ...c, valorMinCodigo: Number(e.target.value) || 0 }))}
                      className="input-base mt-1"
                    />
                  </div>
                )}

                <Button variant="primary" size="lg" disabled={busy} loading={busy} onClick={() => void salvarConfig()}>
                  Salvar configuração
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}
