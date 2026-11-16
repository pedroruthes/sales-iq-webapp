import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  BarChart3,
  Calendar,
  Eye,
  RefreshCw,
  Target,
  TrendingDown,
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, subDays, subMonths } from 'date-fns'
import { DashboardLayout } from '@/components/layout'
import { Card, Button, KPICard, Modal, Badge } from '@/components/ui'
import { useFiltroFilial } from '@/hooks/useFiltroFilial'
import { cn, fmt } from '@/lib/utils'

type LojaAgg = {
  tenantId: number
  tenantNome: string
  filial: string
  nomeFilial: string
  ticketsBrutos: number
  ticketsValidos: number
  ticketsGap: number
  gapPct: number
  faturamentoValido: number
  faturamentoBruto: number
  pecas: number
  ticketMedio: number
  pa: number
  pm: number
  pa1Pct: number
  diasComVenda: number
  metaFaturamento: number | null
  gapMeta: number | null
  pctMeta: number | null
}

type DiaGap = {
  tenantId: number
  tenantNome: string
  filial: string
  nomeFilial: string
  dia: string
  ticketsBrutos: number
  ticketsValidos: number
  ticketsGap: number
  faturamentoValido: number
}

type Resumo = {
  ticketsBrutos: number
  ticketsValidos: number
  ticketsGap: number
  gapPct: number
  faturamentoValido: number
  faturamentoBruto: number
  pecas: number
  ticketMedio: number
  pa: number
  pm: number
  lojas: number
  metaTotal: number | null
  gapMeta: number | null
  pctMeta: number | null
}

type GapTicket = {
  ticket: string
  dataVenda: string
  vendedor: string | null
  nomeVendedor: string | null
  operacao: string | null
  qtdeTotal: number
  valorBruto: number
  valorTroca: number
  qtdeTroca: number
  valorCancelado: number
  qtdeCancelada: number
  dataCancelamento: string | null
  motivoCancelamento: number | null
  valorPago: number
  terminal: string | null
  cliente: string | null
  desconto: number
  motivo: 'cancelados' | 'zerados' | 'troca' | 'outros'
}

type DetalheGap = {
  tenantId: number
  filial: string
  nomeFilial: string
  tenantNome: string
  dia?: string
}

type PeriodoLocal = { key: string; label: string; inicio: Date; fim: Date }

const MOTIVO_LABEL: Record<GapTicket['motivo'], string> = {
  cancelados: 'Cancelado',
  zerados: 'Zerado',
  troca: 'Só troca',
  outros: 'Outros',
}

const MOTIVO_BADGE: Record<GapTicket['motivo'], 'danger' | 'warn' | 'info' | 'neutral'> = {
  cancelados: 'danger',
  zerados: 'warn',
  troca: 'info',
  outros: 'neutral',
}

function presetPeriodos(): PeriodoLocal[] {
  const h = new Date()
  h.setHours(23, 59, 59, 999)
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const mesAnt = subMonths(h, 1)
  return [
    { key: 'hoje', label: 'Hoje', inicio: start, fim: h },
    { key: '7d', label: '7 dias', inicio: subDays(start, 6), fim: h },
    { key: '14d', label: '14 dias', inicio: subDays(start, 13), fim: h },
    { key: '30d', label: '30 dias', inicio: subDays(start, 29), fim: h },
    { key: 'mes_atual', label: 'Mês atual', inicio: startOfMonth(h), fim: endOfMonth(h) },
    { key: 'mes_anterior', label: 'Mês anterior', inicio: startOfMonth(mesAnt), fim: endOfMonth(mesAnt) },
  ]
}

