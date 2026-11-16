import { BookOpen, Truck, Gauge, Trophy, MessageCircle, ClipboardList, Scale } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui'
import { fmt, cn } from '@/lib/utils'
import type { ContextoOperacional } from '@/lib/queries/ia-contexto'

function Variacao({ v }: { v: number | null }) {
  if (v == null) return <span className="text-[var(--ink-ghost)]">s/ base</span>
  return (
    <span className={cn('font-medium', v >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]')}>
      {v >= 0 ? '+' : ''}{fmt.number(v, 1)}%
    </span>
  )
}

function Bloco({ icon: Icon, titulo, children }: { icon: any; titulo: string; children: React.ReactNode }) {
  return (
    <div className="border border-[var(--border)] rounded-xl p-3 flex flex-col gap-2 min-w-0">
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--ink)]">
        <Icon className="w-3.5 h-3.5 text-[var(--acc)]" /> {titulo}
      </div>
      <div className="text-[12px] text-[var(--ink-muted)] flex flex-col gap-1">{children}</div>
    </div>
  )
}

function Linha({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[var(--ink-ghost)] truncate">{rotulo}</span>
      <span className="text-right shrink-0">{valor}</span>
    </div>
  )
}

const pctDe = (parte: number, total: number) => (total > 0 ? `${fmt.number((parte / total) * 100, 1)}%` : '—')

