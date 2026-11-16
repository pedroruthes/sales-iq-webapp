import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, Eye, RefreshCw, RotateCcw, Search, Send, Users } from 'lucide-react'
import axios from 'axios'
import { DashboardLayout } from '@/components/layout'
import { Button, Card, Modal } from '@/components/ui'
import { AdminToast } from '@/components/admin/AdminToast'
import { AdminTableFooter, pageItems } from '@/components/admin/AdminTableFooter'
import { RowActionsMenu } from '@/components/admin/RowActionsMenu'
import { StatusDotBadge } from '@/components/admin/StatusDotBadge'
import { useCurrentUser } from '@/hooks/useSession'
import type { LojaSaude, TabelaStatusAgente } from '@/lib/sync/agent-status'

type Saude = 'ok' | 'sincronizando' | 'atencao' | 'erro' | 'offline' | 'sem_relatorio' | 'inativa'
type Variant = 'success' | 'neutral' | 'danger' | 'warn' | 'info'

const SAUDE: Record<Saude, { label: string; variant: Variant }> = {
  ok: { label: 'Ok', variant: 'success' },
  sincronizando: { label: 'Leitura completa', variant: 'info' },
  atencao: { label: 'Atenção', variant: 'warn' },
  erro: { label: 'Erro', variant: 'danger' },
  offline: { label: 'Offline', variant: 'danger' },
  sem_relatorio: { label: 'Sem relatório', variant: 'neutral' },
  inativa: { label: 'Inativa', variant: 'neutral' },
}

const TABELA_STATUS: Record<string, { label: string; variant: Variant }> = {
  OK: { label: 'Ok', variant: 'success' },
  PARCIAL: { label: 'Parcial', variant: 'warn' },
  ERROR: { label: 'Erro', variant: 'danger' },
}

const selectChevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")"

// Sem relatório por 3 intervalos (mínimo 1h) = agente parado, máquina desligada ou sem internet
function minutosOffline(l: LojaSaude) {
  return Math.max(60, (l.intervalo_min || l.frequencia_min || 15) * 3)
}

function saudeDaLoja(l: LojaSaude, agora: number): Saude {
  if (!l.ativo) return 'inativa'
  if (!l.reportado_em) return 'sem_relatorio'
  if (agora - new Date(l.reportado_em).getTime() > minutosOffline(l) * 60000) return 'offline'
  if (l.info?.api_online === false || l.info?.erro_ciclo || l.tabelas.some((t) => t.status === 'ERROR')) return 'erro'
  if (
    l.tabelas.some((t) => t.status === 'PARCIAL') ||
    (l.dead_letter?.registros ?? 0) > 0 ||
    l.resets_pendentes.length > 0
  ) return 'atencao'
  if (l.tabelas.some((t) => t.leitura_completa)) return 'sincronizando'
  return 'ok'
}

