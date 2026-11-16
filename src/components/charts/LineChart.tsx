import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { fmt } from '@/lib/utils'

interface Item { data: string; faturamento: number; totalVendas: number }

const Tooltip_ = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload as Item | undefined
  const vendas = Number(row?.totalVendas ?? 0)
  return (
    <div className="bg-white border border-[rgba(120,90,220,0.18)] rounded-xl px-3 py-2.5 text-[13px] shadow-[var(--shadow-card2)]">
      <div className="text-[var(--ink-ghost)] mb-1 font-medium">
        {format(parseISO(label), "dd 'de' MMM", { locale: ptBR })}
      </div>
      <div className="text-[var(--ink)] font-medium text-[13px]">{fmt.currencyShort(payload[0]?.value ?? 0)}</div>
      <div className="text-[var(--ink-faint)] mt-0.5">{vendas} {vendas === 1 ? 'venda' : 'vendas'}</div>
    </div>
  )
}

export function LineChart({ dados, altura = 130, metaDiaria }: {
  dados: Item[]; altura?: number; metaDiaria?: number
}) {
  if (!dados?.length) return (
    <div className="flex items-center justify-center text-[13px] text-[var(--ink-ghost)]" style={{ height: altura }}>
      Sem dados no período
    </div>
  )

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <AreaChart data={dados} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradFat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#6c5ce7" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#6c5ce7" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,90,220,0.08)" vertical={false} />
        <XAxis
          dataKey="data"
          tickFormatter={v => format(parseISO(v), 'dd', { locale: ptBR })}
          tick={{ fill: '#a89ecf', fontSize: 9 }}
          axisLine={false} tickLine={false} interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={v => fmt.currencyShort(v)}
          tick={{ fill: '#a89ecf', fontSize: 9 }}
          axisLine={false} tickLine={false} width={46}
        />
        <Tooltip content={<Tooltip_ />} />
        {metaDiaria && (
          <ReferenceLine y={metaDiaria} stroke="#c97c14" strokeDasharray="4 3" strokeOpacity={0.6} />
        )}
        <Area
          type="monotone" dataKey="faturamento"
          stroke="#6c5ce7" strokeWidth={2}
          fill="url(#gradFat)"
          dot={false}
          activeDot={{ r: 4, fill: '#8b7cf0', stroke: '#6c5ce7', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
