/**
 * SalesIQ — Lógica de períodos de comparação
 *
 * Tipos suportados:
 *   'mesmo_periodo' — mesma quantidade de dias no mês anterior
 *   'mes_anterior'  — mês anterior completo
 *   '454'           — calendário varejista 4-5-4 (NRF simplificado)
 */

export type TipoComparacao = 'mesmo_periodo' | 'mes_anterior' | '454'

export interface PeriodoComparacao {
  inicio: Date
  fim: Date
  label: string
}

/** Semanas por mês no calendário 4-5-4 (52 semanas; ano de 53 recebe +1 no último mês). */
const WEEKS_454 = [4, 5, 4, 4, 5, 4, 4, 5, 4, 4, 5, 4] as const

/** Domingo inicial do ano varejista (próximo a 1º de fevereiro). */
function retailYearStart(calendarYear: number): Date {
  const feb1 = new Date(calendarYear, 1, 1)
  const dow = feb1.getDay() // 0=domingo
  // Domingo em ou imediatamente antes de 1/fev (janela NRF aproximada)
  const start = new Date(feb1)
  start.setDate(feb1.getDate() - dow)
  start.setHours(0, 0, 0, 0)
  return start
}

function build454Months(retailYear: number): { inicio: Date; fim: Date; label: string }[] {
  const start = retailYearStart(retailYear)
  const nextStart = retailYearStart(retailYear + 1)
  const totalDays = Math.round((nextStart.getTime() - start.getTime()) / 86400000)
  const totalWeeks = Math.round(totalDays / 7)
  const weeks = [...WEEKS_454]
  if (totalWeeks >= 53) weeks[11] += 1

  const months: { inicio: Date; fim: Date; label: string }[] = []
  let cursor = new Date(start)
  const nomes = [
    'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul',
    'Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan',
  ]
  for (let i = 0; i < 12; i++) {
    const inicio = new Date(cursor)
    const fim = new Date(cursor)
    fim.setDate(fim.getDate() + weeks[i] * 7 - 1)
    fim.setHours(23, 59, 59, 999)
    months.push({
      inicio,
      fim,
      label: `${nomes[i]} 4-5-4/${retailYear}`,
    })
    cursor = new Date(fim)
    cursor.setDate(cursor.getDate() + 1)
    cursor.setHours(0, 0, 0, 0)
  }
  return months
}

function find454Month(date: Date): { monthIndex: number; retailYear: number; month: { inicio: Date; fim: Date; label: string } } {
  // Tenta o ano varejista do calendário e o anterior (Jan cai no ano varejista anterior)
  for (const y of [date.getFullYear(), date.getFullYear() - 1, date.getFullYear() + 1]) {
    const months = build454Months(y)
    for (let i = 0; i < months.length; i++) {
      const m = months[i]
      if (date >= m.inicio && date <= m.fim) {
        return { monthIndex: i, retailYear: y, month: m }
      }
    }
  }
  // Fallback: mês civil
  const inicio = new Date(date.getFullYear(), date.getMonth(), 1)
  const fim = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  fim.setHours(23, 59, 59, 999)
  return {
    monthIndex: date.getMonth(),
    retailYear: date.getFullYear(),
    month: { inicio, fim, label: 'fallback' },
  }
}

/**
 * Dado um período atual (inicio/fim), calcula o período anterior
 * conforme o tipo de comparação selecionado.
 */
export function calcularPeriodoAnterior(
  inicioRaw: Date | string,
  fimRaw: Date | string,
  tipo: TipoComparacao
): PeriodoComparacao {
  const inicio = new Date(inicioRaw)
  const fim = new Date(fimRaw)
  switch (tipo) {
    case 'mesmo_periodo': {
      const diaInicio = inicio.getDate()
      const diaFim = fim.getDate()
      const mesAnt = new Date(inicio.getFullYear(), inicio.getMonth() - 1, 1)
      const anoAnt = mesAnt.getFullYear()
      const mAnt = mesAnt.getMonth()
      const diasNoMesAnt = new Date(anoAnt, mAnt + 1, 0).getDate()

      const inicioAnt = new Date(anoAnt, mAnt, Math.min(diaInicio, diasNoMesAnt))
      const fimAnt = new Date(anoAnt, mAnt, Math.min(diaFim, diasNoMesAnt))
      fimAnt.setHours(23, 59, 59, 999)

      return {
        inicio: inicioAnt,
        fim: fimAnt,
        label: `${diaInicio}/${(mAnt + 1).toString().padStart(2, '0')} – ${diaFim}/${(mAnt + 1).toString().padStart(2, '0')}`,
      }
    }

    case 'mes_anterior': {
      const mesAnt = new Date(inicio.getFullYear(), inicio.getMonth() - 1, 1)
      const anoAnt = mesAnt.getFullYear()
      const mAnt = mesAnt.getMonth()
      const inicioAnt = new Date(anoAnt, mAnt, 1)
      const fimAnt = new Date(anoAnt, mAnt + 1, 0)
      fimAnt.setHours(23, 59, 59, 999)

      return {
        inicio: inicioAnt,
        fim: fimAnt,
        label: `Mês de ${mesAnt.toLocaleString('pt-BR', { month: 'long' })}`,
      }
    }

    case '454': {
      const atual = find454Month(inicio)
      const prevYear = atual.retailYear - 1
      const prevMonths = build454Months(prevYear)
      const prev = prevMonths[atual.monthIndex] ?? prevMonths[0]

      // Mantém o mesmo offset de dias dentro do mês 4-5-4
      const offsetIni = Math.max(
        0,
        Math.round((inicio.getTime() - atual.month.inicio.getTime()) / 86400000)
      )
      const offsetFim = Math.max(
        offsetIni,
        Math.round((fim.getTime() - atual.month.inicio.getTime()) / 86400000)
      )
      const lenPrev =
        Math.round((prev.fim.getTime() - prev.inicio.getTime()) / 86400000)

      const inicioAnt = new Date(prev.inicio)
      inicioAnt.setDate(inicioAnt.getDate() + Math.min(offsetIni, lenPrev))
      const fimAnt = new Date(prev.inicio)
      fimAnt.setDate(fimAnt.getDate() + Math.min(offsetFim, lenPrev))
      fimAnt.setHours(23, 59, 59, 999)

      return {
        inicio: inicioAnt,
        fim: fimAnt,
        label: prev.label,
      }
    }
  }
}

export const LABELS_COMPARACAO: Record<TipoComparacao, string> = {
  mesmo_periodo: 'Mesmos dias (mês ant.)',
  mes_anterior: 'Mês anterior completo',
  '454': 'Calendário 4-5-4',
}

export const DESCRICAO_COMPARACAO: Record<TipoComparacao, string> = {
  mesmo_periodo: 'vs mesmos dias do mês anterior',
  mes_anterior: 'vs mês anterior completo',
  '454': 'vs período equivalente 4-5-4',
}
