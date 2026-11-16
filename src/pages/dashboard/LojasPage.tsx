import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from '@/lib/navigation'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { Building2, ArrowLeftRight } from 'lucide-react'
import { DashboardLayout }       from '@/components/layout'
import { ErrorBox, FiltroBar, Card, SectionTitle, PageHeader, type Periodo } from '@/components/ui'
import { MetaStrip }             from '@/features/lojas/components/MetaStrip'
import { ScorePerformance }      from '@/features/lojas/components/ScorePerformance'
import { EstoqueMini }           from '@/features/lojas/components/EstoqueMini'
import { ClientesLojaMini }      from '@/features/lojas/components/ClientesLojaMini'
import { VendedoresTabela }      from '@/features/vendedores/components/VendedoresTabela'
import { CardIA }                from '@/features/dashboard/components/CardIA'
import { LineChart, HoraChart }  from '@/components/charts'
import { useKPIsFilial, useFaturamentoDiario, useVolumePorHora } from '@/features/vendas/hooks/useVendasData'
import { useKPIsVendedores }     from '@/features/vendedores/hooks/useVendedoresData'
import { useCurvaABC, useProdutosParados, useGiroPorGrupo } from '@/features/estoque/hooks/useEstoqueData'
import { useClientesResumo, useAniversariantes } from '@/features/clientes/hooks/useClientesData'
import { useFiliais }            from '@/hooks/useFiliais'
import { useContentLoading, useCurrentUser } from '@/hooks/useSession'
import { useEscopoFilial }       from '@/components/layout'
import { getMesAtual, fmt, cn }  from '@/lib/utils'
import Link from '@/lib/Link'

