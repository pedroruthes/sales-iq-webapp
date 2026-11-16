export const CATEGORIAS = [
  { value: 'PROMOCAO',     label: 'Promoção',           cor: '#6c5ce7', grupo: 'Vendas'  },
  { value: 'CAMPANHA',     label: 'Campanha',            cor: '#1d6ec7', grupo: 'Vendas'  },
  { value: 'TREINAMENTO',  label: 'Treinamento',         cor: '#16a571', grupo: 'Vendas'  },
  { value: 'LAYOUT',       label: 'Layout / Vitrine',    cor: '#8b5cf6', grupo: 'Vendas'  },
  { value: 'PRECO',        label: 'Ajuste de preço',     cor: '#c97c14', grupo: 'Vendas'  },
  { value: 'EQUIPE',       label: 'Mudança de equipe',   cor: '#e04b4b', grupo: 'Vendas'  },
  { value: 'FERIADO',      label: 'Feriado / Data esp.', cor: '#f59e0b', grupo: 'Externo' },
  { value: 'CONCORRENCIA', label: 'Concorrência',        cor: '#ef4444', grupo: 'Externo' },
  { value: 'EVENTO_LOCAL', label: 'Evento local',        cor: '#06b6d4', grupo: 'Externo' },
  { value: 'CLIMA',        label: 'Clima / Tempo',       cor: '#64748b', grupo: 'Externo' },
  { value: 'OPERACIONAL',  label: 'Operacional',         cor: '#78716c', grupo: 'Interno' },
  { value: 'OUTRO',        label: 'Outro',               cor: '#94a3b8', grupo: 'Interno' },
]

export const IMPACTOS = [
  { value: 'POSITIVO', label: 'Impacto positivo', cor: '#16a571' },
  { value: 'NEGATIVO', label: 'Impacto negativo', cor: '#e04b4b' },
  { value: 'NEUTRO',   label: 'Neutro / Incerto', cor: '#94a3b8' },
]

export const GRUPOS_CATEGORIA = ['Vendas', 'Externo', 'Interno'] as const

export interface EntradaDiario {
  ID: number; CODIGO_FILIAL: string; NOME_FILIAL: string
  DATA_ACAO: string; DATA_FIM: string | null; DIAS_ACAO?: number
  CATEGORIA: string; SUBCATEGORIA: string | null
  TITULO: string; DESCRICAO: string; IMPACTO_ESPERADO: string | null
  ID_USUARIO: number; NOME_USUARIO: string
  CRIADO_EM: string; EDITADO_EM: string | null
  FAT_DIA?: number; FAT_DIA_ANT?: number; VARIACAO_FAT?: number
}
