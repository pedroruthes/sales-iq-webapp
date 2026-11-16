import { cn, formatCurrencyShort } from '@/lib/utils'
export function GraficoVolumePorHora({ dados, modo='vendas' }: { dados:{hora:number;totalVendas:number;faturamento:number}[]; modo?:'vendas'|'faturamento' }) {
  if (!dados?.length) return <div className="flex items-center justify-center h-[100px] text-[13px] text-[#5c5082]">Sem dados</div>
  const vals   = dados.map(d=>modo==='vendas'?d.totalVendas:d.faturamento)
  const max    = Math.max(...vals,1)
  const idxMax = vals.indexOf(max)
  return (
    <div className="flex flex-col gap-2">
      {dados.map((item,i)=>{
        const val=modo==='vendas'?item.totalVendas:item.faturamento
        const isPico=i===idxMax
        return (
          <div key={item.hora} className="flex items-center gap-2">
            <span className={cn('text-[13px] min-w-[22px] text-right',isPico?'text-green-400 font-medium':'text-[#5c5082]')}>{String(item.hora).padStart(2,'0')}h</span>
            <div className="flex-1 h-[10px] bg-[#2e2748] rounded overflow-hidden">
              <div className={cn('h-full rounded',isPico?'bg-gradient-to-r from-green-400 to-green-300':'bg-gradient-to-r from-purple-500 to-purple-400')} style={{width:`${(val/max)*100}%`}}/>
            </div>
            <span className={cn('text-[12px] min-w-[44px] text-right font-medium',isPico?'text-green-400':'text-[#8b77c8]')}>
              {modo==='vendas'?`${val} vd`:formatCurrencyShort(val)}
            </span>
          </div>
        )
      })}
      <div className="text-[13px] text-[#5c5082] text-center mt-1">pico: {String(dados[idxMax]?.hora??0).padStart(2,'0')}h</div>
    </div>
  )
}
