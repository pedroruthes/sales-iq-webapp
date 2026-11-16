import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Building2,
  Copy,
  Database,
  Info,
  Radio,
  Save,
  Store,
  Users,
  MapPin,
  Plus,
  Trash2,
} from 'lucide-react'
import axios from 'axios'
import { Button, FieldInput, FieldTextarea, Modal } from '@/components/ui'
import { AvatarStack } from '@/components/admin/AvatarStack'
import { StatusDotBadge } from '@/components/admin/StatusDotBadge'
import { cn } from '@/lib/utils'
import { lojasSyncDoGrupo, syncStatusBadge } from '@/lib/admin-sync'
import { perfilLabel, type AdminTenant, type AdminUsuario, type SyncFilial } from '@/types/admin'

type RegiaoTransf = { nome: string; filiais: string[] }

interface DetalheGrupoModalProps {
  tenant: AdminTenant | null
  syncFiliais: SyncFilial[]
  usuarios: AdminUsuario[]
  saving?: boolean
  onClose: () => void
  onSaveInfo: (t: AdminTenant, data: { nome: string; descricao: string }) => Promise<void> | void
  onToggle: (id: number, ativo: boolean) => void
  onVincularLojas: (t: AdminTenant) => void
}

function MetaItem({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-[var(--ink-ghost)] mb-1">{label}</div>
      <div className={cn('text-[13px] text-[var(--ink)] truncate', mono && 'font-mono')}>{value}</div>
    </div>
  )
}

function Section({
  icon,
  title,
  subtitle,
  action,
  children,
}: {
  icon: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-[var(--border)] overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-subtle)]/40">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[var(--acc)] shrink-0">{icon}</span>
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-[var(--ink)]">{title}</div>
            {subtitle && (
              <div className="text-[12px] text-[var(--ink-ghost)]">{subtitle}</div>
            )}
          </div>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

