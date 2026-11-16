import { cn, formatPercent } from '@/lib/utils'
const COR: Record<string,string> = { '1':'bg-red-500','2':'bg-amber-400','3':'bg-green-400','4':'bg-purple-400','5+':'bg-teal-400' }
const TEXT: Record<string,string> = { '1':'text-red-400','2':'text-amber-400','3':'text-green-400','4':'text-purple-300','5+':'text-teal-400' }
export function GraficoDistribuicaoPA({ dados }: { dados:{pa:string;total:number;percentual:number}[] }) {
  const max = Math.max(...(dados?.map(d=>d.percentual)??[1]))
  if (!dados?.length) return <div className="flex items-center justify-center h-[120px] text-[13px] text-[#5c5082]">Sem dados</div>
  return (
    <div className="flex flex-col gap-2.5">
      {dados.map(item=>(
        <div key={item.pa} className="flex items-center gap-2.5">
          <div className={cn('text-[13px] font-medium min-w-[20px] text-right', TEXT[item.pa]??'text-[#8b77c8]')}>{item.pa}</div>
          <div className="flex-1 h-[14px] bg-[#2e2748] rounded overflow-hidden">
            <div className={cn('h-full rounded flex items-center justify-end pr-1.5', COR[item.pa]??'bg-purple-500')} style={{width:`${(item.percentual/max)*100}%`}}>
              {item.percentual>12&&<span className="text-[12px] font-medium text-white">{formatPercent(item.percentual,0)}</span>}
            </div>
          </div>
          <div className="text-right min-w-[40px]">
            <div className={cn('text-[13px] font-medium', TEXT[item.pa]??'text-[#8b77c8]')}>{formatPercent(item.percentual,1)}</div>
            <div className="text-[13px] text-[#5c5082]">{item.total.toLocaleString('pt-BR')} vd</div>
          </div>
        </div>
      ))}
      {(dados.find(d=>d.pa==='1')?.percentual??0)>35&&(
        <div className="mt-1 text-[12px] text-red-400 bg-red-500/8 border border-red-500/20 rounded-lg px-3 py-2">⚠ Alto % de vendas com 1 peça</div>
      )}
    </div>
  )
}
