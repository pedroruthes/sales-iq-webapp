export type CrmPeriodo = { dia: number; semana: number; mes: number }

export type CrmMetaLinha = {
  codigoFilial: string
  nomeFilial: string
  metaContatos: CrmPeriodo
  metaRetornos: CrmPeriodo
  contatos: CrmPeriodo
  retornos: CrmPeriodo
  esperadoContatos: number
  esperadoRetornos: number
  conversao: number | null
  fatRetornos: number
  faturamento: number
  metaFaturamento: number
  pctMetaFaturamento: number | null
  participacaoCrm: number | null
}

export type CrmMetaVendedor = CrmMetaLinha & { codigoVendedor: string; nomeVendedor: string }

export type CrmMetasContato = {
  referencia: string
  inicioMes: string
  inicioSemana: string
  janelaRetornoDias: number
  diasUteis: { mes: number; semana: number; ateHoje: number }
  lojas: CrmMetaLinha[]
  vendedores: CrmMetaVendedor[]
}
