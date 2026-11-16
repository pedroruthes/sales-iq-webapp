import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  Database,
  Edit2,
  Plus,
  Search,
  Store,
  ToggleLeft,
  ToggleRight,
  Users,
} from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { Spinner } from '@/components/ui/Loading'
import { AdminTableFooter, pageItems } from '@/components/admin/AdminTableFooter'
import { AvatarStack } from '@/components/admin/AvatarStack'
import { RowActionsMenu } from '@/components/admin/RowActionsMenu'
import { StatusDotBadge } from '@/components/admin/StatusDotBadge'
import { TagStack } from '@/components/admin/TagStack'
import { lojasSyncDoGrupo } from '@/lib/admin-sync'
import type { AdminTenant, AdminUsuario, SyncFilial } from '@/types/admin'

const selectChevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")"

interface GruposTabProps {
  tenants: AdminTenant[]
  usuarios: AdminUsuario[]
  syncFiliais: SyncFilial[]
  loading: boolean
  onNovo: () => void
  onDemo?: () => void
  demoLoading?: boolean
  onOpen: (t: AdminTenant) => void
  onVincularLojas: (t: AdminTenant) => void
  onToggle: (id: number, ativo: boolean) => void
  onVerUsuarios: (t: AdminTenant) => void
}

export function GruposTab({
  tenants,
  usuarios,
  syncFiliais,
  loading,
  onNovo,
  onDemo,
  demoLoading,
  onOpen,
  onVincularLojas,
  onToggle,
  onVerUsuarios,
}: GruposTabProps) {
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos')
  const [pagina, setPagina] = useState(1)

  const usersOf = (tenantId: number) =>
    usuarios
      .filter(
        (u) =>
          Number(u.ID_TENANT) === Number(tenantId) ||
          (u.ID_TENANTS ?? []).includes(Number(tenantId))
      )
      .map((u) => ({ id: `${u.ID_TENANT ?? 'x'}-${u.ID}`, nome: u.NOME }))

  const lojasOf = (t: AdminTenant) =>
    lojasSyncDoGrupo(t, syncFiliais).map((f) => f.FILIAL_NOME || f.FILIAL_COD).filter(Boolean)

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return tenants.filter((t) => {
      if (filtroStatus === 'ativo' && !t.ATIVO) return false
      if (filtroStatus === 'inativo' && t.ATIVO) return false
      if (!q) return true
      const lojas = lojasOf(t).join(' ').toLowerCase()
      return (
        t.NOME?.toLowerCase().includes(q) ||
        (t.DESCRICAO ?? '').toLowerCase().includes(q) ||
        (t.SLUG ?? '').toLowerCase().includes(q) ||
        lojas.includes(q)
      )
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenants, syncFiliais, busca, filtroStatus])

  useEffect(() => {
    setPagina(1)
  }, [busca, filtroStatus])

  const paginaAtual = pageItems(filtrados, pagina)

  return (
    <>
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-xl">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-ghost)]" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar empresa, descrição ou loja…"
            className="input-base w-full pl-10"
          />
        </div>
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
        {onDemo && (
          <Button
            variant="secondary"
            size="md"
            onClick={onDemo}
            disabled={!!demoLoading}
            loading={!!demoLoading}
            title="Copia lojas já vinculadas com nomes e códigos anonimizados (vendedores, clientes, produtos, estoque, barras); mantém quantidades e valores"
          >
            <Database className="w-3.5 h-3.5" />
            {tenants.some((t) => t.IS_DEMO) ? 'Atualizar demo' : 'Criar demonstração'}
          </Button>
        )}
      </div>

      {loading ? (
        <Card>
          <div className="py-14 flex flex-col items-center gap-3">
            <Spinner size="md" />
            <span className="text-[14px] text-[var(--ink-ghost)]">Carregando grupos…</span>
          </div>
        </Card>
      ) : tenants.length === 0 ? (
        <Card>
          <div className="py-14 text-center">
            <Building2 className="w-10 h-10 text-[var(--ink-ghost)] mx-auto mb-4 opacity-40" />
            <div className="text-[15px] text-[var(--ink)] font-medium mb-1">Nenhum grupo</div>
            <div className="text-[14px] text-[var(--ink-ghost)] mb-5">Crie o primeiro grupo para começar.</div>
            <Button variant="primary" size="lg" onClick={onNovo}>
              <Plus className="w-4 h-4" /> Criar grupo
            </Button>
          </div>
        </Card>
      ) : filtrados.length === 0 ? (
        <Card>
          <div className="py-14 text-center">
            <Building2 className="w-10 h-10 text-[var(--ink-ghost)] mx-auto mb-4 opacity-40" />
            <div className="text-[15px] text-[var(--ink)] font-medium mb-1">Nenhum resultado</div>
            <div className="text-[14px] text-[var(--ink-ghost)]">Ajuste a busca ou o filtro de status.</div>
          </div>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto bg-white border border-[var(--border)] rounded-xl">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]/50">
                  {['Empresa', 'Descrição', 'Lojas', 'Usuários', 'Status', ''].map((h, i) => (
                    <th
                      key={h || `a-${i}`}
                      className="text-left py-3 px-4 text-[12px] font-medium text-[var(--ink-ghost)]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginaAtual.map((t) => {
                  const people = usersOf(t.ID)
                  const lojas = lojasOf(t)
                  return (
                    <tr
                      key={t.ID}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-subtle)]/60 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="text-[14px] font-medium text-[var(--ink)]">{t.NOME}</div>
                          {t.IS_DEMO && (
                            <span className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                              Demo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[13px] text-[var(--ink-ghost)] max-w-[220px] truncate">
                        {t.DESCRICAO || '—'}
                      </td>
                      <td className="py-3 px-4 min-w-[200px] max-w-[420px]">
                        <TagStack labels={lojas} max={lojas.length || 1} className="!flex-wrap !overflow-visible" />
                      </td>
                      <td className="py-3 px-4">
                        <AvatarStack people={people} max={4} size="lg" />
                      </td>
                      <td className="py-3 px-4">
                        <StatusDotBadge
                          label={t.ATIVO ? 'Ativo' : 'Inativo'}
                          variant={t.ATIVO ? 'success' : 'neutral'}
                        />
                      </td>
                      <td className="py-3 px-4 w-12">
                        <RowActionsMenu
                          title={t.NOME}
                          subtitle={t.SLUG || undefined}
                          actions={[
                            {
                              id: 'edit',
                              label: 'Editar grupo',
                              description: 'Ver e alterar informações do grupo',
                              icon: <Edit2 className="w-4 h-4" />,
                              onClick: () => onOpen(t),
                              tone: 'accent',
                            },
                            {
                              id: 'users',
                              label: 'Usuários',
                              description: 'Ver usuários deste grupo',
                              icon: <Users className="w-4 h-4" />,
                              onClick: () => onVerUsuarios(t),
                            },
                            {
                              id: 'lojas',
                              label: 'Lojas',
                              description: 'Vincular ou gerenciar lojas',
                              icon: <Store className="w-4 h-4" />,
                              onClick: () => onVincularLojas(t),
                            },
                            {
                              id: 'toggle',
                              label: t.ATIVO ? 'Desativar grupo' : 'Ativar grupo',
                              description: t.ATIVO
                                ? 'Desabilitar acesso deste grupo'
                                : 'Reativar o grupo',
                              icon: t.ATIVO
                                ? <ToggleRight className="w-4 h-4" />
                                : <ToggleLeft className="w-4 h-4" />,
                              onClick: () => onToggle(t.ID, !t.ATIVO),
                              tone: t.ATIVO ? 'danger' : 'default',
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
            totalAll={tenants.length}
            page={pagina}
            onPageChange={setPagina}
            noun={{ singular: 'grupo', plural: 'grupos' }}
          />
        </>
      )}
    </>
  )
}
