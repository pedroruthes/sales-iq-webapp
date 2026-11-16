import { useState } from 'react'
import { DashboardLayout }          from '@/components/layout'
import { ErrorBox, FiltroBar, Card, type Periodo } from '@/components/ui'
import { Aniversariantes }          from '@/features/clientes/components/Aniversariantes'
import { ClientesDormentes }        from '@/features/clientes/components/ClientesDormentes'
import { RankingClientes }          from '@/features/clientes/components/RankingClientes'
import { SemVinculoChart }          from '@/features/clientes/components/SemVinculoChart'
import {
  DiasSemCompraFilter,
  DEFAULT_DIAS_RANGE,
  labelDiasRange,
  type DiasRange,
} from '@/features/clientes/components/DiasSemCompraFilter'
import {
  useClientesResumo,
  useClientesDormentes, useRankingClientes, useSemVinculo,
} from '@/features/clientes/hooks/useClientesData'
import { useFiliais }               from '@/hooks/useFiliais'
import { useFiltroFilial }          from '@/hooks/useFiltroFilial'
import { useContentLoading }        from '@/hooks/useSession'
import { getMesAtual, fmt, cn }     from '@/lib/utils'
import { Users, UserPlus, Unlink, Moon, Building2, ChevronDown } from 'lucide-react'

function KPIMini({ label, valor, cor, icon: Icon }: {
  label: string; valor: string | number; cor?: string; icon?: any
}) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-xl p-3 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 mb-1.5">
        {Icon && <Icon className="w-3 h-3 text-[var(--ink-ghost)]" />}
        <span className="text-[9px] text-[var(--ink-ghost)] uppercase tracking-wide font-medium">{label}</span>
      </div>
      <div className={cn('text-[22px] font-medium leading-none', cor ?? 'text-[var(--ink)]')}>
        {typeof valor === 'number' ? valor.toLocaleString('pt-BR') : valor}
      </div>
    </div>
  )
}

export default function ClientesPage() {
  const { data: filiais, isLoading: lFiliais } = useFiliais()
  const { filialSel, setFilialSel, filiaisAtivas } = useFiltroFilial()
  const [periodo,   setPeriodo]   = useState<Periodo>({ label: 'Mês atual', ...getMesAtual() })
  const [menuFilial, setMenuFilial] = useState(false)
  const [diasRange, setDiasRange] = useState<DiasRange>(DEFAULT_DIAS_RANGE)

  const filiaisQuery = filiaisAtivas
  const filialAtual  = filiais?.find(f => f.COD_FILIAL === filialSel)

  const { data: resumo, error } = useClientesResumo(filiaisQuery, periodo.inicio, periodo.fim)
  const { data: dormentes }     = useClientesDormentes(
    filiaisQuery,
    diasRange.diasMin,
    diasRange.diasMax
  )
  const { data: ranking }       = useRankingClientes(filiaisQuery, periodo.inicio, periodo.fim)
  const { data: semVin }        = useSemVinculo(filiaisQuery, periodo.inicio, periodo.fim)

  const hasScope = filiaisQuery.length > 0
  const loading = useContentLoading({
    filiaisLoading: lFiliais,
    filiaisQuery,
    waiting: hasScope
      ? [
          resumo === undefined,
          dormentes === undefined,
          ranking === undefined,
          semVin === undefined,
        ]
      : [],
  })

  if (error) return <DashboardLayout titulo="Clientes"><ErrorBox /></DashboardLayout>

  return (
    <DashboardLayout
      titulo="Clientes"
      subtitulo="Análise da carteira de clientes"
      loading={loading}
      actions={
        <>
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
                    className={cn('flex items-center w-full px-3 py-2 text-[11px] transition-colors text-left',
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
          <FiltroBar periodo={periodo} onPeriodoChange={setPeriodo} />
        </>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3">
        <KPIMini label="Carteira (12 meses)" valor={resumo?.totalCarteira ?? 0} icon={Users} />
        <KPIMini label="Sem vínculo"
          valor={resumo ? `${fmt.number(isNaN(resumo.semVinculoPct) ? 0 : resumo.semVinculoPct, 1)}%` : '—'}
          cor={(resumo?.semVinculoPct ?? 0) > 20 ? 'text-[var(--danger)]' : (resumo?.semVinculoPct ?? 0) > 10 ? 'text-[var(--warn)]' : 'text-[var(--success)]'}
          icon={Unlink} />
        <KPIMini label="Dormentes 60–89d"
          valor={resumo?.dormentes60 ?? 0}
          cor={(resumo?.dormentes60 ?? 0) > 50 ? 'text-[var(--warn)]' : 'text-[var(--ink)]'}
          icon={Moon} />
        <KPIMini label="Dormentes 90–365d"
          valor={resumo?.dormentes90 ?? 0}
          cor={(resumo?.dormentes90 ?? 0) > 30 ? 'text-[var(--danger)]' : 'text-[var(--warn)]'}
          icon={Moon} />
        <KPIMini label="Sem compra no período"
          valor={resumo ? `${fmt.number(((resumo.semCompraPeriodoQtd ?? 0) / Math.max(resumo.totalCarteira, 1)) * 100, 1)}%` : '—'}
          icon={UserPlus} />
      </div>

      <Card padding="sm">
        <div className="text-[12px] font-medium text-[var(--ink-muted)] mb-2">
          Filtro de inativos · {labelDiasRange(diasRange)} sem compra
        </div>
        <DiasSemCompraFilter value={diasRange} onChange={setDiasRange} compact />
      </Card>

      {/* Aniversariantes + Dormentes lado a lado */}
      <div className="grid grid-cols-2 gap-4">
        <Aniversariantes filiais={filiaisQuery} />
        <ClientesDormentes
          dados={dormentes ?? []}
          titulo={`Clientes inativos (${labelDiasRange(diasRange)})`}
        />
      </div>

      {/* Ranking + Sem vínculo */}
      <div className="grid grid-cols-[1.2fr_1fr] gap-4">
        <RankingClientes dados={ranking ?? []} />
        <SemVinculoChart dados={semVin ?? []} />
      </div>
    </DashboardLayout>
  )
}
