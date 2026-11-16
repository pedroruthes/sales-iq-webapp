import { useState } from 'react'
import { BarChart2, ArrowLeftRight, Lightbulb } from 'lucide-react'
import { DashboardLayout }      from '@/components/layout'
import { ErrorBox, FiltroBar, Card, SectionTitle, type Periodo } from '@/components/ui'
import { LineChart, PAChart, HoraChart, Heatmap } from '@/components/charts'
import { VendasKPIStrip }       from '@/features/vendas/components/VendasKPIStrip'
import { TabelaComparativo }    from '@/features/vendas/components/TabelaComparativo'
import { InsightsVendas }       from '@/features/vendas/components/InsightsVendas'
import {
  useKPIsFilial, useFaturamentoDiario, useComparativo,
  useDistribuicaoPA, useVolumePorHora, useHeatmap,
} from '@/features/vendas/hooks/useVendasData'
import { useFiliais }     from '@/hooks/useFiliais'
import { useFiltroFilial } from '@/hooks/useFiltroFilial'
import { useContentLoading } from '@/hooks/useSession'
import { getMesAtual, cn } from '@/lib/utils'
import { calcularPeriodoAnterior } from '@/lib/comparacao'
import { Building2, ChevronDown } from 'lucide-react'

export default function VendasPage() {
  const { data: filiais, isLoading: lFiliais } = useFiliais()
  const { filialSel, setFilialSel, filiaisAtivas, podeEscolher } = useFiltroFilial()
  const [periodo,    setPeriodo]    = useState<Periodo>({ label: 'Mês atual', ...getMesAtual() })
  const [menuFilial, setMenuFilial] = useState(false)

  const filiaisQuery = filiaisAtivas
  const filialAtual  = filiais?.find(f => f.COD_FILIAL === filialSel)

  const periodoAnt = calcularPeriodoAnterior(periodo.inicio, periodo.fim, 'mesmo_periodo')
  const { data: kpis,    error } = useKPIsFilial(filiaisQuery, periodo.inicio, periodo.fim)
  const { data: fatDiario }      = useFaturamentoDiario(filiaisQuery, periodo.inicio, periodo.fim)
  const { data: comparativo }    = useComparativo(
    filiaisQuery, periodo.inicio, periodo.fim, periodoAnt.inicio, periodoAnt.fim
  )
  const { data: distPA }         = useDistribuicaoPA(filiaisQuery, periodo.inicio, periodo.fim)
  const { data: volHora }        = useVolumePorHora(filiaisQuery, periodo.inicio, periodo.fim)
  const { data: heatmap }        = useHeatmap(filiaisQuery, periodo.inicio, periodo.fim)

  const hasScope = filiaisQuery.length > 0
  const loading = useContentLoading({
    filiaisLoading: lFiliais,
    filiaisQuery,
    waiting: hasScope
      ? [
          kpis === undefined,
          fatDiario === undefined,
          comparativo === undefined,
          distPA === undefined,
          volHora === undefined,
          heatmap === undefined,
        ]
      : [],
  })

  if (error) return <DashboardLayout titulo="Vendas"><ErrorBox /></DashboardLayout>

  // Consolida KPIs para insights
  const tv = kpis?.reduce((a, k) => a + k.totalVendas, 0) || 1
  const kpiNorm = kpis?.length ? {
    faturamento:      kpis.reduce((a, k) => a + k.faturamento, 0),
    ticketMedio:      kpis.reduce((a, k) => a + k.faturamento, 0) / tv,
    pecasAtendimento: kpis.reduce((a, k) => a + k.pecasAtendimento * k.totalVendas, 0) / tv,
    precoMedio:       kpis.reduce((a, k) => a + k.precoMedio * k.totalVendas, 0) / tv,
    percentualPA1:    kpis.reduce((a, k) => a + k.percentualPA1 * k.totalVendas, 0) / tv,
    totalVendas:      tv,
  } : null

  const comMeta    = kpis?.filter(k => k.percentualMeta !== null) ?? []
  const metaMedia  = comMeta.length > 0
    ? comMeta.reduce((a, k) => a + (k.percentualMeta ?? 0), 0) / comMeta.length
    : undefined

  return (
    <DashboardLayout
      titulo="Vendas"
      subtitulo="Comparando com o período anterior equivalente"
      loading={loading}
      actions={
        <>
          {podeEscolher && (
          <div className="relative">
            <button type="button" onClick={() => setMenuFilial(!menuFilial)}
              className="filter-trigger">
              <Building2 className="w-3.5 h-3.5 text-[var(--ink-ghost)]" />
              <span className="font-medium">{filialAtual?.FILIAL ?? 'Todas as lojas'}</span>
              <ChevronDown className={cn('w-3.5 h-3.5 text-[var(--ink-ghost)] transition-transform', menuFilial && 'rotate-180')} />
            </button>
            {menuFilial && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuFilial(false)} />
                <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-[var(--border)] rounded-xl py-1 shadow-lg z-20 max-h-60 overflow-y-auto">
                  <button onClick={() => { setFilialSel(''); setMenuFilial(false) }}
                    className={cn('flex items-center w-full px-3 py-2 text-[11px] transition-colors text-left border-b border-[var(--border)]',
                      !filialSel ? 'bg-[var(--acc-pale)] text-[var(--acc)]' : 'text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)]')}>
                    Todas as lojas
                  </button>
                  {filiais?.map(f => (
                    <button key={f.COD_FILIAL} onClick={() => { setFilialSel(f.COD_FILIAL); setMenuFilial(false) }}
                      className={cn('flex items-center justify-between w-full px-3 py-2 text-[11px] transition-colors text-left',
                        f.COD_FILIAL === filialSel ? 'bg-[var(--acc-pale)] text-[var(--acc)]' : 'text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)]')}>
                      <span className="truncate">{f.FILIAL || f.COD_FILIAL}</span>
                      <span className="text-[9px] text-[var(--ink-ghost)] shrink-0 ml-1">{f.COD_FILIAL}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          )}
          <FiltroBar periodo={periodo} onPeriodoChange={setPeriodo} />
        </>
      }
    >
      {/* KPIs — todos respeitam o filtro de período */}
      <VendasKPIStrip kpis={kpis ?? []} comparativo={comparativo ?? []} />

      {/* Insights + Gráfico */}
      <div className="grid grid-cols-[1fr_1.8fr] gap-4">
        <div>
          <SectionTitle label="Pontos de atenção" icon={Lightbulb} />
          {kpiNorm && (
            <InsightsVendas
              kpis={kpiNorm}
              comparativo={comparativo ?? []}
              metaPct={metaMedia}
            />
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-3.5 h-3.5 text-[var(--acc)]" />
              <span className="text-[12px] font-medium text-[var(--ink-muted)]">Faturamento diário</span>
            </div>
            <span className="text-[10px] text-[var(--ink-ghost)] capitalize">{periodo.label}</span>
          </div>
          <Card padding="sm">
            <LineChart dados={fatDiario ?? []} altura={120} />
          </Card>
          <div className="mt-3">
            <div className="flex items-center gap-2 mb-2">
              <ArrowLeftRight className="w-3.5 h-3.5 text-[var(--acc)]" />
              <span className="text-[12px] font-medium text-[var(--ink-muted)]">Comparativo de período</span>
            </div>
            {(comparativo ?? []).length > 0 ? (
              <TabelaComparativo dados={comparativo ?? []} />
            ) : (
              <Card padding="sm">
                <div className="text-[13px] text-[var(--ink-ghost)] py-4 text-center">
                  Sem dados para comparar no período
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* PA / Hora / Heatmap — todos respeitam o filtro */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="sm">
          <SectionTitle label="Distribuição de PA" />
          <PAChart dados={distPA ?? []} />
        </Card>
        <Card padding="sm">
          <SectionTitle label="Volume por hora" />
          <HoraChart dados={volHora ?? []} />
        </Card>
        <Card padding="sm">
          <SectionTitle label="Mapa de calor — hora × dia" />
          <Heatmap dados={heatmap ?? []} />
        </Card>
      </div>
    </DashboardLayout>
  )
}
