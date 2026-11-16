import { useMemo } from 'react'
import { eachDayOfInterval, format, parseISO, isAfter, startOfDay, min as minDate } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, SectionTitle } from '@/components/ui'
import { Activity } from 'lucide-react'
import { fmt } from '@/lib/utils'

interface Item {
  data: string
  faturamento: number
  totalVendas: number
}

function normalizarDia(v: string) {
  return String(v).slice(0, 10)
}

/** Preenche todos os dias do filtro (até hoje), com zero onde não há venda. */
function serieCompleta(dados: Item[], inicio: Date, fim: Date): Item[] {
  const map = new Map(
    dados.map((d) => [normalizarDia(d.data), {
      data: normalizarDia(d.data),
      faturamento: Number(d.faturamento) || 0,
      totalVendas: Number(d.totalVendas) || 0,
    }])
  )

  const start = startOfDay(inicio)
  const endCap = startOfDay(minDate([fim, new Date()]))
  if (isAfter(start, endCap)) return []

  return eachDayOfInterval({ start, end: endCap }).map((day) => {
    const key = format(day, 'yyyy-MM-dd')
    return map.get(key) ?? { data: key, faturamento: 0, totalVendas: 0 }
  })
}

function TooltipDia({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload as Item & { acumulado?: number }
  if (!row) return null
  return (
    <div className="bg-white border border-[var(--border)] rounded-xl px-3.5 py-3 text-[12px] shadow-[var(--shadow-card2)] min-w-[170px]">
      <div className="text-[var(--ink-ghost)] mb-1.5 font-medium">
        {format(parseISO(row.data), "EEEE, dd 'de' MMM", { locale: ptBR })}
      </div>
      <div className="flex justify-between gap-4 mb-1">
        <span className="text-[var(--ink-ghost)]">Faturamento</span>
        <span className="font-semibold text-[var(--ink)] tabular-nums">{fmt.currencyShort(row.faturamento)}</span>
      </div>
      <div className="flex justify-between gap-4 mb-1">
        <span className="text-[var(--ink-ghost)]">Vendas</span>
        <span className="font-medium text-[var(--ink-muted)] tabular-nums">{row.totalVendas}</span>
      </div>
      {row.acumulado != null && (
        <div className="flex justify-between gap-4 pt-1.5 border-t border-[var(--border)]">
          <span className="text-[var(--ink-ghost)]">Acumulado</span>
          <span className="font-semibold text-[var(--acc)] tabular-nums">{fmt.currencyShort(row.acumulado)}</span>
        </div>
      )}
    </div>
  )
}

export function EvolucaoFaturamento({
  dados,
  inicio,
  fim,
  metaDiaria,
}: {
  dados: Item[]
  inicio: Date
  fim: Date
  metaDiaria?: number
}) {
  const serie = useMemo(() => {
    const base = serieCompleta(dados, inicio, fim)
    let acc = 0
    return base.map((d) => {
      acc += d.faturamento
      return { ...d, acumulado: acc }
    })
  }, [dados, inicio, fim])

  const diasComVenda = serie.filter((d) => d.faturamento > 0)
  const total = serie.reduce((a, d) => a + d.faturamento, 0)
  const media = diasComVenda.length ? total / diasComVenda.length : 0
  const pico = diasComVenda.reduce(
    (best, d) => (d.faturamento > (best?.faturamento ?? -1) ? d : best),
    null as Item | null
  )
  const labelPeriodo = `${format(inicio, 'dd/MM', { locale: ptBR })} – ${format(
    minDate([fim, new Date()]),
    'dd/MM',
    { locale: ptBR }
  )}`

  return (
    <Card padding="sm">
      <div className="flex items-start justify-between mb-3 gap-3 flex-wrap">
        <div>
          <SectionTitle label="Evolução diária" icon={Activity} className="mb-1" />
          <p className="text-[12px] text-[var(--ink-ghost)]">
            {labelPeriodo} · {serie.length} dias · {fmt.currencyShort(total)} no período
          </p>
        </div>
        <div className="flex items-center gap-4 text-right shrink-0">
          <div>
            <div className="text-[10px] text-[var(--ink-ghost)] uppercase tracking-wide">Média (dias c/ venda)</div>
            <div className="text-[13px] font-semibold text-[var(--ink)] tabular-nums">{fmt.currencyShort(media)}</div>
          </div>
          {pico && (
            <div>
              <div className="text-[10px] text-[var(--ink-ghost)] uppercase tracking-wide">Melhor dia</div>
              <div className="text-[13px] font-semibold text-[var(--acc)] tabular-nums">
                {fmt.currencyShort(pico.faturamento)}
              </div>
              <div className="text-[10px] text-[var(--ink-ghost)]">
                {format(parseISO(pico.data), "dd MMM", { locale: ptBR })}
              </div>
            </div>
          )}
          {metaDiaria != null && metaDiaria > 0 && (
            <div>
              <div className="text-[10px] text-[var(--ink-ghost)] uppercase tracking-wide">Meta/dia</div>
              <div className="text-[13px] font-semibold text-[var(--warn)] tabular-nums">
                {fmt.currencyShort(metaDiaria)}
              </div>
            </div>
          )}
        </div>
      </div>

      {!serie.length ? (
        <div className="h-[180px] flex items-center justify-center text-[13px] text-[var(--ink-ghost)]">
          Sem dados no período
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={serie} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradFatDash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6c5ce7" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#6c5ce7" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(22,21,29,0.06)" vertical={false} />
            <XAxis
              dataKey="data"
              tickFormatter={(v) => format(parseISO(v), 'dd/MM', { locale: ptBR })}
              tick={{ fill: 'var(--ink-ghost)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              minTickGap={28}
            />
            <YAxis
              tickFormatter={(v) => fmt.currencyShort(v)}
              tick={{ fill: 'var(--ink-ghost)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip content={<TooltipDia />} />
            {metaDiaria != null && metaDiaria > 0 && (
              <ReferenceLine
                y={metaDiaria}
                stroke="#c07812"
                strokeDasharray="4 3"
                strokeOpacity={0.7}
                label={{ value: 'meta', fill: '#c07812', fontSize: 10, position: 'insideTopRight' }}
              />
            )}
            <Area
              type="monotone"
              dataKey="faturamento"
              stroke="#6c5ce7"
              strokeWidth={2}
              fill="url(#gradFatDash)"
              dot={false}
              activeDot={{ r: 4, fill: '#8b7cf0', stroke: '#6c5ce7', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
