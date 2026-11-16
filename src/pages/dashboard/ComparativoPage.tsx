import { useState, useEffect, useMemo } from 'react'
import { ArrowLeftRight, ChevronDown } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Card, SectionTitle, FiltroBar, ErrorBox, type Periodo } from '@/components/ui'
import { useContentLoading, useCurrentUser } from '@/hooks/useSession'
import { useFiliais } from '@/hooks/useFiliais'
import { useEscopoFilial } from '@/components/layout/EscopoSelector'
import { useKPIsFilial } from '@/features/vendas/hooks/useVendasData'
import { getMesAtual, fmt, cn } from '@/lib/utils'

function trimCod(v: unknown): string {
  return String(v ?? '').trim()
}

export default function ComparativoPage() {
  const user = useCurrentUser()
  const { data: filiais, isLoading: lFiliais } = useFiliais()
  const { codigo: escopo } = useEscopoFilial()
      const [periodo, setPeriodo] = useState<Periodo>({ label: 'Mês atual', ...getMesAtual() })
  const [filialSel, setFilialSel] = useState<string>('')
  const [menuFilial, setMenuFilial] = useState(false)

  // Rede = lojas acessíveis via API (admin/dono) ∩ JWT quando o JWT tem escopo
  const filiaisRede = useMemo(() => {
    const fromApi = (filiais ?? []).map((f) => trimCod(f.COD_FILIAL)).filter(Boolean)
    const fromJwt = user.filiais.map(trimCod).filter(Boolean)
    if (user.isAdmin || user.isProprietario || user.isDono) {
      return fromApi.length ? fromApi : fromJwt
    }
    if (!fromJwt.length) return fromApi
    if (!fromApi.length) return fromJwt
    return fromApi.filter((c) => fromJwt.includes(c))
  }, [filiais, user.filiais, user.isAdmin, user.isProprietario, user.isDono])

  const filiaisLista = useMemo(() => {
    const set = new Set(filiaisRede)
    return (filiais ?? []).filter((f) => set.has(trimCod(f.COD_FILIAL)))
  }, [filiais, filiaisRede])

  useEffect(() => {
    if (filialSel && filiaisRede.includes(trimCod(filialSel))) return
    const prefer =
      trimCod(escopo) ||
      trimCod(user.filialPadrao) ||
      filiaisRede[0] ||
      ''
    if (prefer && filiaisRede.includes(prefer)) {
      setFilialSel(prefer)
    } else if (filiaisRede[0]) {
      setFilialSel(filiaisRede[0])
    }
  }, [filiaisRede, escopo, user.filialPadrao, filialSel])

  const { data: kpisRede, error } = useKPIsFilial(filiaisRede, periodo.inicio, periodo.fim)
  const filialAtual = filiaisLista.find((f) => trimCod(f.COD_FILIAL) === trimCod(filialSel))
  const kpiLoja = kpisRede?.find((k) => trimCod(k.codigoFilial) === trimCod(filialSel))

  const hasScope = filiaisRede.length > 0
  const loading = useContentLoading({
    filiaisLoading: lFiliais,
    filiaisQuery: filiaisRede,
    waiting: hasScope ? [kpisRede === undefined] : [],
  })

  if (error) {
    return (
      <DashboardLayout titulo="Loja vs Rede">
        <ErrorBox />
      </DashboardLayout>
    )
  }

  const tv = kpisRede?.reduce((a, k) => a + k.totalVendas, 0) || 1
  const tp = kpisRede?.reduce((a, k) => a + k.totalPecas, 0) || 1
  const mediaRede = kpisRede?.length
    ? {
        faturamento: kpisRede.reduce((a, k) => a + k.faturamento, 0) / kpisRede.length,
        ticketMedio: kpisRede.reduce((a, k) => a + k.faturamento, 0) / tv,
        pecasAtendimento: tp / tv,
        precoMedio: kpisRede.reduce((a, k) => a + k.faturamento, 0) / tp,
        totalVendas: kpisRede.reduce((a, k) => a + k.totalVendas, 0) / kpisRede.length,
        percentualPA1: kpisRede.reduce((a, k) => a + (k.percentualPA1 ?? 0), 0) / kpisRede.length,
      }
    : null

  const ranking = [...(kpisRede ?? [])].sort((a, b) => b.faturamento - a.faturamento)
  const posicao = ranking.findIndex((k) => trimCod(k.codigoFilial) === trimCod(filialSel)) + 1

  const diff = (loja: number, rede: number) => (rede > 0 ? ((loja - rede) / rede) * 100 : 0)

  const indicadores =
    kpiLoja && mediaRede
      ? [
          {
            label: 'Faturamento',
            loja: fmt.currencyShort(kpiLoja.faturamento),
            rede: fmt.currencyShort(mediaRede.faturamento),
            variacao: diff(kpiLoja.faturamento, mediaRede.faturamento),
            melhorAlto: true,
          },
          {
            label: 'Ticket Medio',
            loja: fmt.currency(kpiLoja.ticketMedio),
            rede: fmt.currency(mediaRede.ticketMedio),
            variacao: diff(kpiLoja.ticketMedio, mediaRede.ticketMedio),
            melhorAlto: true,
          },
          {
            label: 'Pecas / Atend.',
            loja: fmt.number(kpiLoja.pecasAtendimento, 1),
            rede: fmt.number(mediaRede.pecasAtendimento, 1),
            variacao: diff(kpiLoja.pecasAtendimento, mediaRede.pecasAtendimento),
            melhorAlto: true,
          },
          {
            label: 'Preco Medio',
            loja: fmt.currencyShort(kpiLoja.precoMedio),
            rede: fmt.currencyShort(mediaRede.precoMedio),
            variacao: diff(kpiLoja.precoMedio, mediaRede.precoMedio),
            melhorAlto: true,
          },
          {
            label: 'Qtde Vendas',
            loja: String(kpiLoja.totalVendas),
            rede: fmt.number(mediaRede.totalVendas, 0),
            variacao: diff(kpiLoja.totalVendas, mediaRede.totalVendas),
            melhorAlto: true,
          },
          {
            label: '% PA1',
            loja: fmt.percent(kpiLoja.percentualPA1),
            rede: fmt.percent(mediaRede.percentualPA1),
            variacao: diff(kpiLoja.percentualPA1, mediaRede.percentualPA1),
            melhorAlto: false,
          },
        ]
      : []

  return (
    <DashboardLayout
      titulo="Loja vs Rede"
      subtitulo="Comparativo da loja com a média da rede"
      loading={loading}
      actions={
        <>
          <FiltroBar periodo={periodo} onPeriodoChange={setPeriodo} />
          <div className="relative">
            <button type="button" onClick={() => setMenuFilial(!menuFilial)} className="filter-trigger">
              <span>{filialAtual?.FILIAL || filialAtual?.COD_FILIAL || 'Selecionar loja'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--ink-ghost)]" />
            </button>
            {menuFilial && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuFilial(false)} />
                <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-[var(--border)] rounded-xl py-1 shadow-lg z-20 max-h-60 overflow-y-auto">
                  {filiaisLista.map((f) => (
                    <button
                      key={trimCod(f.COD_FILIAL)}
                      onClick={() => {
                        setFilialSel(trimCod(f.COD_FILIAL))
                        setMenuFilial(false)
                      }}
                      className={cn(
                        'flex items-center justify-between w-full px-3 py-2 text-[13px] transition-colors',
                        trimCod(f.COD_FILIAL) === trimCod(filialSel)
                          ? 'bg-[var(--acc-pale)] text-[var(--acc)]'
                          : 'text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)]'
                      )}
                    >
                      <span>{f.FILIAL || f.COD_FILIAL}</span>
                      <span className="text-[13px] text-[var(--ink-ghost)]">{trimCod(f.COD_FILIAL)}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      }
    >
      {posicao > 0 && (
        <div className="flex items-center gap-2 bg-[var(--acc-pale)] border border-[var(--acc-border)] rounded-xl px-4 py-2.5">
          <ArrowLeftRight className="w-4 h-4 text-[var(--acc)]" />
          <span className="text-[12px] text-[var(--acc)] font-medium">
            {filialAtual?.FILIAL} está em {posicao}o lugar na rede de {kpisRede?.length} lojas
          </span>
        </div>
      )}

      {!hasScope ? (
        <Card>
          <div className="py-8 text-center text-[12px] text-[var(--ink-ghost)]">
            Nenhuma loja no escopo. Verifique o vínculo de filiais do usuário.
          </div>
        </Card>
      ) : !kpiLoja ? (
        <Card>
          <div className="py-8 text-center text-[12px] text-[var(--ink-ghost)]">
            {kpisRede && kpisRede.length === 0
              ? 'Sem vendas no período para as lojas da rede'
              : 'Selecione uma loja para comparar'}
          </div>
        </Card>
      ) : (
        <>
          <SectionTitle
            label={`${(filialAtual?.FILIAL || filialAtual?.COD_FILIAL) ?? 'Loja'} vs média da rede`}
            icon={ArrowLeftRight}
          />
          <Card padding="sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-[13px] text-[var(--ink-ghost)] uppercase tracking-wider px-4 py-3 font-medium text-left">
                    Indicador
                  </th>
                  <th className="text-[13px] text-[var(--ink-ghost)] uppercase tracking-wider px-4 py-3 font-medium text-center">
                    Loja
                  </th>
                  <th className="text-[13px] text-[var(--ink-ghost)] uppercase tracking-wider px-4 py-3 font-medium text-center">
                    Média rede
                  </th>
                  <th className="text-[13px] text-[var(--ink-ghost)] uppercase tracking-wider px-4 py-3 font-medium text-center">
                    Variação
                  </th>
                  <th className="text-[13px] text-[var(--ink-ghost)] uppercase tracking-wider px-4 py-3 font-medium text-center">
                    Status
                  </th>
                  <th className="text-[13px] text-[var(--ink-ghost)] uppercase tracking-wider px-4 py-3 font-medium text-center">
                    Barra comparativa
                  </th>
                </tr>
              </thead>
              <tbody>
                {indicadores.map((ind, i) => {
                  const positivo = ind.melhorAlto ? ind.variacao > 2 : ind.variacao < -2
                  const negativo = ind.melhorAlto ? ind.variacao < -2 : ind.variacao > 2
                  const status = positivo ? 'acima' : negativo ? 'abaixo' : 'na média'
                  const pct = Math.min(Math.max(50 + ind.variacao / 2, 5), 95)

                  return (
                    <tr
                      key={i}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-subtle)] transition-colors"
                    >
                      <td className="px-4 py-3 text-[12px] font-medium text-[var(--ink)]">{ind.label}</td>
                      <td className="px-4 py-3 text-[12px] text-center font-medium text-[var(--ink)]">
                        {ind.loja}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-center text-[var(--ink-ghost)]">{ind.rede}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            'text-[13px] font-medium',
                            positivo
                              ? 'text-[var(--success)]'
                              : negativo
                                ? 'text-[var(--danger)]'
                                : 'text-[var(--ink-ghost)]'
                          )}
                        >
                          {ind.variacao !== 0
                            ? `${ind.variacao > 0 ? '+' : ''}${fmt.percent(ind.variacao, 1)}`
                            : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            'text-[12px] px-2 py-0.5 rounded-full font-medium',
                            positivo
                              ? 'bg-green-50 text-[var(--success)]'
                              : negativo
                                ? 'bg-red-50 text-[var(--danger)]'
                                : 'bg-gray-50 text-[var(--ink-ghost)]'
                          )}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative h-4 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[var(--border-md)]" />
                          <div
                            className={cn(
                              'absolute top-1 bottom-1 rounded-full transition-all',
                              positivo
                                ? 'bg-[var(--success)]'
                                : negativo
                                  ? 'bg-[var(--danger)]'
                                  : 'bg-[var(--ink-ghost)]'
                            )}
                            style={{ left: `${Math.min(pct, 50)}%`, right: `${100 - Math.max(pct, 50)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[12px] text-[var(--ink-ghost)] mt-0.5 px-0.5">
                          <span>abaixo</span>
                          <span>media</span>
                          <span>acima</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>

          <SectionTitle label="Posição na rede" icon={ArrowLeftRight} />
          <Card padding="sm">
            <div className="flex flex-col gap-1">
              {ranking.map((k, i) => {
                const isLoja = trimCod(k.codigoFilial) === trimCod(filialSel)
                const nomeFilial =
                  filiaisLista.find((f) => trimCod(f.COD_FILIAL) === trimCod(k.codigoFilial))?.FILIAL ??
                  k.nomeFilial ??
                  k.codigoFilial
                return (
                  <div
                    key={trimCod(k.codigoFilial) || i}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                      isLoja
                        ? 'bg-[var(--acc-pale)] border border-[var(--acc-border)]'
                        : 'hover:bg-[var(--bg-subtle)]'
                    )}
                  >
                    <span
                      className={cn(
                        'text-[13px] font-bold w-6 text-center shrink-0',
                        i === 0
                          ? 'text-yellow-500'
                          : i === 1
                            ? 'text-gray-400'
                            : i === 2
                              ? 'text-amber-600'
                              : 'text-[var(--ink-ghost)]'
                      )}
                    >
                      {i + 1}
                    </span>
                    <span
                      className={cn(
                        'text-[13px] flex-1',
                        isLoja ? 'font-medium text-[var(--acc)]' : 'text-[var(--ink-muted)]'
                      )}
                    >
                      {nomeFilial} {isLoja && '- voce'}
                    </span>
                    <span
                      className={cn(
                        'text-[13px] font-medium',
                        isLoja ? 'text-[var(--acc)]' : 'text-[var(--ink-ghost)]'
                      )}
                    >
                      {fmt.currencyShort(k.faturamento)}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>
        </>
      )}
    </DashboardLayout>
  )
}
