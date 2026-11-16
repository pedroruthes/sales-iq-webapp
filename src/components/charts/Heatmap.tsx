import { cn } from '@/lib/utils'

interface Item { hora: number; diaSemana: number; totalVendas: number; faturamento: number }

const DIAS  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const HORAS = [8,9,10,11,12,13,14,15,16,17,18,19,20,21]

function intensidade(v: number, max: number): string {
  if (!max || !v) return ''
  const p = v / max
  if (p > 0.85) return 'bg-[var(--acc)]'
  if (p > 0.65) return 'bg-[var(--acc)] opacity-70'
  if (p > 0.45) return 'bg-[var(--acc)] opacity-50'
  if (p > 0.20) return 'bg-[var(--acc)] opacity-30'
  return 'bg-[var(--acc)] opacity-15'
}

export function Heatmap({ dados }: { dados: Item[] }) {
  if (!dados?.length) return (
    <div className="flex items-center justify-center h-32 text-[13px] text-[var(--ink-ghost)]">
      Sem dados no período
    </div>
  )

  // Detecta se todos os dados estão na hora 0 (sem hora gravada)
  const semHora = dados.every(d => d.hora === 0)

  if (semHora) {
    // Fallback: mostra por dia da semana apenas (sem hora)
    const porDia: Record<number, number> = {}
    dados.forEach(d => {
      porDia[d.diaSemana] = (porDia[d.diaSemana] ?? 0) + d.totalVendas
    })
    const maxDia = Math.max(...Object.values(porDia), 1)

    return (
      <div>
        <div className="text-[12px] text-[var(--ink-ghost)] mb-3 text-center">
          Distribuição por dia da semana
        </div>
        <div className="flex items-end gap-2 h-24 px-2">
          {[1,2,3,4,5,6,7].map(dia => {
            const v   = porDia[dia] ?? 0
            const pct = (v / maxDia) * 100
            const isPico = v === maxDia && v > 0
            return (
              <div key={dia} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: 80 }}>
                  <div
                    className={cn('w-full rounded-t-md transition-all', isPico ? 'bg-[var(--acc)]' : 'bg-[var(--acc-pale)] border border-[var(--acc-border)]')}
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  />
                </div>
                <span className={cn('text-[13px]', isPico ? 'text-[var(--acc)] font-medium' : 'text-[var(--ink-ghost)]')}>
                  {DIAS[dia-1]}
                </span>
                <span className="text-[12px] text-[var(--ink-ghost)]">{v}</span>
              </div>
            )
          })}
        </div>
        <div className="text-[13px] text-[var(--ink-ghost)] text-center mt-2 opacity-60">
          DATA_VENDA sem hora — exibindo por dia da semana
        </div>
      </div>
    )
  }

  // Heatmap normal hora × dia
  const mapa: Record<string,number> = {}
  dados.forEach(d => { mapa[`${d.diaSemana}_${d.hora}`] = d.totalVendas })
  const max = Math.max(...Object.values(mapa), 1)

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: 380 }}>
        <div className="flex gap-1 pl-9 mb-1.5">
          {DIAS.map(d => <div key={d} className="flex-1 text-center text-[13px] text-[var(--ink-ghost)]">{d}</div>)}
        </div>
        {HORAS.map(h => (
          <div key={h} className="flex items-center gap-1 mb-0.5">
            <div className="w-8 text-right text-[13px] text-[var(--ink-ghost)] shrink-0">{String(h).padStart(2,'0')}h</div>
            {[1,2,3,4,5,6,7].map(dia => {
              const v = mapa[`${dia}_${h}`] ?? 0
              return (
                <div
                  key={dia}
                  title={`${DIAS[dia-1]} ${h}h — ${v} vendas`}
                  className={cn(
                    'flex-1 h-[18px] rounded cursor-pointer hover:opacity-80 flex items-center justify-center',
                    v > 0 ? intensidade(v, max) : 'bg-[var(--bg-subtle)]'
                  )}
                >
                  {v > 0 && <span className="text-[7px] text-[var(--ink)] font-medium opacity-70">{v}</span>}
                </div>
              )
            })}
          </div>
        ))}
        <div className="flex items-center gap-1.5 justify-end mt-2">
          <span className="text-[13px] text-[var(--ink-ghost)]">baixo</span>
          {[15, 30, 50, 70, 90].map(o => (
            <div key={o} className="w-3.5 h-3.5 rounded bg-[var(--acc)]" style={{ opacity: o/100 }} />
          ))}
          <span className="text-[13px] text-[var(--ink-ghost)]">alto</span>
        </div>
      </div>
    </div>
  )
}
