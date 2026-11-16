import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { num } from '@/lib/num'

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

/** Nome de cliente/vendedor sempre em maiúsculas (exibição). */
export function upperNome(v: unknown): string {
  const s = String(v ?? '').trim()
  return s ? s.toLocaleUpperCase('pt-BR') : ''
}

export const fmt = {
  currency: (v: number | string) => {
    const n = num(v, NaN)
    if (!Number.isFinite(n)) return '—'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
  },
  currencyShort: (v: number | string) => {
    const n = num(v, NaN)
    if (!Number.isFinite(n)) return '—'
    if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `R$${(n / 1_000).toFixed(0)}k`
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(n)
  },
  number: (v: number | string, d = 0) => {
    const n = num(v, NaN)
    if (!Number.isFinite(n)) return '—'
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n)
  },
  percent: (v: number | string, d = 1) => {
    const n = num(v, NaN)
    if (!Number.isFinite(n)) return '—'
    return `${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n)}%`
  },
  date: (d: Date | string, p = 'dd/MM/yyyy') => format(typeof d === 'string' ? new Date(d) : d, p, { locale: ptBR }),
}

// Aliases para compatibilidade com componentes antigos
export const formatCurrency      = fmt.currency
export const formatCurrencyShort = fmt.currencyShort
export const formatNumber        = (v: number, d = 0) => fmt.number(v, d)
export const formatPercent       = (v: number, d = 1) => fmt.percent(v, d)

export function getMesAtual()    { const h = new Date(); return { inicio: startOfMonth(h), fim: endOfMonth(h) } }
export function getMesAnterior() { const m = subMonths(new Date(), 1); return { inicio: startOfMonth(m), fim: endOfMonth(m) } }

/**
 * Parseia YYYY-MM-DD do query string como dia de calendário local
 * (00:00 início / 23:59:59.999 fim), evitando o parse UTC de `new Date('YYYY-MM-DD')`.
 */
export function parseDiaParam(v: string | null | undefined, end = false): Date | null {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null
  const d = new Date(`${v}T${end ? '23:59:59.999' : '00:00:00.000'}`)
  return Number.isNaN(d.getTime()) ? null : d
}
export function calcVariacao(atual: number | string, anterior: number | string) {
  const a = num(atual)
  const b = num(anterior)
  return b === 0 ? 0 : ((a - b) / b) * 100
}
export function formatDate(d: Date | string) { const dt = d instanceof Date ? d : new Date(d); return isNaN(dt.getTime()) ? '' : format(dt, 'yyyy-MM-dd') }

export function corMeta(p: number) {
  if (p >= 100) return 'text-success'
  if (p >= 80)  return 'text-warn'
  return 'text-danger'
}
export function corVariacao(v: number, inverter = false) {
  const positivo = inverter ? v < 0 : v > 0
  if (v === 0)  return 'text-ink-ghost'
  return positivo ? 'text-success' : 'text-danger'
}
export function bgMeta(p: number) {
  if (p >= 100) return 'bg-success-bg text-success'
  if (p >= 80)  return 'bg-warn-bg text-warn'
  return 'bg-danger-bg text-danger'
}
