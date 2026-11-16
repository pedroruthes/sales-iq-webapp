import {
  Sparkles, TrendingDown, AlertTriangle, CheckCircle, Target, ArrowUpRight,
} from 'lucide-react'
import { useState } from 'react'
import { useRouter } from '@/lib/navigation'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { fmt, cn, formatDate } from '@/lib/utils'
import { KPIsFilial } from '@/types'
import { calcularPeriodoAnterior, TipoComparacao } from '@/lib/comparacao'
import { num } from '@/lib/num'

interface Props {
  kpis: KPIsFilial[]
  filiais: string[]
  periodoInicio: Date | string
  periodoFim: Date | string
}

interface Acao { label: string; prompt: string }
interface Insight {
  tipo: 'critico' | 'alerta' | 'positivo'
  texto: string
  acoes: Acao[]
}
interface Projecao {
  titulo: string
  ganho: number
}

const TIPOS: { key: TipoComparacao; label: string; labelCurto: string }[] = [
  { key: 'mesmo_periodo', label: 'Mesmos dias do mês anterior', labelCurto: 'Mesmos dias' },
  { key: 'mes_anterior', label: 'Mês anterior completo', labelCurto: 'Mês ant.' },
  { key: '454', label: 'Calendário varejista 4-5-4', labelCurto: '4-5-4' },
]

function calcularProjecoes(kpis: KPIsFilial[]): Projecao[] {
  const projecoes: Projecao[] = []
  if (!kpis.length) return projecoes
  const tv = kpis.reduce((a, k) => a + num(k.totalVendas), 0) || 1
  const fat = kpis.reduce((a, k) => a + num(k.faturamento), 0)
  const pa1Med = kpis.reduce((a, k) => a + num(k.percentualPA1) * num(k.totalVendas), 0) / tv
  const paMed = kpis.reduce((a, k) => a + num(k.pecasAtendimento) * num(k.totalVendas), 0) / tv
  const tmMed = fat / tv
  const precoPeca = paMed > 0 ? tmMed / paMed : 0

  if (pa1Med > 25 && precoPeca > 0) {
    const convertidas = Math.round(tv * (pa1Med / 100) * 0.2)
    projecoes.push({ titulo: 'Reduzir PA1 20%', ganho: convertidas * precoPeca })
  }
  if (paMed > 0 && precoPeca > 0) {
    projecoes.push({ titulo: 'PA +0,5 peça', ganho: tv * 0.5 * precoPeca })
  }
  return projecoes.slice(0, 2)
}

function gerarInsights(
  kpis: KPIsFilial[],
  comparativo: Array<{ indicador?: string; variacao?: number }>
): Insight[] {
  const insights: Insight[] = []
  const gv = (ind: string) => comparativo?.find((c) => c.indicador === ind)?.variacao ?? 0
  const fatTotal = kpis.reduce((a, k) => a + num(k.faturamento), 0)
  const tv = kpis.reduce((a, k) => a + num(k.totalVendas), 0) || 1
  const pa1Med = kpis.reduce((a, k) => a + num(k.percentualPA1) * num(k.totalVendas), 0) / tv
  const paMed = kpis.reduce((a, k) => a + num(k.pecasAtendimento) * num(k.totalVendas), 0) / tv
  const varFat = Number(gv('Faturamento')) || 0

  const lojasCriticas = kpis.filter(
    (k) => k.percentualMeta != null && Number.isFinite(num(k.percentualMeta, NaN)) && num(k.percentualMeta) < 80
  )
  if (lojasCriticas.length > 0) {
    const nomes = lojasCriticas.slice(0, 2).map((k) => k.nomeFilial).join(', ')
    insights.push({
      tipo: 'critico',
      texto: `${lojasCriticas.length === 1 ? nomes : `${lojasCriticas.length} lojas`} abaixo de 80% da meta.`,
      acoes: [
        { label: 'Analisar', prompt: `Analise as lojas abaixo da meta: ${nomes}. Quais ações priorizar?` },
      ],
    })
  }
  if (pa1Med > 35) {
    insights.push({
      tipo: 'critico',
      texto: `${fmt.percent(pa1Med, 0)} das vendas com 1 peça.`,
      acoes: [
        { label: 'Melhorar PA', prompt: 'Quais estratégias práticas para aumentar peças por atendimento no varejo de moda?' },
      ],
    })
  } else if (paMed < 2.3 && paMed > 0) {
    insights.push({
      tipo: 'alerta',
      texto: `PA médio ${fmt.number(paMed, 1)} — abaixo de 2,7.`,
      acoes: [
        { label: 'Diagnóstico', prompt: `PA em ${fmt.number(paMed, 1)}. Como subir para 2,7?` },
      ],
    })
  }
  if (varFat < -8) {
    insights.push({
      tipo: 'critico',
      texto: `Fat. ${fmt.percent(Math.abs(varFat), 1)} abaixo vs anterior.`,
      acoes: [
        { label: 'Analisar queda', prompt: `Faturamento caiu ${fmt.percent(Math.abs(varFat), 1)}. Como reverter?` },
      ],
    })
  } else if (varFat > 8) {
    insights.push({
      tipo: 'positivo',
      texto: `Fat. ${fmt.percent(varFat, 1)} acima vs anterior.`,
      acoes: [
        { label: 'Sustentar', prompt: `Faturamento subiu ${fmt.percent(varFat, 1)}. Como sustentar?` },
      ],
    })
  }
  const lojasBoas = kpis.filter(
    (k) => k.percentualMeta != null && Number.isFinite(num(k.percentualMeta, NaN)) && num(k.percentualMeta) >= 100
  )
  if (lojasBoas.length > 0 && insights.filter((i) => i.tipo === 'critico').length === 0) {
    insights.push({
      tipo: 'positivo',
      texto: `${lojasBoas.length} loja(s) na meta.`,
      acoes: [
        { label: 'Replicar', prompt: `${lojasBoas.length} lojas bateram a meta. O que replicar?` },
      ],
    })
  }
  if (!insights.length) {
    insights.push({
      tipo: 'positivo',
      texto: `Rede: ${fmt.currencyShort(fatTotal)} no período.`,
      acoes: [{ label: 'Melhorias', prompt: 'Sugira 3 pontos de melhoria priorizados.' }],
    })
  }
  return insights.slice(0, 2)
}