export function DetalheGrupoModal({
  tenant,
  syncFiliais,
  usuarios,
  saving = false,
  onClose,
  onSaveInfo,
  onToggle,
  onVincularLojas,
}: DetalheGrupoModalProps) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [copied, setCopied] = useState(false)
  const [mostrarProdutoCor, setMostrarProdutoCor] = useState(false)
  const [transfMesmaRegiao, setTransfMesmaRegiao] = useState(false)
  const [regioes, setRegioes] = useState<RegiaoTransf[]>([])
  const [settingsMsg, setSettingsMsg] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    if (tenant) {
      setNome(tenant.NOME)
      setDescricao(tenant.DESCRICAO ?? '')
      setSettingsMsg('')
      axios
        .get('/api/admin/tenant-settings', { params: { tenantId: tenant.ID } })
        .then((r) => {
          setMostrarProdutoCor(!!r.data?.data?.mostrarProdutoCor)
          setTransfMesmaRegiao(!!r.data?.data?.transferenciaMesmaRegiao)
          const g = r.data?.data?.transferenciaGrupos
          setRegioes(Array.isArray(g) ? g.map((x: RegiaoTransf) => ({
            nome: String(x.nome || '').trim() || 'Região',
            filiais: (x.filiais || []).map((f: string) => String(f).trim()).filter(Boolean),
          })) : [])
        })
        .catch(() => {
          setMostrarProdutoCor(false)
          setTransfMesmaRegiao(false)
          setRegioes([])
        })
    }
  }, [tenant])

  const salvarSettings = async () => {
    if (!tenant) return
    setSavingSettings(true)
    setSettingsMsg('')
    try {
      await axios.put('/api/admin/tenant-settings', {
        tenantId: tenant.ID,
        mostrarProdutoCor,
        transferenciaMesmaRegiao: transfMesmaRegiao,
        transferenciaGrupos: regioes
          .map((r) => ({
            nome: r.nome.trim() || 'Região',
            filiais: r.filiais.map((f) => f.trim()).filter(Boolean),
          }))
          .filter((r) => r.filiais.length > 0),
      })
      setSettingsMsg('Parâmetros salvos')
    } catch {
      setSettingsMsg('Erro ao salvar parâmetros')
    }
    setSavingSettings(false)
  }

  const lojas = useMemo(
    () => lojasSyncDoGrupo(tenant, syncFiliais),
    [tenant, syncFiliais]
  )

  const users = useMemo(() => {
    if (!tenant) return []
    const tid = Number(tenant.ID)
    return usuarios.filter(
      (u) => Number(u.ID_TENANT) === tid || (u.ID_TENANTS ?? []).includes(tid)
    )
  }, [tenant, usuarios])

  if (!tenant) return null

  const dirty =
    nome.trim() !== tenant.NOME ||
    (descricao.trim() || '') !== (tenant.DESCRICAO ?? '').trim()
  const canSave = nome.trim().length > 0 && dirty && !saving

  const syncOk = lojas.filter((f) => f.ATIVO && String(f.ULTIMO_STATUS).toUpperCase() === 'SUCCESS').length
  const syncParcial = lojas.filter((f) => String(f.ULTIMO_STATUS).toUpperCase() === 'PARTIAL').length
  const syncErro = lojas.filter((f) => String(f.ULTIMO_STATUS).toUpperCase() === 'ERROR').length

  const copiarId = async () => {
    await navigator.clipboard.writeText(String(tenant.ID))
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      zIndex={55}
      title={
        <span className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[var(--acc)]" />
          {tenant.NOME}
        </span>
      }
      subtitle="Detalhes do grupo, banco e sync"
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose}>
            Fechar
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={!canSave}
            loading={saving}
            onClick={() =>
              void onSaveInfo(tenant, { nome: nome.trim(), descricao: descricao.trim() })
            }
          >
            <Save className="w-4 h-4" />
            Salvar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Section
          icon={<Info className="w-4 h-4" />}
          title="Parâmetros"
          subtitle="Produto/cor nas telas e regra de transferência"
          action={
            <Button variant="secondary" size="sm" onClick={() => void salvarSettings()} loading={savingSettings}>
              <Save className="w-3.5 h-3.5" /> Salvar params
            </Button>
          }
        >
          <div className="flex flex-col gap-3">
            <label className="flex items-center justify-between gap-3 text-[13px] text-[var(--ink-muted)]">
              <span>Mostrar produto e cor nas telas</span>
              <button
                type="button"
                role="switch"
                aria-checked={mostrarProdutoCor}
                onClick={() => setMostrarProdutoCor((v) => !v)}
                className={cn(
                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                  mostrarProdutoCor ? 'bg-[var(--acc)]' : 'bg-[var(--border-md)]'
                )}
              >
                <span
                  className="inline-block h-3.5 w-3.5 rounded-full bg-white"
                  style={{ transform: mostrarProdutoCor ? 'translateX(18px)' : 'translateX(2px)' }}
                />
              </button>
            </label>
            <label className="flex items-center justify-between gap-3 text-[13px] text-[var(--ink-muted)]">
              <span>Transferências só na mesma região (campo REGIAO do ERP)</span>
              <button
                type="button"
                role="switch"
                aria-checked={transfMesmaRegiao}
                onClick={() => setTransfMesmaRegiao((v) => !v)}
                className={cn(
                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                  transfMesmaRegiao ? 'bg-[var(--acc)]' : 'bg-[var(--border-md)]'
                )}
              >
                <span
                  className="inline-block h-3.5 w-3.5 rounded-full bg-white"
                  style={{ transform: transfMesmaRegiao ? 'translateX(18px)' : 'translateX(2px)' }}
                />
              </button>
            </label>

            <div className="rounded-xl border border-[var(--border)] p-3 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--ink)]">
                  <MapPin className="w-3.5 h-3.5 text-[var(--acc)]" />
                  Regiões de transferência
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setRegioes((r) => [...r, { nome: `Região ${r.length + 1}`, filiais: [] }])}
                >
                  <Plus className="w-3.5 h-3.5" /> Nova região
                </Button>
              </div>
              <p className="text-[12px] text-[var(--ink-ghost)]">
                Com regiões cadastradas, só ocorrem transferências entre lojas da mesma região.
              </p>
              {regioes.length === 0 && (
                <p className="text-[12px] text-[var(--ink-ghost)] italic">Nenhuma região cadastrada.</p>
              )}
              {regioes.map((reg, idx) => (
                <div key={idx} className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)]/40 p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <FieldInput
                        value={reg.nome}
                        onChange={(e) => {
                          const nome = e.target.value
                          setRegioes((all) => all.map((r, i) => (i === idx ? { ...r, nome } : r)))
                        }}
                        placeholder="Nome da região"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setRegioes((all) => all.filter((_, i) => i !== idx))}
                      className="p-2 rounded-lg text-[var(--ink-ghost)] hover:text-[var(--danger)] hover:bg-white shrink-0"
                      title="Remover região"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {lojas.map((lj) => {
                      const cod = String(lj.FILIAL_COD ?? '').trim()
                      if (!cod) return null
                      const on = reg.filiais.includes(cod)
                      const nomeLj = String(lj.FILIAL_NOME || cod)
                      return (
                        <button
                          key={cod}
                          type="button"
                          onClick={() => {
                            setRegioes((all) =>
                              all.map((r, i) => {
                                if (i !== idx) return r
                                const filiais = on
                                  ? r.filiais.filter((f) => f !== cod)
                                  : [...r.filiais, cod]
                                return { ...r, filiais }
                              })
                            )
                          }}
                          className={cn(
                            'text-[12px] px-2.5 py-1.5 rounded-lg border font-medium transition-colors',
                            on
                              ? 'bg-[var(--acc)] text-white border-[var(--acc)]'
                              : 'bg-white text-[var(--ink-muted)] border-[var(--border)] hover:border-[var(--acc-border)]'
                          )}
                          title={cod}
                        >
                          {nomeLj}
                        </button>
                      )
                    })}
                    {!lojas.length && (
                      <span className="text-[12px] text-[var(--ink-ghost)]">Vincule lojas ao grupo primeiro.</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {settingsMsg && <p className="text-[12px] text-[var(--ink-ghost)]">{settingsMsg}</p>}
          </div>
        </Section>

        {/* Informações */}
        <Section
          icon={<Info className="w-4 h-4" />}
          title="Informações"
          subtitle="Identidade e dados editáveis do grupo"
        >
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetaItem
                label="Tenant ID"
                mono
                value={
                  <button
                    type="button"
                    onClick={() => void copiarId()}
                    className="inline-flex items-center gap-1.5 hover:text-[var(--acc)] transition-colors"
                    title="Copiar ID"
                  >
                    {tenant.ID}
                    <Copy className="w-3 h-3" />
                    {copied && <span className="text-[11px] text-[var(--success)]">ok</span>}
                  </button>
                }
              />
              <MetaItem label="Slug" value={tenant.SLUG || '—'} mono />
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wide text-[var(--ink-ghost)] mb-1">
                  Status
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <StatusDotBadge
                    label={
                      tenant.dbIndicador === 'ok' ? 'Ok'
                        : tenant.dbIndicador === 'erro' ? 'Erro'
                          : 'Sem banco'
                    }
                    variant={
                      tenant.dbIndicador === 'ok' ? 'success'
                        : tenant.dbIndicador === 'erro' ? 'danger'
                          : 'warn'
                    }
                  />
                  <button
                    type="button"
                    role="switch"
                    aria-checked={tenant.ATIVO}
                    onClick={() => onToggle(tenant.ID, !tenant.ATIVO)}
                    className="flex items-center gap-2"
                  >
                    <span className={cn(
                      'text-[13px] font-medium',
                      tenant.ATIVO ? 'text-[var(--success)]' : 'text-[var(--ink-ghost)]'
                    )}>
                      {tenant.ATIVO ? 'Ativo' : 'Inativo'}
                    </span>
                    <span
                      className={cn(
                        'relative w-11 h-6 rounded-full transition-colors',
                        tenant.ATIVO ? 'bg-[var(--success)]' : 'bg-[var(--border-md)]'
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                          tenant.ATIVO && 'translate-x-5'
                        )}
                      />
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-4 flex flex-col gap-3">
              <FieldInput
                label="Nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do grupo"
              />
              <FieldTextarea
                label="Descrição"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Opcional"
                rows={2}
              />
            </div>

            {!tenant.dbProvisionado && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-3">
                <Database className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-[13px] text-amber-900">
                  Banco ainda não provisionado. Recrie o grupo ou verifique o PostgreSQL /
                  permissões de CREATE DATABASE.
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Lojas & Sync */}
        <Section
          icon={<Radio className="w-4 h-4" />}
          title="Lojas & Sync"
          subtitle={
            lojas.length === 0
              ? 'Nenhuma loja vinculada'
              : [
                  `${lojas.length} loja${lojas.length === 1 ? '' : 's'}`,
                  syncOk > 0 ? `${syncOk} ok` : null,
                  syncParcial > 0 ? `${syncParcial} parcial` : null,
                  syncErro > 0 ? `${syncErro} erro` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')
          }
          action={
            tenant.dbProvisionado ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onClose()
                  onVincularLojas(tenant)
                }}
              >
                <Store className="w-3.5 h-3.5" /> Gerenciar
              </Button>
            ) : undefined
          }
        >
          {lojas.length === 0 ? (
            <div className="py-4 text-center text-[13px] text-[var(--ink-ghost)]">
              Associe filiais do Sync Agent para ver código, frequência e status de sync.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 -mb-4">
              <table className="w-full border-collapse min-w-[520px]">
                <thead>
                  <tr className="border-y border-[var(--border)] bg-[var(--bg-subtle)]/30">
                    {['Código', 'Nome', 'Freq.', 'Último sync', 'Status'].map((h) => (
                      <th
                        key={h}
                        className="text-left py-2.5 px-4 text-[11px] font-medium text-[var(--ink-ghost)] uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lojas.map((f) => {
                    const st = syncStatusBadge(f.ULTIMO_STATUS, f.ATIVO)
                    return (
                      <tr key={`${f.TENANT_ID}-${f.FILIAL_COD}`} className="border-b border-[var(--border)] last:border-0">
                        <td className="py-2.5 px-4 text-[12px] font-mono text-[var(--acc)]">
                          {f.FILIAL_COD}
                        </td>
                        <td className="py-2.5 px-4 text-[13px] text-[var(--ink)]">
                          {f.FILIAL_NOME}
                        </td>
                        <td className="py-2.5 px-4 text-[12px] text-[var(--ink-ghost)] whitespace-nowrap">
                          {f.FREQUENCIA_MIN > 0 ? `${f.FREQUENCIA_MIN} min` : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-[12px] text-[var(--ink-ghost)] whitespace-nowrap">
                          {f.ULTIMO_SYNC
                            ? new Date(f.ULTIMO_SYNC).toLocaleString('pt-BR')
                            : '—'}
                        </td>
                        <td className="py-2.5 px-4">
                          <StatusDotBadge label={st.label} variant={st.variant} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Usuários */}
        <Section
          icon={<Users className="w-4 h-4" />}
          title="Usuários"
          subtitle={`${users.length} com acesso a este grupo`}
          action={
            <AvatarStack
              people={users.map((u) => ({ id: u.ID, nome: u.NOME }))}
              max={5}
              size="md"
            />
          }
        >
          {users.length === 0 ? (
            <div className="py-4 text-center text-[13px] text-[var(--ink-ghost)]">
              Nenhum usuário vinculado.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)] -mx-4 -my-4 max-h-52 overflow-y-auto">
              {users.map((u) => (
                <div key={u.ID} className="px-4 py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AvatarStack
                      people={[{ id: u.ID, nome: u.NOME }]}
                      max={1}
                      size="sm"
                      showTooltip={false}
                    />
                    <div className="min-w-0">
                      <div className="text-[13px] text-[var(--ink)] truncate">{u.NOME}</div>
                      <div className="text-[11px] text-[var(--ink-ghost)] truncate">{u.EMAIL}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-[var(--acc)] bg-[var(--acc-pale)] px-2 py-0.5 rounded-full">
                      {perfilLabel(u.PERFIL)}
                    </span>
                    <StatusDotBadge
                      label={u.ATIVO ? 'Ativo' : 'Inativo'}
                      variant={u.ATIVO ? 'success' : 'neutral'}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </Modal>
  )
}
