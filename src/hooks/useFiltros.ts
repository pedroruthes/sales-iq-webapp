import { create } from 'zustand'
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears, format, parseISO } from 'date-fns'

export interface Periodo {
  label: string
  inicio: Date
  fim: Date
}

interface FiltrosState {
  periodo: Periodo
  filialSelecionada: string
  setPeriodo: (p: Periodo) => void
  setFilial: (cod: string) => void
}

export const useFiltros = create<FiltrosState>((set) => ({
  periodo: {
    label: 'Mês atual',
    inicio: startOfMonth(new Date()),
    fim:    endOfMonth(new Date()),
  },
  filialSelecionada: '',
  setPeriodo: (p) => set({ periodo: p }),
  setFilial:  (cod) => set({ filialSelecionada: cod }),
}))

export function getOpcoesPeriodo(): Periodo[] {
  const h = new Date()
  return [
    { label: 'Mês atual',        inicio: startOfMonth(h),              fim: endOfMonth(h)              },
    { label: 'Mês anterior',     inicio: startOfMonth(subMonths(h,1)), fim: endOfMonth(subMonths(h,1)) },
    { label: '2 meses atrás',    inicio: startOfMonth(subMonths(h,2)), fim: endOfMonth(subMonths(h,2)) },
    { label: '3 meses atrás',    inicio: startOfMonth(subMonths(h,3)), fim: endOfMonth(subMonths(h,3)) },
    { label: 'Últimos 3 meses',  inicio: startOfMonth(subMonths(h,2)), fim: endOfMonth(h)              },
    { label: 'Últimos 6 meses',  inicio: startOfMonth(subMonths(h,5)), fim: endOfMonth(h)              },
    { label: 'Ano atual',        inicio: startOfYear(h),               fim: endOfYear(h)               },
    { label: 'Ano anterior',     inicio: startOfYear(subYears(h,1)),   fim: endOfYear(subYears(h,1))   },
    { label: 'Últimos 12 meses', inicio: startOfMonth(subMonths(h,11)),fim: endOfMonth(h)              },
  ]
}

/** Monta período personalizado (início ≤ fim). Label curto para a barra. */
export function periodoPersonalizado(inicioIso: string, fimIso: string): Periodo | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inicioIso) || !/^\d{4}-\d{2}-\d{2}$/.test(fimIso)) return null
  if (fimIso < inicioIso) return null
  const inicio = parseISO(inicioIso)
  const fim = parseISO(fimIso)
  return {
    label: `${format(inicio, 'dd/MM/yy')} – ${format(fim, 'dd/MM/yy')}`,
    inicio,
    fim,
  }
}