export function CardIA({ kpis, filiais, periodoInicio, periodoFim }: Props) {
  const router = useRouter()
  const [tipoComp, setTipoComp] = useState<TipoComparacao>('mesmo_periodo')

  const hoje = new Date()
  const fimEfetivo = new Date(periodoFim) > hoje ? hoje : new Date(periodoFim)
  const periodoAnt = calcularPeriodoAnterior(periodoInicio, fimEfetivo, tipoComp)

  const { data: comparativo } = useQuery({
    queryKey: ['comparativo-ia', filiais, formatDate(new Date(periodoInicio)), formatDate(fimEfetivo), tipoComp],
    queryFn: async () => {
      const { data } = await axios.get('/api/vendas/comparativo', {
        params: {
          filiais: filiais.join(','),
          dIA: formatDate(new Date(periodoInicio)),
          dFA: formatDate(fimEfetivo),
          dIAnt: formatDate(periodoAnt.inicio),
          dFAnt: formatDate(periodoAnt.fim),
        },
      })
      return data.data ?? []
    },
    enabled: filiais.length > 0,
    staleTime: 1000 * 60 * 10,
  })

  const abrirNaIA = (prompt: string) => {
    try {
      sessionStorage.setItem('salesiq-ia-prompt', prompt)
    } catch { /* ignore */ }
    router.push('/dashboard/ia')
  }

  if (!kpis.length) return null
  if (filiais.length > 0 && comparativo === undefined) {
    return (
      <div className="bg-gradient-to-br from-[var(--acc-pale)] to-white border border-[var(--acc-border)] rounded-[14px] p-3.5 shadow-[var(--shadow-card)] min-h-[160px] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[var(--acc-border)] border-t-[var(--acc)] rounded-full animate-spin" />
      </div>
    )
  }

  const insights = gerarInsights(kpis, comparativo ?? [])
  const projecoes = calcularProjecoes(kpis)

  return (
    <div className="bg-gradient-to-br from-[var(--acc-pale)] to-white border border-[var(--acc-border)] rounded-[14px] p-3.5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-6 h-6 rounded-lg bg-[var(--acc)] flex items-center justify-center shrink-0">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
        <span className="text-[12px] font-medium text-[var(--acc)] flex-1">Inteligência de resultados</span>
        <span className="text-[10px] text-[var(--ink-ghost)] truncate max-w-[90px]" title={periodoAnt.label}>
          {periodoAnt.label}
        </span>
      </div>

      <div className="flex items-center gap-1 bg-[var(--bg-subtle)] rounded-lg p-0.5 mb-2.5">
        {TIPOS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTipoComp(t.key)}
            title={t.label}
            className={cn(
              'flex-1 py-0.5 px-1.5 rounded-md text-[11px] font-medium transition-all truncate',
              tipoComp === t.key
                ? 'bg-white text-[var(--acc)] shadow-[var(--shadow-card)]'
                : 'text-[var(--ink-ghost)] hover:text-[var(--ink-muted)]'
            )}
          >
            {t.labelCurto}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1.5 mb-2.5">
        {insights.map((ins, i) => (
          <div key={i} className="flex items-start gap-1.5">
            {ins.tipo === 'critico'
              ? <AlertTriangle className="w-3 h-3 text-[var(--danger)] shrink-0 mt-0.5" />
              : ins.tipo === 'alerta'
                ? <TrendingDown className="w-3 h-3 text-[var(--warn)] shrink-0 mt-0.5" />
                : <CheckCircle className="w-3 h-3 text-[var(--success)] shrink-0 mt-0.5" />}
            <p className="text-[12px] text-[var(--ink-muted)] leading-snug">{ins.texto}</p>
          </div>
        ))}
      </div>

      {projecoes.length > 0 && (
        <div className="mb-2.5 border-t border-[var(--acc-border)] pt-2">
          <div className="text-[10px] text-[var(--acc)] uppercase tracking-wider font-medium mb-1.5 flex items-center gap-1">
            <Target className="w-2.5 h-2.5" />
            Potencial
          </div>
          <div className="flex flex-col gap-1">
            {projecoes.map((p, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg px-2 py-1.5 bg-green-50 border border-green-100">
                <span className="text-[11px] font-medium text-[var(--ink)] truncate">{p.titulo}</span>
                <span className="text-[11px] font-semibold text-[var(--success)] shrink-0 ml-2">
                  +{fmt.currencyShort(p.ganho)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {insights.flatMap((ins) => ins.acoes).slice(0, 3).map((acao, i) => (
          <button
            key={i}
            type="button"
            onClick={() => abrirNaIA(acao.prompt)}
            className="flex items-center gap-0.5 text-[11px] bg-white border border-[var(--acc-border)] hover:bg-[var(--acc-pale)] rounded-md px-2 py-0.5 text-[var(--acc)] transition-colors font-medium"
          >
            {acao.label}
            <ArrowUpRight className="w-2.5 h-2.5" />
          </button>
        ))}
      </div>
    </div>
  )
}
