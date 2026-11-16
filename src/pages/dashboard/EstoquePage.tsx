import { useState } from 'react'
import { BarChart3, RefreshCw, Package, Lightbulb, AlertTriangle, XCircle, Building2, ChevronDown, Layers, Store } from 'lucide-react'
import { DashboardLayout }        from '@/components/layout'
import { ErrorBox, FiltroBar, KPICard, SectionTitle, Card, Badge, type Periodo } from '@/components/ui'
import { CurvaABCTabela }         from '@/features/estoque/components/CurvaABCTabela'
import { GiroChart }              from '@/features/estoque/components/GiroChart'
import { ParadosComEstoque }      from '@/features/estoque/components/ParadosComEstoque'
import { RupturaTabela }          from '@/features/estoque/components/RupturaTabela'
import {
  useCurvaABC, useGiroPorGrupo, useParadosComEstoque, useRuptura, useResumoEstoque,
} from '@/features/estoque/hooks/useEstoqueData'
import { useFiliais }             from '@/hooks/useFiliais'
import { useFiltroFilial }        from '@/hooks/useFiltroFilial'
import { useContentLoading }      from '@/hooks/useSession'
import { getMesAtual, fmt, cn }   from '@/lib/utils'

type Aba = 'abc' | 'giro' | 'parados' | 'ruptura' | 'insights'

const ABAS: { id: Aba; label: string; icon: any }[] = [
  { id: 'abc',      label: 'Curva ABC',  icon: BarChart3   },
  { id: 'giro',     label: 'Giro',       icon: RefreshCw   },
  { id: 'parados',  label: 'Parados',    icon: Package     },
  { id: 'ruptura',  label: 'Rupturas',   icon: XCircle     },
  { id: 'insights', label: 'Insights',   icon: Lightbulb   },
]

