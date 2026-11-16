import type { CrmMetasContato } from '@/lib/queries/crm'

export type DiarioResultado = {
  titulo: string
  categoria: string
  filial: string
  inicio: string
  fim: string
  dias: number
  faturamento: number
  faturamentoAnterior: number
  variacao: number | null
}

export type TransferenciaResumo = {
  total: number
  porStatus: Record<string, number>
  pecas: number
  previsaoReceita: number
  recebidas: number
  pecasRecebidas: number
  pecasVendidasDestino: number
  faturamentoDestino: number
  sellThrough: number | null
}

export type ScoreLinha = {
  filial: string
  vendedor: string
  nome: string
  score: number
  scoreAnterior: number | null
  faturamento: number
  metaFaturamento: number | null
}

export type GamificacaoLinha = {
  filial: string
  vendedor: string
  pontos: number
  faturamento: number
  badgesNoPeriodo: number
}

export type PdcaResumo = {
  porStatus: Record<string, number>
  atrasados: number
  concluidos: {
    titulo: string
    indicador: string | null
    baseline: number | null
    meta: number | null
    resultado: number | null
    scoreAntes: number | null
    scoreDepois: number | null
  }[]
}

export type ContextoOperacional = {
  faturamentoPeriodo: number
  faturamentoPeriodoAnterior: number
  diario: DiarioResultado[] | null
  transferencias: TransferenciaResumo | null
  score: ScoreLinha[] | null
  gamificacao: { ranking: GamificacaoLinha[]; desafiosAtivos: number } | null
  crm: CrmMetasContato | null
  pdca: PdcaResumo | null
}
