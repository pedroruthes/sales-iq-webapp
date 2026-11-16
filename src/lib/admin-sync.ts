import type { AdminTenant, SyncFilial } from '@/types/admin'

type StatusVariant = 'success' | 'neutral' | 'danger' | 'warn' | 'info'

/** Badge de status do Sync Agent (SUCCESS / PARTIAL / ERROR / RESET). */
export function syncStatusBadge(
  status: string | null | undefined,
  ativo = true
): { label: string; variant: StatusVariant } {
  if (!ativo) return { label: 'Inativo', variant: 'neutral' }
  const s = String(status ?? '').trim().toUpperCase()
  if (s === 'SUCCESS') return { label: 'Ok', variant: 'success' }
  if (s === 'PARTIAL') return { label: 'Parcial', variant: 'warn' }
  if (s === 'ERROR') return { label: 'Erro', variant: 'danger' }
  if (s === 'RESET') return { label: 'Reset', variant: 'neutral' }
  if (s) return { label: s, variant: 'warn' }
  return { label: 'Sem sync', variant: 'neutral' }
}

/**
 * Lojas do grupo para UI de sync.
 * Fonte de verdade: `tenant.filiais` (tenant_filiais). Enriquece com sync_filiais_config
 * pelo código — mesmo se o tenant_id do sync estiver desalinhado.
 * Sem vínculos formais: cai nas filiais de sync deste tenant.
 */
export function lojasSyncDoGrupo(
  tenant: AdminTenant | null | undefined,
  syncFiliais: SyncFilial[]
): SyncFilial[] {
  if (!tenant) return []

  const codigosGrupo = new Set(
    (tenant.filiais ?? []).map((c) => String(c).trim()).filter(Boolean)
  )

  if (codigosGrupo.size > 0) {
    const byCod = new Map<string, SyncFilial>()

    for (const f of syncFiliais) {
      const cod = String(f.FILIAL_COD).trim()
      if (!codigosGrupo.has(cod)) continue
      const prev = byCod.get(cod)
      const prefer =
        !prev || Number(f.TENANT_ID) === Number(tenant.ID)
      if (prefer) {
        byCod.set(cod, { ...f, FILIAL_COD: cod, VINCULADA: true })
      }
    }

    for (const cod of codigosGrupo) {
      if (byCod.has(cod)) continue
      byCod.set(cod, {
        ID: 0,
        TENANT_ID: tenant.ID,
        FILIAL_COD: cod,
        FILIAL_NOME: cod,
        ATIVO: true,
        FREQUENCIA_MIN: 0,
        SENHA_PAINEL: '',
        VINCULADA: true,
        ULTIMO_SYNC: null,
        ULTIMO_STATUS: null,
      })
    }

    return [...byCod.values()].sort((a, b) =>
      String(a.FILIAL_NOME).localeCompare(String(b.FILIAL_NOME), 'pt-BR')
    )
  }

  return syncFiliais
    .filter((f) => Number(f.TENANT_ID) === Number(tenant.ID))
    .map((f) => ({ ...f, FILIAL_COD: String(f.FILIAL_COD).trim() }))
    .sort((a, b) =>
      String(a.FILIAL_NOME).localeCompare(String(b.FILIAL_NOME), 'pt-BR')
    )
}