function relativo(iso: string | null | undefined, agora: number) {
  if (!iso) return 'nunca'
  const min = Math.round((agora - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.round(min / 60)
  if (h < 48) return `há ${h} h`
  return `há ${Math.round(h / 24)} dias`
}

function dataHora(iso: string | null | undefined) {
  return iso ? new Date(iso).toLocaleString('pt-BR') : '—'
}

function resumoTexto(r: TabelaStatusAgente['ultimo_resumo']) {
  if (!r) return '—'
  const partes = [`${r.lidos ?? 0} lidos`, `${r.enviados ?? 0} enviados`]
  if (r.erros) partes.push(`${r.erros} recusados`)
  return partes.join(' · ')
}

export default function SincronizacaoPage() {
  const user = useCurrentUser()
  const [lojas, setLojas] = useState<LojaSaude[]>([])
  const [agora, setAgora] = useState(Date.now())
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroSaude, setFiltroSaude] = useState<'todas' | 'problemas' | Saude>('todas')
  const [filtroGrupo, setFiltroGrupo] = useState<number | 'todos'>('todos')
  const [pagina, setPagina] = useState(1)
  const [detalhe, setDetalhe] = useState<LojaSaude | null>(null)
  const [executando, setExecutando] = useState<string | null>(null)

  const [toast, setToast] = useState({ msg: '', tipo: 'ok' as 'ok' | 'err' })
  const showToast = (msg: string, tipo: 'ok' | 'err' = 'ok') => {
    setToast({ msg, tipo })
    setTimeout(() => setToast({ msg: '', tipo: 'ok' }), 3200)
  }

  const carregar = useCallback(async () => {
    try {
      const r = await axios.get('/api/admin/sync-saude')
      setLojas(r.data.data ?? [])
      setAgora(r.data.agora ? new Date(r.data.agora).getTime() : Date.now())
    } catch {
      showToast('Erro ao carregar o status das lojas', 'err')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregar()
    const id = setInterval(carregar, 60000)
    return () => clearInterval(id)
  }, [carregar])

  // Mantém o modal de detalhe com os dados da última atualização
  useEffect(() => {
    if (!detalhe) return
    const atual = lojas.find((l) => l.tenant_id === detalhe.tenant_id && l.filial_cod === detalhe.filial_cod)
    if (atual && atual !== detalhe) setDetalhe(atual)
  }, [lojas, detalhe])

  const comSaude = useMemo(() => lojas.map((l) => ({ ...l, saude: saudeDaLoja(l, agora) })), [lojas, agora])

  const grupos = useMemo(() => {
    const m = new Map<number, string>()
    for (const l of lojas) m.set(l.tenant_id, l.tenant_nome ?? `Grupo ${l.tenant_id}`)
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [lojas])

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    const problemas: Saude[] = ['erro', 'offline', 'atencao']
    return comSaude.filter((l) => {
      if (filtroGrupo !== 'todos' && l.tenant_id !== filtroGrupo) return false
      if (filtroSaude === 'problemas' && !problemas.includes(l.saude)) return false
      if (filtroSaude !== 'todas' && filtroSaude !== 'problemas' && l.saude !== filtroSaude) return false
      if (!q) return true
      return (
        l.filial_cod.toLowerCase().includes(q) ||
        (l.filial_nome ?? '').toLowerCase().includes(q) ||
        (l.tenant_nome ?? '').toLowerCase().includes(q)
      )
    })
  }, [comSaude, busca, filtroSaude, filtroGrupo])

  useEffect(() => setPagina(1), [busca, filtroSaude, filtroGrupo])

  const kpis = useMemo(() => {
    const conta = (...s: Saude[]) => comSaude.filter((l) => s.includes(l.saude)).length
    return {
      ok: conta('ok', 'sincronizando'),
      atencao: conta('atencao'),
      erro: conta('erro'),
      offline: conta('offline', 'sem_relatorio'),
    }
  }, [comSaude])

  const acao = async (
    chave: string,
    payload: Record<string, unknown>,
    confirmacao: string
  ) => {
    if (!window.confirm(confirmacao)) return
    setExecutando(chave)
    try {
      const r = await axios.post('/api/admin/sync-saude', payload)
      showToast(`${r.data.message}. O agente aplica em até ~20 min.`)
      carregar()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      showToast(err?.response?.data?.error ?? 'Falha na operação', 'err')
    } finally {
      setExecutando(null)
    }
  }

  const forcarPeriodo = (l: LojaSaude) => {
    const dataInicio = window.prompt('Data início (AAAA-MM-DD)', new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10))
    if (!dataInicio) return
    const dataFim = window.prompt('Data fim (AAAA-MM-DD)', new Date().toISOString().slice(0, 10))
    if (!dataFim) return
    if (dataInicio > dataFim) {
      showToast('Data início deve ser <= data fim', 'err')
      return
    }
    return acao(
      `forcar-periodo:${l.tenant_id}:${l.filial_cod}`,
      { action: 'forcar', tenantId: l.tenant_id, filialCod: l.filial_cod, dataInicio, dataFim },
      `Reenviar vendas/movimentos de ${dataInicio} a ${dataFim} na loja ${l.filial_cod}?`
    )
  }

  const forcarLoja = (l: LojaSaude, tabela?: string) =>
    acao(
      `forcar:${l.tenant_id}:${l.filial_cod}:${tabela ?? '*'}`,
      { action: 'forcar', tenantId: l.tenant_id, filialCod: l.filial_cod, tabela },
      tabela
        ? `Reler ${tabela} do zero na loja ${l.filial_nome ?? l.filial_cod}?`
        : `Reler TODAS as tabelas do zero na loja ${l.filial_nome ?? l.filial_cod}? Pode levar horas em lojas grandes.`
    )

  const forcarGrupo = (l: LojaSaude, tabela: string) =>
    acao(
      `grupo:${l.tenant_id}:${tabela}`,
      { action: 'forcar_grupo', tenantId: l.tenant_id, tabela },
      `Reler ${tabela} do zero em TODAS as lojas do grupo ${l.tenant_nome ?? l.tenant_id}?`
    )

  const reenviar = (l: LojaSaude) =>
    acao(
      `reenviar:${l.tenant_id}:${l.filial_cod}`,
      { action: 'reenviar', tenantId: l.tenant_id, filialCod: l.filial_cod },
      `Reenviar os ${l.dead_letter?.registros ?? 0} registro(s) recusados da loja ${l.filial_nome ?? l.filial_cod}?`
    )

  if (!user.ready) {
    return (
      <DashboardLayout titulo="Sincronização" subtitulo="Saúde do Sync Agent em cada loja" loading>
        {null}
      </DashboardLayout>
    )
  }
  if (!user.isAdmin) return null

  const paginaAtual = pageItems(filtradas, pagina)

  return (
    <DashboardLayout
      titulo="Sincronização"
      subtitulo="Saúde do Sync Agent em cada loja"
      loading={loading && lojas.length === 0}
      actions={
        <Button variant="secondary" size="lg" onClick={() => { setLoading(true); carregar() }}>
          <RefreshCw className="w-4 h-4" /> Atualizar
        </Button>
      }
    >
      <AdminToast message={toast.msg} tipo={toast.tipo} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Sincronizando normalmente', valor: kpis.ok, cor: 'text-[var(--success)]', border: 'border-l-[var(--success)]', filtro: 'todas' as const },
          { label: 'Com atenção', valor: kpis.atencao, cor: 'text-amber-600', border: 'border-l-amber-500', filtro: 'atencao' as const },
          { label: 'Com erro', valor: kpis.erro, cor: 'text-[var(--danger)]', border: 'border-l-[var(--danger)]', filtro: 'erro' as const },
          { label: 'Offline / sem relatório', valor: kpis.offline, cor: 'text-[var(--ink-muted)]', border: 'border-l-[var(--ink-ghost)]', filtro: 'offline' as const },
        ].map((k) => (
          <button
            type="button"
            key={k.label}
            onClick={() => setFiltroSaude(k.filtro)}
            className={`text-left bg-white border border-[var(--border)] border-l-4 ${k.border} rounded-xl p-3.5 hover:bg-[var(--bg-subtle)]/60`}
          >
            <div className="text-[12px] text-[var(--ink-ghost)] mb-1">{k.label}</div>
            <div className={`text-[18px] font-medium ${k.cor}`}>{k.valor}</div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-xl">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-ghost)]" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar loja, código ou grupo…"
            className="input-base w-full pl-10"
          />
        </div>
        <select
          value={filtroSaude}
          onChange={(e) => setFiltroSaude(e.target.value as typeof filtroSaude)}
          style={{ backgroundImage: selectChevron }}
          className="select-base !w-auto min-w-[170px]"
        >
          <option value="todas">Todas as lojas</option>
          <option value="problemas">Só com problema</option>
          <option value="erro">Com erro</option>
          <option value="offline">Offline</option>
          <option value="atencao">Com atenção</option>
          <option value="sincronizando">Em leitura completa</option>
          <option value="sem_relatorio">Sem relatório</option>
          <option value="ok">Ok</option>
        </select>
        <select
          value={filtroGrupo}
          onChange={(e) => setFiltroGrupo(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}
          style={{ backgroundImage: selectChevron }}
          className="select-base !w-auto min-w-[170px]"
        >
          <option value="todos">Todos os grupos</option>
          {grupos.map(([id, nome]) => (
            <option key={id} value={id}>{nome}</option>
          ))}
        </select>
      </div>

      {filtradas.length === 0 ? (
        <Card>
          <div className="py-14 text-center">
            <Activity className="w-10 h-10 text-[var(--ink-ghost)] mx-auto mb-4 opacity-40" />
            <div className="text-[15px] text-[var(--ink)] font-medium mb-1">
              {lojas.length === 0 ? 'Nenhuma loja cadastrada' : 'Nenhuma loja neste filtro'}
            </div>
          </div>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto bg-white border border-[var(--border)] rounded-xl">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]/50">
                  {['Loja', 'Situação', 'Último contato', 'Problemas', 'Versão', ''].map((h, i) => (
                    <th key={h || `a-${i}`} className="text-left py-3 px-4 text-[12px] font-medium text-[var(--ink-ghost)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginaAtual.map((l) => {
                  const st = SAUDE[l.saude]
                  const comErro = l.tabelas.filter((t) => t.status === 'ERROR' || t.status === 'PARCIAL')
                  const emLeitura = l.tabelas.filter((t) => t.leitura_completa)
                  const recusados = l.dead_letter?.registros ?? 0
                  return (
                    <tr
                      key={`${l.tenant_id}-${l.filial_cod}`}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-subtle)]/60 transition-colors cursor-pointer"
                      onClick={() => setDetalhe(l)}
                    >
                      <td className="py-3 px-4">
                        <div className="text-[14px] font-medium text-[var(--ink)]">{l.filial_nome ?? l.filial_cod}</div>
                        <div className="text-[12px] text-[var(--ink-ghost)] mt-0.5">
                          {l.filial_cod} · {l.tenant_nome ?? `Grupo ${l.tenant_id}`}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <StatusDotBadge label={st.label} variant={st.variant} />
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[13px] text-[var(--ink)]">{relativo(l.reportado_em, agora)}</div>
                        <div className="text-[12px] text-[var(--ink-ghost)] mt-0.5">
                          último lote {relativo(l.ultimo_lote_em, agora)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[12px] text-[var(--ink-muted)] max-w-[360px]">
                        {l.saude === 'offline' && <div>Sem contato há mais de {Math.round(minutosOffline(l) / 60)} h</div>}
                        {l.saude === 'sem_relatorio' && <div>Agente ainda não enviou status (versão anterior a 1.2.1 ou nunca rodou)</div>}
                        {l.info?.api_online === false && <div>Agente não alcança a API do SalesIQ</div>}
                        {!!l.info?.erro_ciclo && <div className="text-[var(--danger)] truncate">{String(l.info.erro_ciclo)}</div>}
                        {comErro.map((t) => (
                          <div key={t.tabela} className="truncate">
                            <span className={t.status === 'ERROR' ? 'text-[var(--danger)]' : 'text-amber-700'}>{t.tabela}</span>
                            {t.ultimo_erro ? `: ${t.ultimo_erro}` : t.status === 'PARCIAL' ? ': registros recusados' : ''}
                          </div>
                        ))}
                        {recusados > 0 && <div>{recusados} registro(s) recusados aguardando reenvio</div>}
                        {l.resets_pendentes.length > 0 && <div>Releitura pedida: {l.resets_pendentes.join(', ')}</div>}
                        {emLeitura.length > 0 && <div className="text-[var(--info)]">Leitura completa: {emLeitura.map((t) => t.tabela).join(', ')}</div>}
                      </td>
                      <td className="py-3 px-4 text-[13px] text-[var(--ink-muted)]">{l.versao_agente ?? '—'}</td>
                      <td className="py-3 px-4 w-12" onClick={(e) => e.stopPropagation()}>
                        <RowActionsMenu
                          title={l.filial_nome ?? l.filial_cod}
                          subtitle={`${l.filial_cod} · ${l.tenant_nome ?? ''}`}
                          actions={[
                            {
                              id: 'ver',
                              label: 'Ver tabelas',
                              description: 'Status, erros e releitura por tabela',
                              icon: <Eye className="w-4 h-4" />,
                              onClick: () => setDetalhe(l),
                              tone: 'accent',
                            },
                            {
                              id: 'reenviar',
                              label: 'Reenviar recusados',
                              description: recusados ? `${recusados} registro(s) no dead-letter` : 'Nenhum registro recusado',
                              icon: <Send className="w-4 h-4" />,
                              onClick: () => reenviar(l),
                              disabled: !recusados,
                            },
                            {
                              id: 'forcar',
                              label: 'Forçar sincronização completa',
                              description: 'Relê todas as tabelas desta loja do zero',
                              icon: <RotateCcw className="w-4 h-4" />,
                              onClick: () => forcarLoja(l),
                              tone: 'warn',
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <AdminTableFooter
            total={filtradas.length}
            totalAll={lojas.length}
            page={pagina}
            onPageChange={setPagina}
            noun={{ singular: 'loja', plural: 'lojas' }}
          />
        </>
      )}

      <Modal
        open={!!detalhe}
        onClose={() => setDetalhe(null)}
        size="xl"
        title={detalhe ? `${detalhe.filial_nome ?? detalhe.filial_cod} (${detalhe.filial_cod})` : ''}
        subtitle={detalhe ? `${detalhe.tenant_nome ?? ''} · agente ${detalhe.versao_agente ?? '?'} · último contato ${relativo(detalhe.reportado_em, agora)}` : ''}
        footer={
          detalhe && (
            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                variant="secondary"
                disabled={!detalhe.dead_letter?.registros}
                loading={executando === `reenviar:${detalhe.tenant_id}:${detalhe.filial_cod}`}
                onClick={() => reenviar(detalhe)}
              >
                <Send className="w-4 h-4" /> Reenviar recusados
              </Button>
              <Button
                variant="secondary"
                loading={executando === `forcar-periodo:${detalhe.tenant_id}:${detalhe.filial_cod}`}
                onClick={() => forcarPeriodo(detalhe)}
              >
                <RotateCcw className="w-4 h-4" /> Reenviar período
              </Button>
              <Button
                variant="primary"
                loading={executando === `forcar:${detalhe.tenant_id}:${detalhe.filial_cod}:*`}
                onClick={() => forcarLoja(detalhe)}
              >
                <RotateCcw className="w-4 h-4" /> Forçar todas as tabelas
              </Button>
            </div>
          )
        }
      >
        {detalhe && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
              <div>
                <div className="text-[var(--ink-ghost)]">Máquina</div>
                <div className="text-[var(--ink)]">{String(detalhe.info?.hostname ?? '—')}</div>
              </div>
              <div>
                <div className="text-[var(--ink-ghost)]">Último ciclo</div>
                <div className="text-[var(--ink)]">{dataHora(detalhe.ciclo_fim)}</div>
              </div>
              <div>
                <div className="text-[var(--ink-ghost)]">Registros recusados</div>
                <div className="text-[var(--ink)]">
                  {detalhe.dead_letter?.registros ?? 0} em {detalhe.dead_letter?.arquivos ?? 0} lote(s)
                </div>
              </div>
              <div>
                <div className="text-[var(--ink-ghost)]">Recusados na API (24 h)</div>
                <div className="text-[var(--ink)]">{detalhe.erros_24h}</div>
              </div>
            </div>

            {!!detalhe.info?.erro_ciclo && (
              <div className="text-[12px] text-[var(--danger)] bg-[var(--danger-bg)] rounded-lg px-3 py-2">
                Erro no último ciclo: {String(detalhe.info.erro_ciclo)}
              </div>
            )}
            {detalhe.reenviar_solicitado_em && (
              <div className="text-[12px] text-[var(--ink-muted)]">
                Reenvio pedido em {dataHora(detalhe.reenviar_solicitado_em)}
                {(() => {
                  const r = detalhe.info?.reenvio as { em?: string; reenviados?: number; falhas?: number } | null | undefined
                  return r?.em ? ` · último reenvio em ${dataHora(r.em)}: ${r.reenviados ?? 0} lote(s) aceitos, ${r.falhas ?? 0} ainda recusados` : ' · aguardando o agente'
                })()}
              </div>
            )}

            {detalhe.tabelas.length === 0 ? (
              <div className="text-[13px] text-[var(--ink-ghost)] py-6 text-center">
                Esta loja ainda não enviou o status das tabelas.
              </div>
            ) : (
              <div className="overflow-x-auto border border-[var(--border)] rounded-xl">
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]/50">
                      {['Tabela', 'Status', 'Último dado', 'Última leitura completa', 'Último ciclo', ''].map((h, i) => (
                        <th key={h || `a-${i}`} className="text-left py-2.5 px-3 font-medium text-[var(--ink-ghost)]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detalhe.tabelas.map((t) => {
                      const st = TABELA_STATUS[t.status ?? ''] ?? { label: t.status ?? '—', variant: 'neutral' as const }
                      const pendente = t.tabela_destino ? detalhe.resets_pendentes.includes(t.tabela_destino) : false
                      return (
                        <tr key={t.tabela} className="border-b border-[var(--border)] last:border-0 align-top">
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-[var(--ink)]">{t.tabela}</div>
                            {t.ultimo_erro && <div className="text-[var(--danger)] mt-0.5 max-w-[260px] break-words">{t.ultimo_erro}</div>}
                            {t.leitura_completa && (
                              <div className="text-[var(--info)] mt-0.5">
                                Leitura completa ({t.leitura_completa.ordem === 'desc' ? 'mais recentes primeiro' : 'mais antigos primeiro'})
                                {t.leitura_completa.posicao ? ` · em ${t.leitura_completa.posicao}` : ''}
                              </div>
                            )}
                            {pendente && <div className="text-amber-700 mt-0.5">Releitura pedida, aguardando o agente</div>}
                          </td>
                          <td className="py-2.5 px-3">
                            <StatusDotBadge label={st.label} variant={st.variant} />
                            {t.tentativas > 0 && <div className="text-[var(--ink-ghost)] mt-1">{t.tentativas} falha(s)</div>}
                          </td>
                          <td className="py-2.5 px-3 text-[var(--ink-muted)]">{dataHora(t.ultimo_sync_ts)}</td>
                          <td className="py-2.5 px-3 text-[var(--ink-muted)]">{dataHora(t.ultimo_full_sync)}</td>
                          <td className="py-2.5 px-3 text-[var(--ink-muted)]">
                            <div>{relativo(t.atualizado_em, agora)}</div>
                            <div className="text-[var(--ink-ghost)] mt-0.5">{resumoTexto(t.ultimo_resumo)}</div>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="flex gap-1.5 justify-end">
                              <Button
                                size="sm"
                                variant="secondary"
                                title="Reler esta tabela do zero nesta loja"
                                loading={executando === `forcar:${detalhe.tenant_id}:${detalhe.filial_cod}:${t.tabela}`}
                                onClick={() => forcarLoja(detalhe, t.tabela)}
                              >
                                <RotateCcw className="w-3.5 h-3.5" /> Forçar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Reler esta tabela do zero em todas as lojas do grupo"
                                loading={executando === `grupo:${detalhe.tenant_id}:${t.tabela}`}
                                onClick={() => forcarGrupo(detalhe, t.tabela)}
                              >
                                <Users className="w-3.5 h-3.5" /> Grupo
                              </Button>
                            </div>
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
      </Modal>
    </DashboardLayout>
  )
}
