import { cn } from '@/lib/utils'
const DIAS=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const HORAS=[8,9,10,11,12,13,14,15,16,17,18,19,20]
function intensidade(v:number,max:number) {
  if(!max||!v) return 'bg-[#221d35]'
  const p=v/max
  if(p>0.85) return 'bg-purple-500'; if(p>0.65) return 'bg-purple-500/75'
  if(p>0.45) return 'bg-purple-500/50'; if(p>0.25) return 'bg-purple-500/30'
  return 'bg-purple-500/15'
}
export function HeatmapHoraDia({ dados }: { dados:{hora:number;diaSemana:number;totalVendas:number;faturamento:number}[] }) {
  const mapa: Record<string,number> = {}
  dados?.forEach(d=>{ mapa[`${d.diaSemana}_${d.hora}`]=d.totalVendas })
  const max=Math.max(...Object.values(mapa),1)
  return (
    <div className="overflow-x-auto">
      <div style={{minWidth:480}}>
        <div className="flex gap-1 pl-10 mb-1">{DIAS.map(d=><div key={d} className="flex-1 text-center text-[13px] text-[#5c5082]">{d}</div>)}</div>
        {HORAS.map(h=>(
          <div key={h} className="flex items-center gap-1 mb-1">
            <div className="w-9 text-right text-[13px] text-[#5c5082] shrink-0">{String(h).padStart(2,'0')}h</div>
            {[1,2,3,4,5,6,7].map(dia=>{
              const v=mapa[`${dia}_${h}`]??0
              return <div key={dia} title={`${DIAS[dia-1]} ${h}h — ${v} vendas`} className={cn('flex-1 h-[22px] rounded cursor-pointer hover:opacity-75 flex items-center justify-center',intensidade(v,max))}>
                {v>0&&<span className="text-[12px] text-white/70 font-medium">{v}</span>}
              </div>
            })}
          </div>
        ))}
        <div className="flex items-center gap-1.5 justify-end mt-2">
          <span className="text-[13px] text-[#5c5082]">baixo</span>
          {['bg-purple-500/15','bg-purple-500/30','bg-purple-500/50','bg-purple-500/75','bg-purple-500'].map(c=><div key={c} className={cn('w-4 h-4 rounded',c)}/>)}
          <span className="text-[13px] text-[#5c5082]">alto</span>
        </div>
      </div>
    </div>
  )
}
