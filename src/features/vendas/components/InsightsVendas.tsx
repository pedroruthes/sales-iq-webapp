import { AlertTriangle, TrendingDown, TrendingUp, Lightbulb, CheckCircle, Info } from 'lucide-react'
import { cn, fmt } from '@/lib/utils'
import { ComparativoItem } from '@/types'

interface Props {
  kpis: {
    faturamento: number; ticketMedio: number; pecasAtendimento: number
    precoMedio: number; percentualPA1: number; totalVendas: number
  }
  comparativo: ComparativoItem[]
  metaPct?: number
}

type Severidade = 'critico' | 'alerta' | 'positivo' | 'info'

interface Insight {
  titulo: string
  descricao: string
  acao: string
  severidade: Severidade
}

const ICON: Record<Severidade, any> = {
  critico:  AlertTriangle,
  alerta:   TrendingDown,
  positivo: TrendingUp,
  info:     Info,
}

const STYLE: Record<Severidade, string> = {
  critico:  'bg-[var(--danger-bg)] border-red-200 text-[var(--danger)]',
  alerta:   'bg-[var(--warn-bg)] border-amber-200 text-[var(--warn)]',
  positivo: 'bg-[var(--success-bg)] border-green-200 text-[var(--success)]',
  info:     'bg-[var(--info-bg)] border-blue-200 text-[var(--info)]',
}

const ICON_STYLE: Record<Severidade, string> = {
  critico:  'text-[var(--danger)]',
  alerta:   'text-[var(--warn)]',
  positivo: 'text-[var(--success)]',
  info:     'text-[var(--info)]',
}

