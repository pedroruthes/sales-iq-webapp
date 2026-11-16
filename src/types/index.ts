export type PerfilUsuario = 'admin' | 'proprietario' | 'dono_grupo' | 'supervisora' | 'gerente_loja' | 'vendedora' | 'gerente_grupo' | 'vendedor'
export interface UsuarioSalesIQ {
  ID: number; NOME: string; EMAIL: string; SENHA_HASH: string
  PERFIL: PerfilUsuario; ATIVO: boolean
  CODIGO_FILIAL_PADRAO: string | null; CODIGO_VENDEDOR: string | null; ID_TENANT: number | null
}
export interface Venda {
  CODIGO_FILIAL: string; TICKET: string; DATA_VENDA: Date; DATA_DIGITACAO: Date
  CODIGO_CLIENTE: string | null; VENDEDOR: string; OPERACAO_VENDA: string
  QTDE_TOTAL: number; VALOR_TIKET: number; VALOR_PAGO: number
  VALOR_CANCELADO: number; TOTAL_QTDE_CANCELADA: number
  VALOR_VENDA_BRUTA: number; VALOR_TROCA: number; TERMINAL: string
  CODIGO_FILIAL_PGTO: string | null; TERMINAL_PGTO: string | null; LANCAMENTO_CAIXA: string | null
}
export interface VendaProduto {
  CODIGO_FILIAL: string; TICKET: string; DATA_VENDA: Date; ITEM: number
  CODIGO_BARRA: string; PRODUTO: string; COR_PRODUTO: string; TAMANHO: string
  QTDE: number; PRECO_LIQUIDO: number; DESCONTO_ITEM: number; CUSTO: number; VALOR_TOTAL: number
}
export interface Cliente {
  CODIGO_CLIENTE: string; CONCEITO: string; TIPO_VAREJO: string; CLIENTE_VAREJO: string
  FILIAL: string; UF: string; CIDADE: string; DDD_CELULAR: string; CELULAR: string
  ULTIMA_COMPRA: Date | null; EMAIL: string | null; ANIVERSARIO: Date | null
}
export interface Produto {
  PRODUTO: string; TIPO_PRODUTO: string; DESC_PRODUTO: string; GRUPO_PRODUTO: string
  COLECAO: string; DATA_CADASTRAMENTO: Date; FABRICANTE: string
}
export interface Vendedor {
  VENDEDOR: string; CODIGO_FILIAL: string; VENDEDOR_APELIDO: string
  NOME_VENDEDOR: string; EMAIL: string | null; DESC_CARGO: string
}
export interface Filial {
  FILIAL: string; EMPRESA: string; COD_FILIAL: string; REGIAO: string; REDE_LOJAS: string
  /** Presente no multi-DB */
  _TENANT_ID?: number
  _TENANT_NOME?: string
  IS_DEMO?: boolean
}
export interface KPIsVendas {
  faturamento: number; ticketMedio: number; pecasAtendimento: number; precoMedio: number
  taxaConversao: number | null; percentualPA1: number; totalVendas: number; totalPecas: number
  periodoInicio: Date; periodoFim: Date
}
export interface KPIsFilial extends KPIsVendas {
  codigoFilial: string; nomeFilial: string; meta: number | null; percentualMeta: number | null
}
export interface KPIsVendedor extends KPIsVendas {
  codigoVendedor: string; nomeVendedor: string; apelidoVendedor: string; codigoFilial: string
  meta: number | null; percentualMeta: number | null
}
export interface ComparativoItem {
  indicador: string; valorAtual: number; valorAnterior: number; variacao: number
}
export interface DistribuicaoPAItem { pa: string; total: number; percentual: number }
export interface VolumeHoraItem { hora: number; totalVendas: number; faturamento: number }
export interface HeatmapItem { hora: number; diaSemana: number; totalVendas: number; faturamento: number }
export interface FaturamentoDiarioItem { data: string; faturamento: number; totalVendas: number; vendasDigitadasForaDoDia: number }
export interface SessionUser {
  id: string
  name: string
  email: string
  perfil: PerfilUsuario
  idTenant: number | null
  idTenants?: number[]
  codigoFilialPadrao: string | null
  codigoVendedor: string | null
  filiaisAcesso: string[]
}
