import { KPICard, SectionTitle } from '@/components/ui'
import { TrendingUp } from 'lucide-react'
import { KPIsFilial, ComparativoItem } from '@/types'

interface Props { kpis: KPIsFilial[]; comparativo: ComparativoItem[] }

export function VendasKPIStrip({ kpis, comparativo }: Props) {
  const tot = kpis.reduce(
    (a, k) => ({
      fat: a.fat + k.faturamento,
      tv:  a.tv  + k.totalVendas,
      tp:  a.tp  + k.totalPecas,
      pa1: a.pa1 + k.percentualPA1 * k.totalVendas,
    }),
    { fat: 0, tv: 0, tp: 0, pa1: 0 }
  )

  const tm  = tot.tv > 0 ? tot.fat / tot.tv : 0
  const pa  = tot.tv > 0 ? tot.tp  / tot.tv : 0
  const pm  = tot.tp > 0 ? tot.fat / tot.tp : 0
  const pa1 = tot.tv > 0 ? tot.pa1 / tot.tv : 0

  const gv = (ind: string) => comparativo?.find(c => c.indicador === ind)?.variacao ?? 0

  return (
    <div>
      <SectionTitle label="Indicadores do período" icon={TrendingUp} />
      <div className="grid grid-cols-7 gap-2.5">
        <KPICard
          label="Faturamento"
          valor={tot.fat}
          formato="moeda"
          variacao={gv('Faturamento')}
          variacaoLabel="vs ant."
          destaque={gv('Faturamento') >= 0 ? 'success' : 'danger'}
        />
        <KPICard
          label="T.M"
          valor={tm}
          formato="moeda"
          variacao={gv('Ticket Médio')}
          variacaoLabel="vs ant."
          destaque={gv('Ticket Médio') >= 0 ? 'success' : 'danger'}
        />
        <KPICard
          label="P.A"
          valor={pa}
          formato="numero"
          variacao={gv('Peças / Atend.')}
          variacaoLabel="vs ant."
          destaque={pa >= 2.7 ? 'success' : pa >= 2.0 ? 'warn' : 'danger'}
        />
        <KPICard
          label="P.M"
          valor={pm}
          formato="moeda"
          variacao={gv('Preço Médio')}
          variacaoLabel="vs ant."
          destaque="neutral"
        />
        <KPICard
          label="Qtde vendas"
          valor={tot.tv}
          formato="numero"
          variacao={gv('Qtde Vendas')}
          variacaoLabel="vs ant."
          destaque={gv('Qtde Vendas') >= 0 ? 'success' : 'danger'}
        />
        <KPICard
          label="% PA1"
          valor={pa1}
          formato="percentual"
          destaque={pa1 <= 30 ? 'success' : pa1 <= 40 ? 'warn' : 'danger'}
        />
        <KPICard
          label="Total peças"
          valor={tot.tp}
          formato="numero"
          variacao={gv('Total Peças')}
          variacaoLabel="vs ant."
          destaque={gv('Total Peças') >= 0 ? 'success' : 'danger'}
        />
      </div>
    </div>
  )
}
