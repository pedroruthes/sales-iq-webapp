import { Users } from 'lucide-react'
import { KPICard, SectionTitle } from '@/components/ui'
import { KPIsVendedor } from '@/types'
import { fmt } from '@/lib/utils'

export function VendedoresKPIStrip({ dados }: { dados: KPIsVendedor[] }) {
  if (!dados.length) return null

  const melhor = dados[0]
  const total  = dados.reduce((a, v) => ({
    fat: a.fat + v.faturamento, tv: a.tv + v.totalVendas, tp: a.tp + v.totalPecas,
  }), { fat: 0, tv: 0, tp: 0 })

  const mediaPA  = dados.reduce((a, v) => a + v.pecasAtendimento, 0) / dados.length
  const mediaTM  = dados.reduce((a, v) => a + v.ticketMedio,      0) / dados.length
  const comMeta  = dados.filter(v => v.percentualMeta !== null)
  const mediaM   = comMeta.length > 0
    ? comMeta.reduce((a, v) => a + (v.percentualMeta ?? 0), 0) / comMeta.length
    : undefined

  return (
    <div>
      <SectionTitle label="Resumo da equipe" icon={Users} />
      <div className="grid grid-cols-5 gap-3">
        <KPICard label="Faturamento equipe" valor={total.fat}  formato="moeda"  destaque="primary" />
        <KPICard label="T.M médio"          valor={mediaTM}    formato="moeda"  destaque="info" />
        <KPICard label="P.A médio"          valor={mediaPA}    formato="numero" destaque={mediaPA >= 2.7 ? 'success' : mediaPA >= 2.0 ? 'warn' : 'danger'} />
        <KPICard label="Total vendas"       valor={total.tv}   formato="numero" destaque="primary" />
        <KPICard label="% Meta média"       valor={mediaM ?? '—'} formato={mediaM ? 'percentual' : 'texto'} destaque={mediaM ? mediaM >= 100 ? 'success' : mediaM >= 80 ? 'warn' : 'danger' : 'neutral'} />
      </div>
    </div>
  )
}
