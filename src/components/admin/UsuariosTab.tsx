import { useEffect, useMemo, useState } from 'react'
import {
  Check, Edit2, Eye, EyeOff, Key, Plus, Search, ToggleLeft, ToggleRight, Users,
} from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { Spinner } from '@/components/ui/Loading'
import { AdminTableFooter, pageItems } from '@/components/admin/AdminTableFooter'
import { AvatarStack } from '@/components/admin/AvatarStack'
import { RowActionsMenu } from '@/components/admin/RowActionsMenu'
import { StatusDotBadge } from '@/components/admin/StatusDotBadge'
import { perfilLabel, type AdminTenant, type AdminUsuario } from '@/types/admin'

const selectChevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")"

interface UsuariosTabProps {
  usuarios: AdminUsuario[]
  tenants: AdminTenant[]
  loading: boolean
  initialFiltroGrupo?: string
  onNovo: () => void
  onEdit: (u: AdminUsuario) => void
  onToggle: (u: AdminUsuario) => void
  onResetSenha: (u: AdminUsuario, novaSenha: string) => Promise<void>
}

export function UsuariosTab({
  usuarios, tenants, loading, initialFiltroGrupo = '', onNovo, onEdit, onToggle, onResetSenha,
}: UsuariosTabProps) {
  const [busca, setBusca] = useState('')
  const [filtroGrupo, setFiltroGrupo] = useState(initialFiltroGrupo)
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos')
  const [pagina, setPagina] = useState(1)
  const [resetKey, setResetKey] = useState<string | null>(null)
  const [novaSenha, setNovaSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [resetting, setResetting] = useState(false)

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return usuarios.filter((u) => {
      if (filtroGrupo === 'admin' && u.ID_TENANT != null) return false
      if (filtroGrupo && filtroGrupo !== 'admin') {
        const tid = Number(filtroGrupo)
        const nosGrupos = u.ID_TENANTS?.includes(tid) || Number(u.ID_TENANT) === tid
        if (!nosGrupos) return false
      }
      if (filtroStatus === 'ativo' && !u.ATIVO) return false
      if (filtroStatus === 'inativo' && u.ATIVO) return false
      if (!q) return true
      return (
        u.NOME?.toLowerCase().includes(q) ||
        u.EMAIL?.toLowerCase().includes(q) ||
        (u.NOME_TENANT ?? '').toLowerCase().includes(q) ||
        perfilLabel(u.PERFIL).toLowerCase().includes(q)
      )
    })
  }, [usuarios, busca, filtroGrupo, filtroStatus])

  useEffect(() => {
    if (initialFiltroGrupo) setFiltroGrupo(initialFiltroGrupo)
  }, [initialFiltroGrupo])

  useEffect(() => {
    setPagina(1)
  }, [busca, filtroGrupo, filtroStatus])

  const paginaAtual = pageItems(filtrados, pagina)

  const handleReset = async (u: AdminUsuario) => {
    if (!novaSenha.trim() || resetting) return
    setResetting(true)
    try {
      await onResetSenha(u, novaSenha)
      setResetKey(null)
      setNovaSenha('')
      setMostrarSenha(false)
    } finally {
      setResetting(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-xl">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-ghost)]" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar nome, e-mail, perfil ou grupo…"
            className="input-base w-full pl-10"
          />
        </div>
        <select
          value={filtroGrupo}
          onChange={(e) => setFiltroGrupo(e.target.value)}
          style={{ backgroundImage: selectChevron }}
          className="select-base !w-auto min-w-[180px]"
        >
          <option value="">Todos os grupos</option>
          <option value="admin">Administradores</option>
          {tenants.map((t) => (
            <option key={t.ID} value={String(t.ID)}>{t.NOME}</option>
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
      </div>

      {loading ? (
        <Card>
          <div className="py-14 flex flex-col items-center gap-3">
            <Spinner size="md" />
            <span className="text-[14px] text-[var(--ink-ghost)]">Carregando usuários…</span>
          </div>
        </Card>
      ) : filtrados.length === 0 ? (
        <Card>
          <div className="py-14 text-center">
            <Users className="w-10 h-10 text-[var(--ink-ghost)] mx-auto mb-4 opacity-40" />
            <div className="text-[15px] text-[var(--ink)] font-medium mb-1">
              {usuarios.length === 0 ? 'Nenhum usuário' : 'Nenhum resultado'}
            </div>
            {usuarios.length === 0 ? (
              <div className="text-[14px] text-[var(--ink-ghost)] mb-5">Crie o primeiro usuário.</div>
            ) : (
              <div className="text-[14px] text-[var(--ink-ghost)]">Ajuste a busca ou os filtros.</div>
            )}
            {usuarios.length === 0 && (
              <Button variant="primary" size="lg" onClick={onNovo}>
                <Plus className="w-4 h-4" /> Novo usuário
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
                  {['Usuário', 'Perfil', 'Grupos', 'Status', ''].map((h, i) => (
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
                {paginaAtual.map((u) => {
                  const rowKey = `${u.ID_TENANT ?? 'admin'}-${u.ID}`
                  const isPlatformAdmin = u.PERFIL === 'admin' && u.ID_TENANT == null && !(u.ID_TENANTS?.length)
                  const idsGrupos = u.ID_TENANTS?.length
                    ? u.ID_TENANTS
                    : u.ID_TENANT != null
                      ? [u.ID_TENANT]
                      : []
                  const nomesGrupos = idsGrupos
                    .map((tid) => tenants.find((t) => t.ID === tid)?.NOME)
                    .filter(Boolean) as string[]
                  return (
                    <tr key={rowKey} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-subtle)]/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <AvatarStack people={[{ id: rowKey, nome: u.NOME }]} max={1} size="lg" showTooltip={false} />
                          <div className="min-w-0">
                            <div className="text-[14px] font-medium text-[var(--ink)] truncate">{u.NOME}</div>
                            <div className="text-[12px] text-[var(--ink-ghost)] truncate">{u.EMAIL}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[13px] bg-[var(--acc-pale)] text-[var(--acc)] px-2.5 py-1 rounded-full">
                          {perfilLabel(u.PERFIL)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {isPlatformAdmin ? (
                          <span className="text-[12px] text-[var(--ink-ghost)]">Administrador</span>
                        ) : nomesGrupos.length === 0 ? (
                          <span className="text-[12px] text-[var(--ink-ghost)]">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 min-w-0" title={nomesGrupos.join(', ')}>
                            {nomesGrupos.map((nome) => (
                              <span
                                key={nome}
                                className="text-[11px] px-2 py-0.5 rounded-md bg-[var(--bg-subtle)] text-[var(--ink-muted)] border border-[var(--border)] truncate max-w-[140px]"
                              >
                                {nome}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <StatusDotBadge
                          label={u.ATIVO ? 'Ativo' : 'Inativo'}
                          variant={u.ATIVO ? 'success' : 'neutral'}
                        />
                      </td>
                      <td className="py-3 px-4 w-12">
                        <RowActionsMenu
                          title={u.NOME}
                          subtitle={u.EMAIL}
                          actions={[
                            {
                              id: 'edit',
                              label: 'Editar usuário',
                              description: 'Alterar perfil, lojas e contextos de acesso',
                              icon: <Edit2 className="w-4 h-4" />,
                              onClick: () => onEdit(u),
                              tone: 'accent',
                            },
                            {
                              id: 'reset',
                              label: 'Resetar senha',
                              description: 'Definir uma nova senha de acesso',
                              icon: <Key className="w-4 h-4" />,
                              onClick: () => {
                                setResetKey(rowKey)
                                setNovaSenha('')
                                setMostrarSenha(false)
                              },
                              tone: 'warn',
                            },
                            {
                              id: 'toggle',
                              label: u.ATIVO ? 'Desativar usuário' : 'Ativar usuário',
                              description: u.ATIVO
                                ? 'Impedir o login deste usuário'
                                : 'Permitir novamente o acesso',
                              icon: u.ATIVO
                                ? <ToggleRight className="w-4 h-4" />
                                : <ToggleLeft className="w-4 h-4" />,
                              onClick: () => onToggle(u),
                              tone: u.ATIVO ? 'danger' : 'default',
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
            totalAll={usuarios.length}
            page={pagina}
            onPageChange={setPagina}
            noun={{ singular: 'usuário', plural: 'usuários' }}
          />
        </>
      )}

      {resetKey && (
        <Card className="!p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-[13px] text-[var(--ink-muted)]">
              Definir nova senha para o usuário selecionado
            </div>
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Nova senha (mín. 6)"
                  className="input-base !w-52 !pr-9"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-ghost)]"
                >
                  {mostrarSenha ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <Button
                variant="primary"
                size="md"
                disabled={resetting || novaSenha.trim().length < 6}
                onClick={() => {
                  const u = filtrados.find((x) => `${x.ID_TENANT ?? 'admin'}-${x.ID}` === resetKey)
                  if (u) void handleReset(u)
                }}
              >
                <Check className="w-4 h-4" /> Confirmar
              </Button>
              <Button variant="secondary" size="md" onClick={() => setResetKey(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  )
}
