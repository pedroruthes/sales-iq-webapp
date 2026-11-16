import { useState } from 'react'
import { calcularPeriodoAnterior } from '@/lib/comparacao'
import { DashboardLayout } from '@/components/layout'
import { ErrorBox, FiltroBar, type Periodo } from '@/components/ui'
import { KPIStrip } from '@/features/dashboard/components/KPIStrip'
import { FaturamentoPorLoja } from '@/features/dashboard/components/FaturamentoPorLoja'
import { MixCategorias } from '@/features/dashboard/components/MixCategorias'
import { EvolucaoFaturamento } from '@/features/dashboard/components/EvolucaoFaturamento'
import { MetaLojasResumo } from '@/features/dashboard/components/MetaLojasResumo'
import { RankingVendedores } from '@/features/dashboard/components/RankingVendedores'
import { CardIA } from '@/features/dashboard/components/CardIA'
import {
  useKPIsFilial,
  useVendedoresRede,
  useFaturamentoDiario,
} from '@/features/vendas/hooks/useVendasData'
import { useGiroPorGrupo } from '@/features/estoque/hooks/useEstoqueData'
import { useContentLoading, useCurrentUser } from '@/hooks/useSession'
import { useFiliaisAtivas } from '@/hooks/useFiliaisAtivas'
import { getMesAtual } from '@/lib/utils'
import { num } from '@/lib/num'

export default function DashboardPage() {
  const user = useCurrentUser()
  const { filiaisAtivas, temEscopo } = useFiliaisAtivas()
  const [periodo, setPeriodo] = useState<Periodo>({ label: 'Mês atual', ...getMesAtual() })

  const periodoAnt = calcularPeriodoAnterior(periodo.inicio, periodo.fim, 'mesmo_periodo')

  const codigoVendedor = user.isVendedora ? user.codigoVendedor : undefined
  const { data: kpisAt, error } = useKPIsFilial(filiaisAtivas, periodo.inicio, periodo.fim, codigoVendedor)
  const { data: kpisAnt } = useKPIsFilial(filiaisAtivas, periodoAnt.inicio, periodoAnt.fim)

  const filiaisTop = filiaisAtivas.slice(0, 5)
  const { data: vendedores } = useVendedoresRede(filiaisTop, periodo.inicio, periodo.fim)
  const { data: giroGrupos } = useGiroPorGrupo(filiaisAtivas, periodo.inicio, periodo.fim)
  const { data: fatDiario } = useFaturamentoDiario(filiaisAtivas, periodo.inicio, periodo.fim)

  const hasScope = filiaisAtivas.length > 0
  const loading = useContentLoading({
    filiaisQuery: filiaisAtivas,
    waiting: hasScope
      ? [
          kpisAt === undefined,
          kpisAnt === undefined,
          vendedores === undefined,
          giroGrupos === undefined,
          fatDiario === undefined,
        ]
      : [],
  })

  const hoje = new Date()
  const fimEfetivo = periodo.fim > hoje ? hoje : periodo.fim
  const diasPeriodo = Math.max(
    1,
    Math.round((fimEfetivo.getTime() - periodo.inicio.getTime()) / 86_400_000) + 1
  )
  const metaTotal = (kpisAt ?? []).reduce((a, k) => a + num(k.meta), 0)
  const metaDiaria = metaTotal > 0 ? metaTotal / diasPeriodo : undefined

  const subtitulo = temEscopo
    ? `Loja ${filiaisAtivas[0] ?? ''} · indicadores do período`
    : user.isProprietario || user.isSupervisora
      ? `${kpisAt?.length ?? 0} lojas ativas · visão consolidada`
      : `Loja ${user.filialPadrao ?? ''} · indicadores do período`

  if (error) {
    return (
      <DashboardLayout titulo="Dashboard">
        <ErrorBox message="Erro ao carregar indicadores. Verifique a conexão com o banco." />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      titulo="Dashboard"
      subtitulo={subtitulo}
      actions={<FiltroBar periodo={periodo} onPeriodoChange={setPeriodo} />}
      loading={loading}
    >
      <KPIStrip kpisAtual={kpisAt ?? []} kpisAnterior={kpisAnt ?? []} />

      <EvolucaoFaturamento
        dados={fatDiario ?? []}
        inicio={periodo.inicio}
        fim={periodo.fim}
        metaDiaria={metaDiaria}
      />

      <div className="grid grid-cols-[1.15fr_1.35fr] gap-4">
        <FaturamentoPorLoja kpisAtual={kpisAt ?? []} kpisAnterior={kpisAnt ?? []} />
        <MixCategorias dados={giroGrupos ?? []} />
      </div>

      <MetaLojasResumo kpis={kpisAt ?? []} />

      <div className="grid grid-cols-2 gap-4 items-start">
        <RankingVendedores dados={vendedores ?? []} top={5} />
        <CardIA
          kpis={kpisAt ?? []}
          filiais={filiaisAtivas}
          periodoInicio={periodo.inicio}
          periodoFim={periodo.fim}
        />
      </div>
    </DashboardLayout>
  )
}
