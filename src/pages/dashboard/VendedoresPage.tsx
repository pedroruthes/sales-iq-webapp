import { useState } from 'react'
import { Star, UserX } from 'lucide-react'
import { DashboardLayout }      from '@/components/layout'
import { ErrorBox, FiltroBar, type Periodo } from '@/components/ui'
import { VendedoresKPIStrip }   from '@/features/vendedores/components/VendedoresKPIStrip'
import { VendedoresTabela }     from '@/features/vendedores/components/VendedoresTabela'
import { SemVinculoChart }      from '@/features/clientes/components/SemVinculoChart'
import { useKPIsVendedores }    from '@/features/vendedores/hooks/useVendedoresData'
import { useSemVinculo }        from '@/features/clientes/hooks/useClientesData'
import { useFiliais }           from '@/hooks/useFiliais'
import { useFiltroFilial }      from '@/hooks/useFiltroFilial'
import { useContentLoading }    from '@/hooks/useSession'
import { getMesAtual, cn }      from '@/lib/utils'

type Aba = 'desempenho' | 'sem-vinculo'

export default function VendedoresPage() {
  const { data: filiais, isLoading: lFiliais } = useFiliais()
  const { filialSel, setFilialSel, filiaisAtivas } = useFiltroFilial()
  const [periodo,   setPeriodo]  = useState<Periodo>({ label: 'Mês atual', ...getMesAtual() })
  const [aba,       setAba]       = useState<Aba>('desempenho')

  const { data: vendedores, error } = useKPIsVendedores(filiaisAtivas, periodo.inicio, periodo.fim)
  const { data: semVin }            = useSemVinculo(
    filiaisAtivas,
    periodo.inicio, periodo.fim
  )

  const hasScope = filiaisAtivas.length > 0
  const loading = useContentLoading({
    filiaisLoading: lFiliais,
    filiaisQuery: filiaisAtivas,
    waiting: hasScope ? [vendedores === undefined, semVin === undefined] : [],
  })

  if (error) return <DashboardLayout titulo="Vendedores"><ErrorBox message="Erro ao carregar dados da equipe." /></DashboardLayout>

  return (
    <DashboardLayout
      titulo="Vendedores"
      subtitulo="Desempenho da equipe de vendas"
      loading={loading}
      actions={
        <FiltroBar
          periodo={periodo} onPeriodoChange={setPeriodo}
          filiais={filiais} filialSelecionada={filialSel}
          onFilialChange={setFilialSel} labelFilial="Loja"
        />
      }
    >
      {/* KPI strip */}
      <VendedoresKPIStrip dados={vendedores ?? []} />

      {/* Abas */}
      <div className="flex items-center gap-1 bg-[var(--bg-subtle)] p-1 rounded-xl w-fit">
        {([
          { id: 'desempenho'  as Aba, label: 'Desempenho da equipe', icon: Star   },
          { id: 'sem-vinculo' as Aba, label: 'Vendas sem vínculo',   icon: UserX  },
        ]).map(a => {
          const Icon = a.icon
          return (
            <button key={a.id} onClick={() => setAba(a.id)}
              className={cn('flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                aba === a.id
                  ? 'bg-white text-[var(--acc)] shadow-[var(--shadow-card)]'
                  : 'text-[var(--ink-ghost)] hover:text-[var(--ink-muted)]')}>
              <Icon className="w-3.5 h-3.5" />
              {a.label}
            </button>
          )
        })}
      </div>

      {/* Conteúdo da aba */}
      {aba === 'desempenho' && (
        <VendedoresTabela dados={vendedores ?? []} />
      )}

      {aba === 'sem-vinculo' && (
        <SemVinculoChart dados={semVin ?? []} />
      )}
    </DashboardLayout>
  )
}