export default function IndicadoresPage() {
  const { filiaisAtivas } = useFiltroFilial()
  const presets = useMemo(() => presetPeriodos(), [])
  const [periodoKey, setPeriodoKey] = useState('7d')
  const [iniCustom, setIniCustom] = useState('')
  const [fimCustom, setFimCustom] = useState('')
  const [customAtivo, setCustomAtivo] = useState(false)

  const [lojas, setLojas] = useState<LojaAgg[]>([])
  const [topGapDias, setTopGapDias] = useState<DiaGap[]>([])
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState<'lojas' | 'dias' | 'meta'>('lojas')

  const [detalhe, setDetalhe] = useState<DetalheGap | null>(null)
  const [ticketsGap, setTicketsGap] = useState<GapTicket[]>([])
  const [loadingDetalhe, setLoadingDetalhe] = useState(false)
  const [hasMoreTickets, setHasMoreTickets] = useState(false)
  const [erroDetalhe, setErroDetalhe] = useState<string | null>(null)

  const periodoAtivo = useMemo(() => {
    if (customAtivo && iniCustom && fimCustom && fimCustom >= iniCustom) {
      return {
        key: 'custom',
        label: `${format(new Date(iniCustom + 'T12:00:00'), 'dd/MM')} – ${format(new Date(fimCustom + 'T12:00:00'), 'dd/MM')}`,
        inicio: new Date(iniCustom + 'T00:00:00'),
        fim: new Date(fimCustom + 'T23:59:59.999'),
      }
    }
    return presets.find((p) => p.key === periodoKey) ?? presets[1]
  }, [customAtivo, iniCustom, fimCustom, periodoKey, presets])

  const carregar = useCallback(async () => {
    if (!filiaisAtivas.length) {
      setLojas([])
      setTopGapDias([])
      setResumo(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const r = await axios.get('/api/indicadores', {
        params: {
          inicio: format(periodoAtivo.inicio, 'yyyy-MM-dd'),
          fim: format(periodoAtivo.fim, 'yyyy-MM-dd'),
          filiais: filiaisAtivas.join(','),
        },
      })
      const d = r.data.data
      setLojas(d?.porLoja ?? [])
      setTopGapDias(d?.topGapDias ?? [])
      setResumo(d?.resumo ?? null)
    } catch {
      setLojas([])
      setTopGapDias([])
      setResumo(null)
    } finally {
      setLoading(false)
    }
  }, [periodoAtivo, filiaisAtivas])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const abrirDetalhe = useCallback(async (ctx: DetalheGap) => {
    setDetalhe(ctx)
    setLoadingDetalhe(true)
    setErroDetalhe(null)
    setTicketsGap([])
    try {
      const r = await axios.get('/api/indicadores/gap-tickets', {
        params: {
          tenantId: ctx.tenantId,
          filial: ctx.filial,
          inicio: format(periodoAtivo.inicio, 'yyyy-MM-dd'),
          fim: format(periodoAtivo.fim, 'yyyy-MM-dd'),
          ...(ctx.dia ? { dia: ctx.dia } : {}),
          limit: 200,
        },
      })
      setTicketsGap(r.data.data?.tickets ?? [])
      setHasMoreTickets(!!r.data.data?.hasMore)
    } catch (e) {
      setErroDetalhe(axios.isAxiosError(e) ? (e.response?.data?.error || e.message) : 'Erro ao carregar tickets')
      setTicketsGap([])
      setHasMoreTickets(false)
    } finally {
      setLoadingDetalhe(false)
    }
  }, [periodoAtivo])

  const lojasComGap = lojas.filter((l) => l.ticketsGap > 0)
  const lojasAbaixoMeta = lojas.filter((l) => l.gapMeta != null && l.gapMeta > 0)

  return (
    <DashboardLayout
      titulo="Indicadores"
      subtitulo="Qualidade dos tickets, desempenho e gap vs meta"
      actions={
        <Button variant="secondary" size="md" onClick={carregar} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      }
    >
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="w-4 h-4 text-[var(--ink-ghost)]" />
          {presets.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => {
                setCustomAtivo(false)
                setPeriodoKey(p.key)
              }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors',
                !customAtivo && periodoKey === p.key
                  ? 'bg-[var(--acc)] text-white'
                  : 'bg-[var(--bg-subtle)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
              )}
            >
              {p.label}
            </button>
          ))}
          <div className="flex items-center gap-1.5 ml-auto">
            <input
              type="date"
              value={iniCustom}
              onChange={(e) => {
                setIniCustom(e.target.value)
                setCustomAtivo(true)
              }}
              className="select-base !h-8 text-[12px]"
            />
            <span className="text-[12px] text-[var(--ink-ghost)]">até</span>
            <input
              type="date"
              value={fimCustom}
              onChange={(e) => {
                setFimCustom(e.target.value)
                setCustomAtivo(true)
              }}
              className="select-base !h-8 text-[12px]"
            />
          </div>
        </div>
        <div className="mt-2 text-[11px] text-[var(--ink-ghost)]">
          Período: <span className="text-[var(--ink-muted)] font-medium">{periodoAtivo.label}</span>
          {' · '}
          {format(periodoAtivo.inicio, 'dd/MM/yyyy')} – {format(periodoAtivo.fim, 'dd/MM/yyyy')}
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5">
        <KPICard label="Tickets brutos" valor={resumo?.ticketsBrutos ?? 0} formato="numero" destaque="neutral" tooltip="Todos os tickets sincronizados" />
        <KPICard label="Tickets válidos" valor={resumo?.ticketsValidos ?? 0} formato="numero" destaque="success" tooltip="Com peças (usados no dashboard)" />
        <KPICard
          label="Gap de tickets"
          valor={resumo?.ticketsGap ?? 0}
          formato="numero"
          destaque={(resumo?.ticketsGap ?? 0) > 0 ? 'warn' : 'success'}
          tooltip="Brutos − válidos (cancelados, zerados, trocas)"
        />
        <KPICard label="% gap" valor={resumo?.gapPct ?? 0} formato="percentual" destaque={(resumo?.gapPct ?? 0) > 5 ? 'danger' : 'warn'} />
        <KPICard label="Fat. válido" valor={resumo?.faturamentoValido ?? 0} formato="moeda" destaque="primary" />
        <KPICard label="Fat. bruto sync" valor={resumo?.faturamentoBruto ?? 0} formato="moeda" destaque="neutral" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5">
        <KPICard label="Ticket médio" valor={resumo?.ticketMedio ?? 0} formato="moeda" />
        <KPICard label="P.A" valor={resumo?.pa ?? 0} formato="numero" destaque={(resumo?.pa ?? 0) >= 2.7 ? 'success' : (resumo?.pa ?? 0) >= 2 ? 'warn' : 'danger'} />
        <KPICard label="P.M" valor={resumo?.pm ?? 0} formato="moeda" destaque="neutral" />
        <KPICard label="Peças" valor={resumo?.pecas ?? 0} formato="numero" />
        <KPICard
          label="% da meta"
          valor={resumo?.pctMeta ?? '—'}
          formato={resumo?.pctMeta != null ? 'percentual' : 'texto'}
          destaque={resumo?.pctMeta == null ? 'neutral' : resumo.pctMeta >= 100 ? 'success' : resumo.pctMeta >= 80 ? 'warn' : 'danger'}
        />
        <KPICard
          label="Gap vs meta"
          valor={resumo?.gapMeta != null ? resumo.gapMeta : '—'}
          formato={resumo?.gapMeta != null ? 'moeda' : 'texto'}
          destaque={resumo?.gapMeta == null ? 'neutral' : resumo.gapMeta > 0 ? 'danger' : 'success'}
        />
      </div>

      <div className="flex items-center gap-1 border-b border-[var(--border)]">
        {[
          { id: 'lojas' as const, label: 'Por loja', icon: BarChart3 },
          { id: 'dias' as const, label: 'Maiores gaps por dia', icon: TrendingDown },
          { id: 'meta' as const, label: 'Gap vs meta', icon: Target },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setAba(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors',
              aba === t.id
                ? 'border-[var(--acc)] text-[var(--acc)]'
                : 'border-transparent text-[var(--ink-ghost)] hover:text-[var(--ink-muted)]'
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.id === 'lojas' && lojasComGap.length > 0 && (
              <span className="text-[10px] text-[var(--ink-ghost)]">({lojasComGap.length} c/ gap)</span>
            )}
          </button>
        ))}
      </div>

      <Card padding="sm">
        {loading ? (
          <div className="text-[13px] text-[var(--ink-ghost)] py-8 text-center">Carregando…</div>
        ) : aba === 'lojas' ? (
          !lojas.length ? (
            <div className="text-[13px] text-[var(--ink-ghost)] py-8 text-center">Sem dados no período</div>
          ) : (
            <div className="overflow-x-auto">
              <p className="text-[11px] text-[var(--ink-ghost)] mb-2">Clique numa loja com gap para ver os tickets.</p>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--ink-ghost)] text-left">
                    <th className="py-2 font-medium pr-2">Loja</th>
                    <th className="py-2 font-medium text-right">Brutos</th>
                    <th className="py-2 font-medium text-right">Válidos</th>
                    <th className="py-2 font-medium text-right">Gap</th>
                    <th className="py-2 font-medium text-right">% gap</th>
                    <th className="py-2 font-medium text-right">Fat.</th>
                    <th className="py-2 font-medium text-right">T.M</th>
                    <th className="py-2 font-medium text-right">P.A</th>
                    <th className="py-2 font-medium text-right">Peças</th>
                    <th className="py-2 font-medium text-right">Dias</th>
                    <th className="py-2 font-medium text-right w-10" />
                  </tr>
                </thead>
                <tbody>
                  {lojas.map((l) => (
                    <tr
                      key={`${l.tenantId}-${l.filial}`}
                      className={cn(
                        'border-b border-[var(--border)] last:border-0 align-middle',
                        l.ticketsGap > 0 && 'hover:bg-[var(--bg-subtle)] cursor-pointer'
                      )}
                      onClick={() => {
                        if (l.ticketsGap > 0) {
                          void abrirDetalhe({
                            tenantId: l.tenantId,
                            filial: l.filial,
                            nomeFilial: l.nomeFilial,
                            tenantNome: l.tenantNome,
                          })
                        }
                      }}
                    >
                      <td className="py-2 pr-2">
                        <div className="font-medium text-[var(--ink)]">{l.nomeFilial}</div>
                        <div className="text-[11px] text-[var(--ink-ghost)]">{l.filial}</div>
                      </td>
                      <td className="py-2 text-right tabular-nums">{l.ticketsBrutos}</td>
                      <td className="py-2 text-right tabular-nums">{l.ticketsValidos}</td>
                      <td className={cn('py-2 text-right tabular-nums font-medium', l.ticketsGap > 0 ? 'text-[var(--warn)]' : 'text-[var(--ink-ghost)]')}>
                        {l.ticketsGap}
                      </td>
                      <td className="py-2 text-right tabular-nums text-[var(--ink-muted)]">{fmt.percent(l.gapPct)}</td>
                      <td className="py-2 text-right tabular-nums">{fmt.currencyShort(l.faturamentoValido)}</td>
                      <td className="py-2 text-right tabular-nums">{fmt.currencyShort(l.ticketMedio)}</td>
                      <td className="py-2 text-right tabular-nums">{fmt.number(l.pa, 2)}</td>
                      <td className="py-2 text-right tabular-nums">{fmt.number(l.pecas, 0)}</td>
                      <td className="py-2 text-right tabular-nums">{l.diasComVenda}</td>
                      <td className="py-2 text-right">
                        {l.ticketsGap > 0 && <Eye className="w-3.5 h-3.5 text-[var(--acc)] inline-block" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : aba === 'dias' ? (
          !topGapDias.length ? (
            <div className="text-[13px] text-[var(--ink-ghost)] py-8 text-center">Nenhum dia com gap no período</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--ink-ghost)] text-left">
                    <th className="py-2 font-medium">Data</th>
                    <th className="py-2 font-medium">Loja</th>
                    <th className="py-2 font-medium text-right">Brutos</th>
                    <th className="py-2 font-medium text-right">Válidos</th>
                    <th className="py-2 font-medium text-right">Gap</th>
                    <th className="py-2 font-medium text-right">Fat. válido</th>
                    <th className="py-2 font-medium text-right w-10" />
                  </tr>
                </thead>
                <tbody>
                  {topGapDias.map((d) => (
                    <tr
                      key={`${d.tenantId}-${d.filial}-${d.dia}`}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-subtle)] cursor-pointer"
                      onClick={() =>
                        void abrirDetalhe({
                          tenantId: d.tenantId,
                          filial: d.filial,
                          nomeFilial: d.nomeFilial,
                          tenantNome: d.tenantNome,
                          dia: d.dia,
                        })
                      }
                    >
                      <td className="py-2 tabular-nums font-medium text-[var(--ink)]">{fmt.date(d.dia)}</td>
                      <td className="py-2">
                        <div className="text-[var(--ink)]">{d.nomeFilial}</div>
                        <div className="text-[11px] text-[var(--ink-ghost)]">{d.filial}</div>
                      </td>
                      <td className="py-2 text-right tabular-nums">{d.ticketsBrutos}</td>
                      <td className="py-2 text-right tabular-nums">{d.ticketsValidos}</td>
                      <td className="py-2 text-right tabular-nums font-medium text-[var(--warn)]">{d.ticketsGap}</td>
                      <td className="py-2 text-right tabular-nums">{fmt.currencyShort(d.faturamentoValido)}</td>
                      <td className="py-2 text-right">
                        <Eye className="w-3.5 h-3.5 text-[var(--acc)] inline-block" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : !lojasAbaixoMeta.length && !lojas.some((l) => l.metaFaturamento != null) ? (
          <div className="text-[13px] text-[var(--ink-ghost)] py-8 text-center">
            Sem metas cadastradas para o(s) mês(es) do período
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--ink-ghost)] text-left">
                  <th className="py-2 font-medium">Loja</th>
                  <th className="py-2 font-medium text-right">Realizado</th>
                  <th className="py-2 font-medium text-right">Meta</th>
                  <th className="py-2 font-medium text-right">Gap meta</th>
                  <th className="py-2 font-medium text-right">% meta</th>
                  <th className="py-2 font-medium min-w-[120px]">Progresso</th>
                </tr>
              </thead>
              <tbody>
                {[...lojas]
                  .filter((l) => l.metaFaturamento != null)
                  .sort((a, b) => (b.gapMeta ?? 0) - (a.gapMeta ?? 0))
                  .map((l) => {
                    const pct = Math.min(100, Math.max(0, l.pctMeta ?? 0))
                    const abaixo = (l.gapMeta ?? 0) > 0
                    return (
                      <tr key={`${l.tenantId}-${l.filial}-meta`} className="border-b border-[var(--border)] last:border-0">
                        <td className="py-2">
                          <div className="font-medium text-[var(--ink)]">{l.nomeFilial}</div>
                          <div className="text-[11px] text-[var(--ink-ghost)]">{l.filial}</div>
                        </td>
                        <td className="py-2 text-right tabular-nums">{fmt.currencyShort(l.faturamentoValido)}</td>
                        <td className="py-2 text-right tabular-nums">{fmt.currencyShort(l.metaFaturamento ?? 0)}</td>
                        <td className={cn('py-2 text-right tabular-nums font-medium', abaixo ? 'text-[var(--danger)]' : 'text-[var(--success)]')}>
                          {fmt.currencyShort(l.gapMeta ?? 0)}
                        </td>
                        <td className="py-2 text-right tabular-nums">{l.pctMeta != null ? fmt.percent(l.pctMeta) : '—'}</td>
                        <td className="py-2">
                          <div className="h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                            <div
                              className={cn('h-full rounded-full', pct >= 100 ? 'bg-[var(--success)]' : pct >= 80 ? 'bg-[var(--warn)]' : 'bg-[var(--danger)]')}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={!!detalhe}
        onClose={() => {
          setDetalhe(null)
          setTicketsGap([])
          setErroDetalhe(null)
        }}
        size="xl"
        className="!max-w-[1100px]"
        title="Tickets com gap"
        subtitle={
          detalhe
            ? `${detalhe.nomeFilial}${detalhe.dia ? ` · ${fmt.date(detalhe.dia)}` : ` · ${periodoAtivo.label}`}`
            : undefined
        }
        bodyClassName="!px-4 !py-3"
      >
        <div className="flex items-center mb-3">
          <span className="text-[11px] text-[var(--ink-ghost)] ml-auto">
            {loadingDetalhe ? 'Carregando…' : `${ticketsGap.length} ticket${ticketsGap.length === 1 ? '' : 's'}`}
            {hasMoreTickets ? ' (parcial — máx. 200)' : ''}
          </span>
        </div>

        {erroDetalhe ? (
          <div className="text-[13px] text-[var(--danger)] py-6 text-center">{erroDetalhe}</div>
        ) : loadingDetalhe ? (
          <div className="text-[13px] text-[var(--ink-ghost)] py-8 text-center">Carregando tickets…</div>
        ) : !ticketsGap.length ? (
          <div className="text-[13px] text-[var(--ink-ghost)] py-8 text-center">Nenhum ticket com gap</div>
        ) : (
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full text-[12px]">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-[var(--border)] text-[var(--ink-ghost)] text-left">
                  <th className="py-2 pr-2 font-medium">Ticket</th>
                  <th className="py-2 pr-2 font-medium">Data/hora</th>
                  <th className="py-2 pr-2 font-medium">Motivo</th>
                  <th className="py-2 pr-2 font-medium">Vendedor</th>
                  <th className="py-2 pr-2 font-medium text-right">Qtde</th>
                  <th className="py-2 pr-2 font-medium text-right">Valor</th>
                  <th className="py-2 pr-2 font-medium text-right">Troca</th>
                  <th className="py-2 pr-2 font-medium text-right">Cancelado</th>
                  <th className="py-2 pr-2 font-medium">Terminal</th>
                  <th className="py-2 font-medium">Cliente</th>
                </tr>
              </thead>
              <tbody>
                {ticketsGap.map((t) => (
                  <tr key={`${t.ticket}-${t.dataVenda}`} className="border-b border-[var(--border)] last:border-0 align-top">
                    <td className="py-2 pr-2 font-medium tabular-nums text-[var(--ink)]">{t.ticket}</td>
                    <td className="py-2 pr-2 tabular-nums text-[var(--ink-muted)] whitespace-nowrap">
                      {t.dataVenda.replace(' ', ' · ')}
                      {t.dataCancelamento && (
                        <div className="text-[10px] text-[var(--danger)] mt-0.5">
                          canc. {t.dataCancelamento.replace(' ', ' · ')}
                        </div>
                      )}
                    </td>
                    <td className="py-2 pr-2">
                      <Badge variant={MOTIVO_BADGE[t.motivo]}>{MOTIVO_LABEL[t.motivo]}</Badge>
                    </td>
                    <td className="py-2 pr-2">
                      <div className="text-[var(--ink)]">{t.nomeVendedor || t.vendedor || '—'}</div>
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums">{t.qtdeTotal}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">{fmt.currencyShort(t.valorBruto)}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">
                      {t.qtdeTroca > 0 || t.valorTroca > 0
                        ? `${t.qtdeTroca} · ${fmt.currencyShort(t.valorTroca)}`
                        : '—'}
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums">
                      {t.valorCancelado > 0 || t.qtdeCancelada > 0
                        ? `${fmt.currencyShort(t.valorCancelado)}${t.qtdeCancelada ? ` (${t.qtdeCancelada}p)` : ''}`
                        : '—'}
                    </td>
                    <td className="py-2 pr-2 tabular-nums text-[var(--ink-muted)]">{t.terminal || '—'}</td>
                    <td className="py-2 tabular-nums text-[var(--ink-muted)]">{t.cliente || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}