export function ConfrontoAcoes({ contexto }: { contexto: ContextoOperacional }) {
  const c = contexto
  const fat = c.faturamentoPeriodo
  const varLoja = c.faturamentoPeriodoAnterior > 0
    ? ((fat - c.faturamentoPeriodoAnterior) / c.faturamentoPeriodoAnterior) * 100
    : null

  const crmFat = (c.crm?.lojas ?? []).reduce((a, l) => a + l.fatRetornos, 0)
  const crmCont = (c.crm?.lojas ?? []).reduce((a, l) => a + l.contatos.mes, 0)
  const crmMeta = (c.crm?.lojas ?? []).reduce((a, l) => a + l.metaContatos.mes, 0)
  const crmEsperado = (c.crm?.lojas ?? []).reduce((a, l) => a + l.esperadoContatos, 0)
  const crmRet = (c.crm?.lojas ?? []).reduce((a, l) => a + l.retornos.mes, 0)
  const crmMetaRet = (c.crm?.lojas ?? []).reduce((a, l) => a + l.metaRetornos.mes, 0)

  const scoreLojas = (c.score ?? []).filter(s => !s.vendedor)
  const scoreVend = (c.score ?? []).filter(s => s.vendedor)
  const gam = c.gamificacao
  const fatPontuados = (gam?.ranking ?? []).reduce((a, r) => a + r.faturamento, 0)

  return (
    <Card padding="sm">
      <div className="flex items-center justify-between gap-3 mb-3">
        <SectionTitle label="Ações da equipe x resultado da loja" icon={Scale} className="mb-0 flex-1" />
        <span className="text-[12px] text-[var(--ink-ghost)]">
          Faturamento no período: <strong className="text-[var(--ink)]">{fmt.currency(fat)}</strong> (<Variacao v={varLoja} /> vs período anterior)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {c.diario && (
          <Bloco icon={BookOpen} titulo="Diário de ações">
            {c.diario.length === 0 ? (
              <span className="text-[var(--ink-ghost)]">Nenhuma ação no período</span>
            ) : c.diario.slice(0, 5).map((d, i) => (
              <Linha key={i}
                rotulo={`${d.inicio}${d.dias > 1 ? `–${d.fim}` : ''} · ${d.titulo}`}
                valor={<><span className="text-[var(--ink)]">{fmt.currencyShort(d.faturamento)}</span> <Variacao v={d.variacao} /></>} />
            ))}
            {c.diario.length > 0 && (
              <span className="text-[11px] text-[var(--ink-ghost)]">Venda da loja durante a ação x mesma janela da semana anterior. Loja no período: <Variacao v={varLoja} /></span>
            )}
          </Bloco>
        )}

        {c.crm && (
          <Bloco icon={MessageCircle} titulo="CRM">
            <Linha rotulo="Contatos no mês" valor={<><span className="text-[var(--ink)]">{fmt.number(crmCont)}</span>{crmMeta > 0 && <span className="text-[var(--ink-ghost)]"> / {fmt.number(crmMeta)} (esperado {fmt.number(crmEsperado)})</span>}</>} />
            <Linha rotulo="Clientes que voltaram" valor={<><span className="text-[var(--ink)]">{fmt.number(crmRet)}</span>{crmMetaRet > 0 && <span className="text-[var(--ink-ghost)]"> / {fmt.number(crmMetaRet)}</span>}</>} />
            <Linha rotulo="Conversão contato → compra" valor={crmCont > 0 ? `${fmt.number((crmRet / crmCont) * 100, 1)}%` : '—'} />
            <Linha rotulo="Faturamento via CRM" valor={<><span className="text-[var(--info)]">{fmt.currencyShort(crmFat)}</span> <span className="text-[var(--ink-ghost)]">({pctDe(crmFat, fat)} da loja)</span></>} />
          </Bloco>
        )}

        {c.transferencias && (
          <Bloco icon={Truck} titulo="Transferências">
            <Linha rotulo="Transferências no período" valor={`${c.transferencias.total} · ${fmt.number(c.transferencias.pecas)} peças`} />
            <Linha rotulo="Receita prevista" valor={fmt.currencyShort(c.transferencias.previsaoReceita)} />
            <Linha rotulo="Peças recebidas / vendidas no destino" valor={`${fmt.number(c.transferencias.pecasRecebidas)} / ${fmt.number(c.transferencias.pecasVendidasDestino)}`} />
            <Linha rotulo="Sell-through · faturamento" valor={<>{c.transferencias.sellThrough != null ? `${fmt.number(c.transferencias.sellThrough, 1)}%` : '—'} · <span className="text-[var(--info)]">{fmt.currencyShort(c.transferencias.faturamentoDestino)}</span></>} />
          </Bloco>
        )}

        {c.score && (
          <Bloco icon={Gauge} titulo="Score de performance">
            {scoreLojas.length === 0 && scoreVend.length === 0 && <span className="text-[var(--ink-ghost)]">Sem snapshot de score no mês</span>}
            {scoreLojas.map(s => (
              <Linha key={s.filial} rotulo={`Loja ${s.filial}`}
                valor={<><span className="text-[var(--ink)] font-medium">{fmt.number(s.score)}</span>{s.scoreAnterior != null && <span className="text-[var(--ink-ghost)]"> (antes {fmt.number(s.scoreAnterior)})</span>}</>} />
            ))}
            {scoreVend.slice(0, 3).map(s => (
              <Linha key={`${s.filial}-${s.vendedor}`} rotulo={s.nome || s.vendedor}
                valor={<><span className="text-[var(--ink)]">{fmt.number(s.score)}</span> <span className="text-[var(--ink-ghost)]">· {fmt.currencyShort(s.faturamento)}</span></>} />
            ))}
          </Bloco>
        )}

        {gam && (
          <Bloco icon={Trophy} titulo="Gamificação">
            <Linha rotulo="Desafios ativos" valor={fmt.number(gam.desafiosAtivos)} />
            <Linha rotulo="Vendedores pontuados" valor={`${gam.ranking.length} · ${pctDe(fatPontuados, fat)} da venda`} />
            {gam.ranking.slice(0, 3).map(r => (
              <Linha key={`${r.filial}-${r.vendedor}`} rotulo={`${r.vendedor} · ${fmt.number(r.pontos)} pts`} valor={fmt.currencyShort(r.faturamento)} />
            ))}
          </Bloco>
        )}

        {c.pdca && (
          <Bloco icon={ClipboardList} titulo="PDCA">
            <Linha rotulo="Em andamento" valor={fmt.number((c.pdca.porStatus.planejado ?? 0) + (c.pdca.porStatus.em_execucao ?? 0) + (c.pdca.porStatus.checando ?? 0))} />
            <Linha rotulo="Atrasados" valor={<span className={c.pdca.atrasados > 0 ? 'text-[var(--danger)] font-medium' : ''}>{fmt.number(c.pdca.atrasados)}</span>} />
            <Linha rotulo="Concluídos no período" valor={fmt.number(c.pdca.concluidos.length)} />
            {c.pdca.concluidos.slice(0, 2).map((p, i) => (
              <Linha key={i} rotulo={p.titulo} valor={p.baseline != null || p.resultado != null ? `${p.baseline ?? '-'} → ${p.resultado ?? '-'}` : '—'} />
            ))}
          </Bloco>
        )}
      </div>
    </Card>
  )
}
