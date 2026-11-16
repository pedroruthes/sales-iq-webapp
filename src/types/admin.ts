export type AdminAba = 'grupos' | 'usuarios' | 'sync' | 'perfis'

export interface AdminMeta {
  multiDb: boolean
}

export interface AdminTenant {
  ID: number
  NOME: string
  DESCRICAO: string | null
  SLUG?: string | null
  ATIVO: boolean
  IS_DEMO?: boolean
  DB_NAME?: string | null
  dbProvisionado?: boolean
  dbIndicador?: 'ok' | 'erro' | 'sem'
  totalUsuarios?: number
  totalFiliais?: number
  filiais?: string[]
}

export interface AdminUsuario {
  ID: number
  NOME: string
  EMAIL: string
  PERFIL: string
  ATIVO: boolean
  /** Grupo principal (compat); use ID_TENANTS para multi-grupo */
  ID_TENANT: number | null
  ID_TENANTS?: number[]
  /** tenantId → id do usuário naquele banco */
  membershipIds?: Record<number, number>
  NOME_TENANT?: string | null
  CODIGO_FILIAL_PADRAO?: string | null
  CODIGO_VENDEDOR?: string | null
  filiaisAcesso?: string
  /** true = acesso a todas as lojas dos grupos vinculados */
  ACESSO_TODAS_FILIAIS?: boolean
}

export interface AdminFilial {
  FILIAL: string
  EMPRESA?: string
  COD_FILIAL: string
  REGIAO?: string
  REDE_LOJAS?: string
  _TENANT_ID?: number
}

export interface SyncFilial {
  ID: number
  TENANT_ID: number
  TENANT_NOME?: string | null
  FILIAL_COD: string
  FILIAL_NOME: string
  ATIVO: boolean
  SISTEMA_ORIGEM?: string
  FREQUENCIA_MIN: number
  ULTIMO_SYNC?: string | null
  ULTIMO_STATUS?: string | null
  VERSAO_AGENTE?: string | null
  SENHA_PAINEL: string
  VINCULADA?: boolean
}

export interface LojaVinculo {
  codigo: string
  nome: string
  syncId?: number | null
  ativo?: boolean | null
  tenantIdOrigem?: number
  tenantNomeOrigem?: string | null
}

export interface SyncForm {
  id?: number
  filialCod: string
  filialNome: string
  tenantId: number | ''
  frequenciaMin: number
  sistemaOrigem: string
  ativo?: boolean
}

export interface GrupoForm {
  nome: string
  descricao: string
  filiais: string[]
  /** Opcional — grupo pode ser criado sem usuário proprietário */
  emailAdmin: string
  senhaAdmin: string
  nomeAdmin: string
  slug: string
  dbConnectionUrl: string
}

export interface UserForm {
  nome: string
  email: string
  senha: string
  /** Perfil padrão (usado se não houver override por contexto) */
  perfil: string
  /**
   * Grupos derivados das lojas (não selecionados manualmente).
   * Preenchido automaticamente a partir de filiaisAcesso / acessoTodasFiliais.
   */
  idTenants: number[]
  /** Perfil por grupo/contexto (tenantId → perfil) */
  perfilPorTenant: Record<number, string>
  codigoFilialPadrao: string
  codigoVendedor: string
  filiaisAcesso: string[]
  /**
   * Se true, o usuário acessa todas as lojas dos grupos selecionados.
   * Independente do perfil.
   */
  acessoTodasFiliais: boolean
}

export interface SyncCredenciais {
  apiKey: string
  senhaPainel: string
  usuarioPainel: string
  filialCod: string
  filialNome: string
  tenantId: number
  regenerada?: boolean
  catalogoCriadoAgora?: boolean
  qtdTabelasCatalogo?: number
}

export interface ProvisionResult {
  nome: string
  tenantId: number
  slug: string
  dbName: string
  dbMode: string
  catalogoTabelas: number
  schemaAplicado?: boolean
  emailAdmin?: string
  senhaAdmin?: string
  mensagem?: string
}

export const emptyGrupoForm = (): GrupoForm => ({
  nome: '',
  descricao: '',
  filiais: [],
  emailAdmin: '',
  senhaAdmin: '',
  nomeAdmin: '',
  slug: '',
  dbConnectionUrl: '',
})

export const emptyUserForm = (): UserForm => ({
  nome: '',
  email: '',
  senha: '',
  perfil: 'vendedora',
  idTenants: [],
  perfilPorTenant: {},
  codigoFilialPadrao: '',
  codigoVendedor: '',
  filiaisAcesso: [],
  acessoTodasFiliais: false,
})

export const emptySyncForm = (): SyncForm => ({
  filialCod: '',
  filialNome: '',
  tenantId: '',
  frequenciaMin: 15,
  sistemaOrigem: 'LinxPos',
})

