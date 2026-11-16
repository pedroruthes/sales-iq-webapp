import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, SectionTitle } from '@/components/ui'
import { Layers } from 'lucide-react'
import { fmt } from '@/lib/utils'

interface ItemGrupo {
  GRUPO_PRODUTO: string
  faturamento: number
  qtdVendida: number
}

const CORES = [
  '#6c5ce7', '#0f9f6e', '#1a6bb8', '#c07812', '#dc4a4a',
  '#8b7cf0', '#0d9488', '#2563eb',
]
const COR_RESTANTE = '#b8bcc8'

type ChartRow = {
  nome: string
  nomeCurto: string
  faturamento: number
  qtd: number
  pct: number
  cor: string
  isOutros?: boolean
  detalhes?: { nome: string; faturamento: number; qtd: number; pct: number }[]
}

function MixTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload as ChartRow | undefined
  if (!row) return null

  return (
    <div className="bg-white border border-[var(--border)] rounded-xl px-3.5 py-3 text-[12px] shadow-[var(--shadow-card2)] min-w-[200px] max-w-[280px]">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: row.cor }} />
        <span className="font-semibold text-[var(--ink)] leading-snug">{row.nome}</span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-1">
        <div>
          <div className="text-[10px] text-[var(--ink-ghost)] uppercase tracking-wide">Participação</div>
          <div className="text-[14px] font-semibold text-[var(--acc)] tabular-nums">
            {fmt.percent(row.pct * 100, 1)}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-[var(--ink-ghost)] uppercase tracking-wide">Faturamento</div>
          <div className="text-[14px] font-semibold text-[var(--ink)] tabular-nums">
            {fmt.currencyShort(row.faturamento)}
          </div>
        </div>
      </div>

      {row.qtd > 0 && (
        <div className="text-[11px] text-[var(--ink-ghost)] mb-1">
          {fmt.number(row.qtd, 0)} peças vendidas
        </div>
      )}

      {row.isOutros && row.detalhes && row.detalhes.length > 0 && (
        <div className="mt-2 pt-2 border-t border-[var(--border)]">
          <div className="text-[10px] text-[var(--ink-ghost)] uppercase tracking-wide mb-1.5">
            Detalhe de Outros
          </div>
          <div className="flex flex-col gap-1">
            {row.detalhes.map((d) => (
              <div key={d.nome} className="flex items-center justify-between gap-3">
                <span className="text-[11px] text-[var(--ink-muted)] truncate flex-1">{d.nome}</span>
                <span className="text-[11px] font-medium text-[var(--ink)] tabular-nums shrink-0">
                  {fmt.percent(d.pct * 100, 1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function MixCategorias({ dados }: { dados: ItemGrupo[] }) {
  if (!dados?.length) return null

  const ordenado = [...dados].sort((a, b) => b.faturamento - a.faturamento)
  const top = ordenado.slice(0, 8)
  const demais = ordenado.slice(8)
  const totalGeral = dados.reduce((a, d) => a + d.faturamento, 0) || 1
  const totalPecas = dados.reduce((a, d) => a + (d.qtdVendida || 0), 0)
  const fatRestante = demais.reduce((a, d) => a + d.faturamento, 0)

  const chartData: ChartRow[] = [
    ...top.map((item, i) => ({
      nome: item.GRUPO_PRODUTO,
      nomeCurto:
        item.GRUPO_PRODUTO.length > 18
          ? `${item.GRUPO_PRODUTO.slice(0, 16)}…`
          : item.GRUPO_PRODUTO,
      faturamento: item.faturamento,
      qtd: item.qtdVendida || 0,
      pct: item.faturamento / totalGeral,
      cor: CORES[i % CORES.length],
    })),
    ...(fatRestante > totalGeral * 0.001
      ? [
          {
            nome: `Outros (${demais.length})`,
            nomeCurto: `Outros (${demais.length})`,
            faturamento: fatRestante,
            qtd: demais.reduce((a, d) => a + (d.qtdVendida || 0), 0),
            pct: fatRestante / totalGeral,
            cor: COR_RESTANTE,
            isOutros: true,
            detalhes: demais.map((d) => ({
              nome: d.GRUPO_PRODUTO,
              faturamento: d.faturamento,
              qtd: d.qtdVendida || 0,
              pct: d.faturamento / totalGeral,
            })),
          },
        ]
      : []),
  ]
  const altura = Math.max(220, chartData.length * 34)

  return (
    <Card padding="sm" className="flex flex-col">
      <div className="mb-2">
        <SectionTitle label="Mix de categorias" icon={Layers} className="mb-1" />
        <p className="text-[12px] text-[var(--ink-ghost)]">
          {dados.length} grupos · {fmt.currencyShort(totalGeral)} · {fmt.number(totalPecas, 0)} peças
        </p>
      </div>

      <ResponsiveContainer width="100%" height={altura}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 48, left: 4, bottom: 4 }}
          barCategoryGap={6}
        >
          <XAxis
            type="number"
            tickFormatter={(v) => fmt.percent(v * 100, 0)}
            domain={[0, 'dataMax']}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--ink-ghost)', fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="nomeCurto"
            width={112}
            reversed
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--ink-muted)', fontSize: 11 }}
          />
          <Tooltip content={<MixTooltip />} cursor={{ fill: 'var(--bg-subtle)' }} />
          <Bar dataKey="pct" radius={[0, 6, 6, 0]} barSize={18}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.cor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
