import { KPICard, SectionTitle } from '@/components/ui'
import { TrendingUp } from 'lucide-react'
import { KPIsFilial } from '@/types'
import { calcVariacao } from '@/lib/utils'
import { num } from '@/lib/num'

interface Props {
  kpisAtual: KPIsFilial[]
  kpisAnterior: KPIsFilial[]
}

export function KPIStrip({ kpisAtual, kpisAnterior }: Props) {
  const soma = (arr: KPIsFilial[]) =>
    arr.reduce(
      (a, k) => {
        const tv = num(k.totalVendas)
        return {
          fat: a.fat + num(k.faturamento),
          tv: a.tv + tv,
          tp: a.tp + num(k.totalPecas),
          pa1: a.pa1 + num(k.percentualPA1) * tv,
        }
      },
      { fat: 0, tv: 0, tp: 0, pa1: 0 }
    )

  const atual = soma(kpisAtual)
  const ant = soma(kpisAnterior)

  const tm = atual.tv > 0 ? atual.fat / atual.tv : 0
  const pa = atual.tv > 0 ? atual.tp / atual.tv : 0
  const pm = atual.tp > 0 ? atual.fat / atual.tp : 0
  const pa1 = atual.tv > 0 ? atual.pa1 / atual.tv : 0
  const tmAnt = ant.tv > 0 ? ant.fat / ant.tv : 0

  const varFat = calcVariacao(atual.fat, ant.fat)
  const varTm = calcVariacao(tm, tmAnt)
  const varVendas = calcVariacao(atual.tv, ant.tv)

  const comMeta = kpisAtual.filter(
    (k) => k.percentualMeta != null && Number.isFinite(num(k.percentualMeta, NaN))
  )
  const metaMedia =
    comMeta.length > 0
      ? comMeta.reduce((a, k) => a + num(k.percentualMeta), 0) / comMeta.length
      : undefined

  const desqueFat = varFat >= 0 ? 'success' : 'danger'
  const destaqueTM = varTm >= 0 ? 'success' : 'danger'
  const desataquePA = pa >= 2.7 ? 'success' : pa >= 2.0 ? 'warn' : 'danger'
  const desataqueTV = varVendas >= 0 ? 'success' : 'danger'
  const desataquePA1 = pa1 <= 30 ? 'success' : pa1 <= 40 ? 'warn' : 'danger'

  return (
    <div>
      <SectionTitle label="Indicadores de vendas" icon={TrendingUp} />
      <div className="grid grid-cols-6 gap-3">
        <KPICard
          label="Faturamento"
          valor={atual.fat}
          formato="moeda"
          variacao={varFat}
          variacaoLabel="vs ant."
          metaPct={metaMedia}
          destaque={desqueFat as any}
          tooltip="Total líquido das vendas (bruto − trocas − descontos de pagamento), alinhado ao Resumo de vendas do Linx."
        />
        <KPICard
          label="T.M"
          valor={tm}
          formato="moeda"
          variacao={varTm}
          variacaoLabel="vs ant."
          destaque={destaqueTM as any}
          tooltip="Ticket médio: faturamento líquido ÷ quantidade de vendas (atendimentos)."
        />
        <KPICard
          label="P.A"
          valor={pa}
          formato="numero"
          destaque={desataquePA as any}
          tooltip="Peças por atendimento: total de peças ÷ quantidade de vendas. Meta típica ≈ 2,7."
        />
        <KPICard
          label="P.M"
          valor={pm}
          formato="moeda"
          destaque="neutral"
          tooltip="Preço médio da peça: faturamento líquido ÷ total de peças vendidas."
        />
        <KPICard
          label="Qtde vendas"
          valor={atual.tv}
          formato="numero"
          variacao={varVendas}
          variacaoLabel="vs ant."
          destaque={desataqueTV as any}
          tooltip="Quantidade de tickets com ao menos 1 peça, excluindo cancelados e só-troca."
        />
        <KPICard
          label="% PA1"
          valor={pa1}
          formato="percentual"
          destaque={desataquePA1 as any}
          tooltip="Percentual de vendas com apenas 1 peça. Quanto menor, melhor o potencial de adicional."
        />
      </div>
    </div>
  )
}
