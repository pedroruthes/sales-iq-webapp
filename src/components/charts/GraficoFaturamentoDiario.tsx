import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatCurrencyShort } from '@/lib/utils'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#221d35] border border-purple-500/30 rounded-lg px-3 py-2 text-[13px] shadow-xl">
      <div className="text-[#8b77c8] mb-1">{format(parseISO(label),"dd 'de' MMM",{locale:ptBR})}</div>
      <div className="text-[#f1eeff] font-medium">{formatCurrencyShort(payload[0]?.value??0)}</div>
      <div className="text-[#5c5082] mt-0.5">{payload[1]?.value??0} vendas</div>
    </div>
  )
}

export function GraficoFaturamentoDiario({ dados, altura=120, mostrarMeta }: { dados:{data:string;faturamento:number;totalVendas:number}[]; altura?:number; mostrarMeta?:number }) {
  if (!dados?.length) return <div className="flex items-center justify-center h-[120px] text-[13px] text-[#5c5082]">Sem dados no período</div>
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <AreaChart data={dados} margin={{top:8,right:4,left:0,bottom:0}}>
        <defs>
          <linearGradient id="gradFat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#8b5cf6" stopOpacity={0.28}/>
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.08)" vertical={false}/>
        <XAxis dataKey="data" tickFormatter={v=>format(parseISO(v),'dd',{locale:ptBR})} tick={{fill:'#5c5082',fontSize:9}} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
        <YAxis tickFormatter={v=>formatCurrencyShort(v)} tick={{fill:'#5c5082',fontSize:9}} axisLine={false} tickLine={false} width={48}/>
        <Tooltip content={<CustomTooltip/>}/>
        {mostrarMeta && <ReferenceLine y={mostrarMeta} stroke="#fbbf24" strokeDasharray="4 3" strokeOpacity={0.7}/>}
        <Area type="monotone" dataKey="faturamento" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradFat)" dot={false} activeDot={{r:4,fill:'#a78bfa',stroke:'#8b5cf6',strokeWidth:2}}/>
      </AreaChart>
    </ResponsiveContainer>
  )
}
