/** Converte valores vindos do PG (numeric/bigint → string) em number seguro. */
export function num(v: unknown, fallback = 0): number {
  if (v == null || v === '') return fallback
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback
  const n = Number(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : fallback
}

export function numOrNull(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = num(v, NaN)
  return Number.isFinite(n) ? n : null
}

const KPI_NUM_KEYS = [
  'faturamento',
  'totalVendas',
  'totalPecas',
  'ticketMedio',
  'precoMedio',
  'pecasAtendimento',
  'percentualPA1',
  'taxaConversao',
  'meta',
  'percentualMeta',
] as const

/** Normaliza campos numéricos de KPIsFilial / KPIsVendedor. */
export function coerceKpiRow<T extends object>(row: T): T {
  const out = { ...row } as Record<string, unknown>
  for (const key of KPI_NUM_KEYS) {
    if (key in out) {
      out[key] = key === 'meta' || key === 'percentualMeta' || key === 'taxaConversao'
        ? numOrNull(out[key])
        : num(out[key])
    }
  }
  for (const key of ['codigoFilial', 'codigoVendedor'] as const) {
    if (key in out && out[key] != null) out[key] = String(out[key]).trim()
  }
  return out as T
}

export function coerceKpiRows<T extends object>(rows: T[]): T[] {
  return rows.map((r) => coerceKpiRow(r))
}
