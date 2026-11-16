import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, SectionTitle } from '@/components/ui'
import { Store } from 'lucide-react'
import { fmt, cn } from '@/lib/utils'
import { num } from '@/lib/num'
import { KPIsFilial } from '@/types'

interface Props {
  kpisAtual: KPIsFilial[]
  kpisAnterior: KPIsFilial[]
}

type Row = {
  nome: string
  nomeCurto: string
  atual: number
  anterior: number
  variacao: number
  pctVsAnt: number
}

function FatTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload as Row | undefined
  if (!row) return null
  return (
    <div className="bg-white border border-[var(--border)] rounded-xl px-3.5 py-3 text-[12px] shadow-[var(--shadow-card2)] min-w-[180px]">
      <div className="font-semibold text-[var(--ink)] mb-2">{row.nome}</div>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between gap-4">
          <span className="text-[var(--ink-ghost)]">Atual</span>
          <span className="font-medium text-[var(--acc)] tabular-nums">{fmt.currencyShort(row.atual)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-[var(--ink-ghost)]">Anterior</span>
          <span className="font-medium text-[var(--ink-muted)] tabular-nums">{fmt.currencyShort(row.anterior)}</span>
        </div>
        <div className="flex justify-between gap-4 pt-1 border-t border-[var(--border)]">
          <span className="text-[var(--ink-ghost)]">vs anterior</span>
          <span
            className={cn(
              'font-semibold tabular-nums',
              row.variacao >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'
            )}
          >
            {row.variacao >= 0 ? '+' : ''}
            {fmt.percent(row.variacao, 1)}
          </span>
        </div>
      </div>
    </div>
  )
}

export function FaturamentoPorLoja({ kpisAtual, kpisAnterior }: Props) {
  if (!kpisAtual.length) return null

  const data: Row[] = [...kpisAtual]
    .sort((a, b) => num(b.faturamento) - num(a.faturamento))
    .slice(0, 8)
    .map((k) => {
      const ant = kpisAnterior.find((a) => a.codigoFilial === k.codigoFilial)
      const atual = num(k.faturamento)
      const anterior = num(ant?.faturamento)
      const nome = k.nomeFilial || k.codigoFilial
      const variacao = anterior > 0 ? ((atual - anterior) / anterior) * 100 : atual > 0 ? 100 : 0
      const pctVsAnt = anterior > 0 ? (atual / anterior) * 100 : atual > 0 ? 100 : 0
      return {
        nome,
        nomeCurto: nome.length > 12 ? `${nome.slice(0, 10)}…` : nome,
        atual,
        anterior,
        variacao,
        pctVsAnt,
      }
    })

  const chartH = Math.max(220, data.length * 42)

  return (
    <Card padding="sm" className="flex flex-col">
      <div className="mb-2">
        <SectionTitle label="Faturamento por loja" icon={Store} className="mb-1" />
        <p className="text-[12px] text-[var(--ink-ghost)]">
          Barras atual × anterior · progresso vs período anterior
        </p>
      </div>

      <ResponsiveContainer width="100%" height={chartH}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
          barCategoryGap={14}
          barGap={2}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(22,21,29,0.06)" />
          <XAxis
            type="number"
            tickFormatter={(v) => fmt.currencyShort(v)}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--ink-ghost)', fontSize: 10 }}
          />
          <YAxis
            type="category"
            dataKey="nomeCurto"
            width={92}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--ink-muted)', fontSize: 11 }}
          />
          <Tooltip content={<FatTooltip />} cursor={{ fill: 'var(--bg-subtle)' }} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, color: 'var(--ink-ghost)', paddingBottom: 6 }}
          />
          <Bar dataKey="anterior" name="Anterior" fill="#cfc9e8" radius={[0, 4, 4, 0]} barSize={9} />
          <Bar dataKey="atual" name="Atual" fill="#6c5ce7" radius={[0, 4, 4, 0]} barSize={9} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-3 pt-3 border-t border-[var(--border)] flex flex-col gap-2">
        <div className="text-[11px] text-[var(--ink-ghost)] uppercase tracking-wide font-medium">
          Progresso vs período anterior
        </div>
        {data.map((row) => {
          const barPct = Math.min(row.pctVsAnt, 100)
          const acima = row.pctVsAnt >= 100
          return (
            <div key={row.nome} className="flex items-center gap-2.5">
              <div className="w-[7rem] shrink-0 text-[11px] text-[var(--ink-muted)] truncate" title={row.nome}>
                {row.nome}
              </div>
              <div className="flex-1 h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden relative">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    acima ? 'bg-[var(--success)]' : row.pctVsAnt >= 80 ? 'bg-[var(--warn)]' : 'bg-[var(--danger)]'
                  )}
                  style={{ width: `${Math.max(barPct, 3)}%`, opacity: 0.85 }}
                />
                {acima && row.pctVsAnt > 100 && (
                  <div
                    className="absolute inset-y-0 left-0 bg-[var(--success)]/25 rounded-full"
                    style={{ width: '100%' }}
                  />
                )}
              </div>
              <div
                className={cn(
                  'w-14 text-right text-[11px] font-semibold tabular-nums shrink-0',
                  acima ? 'text-[var(--success)]' : row.variacao >= 0 ? 'text-[var(--ink)]' : 'text-[var(--danger)]'
                )}
              >
                {fmt.percent(row.pctVsAnt, 0)}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
