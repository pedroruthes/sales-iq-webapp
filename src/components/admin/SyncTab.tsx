import { useEffect, useMemo, useState } from 'react'
import {
  Copy, Edit2, KeyRound, Plus, Radio, RefreshCw, Search, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { Spinner } from '@/components/ui/Loading'
import { AdminTableFooter, pageItems } from '@/components/admin/AdminTableFooter'
import { RowActionsMenu } from '@/components/admin/RowActionsMenu'
import { StatusDotBadge } from '@/components/admin/StatusDotBadge'
import { cn } from '@/lib/utils'
import { syncStatusBadge } from '@/lib/admin-sync'
import type { AdminTenant, SyncFilial } from '@/types/admin'

const selectChevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")"

interface SyncTabProps {
  syncFiliais: SyncFilial[]
  tenants: AdminTenant[]
  loading: boolean
  filtroTenantId: number | null
  onFiltroTenant: (id: number | null) => void
  onRefresh: () => void
  onNovo: () => void
  onEdit: (f: SyncFilial) => void
  onToggle: (id: number, ativo: boolean) => void
  onRegenKey: (f: SyncFilial) => void
  showRefresh?: boolean
}

export function SyncTab({
  syncFiliais,
  tenants,
  loading,
  filtroTenantId,
  onFiltroTenant,
  onRefresh,
  onNovo,
  onEdit,
  onToggle,
  onRegenKey,
  showRefresh = true,
}: SyncTabProps) {
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos')
  const [pagina, setPagina] = useState(1)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return syncFiliais.filter((f) => {
      if (filtroTenantId != null && Number(f.TENANT_ID) !== Number(filtroTenantId)) return false
      if (filtroStatus === 'ativo' && !f.ATIVO) return false
      if (filtroStatus === 'inativo' && f.ATIVO) return false
      if (!q) return true
      return (
        f.FILIAL_COD?.toLowerCase().includes(q) ||
        f.FILIAL_NOME?.toLowerCase().includes(q) ||
        (f.TENANT_NOME ?? '').toLowerCase().includes(q)
      )
    })
  }, [syncFiliais, filtroTenantId, busca, filtroStatus])

  useEffect(() => {
    setPagina(1)
  }, [busca, filtroTenantId, filtroStatus])

  const paginaAtual = pageItems(filtrados, pagina)

  const copiarSenha = (f: SyncFilial) => {
    navigator.clipboard.writeText(f.SENHA_PAINEL)
    setCopiedId(f.ID)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const statusOf = (f: SyncFilial) => syncStatusBadge(f.ULTIMO_STATUS, f.ATIVO)

  return (
    <>
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-ghost)]" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar código, nome ou grupo…"
            className="input-base w-full pl-10"
          />
        </div>
        <select
          value={filtroTenantId ?? ''}
          onChange={(e) => onFiltroTenant(e.target.value ? parseInt(e.target.value, 10) : null)}
          style={{ backgroundImage: selectChevron }}
          className="select-base !w-auto min-w-[180px]"
        >
          <option value="">Todos os grupos</option>
          {tenants.map((t) => (
            <option key={t.ID} value={t.ID}>{t.NOME}</option>
          ))}
        </select>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value as 'todos' | 'ativo' | 'inativo')}
          style={{ backgroundImage: selectChevron }}
          className="select-base !w-auto min-w-[150px]"
        >
          <option value="todos">Todos os status</option>
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
        </select>
        {showRefresh && (
          <Button
            variant="secondary"
            size="md"
            onClick={onRefresh}
            className="rounded-[12px] !px-3"
            title="Atualizar"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
        )}
      </div>

      {loading ? (
        <Card>
          <div className="py-14 flex flex-col items-center gap-3">
            <Spinner size="md" />
            <span className="text-[14px] text-[var(--ink-ghost)]">Carregando filiais…</span>
          </div>
        </Card>
      ) : filtrados.length === 0 ? (
        <Card>
          <div className="py-14 text-center">
            <Radio className="w-10 h-10 text-[var(--ink-ghost)] mx-auto mb-4 opacity-40" />
            <div className="text-[15px] text-[var(--ink)] font-medium mb-1">
              {syncFiliais.length === 0 ? 'Nenhuma filial' : 'Nenhum resultado'}
            </div>
            {syncFiliais.length === 0 ? (
              <div className="text-[14px] text-[var(--ink-ghost)] mb-5">Cadastre a primeira filial do Sync Agent.</div>
            ) : (
              <div className="text-[14px] text-[var(--ink-ghost)]">Ajuste a busca ou os filtros.</div>
            )}
            {syncFiliais.length === 0 && (
              <Button variant="primary" size="lg" onClick={onNovo}>
                <Plus className="w-4 h-4" /> Nova filial
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto bg-white border border-[var(--border)] rounded-xl">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]/50">
                  {['Código', 'Nome', 'Grupo', 'Freq.', 'Último sync', 'Status', 'Vínculo', ''].map((h, i) => (
                    <th
                      key={h || `a-${i}`}
                      className="text-left py-3 px-4 text-[12px] font-medium text-[var(--ink-ghost)] whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginaAtual.map((f) => {
                  const st = statusOf(f)
                  return (
                    <tr key={f.ID} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-subtle)]/60 transition-colors">
                      <td className="py-3 px-4 text-[13px] font-mono font-medium text-[var(--acc)]">{f.FILIAL_COD}</td>
                      <td className="py-3 px-4 text-[14px] text-[var(--ink)]">{f.FILIAL_NOME}</td>
                      <td className="py-3 px-4 text-[13px] text-[var(--ink-ghost)]">
                        {f.TENANT_NOME ?? `ID ${f.TENANT_ID}`}
                      </td>
                      <td className="py-3 px-4 text-[13px] text-[var(--ink-ghost)] whitespace-nowrap">
                        {f.FREQUENCIA_MIN} min
                      </td>
                      <td className="py-3 px-4 text-[13px] text-[var(--ink-ghost)] whitespace-nowrap">
                        {f.ULTIMO_SYNC ? new Date(f.ULTIMO_SYNC).toLocaleString('pt-BR') : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <StatusDotBadge label={st.label} variant={st.variant} />
                      </td>
                      <td className="py-3 px-4">
                        <StatusDotBadge
                          label={f.VINCULADA === false ? 'Sem vínculo' : 'Vinculada'}
                          variant={f.VINCULADA === false ? 'warn' : 'success'}
                        />
                      </td>
                      <td className="py-3 px-4 w-12">
                        <RowActionsMenu
                          title={f.FILIAL_NOME}
                          subtitle={`Código ${f.FILIAL_COD}`}
                          actions={[
                            {
                              id: 'edit',
                              label: 'Editar filial',
                              description: 'Alterar nome, frequência e grupo',
                              icon: <Edit2 className="w-4 h-4" />,
                              onClick: () => onEdit(f),
                              tone: 'accent',
                            },
                            {
                              id: 'copy',
                              label: copiedId === f.ID ? 'Senha copiada!' : 'Copiar senha do painel',
                              description: 'Copia a senha usada no Sync Agent',
                              icon: <Copy className="w-4 h-4" />,
                              onClick: () => copiarSenha(f),
                            },
                            {
                              id: 'regen',
                              label: 'Regenerar API Key',
                              description: 'Invalida a chave atual e gera uma nova',
                              icon: <KeyRound className="w-4 h-4" />,
                              onClick: () => onRegenKey(f),
                              tone: 'warn',
                            },
                            {
                              id: 'toggle',
                              label: f.ATIVO ? 'Desativar filial' : 'Ativar filial',
                              description: f.ATIVO
                                ? 'Pausa o sync desta filial'
                                : 'Retoma o sync desta filial',
                              icon: f.ATIVO
                                ? <ToggleRight className="w-4 h-4" />
                                : <ToggleLeft className="w-4 h-4" />,
                              onClick: () => onToggle(f.ID, !f.ATIVO),
                              tone: f.ATIVO ? 'danger' : 'default',
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <AdminTableFooter
            total={filtrados.length}
            totalAll={syncFiliais.length}
            page={pagina}
            onPageChange={setPagina}
            noun={{ singular: 'filial', plural: 'filiais' }}
          />
        </>
      )}
    </>
  )
}