function gerarInsights(kpis: Props['kpis'], comparativo: Props['comparativo'], metaPct?: number): Insight[] {
  const insights: Insight[] = []
  const gv = (ind: string) => comparativo?.find(c => c.indicador === ind)?.variacao ?? 0

  // PA1 alto — principal oportunidade de melhoria
  if (kpis.percentualPA1 > 45) {
    insights.push({
      titulo: `PA1 crítico: ${fmt.percent(kpis.percentualPA1)} das vendas com 1 peça`,
      descricao: 'Mais de 45% das vendas saíram com apenas 1 peça. Isso indica que a equipe não está oferecendo itens complementares.',
      acao: 'Treinar equipe em técnicas de venda adicional (up-sell e cross-sell). Criar kits e sugestões de combinação.',
      severidade: 'critico',
    })
  } else if (kpis.percentualPA1 > 35) {
    insights.push({
      titulo: `PA1 elevado: ${fmt.percent(kpis.percentualPA1)} das vendas com 1 peça`,
      descricao: 'Há oportunidade de aumentar o número de peças por atendimento.',
      acao: 'Reforçar treinamento de venda adicional com a equipe.',
      severidade: 'alerta',
    })
  }

  // PA baixo
  if (kpis.pecasAtendimento < 2.0) {
    insights.push({
      titulo: `P.A baixo: ${fmt.number(kpis.pecasAtendimento, 1)} peças/atendimento`,
      descricao: `A meta recomendada é 2,7 peças por atendimento. Vocês estão ${fmt.number(2.7 - kpis.pecasAtendimento, 1)} abaixo.`,
      acao: 'Implantar meta de P.A por vendedor. Criar campanha interna de incentivo.',
      severidade: 'critico',
    })
  } else if (kpis.pecasAtendimento < 2.5) {
    insights.push({
      titulo: `P.A em desenvolvimento: ${fmt.number(kpis.pecasAtendimento, 1)} peças/atendimento`,
      descricao: 'Está abaixo do ideal de 2,7. Há espaço para crescimento.',
      acao: 'Definir meta individual de P.A para cada vendedor.',
      severidade: 'alerta',
    })
  } else if (kpis.pecasAtendimento >= 2.7) {
    insights.push({
      titulo: `P.A excelente: ${fmt.number(kpis.pecasAtendimento, 1)} peças/atendimento`,
      descricao: 'Equipe performando acima da meta de 2,7 peças por atendimento.',
      acao: 'Manter o padrão e compartilhar boas práticas entre lojas.',
      severidade: 'positivo',
    })
  }

  // Queda de faturamento
  const varFat = gv('Faturamento')
  if (varFat < -10) {
    insights.push({
      titulo: `Queda expressiva: faturamento ${fmt.percent(varFat, 1)} vs período anterior`,
      descricao: 'Queda acima de 10% requer atenção imediata. Verifique causas: menos clientes, ticket menor ou ambos.',
      acao: 'Analisar curva diária para identificar quando caiu. Verificar se houve problema operacional.',
      severidade: 'critico',
    })
  } else if (varFat < -5) {
    insights.push({
      titulo: `Faturamento em queda: ${fmt.percent(varFat, 1)} vs anterior`,
      descricao: 'Tendência de queda que precisa ser revertida.',
      acao: 'Verificar mix de produtos e ações promocionais do período anterior.',
      severidade: 'alerta',
    })
  } else if (varFat > 10) {
    insights.push({
      titulo: `Faturamento em alta: +${fmt.percent(varFat, 1)} vs período anterior`,
      descricao: 'Crescimento acima de 10%. Identifique o que funcionou para replicar.',
      acao: 'Documentar as ações que geraram esse resultado.',
      severidade: 'positivo',
    })
  }

  // Ticket médio caindo
  const varTM = gv('Ticket Médio')
  if (varTM < -5) {
    insights.push({
      titulo: `Ticket médio caindo: ${fmt.percent(varTM, 1)} vs anterior`,
      descricao: `Clientes estão comprando menos valor. TM atual: ${fmt.currency(kpis.ticketMedio)}.`,
      acao: 'Revisar mix de produtos expostos. Verificar se há muita concentração em itens de menor valor.',
      severidade: 'alerta',
    })
  }

  // Meta
  if (metaPct !== undefined) {
    if (metaPct < 70) {
      insights.push({
        titulo: `Meta em risco: apenas ${fmt.percent(metaPct)} atingido`,
        descricao: 'Com menos de 70% da meta atingida, é necessária uma virada de resultado.',
        acao: 'Calcular quanto precisa faturar por dia para fechar a meta. Definir ações emergenciais.',
        severidade: 'critico',
      })
    } else if (metaPct >= 100) {
      insights.push({
        titulo: `Meta batida! ${fmt.percent(metaPct)} atingido`,
        descricao: 'Parabéns! A meta do período foi superada.',
        acao: 'Definir supermeta para o restante do período.',
        severidade: 'positivo',
      })
    }
  }

  // Sem vínculo
  const semVin = comparativo?.find(c => c.indicador === '% Sem vínculo')?.valorAtual ?? 0
  if (semVin > 30) {
    insights.push({
      titulo: `${fmt.percent(semVin, 0)} das vendas sem cliente vinculado`,
      descricao: 'Alto índice de vendas sem identificação do cliente. Perde-se dados para fidelização.',
      acao: 'Treinar equipe na importância do cadastro. Criar meta de % de vinculação por vendedor.',
      severidade: semVin > 50 ? 'critico' : 'alerta',
    })
  }

  // Se tudo bem
  if (insights.length === 0) {
    insights.push({
      titulo: 'Todos os indicadores dentro do esperado',
      descricao: 'Não foram identificados alertas críticos para o período selecionado.',
      acao: 'Continue monitorando e busque superar as metas.',
      severidade: 'positivo',
    })
  }

  // Ordenar: critico > alerta > positivo > info
  const ordem: Record<Severidade, number> = { critico: 0, alerta: 1, positivo: 2, info: 3 }
  return insights.sort((a, b) => ordem[a.severidade] - ordem[b.severidade])
}

export function InsightsVendas({ kpis, comparativo, metaPct }: Props) {
  const insights = gerarInsights(kpis, comparativo, metaPct)

  return (
    <div className="flex flex-col gap-2">
      {insights.map((insight, i) => {
        const Icon = ICON[insight.severidade]
        return (
          <div
            key={i}
            className={cn('border rounded-xl px-4 py-3 flex gap-3', STYLE[insight.severidade])}
          >
            <Icon className={cn('w-4 h-4 shrink-0 mt-0.5', ICON_STYLE[insight.severidade])} />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium mb-0.5">{insight.titulo}</div>
              <div className="text-[13px] opacity-80 mb-1.5">{insight.descricao}</div>
              <div className="flex items-start gap-1.5">
                <Lightbulb className="w-3 h-3 shrink-0 mt-px opacity-70" />
                <span className="text-[12px] font-medium opacity-90">{insight.acao}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