export const PERFIS_ADMIN = [
  { value: 'admin', label: 'Administrador', desc: 'CytheraTech — acesso global' },
  { value: 'proprietario', label: 'Proprietário', desc: 'Dono da rede' },
  { value: 'dono_grupo', label: 'Dono do grupo', desc: 'Dono do grupo' },
  { value: 'gerente_grupo', label: 'Gerente de grupo', desc: 'Opera várias lojas do grupo' },
  { value: 'analista', label: 'Analista', desc: 'Visualização ampla, sem exclusão' },
  { value: 'supervisora', label: 'Supervisora', desc: 'Supervisiona lojas' },
  { value: 'gerente_loja', label: 'Gerente de loja', desc: 'Gerencia 1 loja' },
  { value: 'vendedora', label: 'Vendedora', desc: 'Vendas da loja' },
] as const

export function perfilLabel(value: string): string {
  return PERFIS_ADMIN.find((p) => p.value === value)?.label ?? value
}

export type LicencaStatusDb = 'ativa' | 'bloqueada' | 'cancelada'
export type LicencaStatusUi = 'ativa' | 'aviso' | 'bloqueada' | 'cancelada'

export interface AdminLicenca {
  ID: number
  ID_TENANT: number
  NOME_TENANT: string
  RESPONSAVEL: string | null
  EMAIL_CONTATO: string | null
  TELEFONE: string | null
  QTDE_LOJAS: number
  QTDE_CADASTRADA: number
  VALOR_POR_LOJA: number
  VALOR_TOTAL: number
  DIAS_CARENCIA: number
  STATUS: LicencaStatusDb
  RENOVACAO_AUTO?: boolean
  DATA_INICIO: string
  DATA_VENCIMENTO: string
  DATA_INICIO_ISO: string
  DATA_VENCIMENTO_ISO: string
  DATA_PAGAMENTO: string | null
  FORMA_PAGAMENTO: string | null
  OBS_PAGAMENTO: string | null
  DIAS_RESTANTES: number
  DIAS_ATRASO: number
  ATUALIZADO_EM?: string | null
  ATUALIZADO_POR?: number | null
}

export interface LicencaForm {
  idTenant: string
  nomeTenant: string
  responsavel: string
  emailContato: string
  telefone: string
  qtdeLojas: string
  valorPorLoja: string
  dataInicio: string
  dataVencimento: string
  diasCarencia: string
}

export interface PagamentoLicencaForm {
  dataPagamento: string
  novoVencimento: string
  valor: string
  formaPagamento: string
  competencia: string
  obs: string
}

export function emptyLicencaForm(): LicencaForm {
  const hoje = new Date()
  const venc = new Date(hoje)
  venc.setMonth(venc.getMonth() + 1)
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return {
    idTenant: '',
    nomeTenant: '',
    responsavel: '',
    emailContato: '',
    telefone: '',
    qtdeLojas: '1',
    valorPorLoja: '0',
    dataInicio: iso(hoje),
    dataVencimento: iso(venc),
    diasCarencia: '5',
  }
}

export function emptyPagamentoForm(valorTotal = 0): PagamentoLicencaForm {
  const hoje = new Date()
  const venc = new Date(hoje)
  venc.setMonth(venc.getMonth() + 1)
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const competencia = `${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`
  return {
    dataPagamento: iso(hoje),
    novoVencimento: iso(venc),
    valor: String(valorTotal || 0),
    formaPagamento: '',
    competencia,
    obs: '',
  }
}

export function statusEfetivoLicenca(l: Pick<AdminLicenca, 'STATUS' | 'DIAS_RESTANTES' | 'DIAS_ATRASO' | 'DIAS_CARENCIA'>): LicencaStatusUi {
  if (l.STATUS === 'cancelada') return 'cancelada'
  if (l.STATUS === 'bloqueada') return 'bloqueada'
  if ((l.DIAS_ATRASO ?? 0) > (l.DIAS_CARENCIA ?? 5)) return 'bloqueada'
  if ((l.DIAS_ATRASO ?? 0) > 0) return 'aviso'
  if ((l.DIAS_RESTANTES ?? 0) >= 0 && (l.DIAS_RESTANTES ?? 0) <= 7) return 'aviso'
  return 'ativa'
}

export function licencaFormFromAdmin(l: AdminLicenca): LicencaForm {
  return {
    idTenant: String(l.ID_TENANT),
    nomeTenant: l.NOME_TENANT ?? '',
    responsavel: l.RESPONSAVEL ?? '',
    emailContato: l.EMAIL_CONTATO ?? '',
    telefone: l.TELEFONE ?? '',
    qtdeLojas: String(l.QTDE_LOJAS ?? 1),
    valorPorLoja: String(l.VALOR_POR_LOJA ?? 0),
    dataInicio: l.DATA_INICIO_ISO || '',
    dataVencimento: l.DATA_VENCIMENTO_ISO || '',
    diasCarencia: String(l.DIAS_CARENCIA ?? 5),
  }
}
