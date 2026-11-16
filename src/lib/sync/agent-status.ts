export interface TabelaStatusAgente {
  tabela: string
  tabela_destino: string | null
  reset_aplicado_em: string | null
  status: string | null
  ultimo_sync_ts: string | null
  ultimo_full_sync: string | null
  atualizado_em: string | null
  tentativas: number
  ultimo_erro: string | null
  leitura_completa: { ordem: string; fase: string; posicao: string | null } | null
  ultimo_resumo: Record<string, number> | null
}

export interface StatusAgente {
  versao_agente: string | null
  ciclo_inicio: string | null
  ciclo_fim: string | null
  intervalo_min: number | null
  tabelas: TabelaStatusAgente[]
  dead_letter: { arquivos: number; registros: number; por_tabela: Record<string, number> }
  info: Record<string, unknown>
}

export interface LojaSaude {
  tenant_id: number
  tenant_nome: string | null
  filial_cod: string
  filial_nome: string | null
  ativo: boolean
  frequencia_min: number
  versao_agente: string | null
  ultimo_lote_em: string | null
  reportado_em: string | null
  ciclo_fim: string | null
  intervalo_min: number | null
  tabelas: TabelaStatusAgente[]
  dead_letter: StatusAgente['dead_letter'] | null
  info: Record<string, unknown> | null
  reenviar_solicitado_em: string | null
  erros_24h: number
  resets_pendentes: string[]
}
