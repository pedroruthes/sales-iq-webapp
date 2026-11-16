import { cn, fmt } from '@/lib/utils'

interface Item { hora: number; totalVendas: number; faturamento: number }

export function HoraChart({ dados, modo = 'vendas' }: { dados: Item[]; modo?: 'vendas'|'faturamento' }) {
  if (!dados?.length) return (
    <div className="flex items-center justify-center h-28 text-[13px] text-[var(--ink-ghost)]">Sem dados</div>
  )

  // Se todos os dados estão na hora 0, DATA_VENDA não tem hora gravada
  const semHora = dados.length === 1 && dados[0].hora === 0
  if (semHora) return (
    <div className="flex flex-col items-center justify-center h-28 gap-2 text-center">
      <span className="text-[13px] text-[var(--ink-ghost)]">Hora não registrada no sistema</span>
      <span className="text-[12px] text-[var(--ink-ghost)] opacity-60">DATA_VENDA sem componente de hora</span>
    </div>
  )

  const vals   = dados.map(d => modo === 'vendas' ? d.totalVendas : d.faturamento)
  const max    = Math.max(...vals, 1)
  const idxMax = vals.indexOf(max)

  return (
    <div className="flex flex-col gap-2">
      {dados.map((item, i) => {
        const val   = modo === 'vendas' ? item.totalVendas : item.faturamento
        const isPico = i === idxMax
        return (
          <div key={item.hora} className="flex items-center gap-2.5">
            <span className={cn('text-[13px] min-w-[22px] text-right', isPico ? 'text-[var(--success)] font-medium' : 'text-[var(--ink-ghost)]')}>
              {String(item.hora).padStart(2,'0')}h
            </span>
            <div className="flex-1 h-[10px] bg-[var(--bg-subtle)] rounded overflow-hidden">
              <div
                className={cn('h-full rounded', isPico ? 'bg-[var(--success)]' : 'bg-[var(--acc)]')}
                style={{ width: `${(val / max) * 100}%`, opacity: isPico ? 0.9 : 0.6 }}
              />
            </div>
            <span className={cn('text-[12px] min-w-[44px] text-right font-medium', isPico ? 'text-[var(--success)]' : 'text-[var(--ink-faint)]')}>
              {modo === 'vendas' ? `${val} vd` : fmt.currencyShort(val)}
            </span>
          </div>
        )
      })}
      <div className="text-[13px] text-[var(--ink-ghost)] text-center mt-1">
        pico: {String(dados[idxMax]?.hora ?? 0).padStart(2,'0')}h
      </div>
    </div>
  )
}