function LojasPageInner() {
  const user = useCurrentUser()
  const { data: filiais, isLoading: lFiliais } = useFiliais()
  const { codigo: escopo, setEscopo } = useEscopoFilial()
  const searchParams = useSearchParams()
  const filialParam = searchParams.get('filial')
  const [periodo, setPeriodo]     = useState<Periodo>({ label: 'Mês atual', ...getMesAtual() })
  const [buscaLoja, setBuscaLoja] = useState('')

  const filialSel = escopo || filialParam || ''

  useEffect(() => {
    if (filialParam && filialParam !== escopo) {
      setEscopo(filialParam)
    }
  }, [filialParam, escopo, setEscopo])

  const periodoAnt = {
    inicio: startOfMonth(subMonths(new Date(periodo.inicio), 1)),
    fim:    endOfMonth(subMonths(new Date(periodo.inicio), 1)),
  }

  // Sem filial selecionada: supervisora/proprietário vê todas; demais precisam de loja
  const filiaisLoja = filialSel
    ? [filialSel]
    : (user.isSupervisora || user.isProprietario || user.isAdmin)
      ? user.filiais
      : []
  const filialAtual = filiais?.find(f => f.COD_FILIAL === filialSel)
  const filiaisFiltradas = (filiais ?? []).filter(f => {
    const q = buscaLoja.trim().toLowerCase()
    if (!q) return true
    return (f.FILIAL || '').toLowerCase().includes(q) || f.COD_FILIAL.toLowerCase().includes(q)
  })

  // Dados da loja
  const { data: kpis, error } = useKPIsFilial(filiaisLoja, periodo.inicio, periodo.fim)
  const { data: kpisAnt }      = useKPIsFilial(filiaisLoja, periodoAnt.inicio, periodoAnt.fim)
  const { data: kpisRede }     = useKPIsFilial(user.filiais, periodo.inicio, periodo.fim)
  const { data: fatDiario }    = useFaturamentoDiario(filiaisLoja, periodo.inicio, periodo.fim)
  const { data: volHora }      = useVolumePorHora(filiaisLoja, periodo.inicio, periodo.fim)
  const { data: vendedores }   = useKPIsVendedores(filiaisLoja, periodo.inicio, periodo.fim)
  const { data: abc }          = useCurvaABC(filiaisLoja, periodo.inicio, periodo.fim)
  const { data: parados }      = useProdutosParados(filiaisLoja, 60)
  const { data: giro }         = useGiroPorGrupo(filiaisLoja, periodo.inicio, periodo.fim)
  const { data: resumoClientes } = useClientesResumo(filiaisLoja, periodo.inicio, periodo.fim)
  const { data: aniversariantes } = useAniversariantes(filiaisLoja, 'semana')

  const hasScope = filiaisLoja.length > 0
  const loading = useContentLoading({
    filiaisLoading: lFiliais,
    filiaisQuery: filiaisLoja,
    waiting: hasScope
      ? [
          kpis === undefined,
          kpisAnt === undefined,
          kpisRede === undefined,
          fatDiario === undefined,
          volHora === undefined,
          vendedores === undefined,
          abc === undefined,
          parados === undefined,
          giro === undefined,
          resumoClientes === undefined,
          aniversariantes === undefined,
        ]
      : [],
  })

  const kpi = kpis?.[0]
  const kpiAnt = kpisAnt?.[0]
  const variacaoFat = kpi && kpiAnt && kpiAnt.faturamento > 0
    ? ((kpi.faturamento - kpiAnt.faturamento) / kpiAnt.faturamento) * 100
    : 0

  // Posição na rede
  const posicaoRede = kpisRede
    ? [...kpisRede].sort((a,b) => b.faturamento - a.faturamento)
        .findIndex(k => k.codigoFilial === filialSel) + 1
    : null

  // Médias da rede para comparação
  const mediaRedePA  = kpisRede?.length ? kpisRede.reduce((a,k) => a + k.pecasAtendimento, 0) / kpisRede.length : 0
  const mediaRedeTM  = kpisRede?.length ? kpisRede.reduce((a,k) => a + k.faturamento, 0) / kpisRede.reduce((a,k) => a + k.totalVendas, 0) : 0

  const giroMedio = giro?.length
    ? giro.reduce((a: number, g: any) => a + g.giroMensal, 0) / giro.length
    : 0

  if (error) return <DashboardLayout titulo="Lojas"><ErrorBox /></DashboardLayout>

  const tituloLoja = (filialAtual?.FILIAL || filialAtual?.COD_FILIAL) ?? 'Lojas'

  return (
    <DashboardLayout
      titulo={tituloLoja}
      breadcrumbExtra={filialSel ? [{ label: tituloLoja }] : undefined}
      bare
      loading={loading}
    >
      <div className="flex h-full min-h-0">

        {/* Lista de lojas */}
        <aside className="w-[240px] shrink-0 border-r border-[var(--border)] flex flex-col bg-white min-h-0">
          <div className="px-4 pt-5 pb-3 border-b border-[var(--border)] shrink-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--ink-ghost)] mb-1">
              Lojas
            </div>
            <div className="text-[14px] font-semibold text-[var(--ink)] leading-snug">
              {filiais?.length ?? 0} disponíveis
            </div>
            <div className="relative mt-3">
              <Building2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-ghost)]" />
              <input
                value={buscaLoja}
                onChange={e => setBuscaLoja(e.target.value)}
                placeholder="Buscar loja…"
                className="input-base pl-9"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-2 px-2 min-h-0">
            {filiaisFiltradas.map(f => {
              const ativa = f.COD_FILIAL === filialSel
              return (
                <button
                  key={f.COD_FILIAL}
                  type="button"
                  onClick={() => setEscopo(f.COD_FILIAL)}
                  className={cn(
                    'w-full flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left transition-colors mb-0.5',
                    ativa
                      ? 'bg-[var(--acc)] text-white shadow-sm'
                      : 'text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)]'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 text-[11px] font-semibold',
                    ativa ? 'bg-white/20 text-white' : 'bg-[var(--acc-pale)] text-[var(--acc)]'
                  )}>
                    {(f.FILIAL || f.COD_FILIAL).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={cn('text-[13px] font-medium truncate leading-snug', ativa ? 'text-white' : 'text-[var(--ink)]')}>
                      {f.FILIAL || f.COD_FILIAL}
                    </div>
                    <div className={cn('text-[11px] truncate leading-normal', ativa ? 'text-white/70' : 'text-[var(--ink-ghost)]')}>
                      Cód. {f.COD_FILIAL}
                    </div>
                  </div>
                </button>
              )
            })}
            {filiaisFiltradas.length === 0 && (
              <div className="px-3 py-8 text-center text-[13px] text-[var(--ink-ghost)]">
                Nenhuma loja encontrada
              </div>
            )}
          </div>

          <div className="border-t border-[var(--border)] p-3 shrink-0 space-y-2">
            {kpi && <ScorePerformance kpi={kpi} />}
            {posicaoRede ? (
              <div className="rounded-[12px] bg-[var(--acc-pale)] px-3 py-2.5 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-[var(--ink-ghost)] font-medium">Posição na rede</div>
                  <div className="text-[18px] font-semibold text-[var(--acc)] leading-none mt-1">
                    {posicaoRede}º
                    <span className="text-[12px] font-medium text-[var(--ink-faint)] ml-1">
                      de {kpisRede?.length}
                    </span>
                  </div>
                </div>
                <Link
                  href="/dashboard/comparativo"
                  className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--acc)] hover:underline"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" /> vs Rede
                </Link>
              </div>
            ) : (
              <Link
                href="/dashboard/comparativo"
                className="flex items-center justify-center gap-1.5 text-[13px] font-medium text-[var(--acc)] hover:bg-[var(--acc-pale)] rounded-[10px] py-2 transition-colors"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" /> Comparar vs Rede
              </Link>
            )}
          </div>
        </aside>

        {/* Conteúdo principal */}
        <div className="flex-1 overflow-y-auto min-w-0">
          <div className="page-content">
            <PageHeader
              title={tituloLoja}
              subtitle="Visão detalhada da loja selecionada"
              actions={
                <div className="flex items-center gap-2">
                  {kpi?.percentualMeta !== null && kpi?.percentualMeta !== undefined && (
                    <span className={cn('text-[12px] px-2.5 py-1 rounded-full border font-medium',
                      kpi.percentualMeta >= 100 ? 'bg-green-100 text-green-700 border-green-200'
                      : kpi.percentualMeta >= 80 ? 'bg-[var(--acc-pale)] text-[var(--acc)] border-[var(--acc-border)]'
                      : 'bg-red-100 text-red-700 border-red-200')}>
                      META: {fmt.percent(kpi.percentualMeta, 0)}
                    </span>
                  )}
                  <FiltroBar periodo={periodo} onPeriodoChange={setPeriodo} />
                </div>
              }
            />

            {/* Meta strip */}
            {kpi && <MetaStrip kpi={kpi} variacaoFat={variacaoFat} />}

            {/* KPIs com vs Rede */}
            {kpi && (
              <div className="grid grid-cols-6 gap-3">
                {[
                  { label: 'Faturamento', valor: fmt.currencyShort(kpi.faturamento), sub: variacaoFat !== 0 ? `${variacaoFat > 0 ? '+' : ''}${fmt.percent(variacaoFat, 1)} vs ant.` : undefined, cor: variacaoFat >= 0 ? 'success' : 'danger' },
                  { label: 'T.M',         valor: fmt.currencyShort(kpi.ticketMedio), sub: mediaRedeTM > 0 ? `rede: ${fmt.currencyShort(mediaRedeTM)}` : undefined, cor: kpi.ticketMedio >= mediaRedeTM ? 'success' : 'warn' },
                  { label: 'P.A',         valor: fmt.number(kpi.pecasAtendimento, 1), sub: `meta: 2,7`, cor: kpi.pecasAtendimento >= 2.7 ? 'success' : kpi.pecasAtendimento >= 2.0 ? 'warn' : 'danger' },
                  { label: 'P.M',         valor: fmt.currencyShort(kpi.precoMedio),   sub: undefined, cor: 'neutral' },
                  { label: '% PA1',       valor: fmt.percent(kpi.percentualPA1),       sub: kpi.percentualPA1 > 40 ? 'alto — atenção' : 'ok', cor: kpi.percentualPA1 > 40 ? 'danger' : kpi.percentualPA1 > 30 ? 'warn' : 'success' },
                  { label: 'vs Rede',     valor: posicaoRede ? `${posicaoRede}º lugar` : '—', sub: posicaoRede && kpisRede ? `de ${kpisRede.length} lojas` : undefined, cor: posicaoRede && posicaoRede <= 3 ? 'success' : 'info' },
                ].map(item => (
                  <div
                    key={item.label}
                    className={cn(
                      'bg-white border border-[var(--border)] border-l-4 rounded-xl p-3.5 shadow-[var(--shadow-card)]',
                      item.cor === 'success' ? 'border-l-[var(--success)]'
                        : item.cor === 'danger' ? 'border-l-[var(--danger)]'
                          : item.cor === 'warn' ? 'border-l-[var(--warn)]'
                            : item.cor === 'info' ? 'border-l-[var(--info)]'
                              : 'border-l-[var(--ink-ghost)]'
                    )}
                  >
                    <div className="text-[12px] text-[var(--ink-ghost)] font-medium mb-1">{item.label}</div>
                    <div className={cn(
                      'text-[18px] font-medium leading-none mb-1',
                      item.cor === 'success' ? 'text-[var(--success)]'
                        : item.cor === 'danger' ? 'text-[var(--danger)]'
                          : item.cor === 'warn' ? 'text-amber-600'
                            : item.cor === 'info' ? 'text-[var(--info)]'
                              : 'text-[var(--ink)]'
                    )}>
                      {item.valor}
                    </div>
                    {item.sub && (
                      <div className={cn(
                        'text-[12px] mt-1',
                        item.cor === 'success' ? 'text-[var(--success)]'
                          : item.cor === 'danger' ? 'text-[var(--danger)]'
                            : 'text-[var(--ink-ghost)]'
                      )}>
                        {item.sub}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Tabela de vendedores */}
            {vendedores && (
              <div>
                <SectionTitle label="Vendedores — desempenho no período" />
                <VendedoresTabela dados={vendedores} />
              </div>
            )}

            {/* 3 painéis: hora + estoque + clientes */}
            <div className="grid grid-cols-3 gap-4">

              {/* Volume por hora */}
              <Card padding="sm">
                <SectionTitle label="Vendas por hora" />
                <HoraChart dados={volHora ?? []} />
                <div className="mt-3">
                  <SectionTitle label="Faturamento diário" />
                  <LineChart dados={fatDiario ?? []} altura={80} />
                </div>
              </Card>

              {/* Estoque resumo */}
              <EstoqueMini
                abc={abc ?? []}
                parados={parados?.length ?? 0}
                giroMedio={giroMedio}
              />

              {/* Clientes */}
              <ClientesLojaMini
                resumo={resumoClientes}
                aniversariantes={aniversariantes ?? []}
              />
            </div>

            {/* Card de IA */}
            <CardIA kpis={kpis ?? []} filiais={filiaisLoja} periodoInicio={periodo.inicio} periodoFim={periodo.fim} />

          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function LojasPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-[13px] text-[var(--ink-ghost)]">Carregando...</div>}>
      <LojasPageInner />
    </Suspense>
  )
}