export default function EstoquePage() {
  const { data: filiais, isLoading: lFiliais } = useFiliais()
  const { filialSel, setFilialSel, filiaisAtivas } = useFiltroFilial()
  const [periodo,    setPeriodo]    = useState<Periodo>({ label: 'Mês atual', ...getMesAtual() })
  const [abaAtiva,   setAbaAtiva]   = useState<Aba>('abc')
  const [diasParado, setDiasParado] = useState(60)
  const [menuFilial,       setMenuFilial]       = useState(false)
  const [visaoConsolidada, setVisaoConsolidada] = useState(true)

  const filiaisQuery    = filiaisAtivas
  const mostrarToggle   = !filialSel && (filiaisQuery.length > 1)
  const filialAtual  = filiais?.find(f => f.COD_FILIAL === filialSel)


  // Carrega só o necessário: KPIs + aba ativa (insights puxa o restante sob demanda).
  const loadAbc      = abaAtiva === 'abc' || abaAtiva === 'insights'
  const loadGiro     = abaAtiva === 'giro' || abaAtiva === 'insights'
  const loadParados  = abaAtiva === 'parados' || abaAtiva === 'insights'
  const loadRuptura  = abaAtiva === 'ruptura' || abaAtiva === 'insights'
  const consolidado  = mostrarToggle ? visaoConsolidada : undefined

  const { data: resumo }     = useResumoEstoque(filiaisQuery, periodo.inicio, periodo.fim)
  const { data: abc, error } = useCurvaABC(filiaisQuery, periodo.inicio, periodo.fim, consolidado, loadAbc)
  const { data: giro }       = useGiroPorGrupo(filiaisQuery, periodo.inicio, periodo.fim, consolidado, loadGiro)
  const { data: parados }    = useParadosComEstoque(filiaisQuery, diasParado, loadParados)
  const { data: ruptura }    = useRuptura(filiaisQuery, 30, loadRuptura)

  const hasScope = filiaisQuery.length > 0
  const loading = useContentLoading({
    filiaisLoading: lFiliais,
    filiaisQuery,
    waiting: hasScope
      ? [
          resumo === undefined,
          loadAbc && abc === undefined,
          loadGiro && giro === undefined,
          loadParados && parados === undefined,
          loadRuptura && ruptura === undefined,
        ]
      : [],
  })

  if (error) return <DashboardLayout titulo="Estoque"><ErrorBox /></DashboardLayout>

  // Quando "por loja": dados brutos. Quando "consolidado": agrupa por produto somando estoque
  const abcProcessado = (() => {
    if (!abc) return []
    if (!mostrarToggle || visaoConsolidada) return abc
    // Por loja: retorna como está (cada linha já é por produto+filial da query)
    return abc
  })()

  const curvaA    = abcProcessado?.filter((d: any) => d.curva === 'A').length ?? 0
  const curvaB    = abcProcessado?.filter((d: any) => d.curva === 'B').length ?? 0
  const curvaC    = abcProcessado?.filter((d: any) => d.curva === 'C').length ?? 0
  const fatTotal  = abcProcessado?.reduce((a: number, d: any) => a + d.faturamento, 0) ?? 0
  const giroMedio = giro?.length
    ? Math.round(giro.reduce((a: number, g: any) => a + g.giroMensal, 0) / giro.length)
    : 0

  // Insights de estoque
  const insightsEstoque = () => {
    const items: { titulo: string; descricao: string; acao: string; sev: string }[] = []
    const totalParados = parados?.length ?? 0
    const valorParado  = parados?.reduce((a: number, d: any) => a + d.valorEstoque, 0) ?? 0
    const totalRuptura = ruptura?.length ?? 0

    if (totalRuptura > 0) {
      items.push({
        titulo: `${totalRuptura} produtos em ruptura — estoque zerado`,
        descricao: `Esses produtos venderam nos últimos 30 dias mas o estoque zerou. Risco de perda de vendas.`,
        acao: 'Acionar reposição imediata dos produtos em ruptura. Verificar pedidos em aberto.',
        sev: 'critico',
      })
    }
    if (totalParados > 0) {
      items.push({
        titulo: `${totalParados} SKUs parados com ${fmt.currencyShort(valorParado)} em estoque`,
        descricao: 'Capital imobilizado sem giro. Produtos com estoque positivo mas sem venda recente.',
        acao: 'Criar campanha de liquidação. Avaliar transferência entre lojas ou devolução ao fornecedor.',
        sev: valorParado > 50000 ? 'critico' : 'alerta',
      })
    }
    if (giroMedio < 3) {
      items.push({
        titulo: `Giro médio baixo: ${giroMedio} un/mês`,
        descricao: 'Estoque com rotação lenta. Pode indicar mix inadequado ou excesso de compras.',
        acao: 'Revisar política de compras. Priorizar Curva A no reabastecimento.',
        sev: 'alerta',
      })
    }
    const coberturaMedia = giro?.filter((g: any) => g.coberturaDias > 0)
      .reduce((a: number, g: any) => a + g.coberturaDias, 0) / Math.max(giro?.filter((g: any) => g.coberturaDias > 0).length ?? 1, 1)
    if (coberturaMedia > 60) {
      items.push({
        titulo: `Cobertura média de ${Math.round(coberturaMedia)} dias — estoque elevado`,
        descricao: 'Cobertura acima de 60 dias indica excesso de estoque em relação às vendas.',
        acao: 'Avaliar redução de compras e liquidação de excedentes.',
        sev: 'alerta',
      })
    }
    if (curvaA > 0 && curvaC > curvaA * 3) {
      items.push({
        titulo: `Mix desequilibrado: ${curvaC} produtos Curva C vs ${curvaA} Curva A`,
        descricao: 'Muitos produtos de baixo giro em relação aos de alto giro.',
        acao: 'Reduzir variedade de produtos C e concentrar investimento nos produtos A.',
        sev: 'info',
      })
    }
    if (items.length === 0) {
      items.push({
        titulo: 'Estoque com desempenho saudável',
        descricao: 'Nenhum alerta crítico identificado no período.',
        acao: 'Continue monitorando giro e cobertura.',
        sev: 'positivo',
      })
    }
    return items
  }

  const SEV_STYLE: Record<string, string> = {
    critico:  'bg-[var(--danger-bg)] border-red-200 text-[var(--danger)]',
    alerta:   'bg-[var(--warn-bg)] border-amber-200 text-[var(--warn)]',
    positivo: 'bg-[var(--success-bg)] border-green-200 text-[var(--success)]',
    info:     'bg-[var(--info-bg)] border-blue-200 text-[var(--info)]',
  }

  return (
    <DashboardLayout
      titulo="Estoque"
      subtitulo="Mix, giro e posição de estoque"
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
      {/* Toggle visão consolidada vs por loja — só aparece em "Todas as lojas" */}
      {mostrarToggle && (
        <div className="flex items-start gap-3 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-xl p-3">
          <div className="flex gap-1 shrink-0 bg-white border border-[var(--border)] rounded-lg p-0.5">
            <button onClick={() => setVisaoConsolidada(true)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all',
                visaoConsolidada ? 'bg-[var(--acc)] text-white shadow-sm' : 'text-[var(--ink-ghost)] hover:text-[var(--ink-muted)]')}>
              <Layers className="w-3.5 h-3.5" />
              Consolidada
            </button>
            <button onClick={() => setVisaoConsolidada(false)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all',
                !visaoConsolidada ? 'bg-[var(--acc)] text-white shadow-sm' : 'text-[var(--ink-ghost)] hover:text-[var(--ink-muted)]')}>
              <Store className="w-3.5 h-3.5" />
              Por loja
            </button>
          </div>
          <div className="flex flex-col gap-0.5">
            {visaoConsolidada ? (
              <>
                <span className="text-[11px] font-medium text-[var(--ink)]">Visão consolidada — estoque somado de todas as lojas</span>
                <span className="text-[10px] text-[var(--ink-ghost)]">Cada produto aparece uma vez com o estoque total somado entre as lojas. Ideal para entender o mix geral do grupo.</span>
              </>
            ) : (
              <>
                <span className="text-[11px] font-medium text-[var(--ink)]">Visão por loja — cada loja individualmente</span>
                <span className="text-[10px] text-[var(--ink-ghost)]">O mesmo produto pode aparecer várias vezes, uma por loja. Ideal para identificar diferenças de estoque entre lojas.</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* KPIs — 6 cards incluindo resumo real */}
      <div className="grid grid-cols-4 xl:grid-cols-8 gap-3">
        <KPICard label="Valor em estoque"  valor={resumo?.valorEstoque ?? 0} formato="moeda" destaque="primary" />
        <KPICard label="Peças em estoque"  valor={resumo?.pecasEstoque ?? 0} formato="numero" destaque="neutral" />
        <KPICard label="SKUs com estoque"  valor={resumo?.totalSkus ?? abcProcessado?.length ?? 0} formato="numero" destaque="primary" />
        <KPICard label="Curva A"           valor={curvaA}  formato="numero" destaque="success" />
        <KPICard label="Curva B"           valor={curvaB}  formato="numero" destaque="warn" />
        <KPICard label="Curva C"           valor={curvaC}  formato="numero" destaque="neutral" />
        <KPICard label="Parados c/ estoque" valor={resumo?.skusParados ?? parados?.length ?? 0} formato="numero"
          destaque={(resumo?.skusParados ?? 0) > 50 ? 'danger' : 'warn'} />
        <KPICard label="Rupturas"          valor={resumo?.rupturas ?? ruptura?.length ?? 0} formato="numero"
          destaque={(resumo?.rupturas ?? 0) > 0 ? 'danger' : 'success'} />
      </div>

      {/* Abas */}
      <div className="flex items-center gap-1 bg-[var(--bg-subtle)] p-1 rounded-xl w-fit">
        {ABAS.map(aba => {
          const Icon    = aba.icon
          const isAtivo = abaAtiva === aba.id
          const badge   = aba.id === 'parados' ? (parados?.length ?? resumo?.skusParados)
                        : aba.id === 'ruptura'  ? (ruptura?.length ?? resumo?.rupturas)
                        : aba.id === 'insights' ? (loadAbc && loadParados && loadRuptura
                            ? insightsEstoque().filter(i => i.sev === 'critico').length
                            : null)
                        : null
          return (
            <button key={aba.id} onClick={() => setAbaAtiva(aba.id)}
              className={cn('flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                isAtivo ? 'bg-white text-[var(--acc)] shadow-[var(--shadow-card)]'
                         : 'text-[var(--ink-ghost)] hover:text-[var(--ink-muted)]')}>
              <Icon className="w-3.5 h-3.5" />
              {aba.label}
              {badge != null && badge > 0 && (
                <Badge variant={aba.id === 'ruptura' ? 'danger' : 'warn'}>{badge}</Badge>
              )}
            </button>
          )
        })}
      </div>

      {/* Conteúdo das abas */}
      {abaAtiva === 'abc' && (
        <CurvaABCTabela dados={abcProcessado ?? []} />
      )}

      {abaAtiva === 'giro' && (
        <div className="grid grid-cols-2 gap-4">
          <GiroChart dados={giro ?? []} />
          <Card padding="sm">
            <SectionTitle label="Ranking por grupo — faturamento e cobertura" />
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {['#','Grupo','Faturamento','Qtd','Giro/mês','Cobertura'].map((h,i) => (
                      <th key={h} className={cn('text-[9px] text-[var(--ink-ghost)] uppercase tracking-wider px-2 py-2 font-medium', i >= 2 ? 'text-right' : 'text-left')}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(giro as any[] ?? []).slice(0, 12).map((g: any, i: number) => (
                    <tr key={g.GRUPO_PRODUTO} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-subtle)]">
                      <td className="px-2 py-2 text-[10px] text-[var(--ink-ghost)]">{i+1}</td>
                      <td className="px-2 py-2 text-[11px] font-medium text-[var(--ink)]">{g.GRUPO_PRODUTO}</td>
                      <td className="px-2 py-2 text-right text-[11px] text-[var(--acc)] font-medium">{fmt.currencyShort(g.faturamento)}</td>
                      <td className="px-2 py-2 text-right text-[10px] text-[var(--ink-muted)]">{fmt.number(g.qtdVendida,0)}</td>
                      <td className={cn('px-2 py-2 text-right text-[11px] font-medium',
                        g.giroMensal >= 10 ? 'text-[var(--success)]' : g.giroMensal >= 3 ? 'text-[var(--acc)]' : 'text-[var(--warn)]')}>
                        {fmt.number(g.giroMensal,1)}
                      </td>
                      <td className={cn('px-2 py-2 text-right text-[11px]',
                        g.coberturaDias > 0 && g.coberturaDias <= 30 ? 'text-[var(--danger)]'
                        : g.coberturaDias > 60 ? 'text-[var(--warn)]' : 'text-[var(--success)]')}>
                        {g.coberturaDias > 0 ? `${Math.round(g.coberturaDias)}d` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

        {/* Painel explicativo — Cobertura */}
        <div className="mt-1 border border-[var(--border)] rounded-xl overflow-hidden">
          <details className="group">
            <summary className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-subtle)] hover:bg-[var(--acc-pale)] transition-colors cursor-pointer list-none">
              <svg className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              <span className="text-[11px] font-medium text-[var(--acc)] flex-1">O que é Cobertura de Estoque?</span>
              <svg className="w-3.5 h-3.5 text-[var(--ink-ghost)] group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </summary>
            <div className="px-4 py-4 bg-white border-t border-[var(--border)] flex flex-col gap-4">
              <p className="text-[12px] text-[var(--ink-muted)] leading-relaxed">A cobertura indica por quantos dias o estoque atual é suficiente para atender a demanda, com base no ritmo de vendas atual. Quando a cobertura é <code>—</code>, significa que não há dados de estoque cadastrados para esse grupo.</p>
              <div className="bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-4 py-3">
                <div className="text-[9px] text-[var(--ink-ghost)] uppercase tracking-wider mb-1.5 font-medium">Fórmula</div>
                <code className="text-[12px] text-[var(--acc)] font-mono">Cobertura (dias) = Estoque atual ÷ (Qtd vendida ÷ Dias do período)</code>
                <p className="text-[11px] text-[var(--ink-ghost)] mt-1.5">Exemplo: 200 camisetas em estoque, vendendo 10/dia → cobertura = 20 dias.</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-start gap-2.5 px-3 py-2 rounded-lg border text-[11px] text-[var(--danger)] bg-[var(--danger-bg)] border-red-200"><span className="font-medium shrink-0 min-w-[110px]">Abaixo de 15 dias</span><span className="opacity-90">Risco de ruptura — solicitar reposição urgente.</span></div>
                <div className="flex items-start gap-2.5 px-3 py-2 rounded-lg border text-[11px] text-[var(--success)] bg-[var(--success-bg)] border-green-200"><span className="font-medium shrink-0 min-w-[110px]">15 a 45 dias</span><span className="opacity-90">Cobertura ideal para produtos de moda.</span></div>
                <div className="flex items-start gap-2.5 px-3 py-2 rounded-lg border text-[11px] text-[var(--warn)] bg-[var(--warn-bg)] border-amber-200"><span className="font-medium shrink-0 min-w-[110px]">Acima de 60 dias</span><span className="opacity-90">Estoque excessivo — capital imobilizado, risco de encalhe.</span></div>
              </div>
            </div>
          </details>
        </div>
      </div>
      )}

      {abaAtiva === 'parados' && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[11px] text-[var(--ink-ghost)]">Parados há mais de:</span>
            <div className="flex gap-1.5">
              {[30, 60, 90, 120].map(d => (
                <button key={d} onClick={() => setDiasParado(d)}
                  className={cn('text-[10px] px-3 py-1 rounded-md border transition-colors font-medium',
                    diasParado === d
                      ? 'bg-[var(--acc-pale)] text-[var(--acc)] border-[var(--acc-border)]'
                      : 'bg-white text-[var(--ink-ghost)] border-[var(--border)] hover:border-[var(--acc-border)]')}>
                  {d}d
                </button>
              ))}
            </div>
          </div>
          <ParadosComEstoque dados={parados ?? []} />
        </div>
      )}

      {abaAtiva === 'ruptura' && (
        <RupturaTabela dados={ruptura ?? []} />
      )}

      {abaAtiva === 'insights' && (
        <div className="flex flex-col gap-3">
          <SectionTitle label="Análise e recomendações do estoque" icon={Lightbulb} />
          {insightsEstoque().map((ins, i) => (
            <div key={i} className={cn('border rounded-xl px-4 py-3 flex gap-3', SEV_STYLE[ins.sev])}>
              {ins.sev === 'critico' || ins.sev === 'alerta'
                ? <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                : <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />}
              <div className="flex-1">
                <div className="text-[12px] font-medium mb-0.5">{ins.titulo}</div>
                <div className="text-[11px] opacity-80 mb-1.5">{ins.descricao}</div>
                <div className="flex items-center gap-1.5 text-[10px] font-medium opacity-90">
                  <Lightbulb className="w-3 h-3" /> {ins.acao}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
