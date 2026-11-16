import { useEffect, useMemo, useState } from 'react'
import { Save, Users } from 'lucide-react'
import axios from 'axios'
import { Button, Modal, FieldInput, FieldSelect, PasswordInput } from '@/components/ui'
import { FilialPicker } from '@/components/admin/FilialPicker'
import {
  PERFIS_ADMIN,
  type AdminFilial,
  type AdminTenant,
  type AdminUsuario,
  type UserForm,
} from '@/types/admin'
import { cn } from '@/lib/utils'

interface UsuarioModalProps {
  open: boolean
  onClose: () => void
  form: UserForm
  setForm: React.Dispatch<React.SetStateAction<UserForm>>
  edit: AdminUsuario | null
  tenantsComBanco: AdminTenant[]
  filiais?: AdminFilial[]
  saving: boolean
  onSave: () => void
}

type OpcaoPerfil = { value: string; label: string; desc: string }

export function UsuarioModal({
  open,
  onClose,
  form,
  setForm,
  edit,
  tenantsComBanco,
  filiais: filiaisProp = [],
  saving,
  onSave,
}: UsuarioModalProps) {
  const [todasFiliais, setTodasFiliais] = useState<AdminFilial[]>([])
  const [loadingFiliais, setLoadingFiliais] = useState(false)
  const [opcoesPerfil, setOpcoesPerfil] = useState<OpcaoPerfil[]>(
    PERFIS_ADMIN.map((p) => ({ value: p.value, label: p.label, desc: p.desc }))
  )

  useEffect(() => {
    if (!open) return
    axios.get('/api/admin/perfis').then((res) => {
      const lista = (res.data?.perfis ?? []) as { id: string; label: string; descricao: string }[]
      if (!lista.length) return
      const custom = lista.map((p) => ({
        value: p.id,
        label: p.label,
        desc: p.descricao || '',
      }))
      const adminOpt = PERFIS_ADMIN.find((p) => p.value === 'admin')
      setOpcoesPerfil([
        ...(adminOpt ? [{ value: adminOpt.value, label: adminOpt.label, desc: adminOpt.desc }] : []),
        ...custom,
      ])
    }).catch(() => { /* mantém defaults */ })
  }, [open])

  const perfisContexto = useMemo(
    () => opcoesPerfil.filter((p) => p.value !== 'admin'),
    [opcoesPerfil]
  )

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoadingFiliais(true)
    Promise.all(
      tenantsComBanco.map((t) =>
        axios
          .get('/api/admin/filiais-grupo', { params: { tenantId: t.ID } })
          .then((res) =>
            (res.data.data ?? []).map((f: AdminFilial) => ({
              ...f,
              _TENANT_ID: t.ID,
              FILIAL: f.FILIAL || f.COD_FILIAL,
            }))
          )
          .catch(() => [] as AdminFilial[])
      )
    )
      .then((lists) => {
        if (cancelled) return
        const map = new Map<string, AdminFilial>()
        for (const f of lists.flat()) {
          const cod = String(f.COD_FILIAL).trim()
          if (!cod || map.has(cod)) continue
          map.set(cod, { ...f, COD_FILIAL: cod })
        }
        for (const f of filiaisProp) {
          const cod = String(f.COD_FILIAL).trim()
          if (cod && !map.has(cod)) map.set(cod, { ...f, COD_FILIAL: cod })
        }
        setTodasFiliais([...map.values()].sort((a, b) =>
          String(a.FILIAL).localeCompare(String(b.FILIAL), 'pt-BR')
        ))
      })
      .finally(() => {
        if (!cancelled) setLoadingFiliais(false)
      })
    return () => { cancelled = true }
  }, [open, tenantsComBanco, filiaisProp])

  const tenantByFilial = useMemo(() => {
    const m = new Map<string, number>()
    for (const f of todasFiliais) {
      const tid = Number(f._TENANT_ID)
      if (f.COD_FILIAL && tid > 0) m.set(String(f.COD_FILIAL).trim(), tid)
    }
    return m
  }, [todasFiliais])

  const contextos = useMemo(() => {
    const ids = new Set<number>(form.idTenants)
    for (const cod of form.filiaisAcesso) {
      const tid = tenantByFilial.get(String(cod).trim())
      if (tid) ids.add(tid)
    }
    // Acesso a todas as lojas: grupos escolhidos explicitamente
    if (form.acessoTodasFiliais) {
      form.idTenants.forEach((id) => ids.add(id))
    }
    return [...ids]
      .map((id) => tenantsComBanco.find((t) => t.ID === id))
      .filter(Boolean) as AdminTenant[]
  }, [form.filiaisAcesso, form.idTenants, form.acessoTodasFiliais, tenantByFilial, tenantsComBanco])

  // Mantém idTenants sincronizado com lojas / grupos
  useEffect(() => {
    if (!open) return
    if (form.acessoTodasFiliais) return // grupos escolhidos manualmente no multi-select
    const ids = contextos.map((t) => t.ID)
    const same =
      ids.length === form.idTenants.length &&
      ids.every((id) => form.idTenants.includes(id))
    if (same) return
    setForm((f) => {
      const perfilPorTenant = { ...f.perfilPorTenant }
      for (const id of ids) {
        if (!perfilPorTenant[id]) perfilPorTenant[id] = f.perfil
      }
      for (const key of Object.keys(perfilPorTenant)) {
        if (!ids.includes(Number(key))) delete perfilPorTenant[Number(key)]
      }
      return { ...f, idTenants: ids, perfilPorTenant }
    })
  }, [open, contextos, form.idTenants, form.perfil, form.acessoTodasFiliais, setForm])

  const toggleFilial = (cod: string) => {
    setForm((f) => {
      const has = f.filiaisAcesso.includes(cod)
      const filiaisAcesso = has
        ? f.filiaisAcesso.filter((x) => x !== cod)
        : [...f.filiaisAcesso, cod]
      return {
        ...f,
        acessoTodasFiliais: false,
        filiaisAcesso,
        codigoFilialPadrao:
          f.codigoFilialPadrao && filiaisAcesso.includes(f.codigoFilialPadrao)
            ? f.codigoFilialPadrao
            : filiaisAcesso[0] ?? '',
      }
    })
  }

  const toggleGrupo = (tenantId: number) => {
    setForm((f) => {
      const has = f.idTenants.includes(tenantId)
      const idTenants = has
        ? f.idTenants.filter((id) => id !== tenantId)
        : [...f.idTenants, tenantId]
      const perfilPorTenant = { ...f.perfilPorTenant }
      if (!has) perfilPorTenant[tenantId] = f.perfil
      else delete perfilPorTenant[tenantId]
      return { ...f, idTenants, perfilPorTenant, acessoTodasFiliais: true }
    })
  }

  const isPlatformAdmin = form.perfil === 'admin' || (edit != null && edit.ID_TENANT == null && !(edit.ID_TENANTS?.length))

  const canSave =
    form.nome.trim() &&
    form.email.trim() &&
    (isPlatformAdmin ||
      (form.acessoTodasFiliais && form.idTenants.length > 0) ||
      form.filiaisAcesso.length > 0) &&
    (edit || form.senha.trim().length >= 6)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[var(--acc)]" />
          {edit ? 'Editar usuário' : 'Novo usuário'}
        </span>
      }
      subtitle={
        isPlatformAdmin
          ? 'Administrador CytheraTech — acesso global'
          : 'Perfil define permissões de módulo. Acesso a lojas é escolhido abaixo (grupo inteiro ou lojas específicas).'
      }
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose}>Cancelar</Button>
          <Button
            variant="primary"
            size="md"
            onClick={onSave}
            disabled={!canSave || saving}
            loading={saving}
          >
            <Save className="w-3.5 h-3.5" />
            {edit ? 'Salvar alterações' : 'Criar usuário'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <FieldInput
            label="Nome *"
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            autoFocus
          />
          <FieldInput
            label="E-mail *"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>

        {!edit && (
          <PasswordInput
            label="Senha *"
            value={form.senha}
            onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
            placeholder="Mínimo 6 caracteres"
          />
        )}

        <FieldSelect
          label="Perfil padrão *"
          value={form.perfil}
          onChange={(e) => {
            const perfil = e.target.value
            setForm((f) => {
              if (perfil === 'admin') {
                return {
                  ...f,
                  perfil,
                  idTenants: [],
                  filiaisAcesso: [],
                  codigoFilialPadrao: '',
                  codigoVendedor: '',
                  perfilPorTenant: {},
                  acessoTodasFiliais: false,
                }
              }
              return {
                ...f,
                perfil,
                perfilPorTenant: Object.fromEntries(
                  Object.keys(f.perfilPorTenant).map((k) => [Number(k), perfil])
                ),
              }
            })
          }}
          disabled={!!edit && edit.ID_TENANT == null && !(edit.ID_TENANTS?.length)}
        >
          {opcoesPerfil.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}{p.desc ? ` — ${p.desc}` : ''}
            </option>
          ))}
        </FieldSelect>

        {isPlatformAdmin && (
          <p className="text-[13px] text-[var(--ink-ghost)] bg-[var(--bg-subtle)] rounded-lg px-3 py-2">
            Administrador tem acesso a tudo — não precisa selecionar lojas.
          </p>
        )}

        {!isPlatformAdmin && (
          <>
            <div>
              <div className="text-[12px] text-[var(--ink-ghost)] uppercase tracking-wide mb-2">
                Escopo de lojas *
              </div>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({
                    ...f,
                    acessoTodasFiliais: true,
                    filiaisAcesso: [],
                    codigoFilialPadrao: '',
                  }))}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg border text-[13px] font-medium transition-colors',
                    form.acessoTodasFiliais
                      ? 'bg-[var(--acc-pale)] border-[var(--acc-border)] text-[var(--acc)]'
                      : 'bg-white border-[var(--border)] text-[var(--ink-muted)] hover:border-[var(--acc-border)]'
                  )}
                >
                  Todas as lojas do(s) grupo(s)
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({
                    ...f,
                    acessoTodasFiliais: false,
                  }))}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg border text-[13px] font-medium transition-colors',
                    !form.acessoTodasFiliais
                      ? 'bg-[var(--acc-pale)] border-[var(--acc-border)] text-[var(--acc)]'
                      : 'bg-white border-[var(--border)] text-[var(--ink-muted)] hover:border-[var(--acc-border)]'
                  )}
                >
                  Somente lojas selecionadas
                </button>
              </div>

              {form.acessoTodasFiliais ? (
                <div>
                  <div className="text-[12px] text-[var(--ink-ghost)] mb-1.5">
                    Selecione o(s) grupo(s) * ({form.idTenants.length})
                  </div>
                  <div className="border border-[var(--border)] rounded-lg max-h-48 overflow-y-auto divide-y divide-[var(--border)]">
                    {tenantsComBanco.map((t) => {
                      const on = form.idTenants.includes(t.ID)
                      return (
                        <button
                          type="button"
                          key={t.ID}
                          onClick={() => toggleGrupo(t.ID)}
                          className={cn(
                            'flex items-center gap-2.5 w-full px-3 py-2.5 text-[13px] text-left transition-colors',
                            on ? 'bg-[var(--acc-pale)] text-[var(--acc)]' : 'text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)]'
                          )}
                        >
                          <span className={cn(
                            'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                            on ? 'bg-[var(--acc)] border-[var(--acc)] text-white' : 'border-[var(--border)]'
                          )}>
                            {on && '✓'}
                          </span>
                          <span className="truncate">{t.NOME}</span>
                          {t.totalFiliais != null && (
                            <span className="text-[11px] text-[var(--ink-ghost)] ml-auto">{t.totalFiliais} lojas</span>
                          )}
                        </button>
                      )
                    })}
                    {!tenantsComBanco.length && (
                      <div className="px-3 py-4 text-[13px] text-[var(--ink-ghost)]">Nenhum grupo cadastrado</div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-[12px] text-[var(--ink-ghost)] mb-1.5">
                    Lojas de acesso * ({form.filiaisAcesso.length})
                  </div>
                  <FilialPicker
                    filiais={todasFiliais}
                    selected={form.filiaisAcesso}
                    onToggle={toggleFilial}
                    emptyMessage={
                      loadingFiliais
                        ? 'Carregando lojas…'
                        : 'Nenhuma loja cadastrada. Vincule lojas aos grupos primeiro.'
                    }
                  />
                </div>
              )}
            </div>

            {!form.acessoTodasFiliais && form.filiaisAcesso.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <FieldSelect
                  label="Loja padrão"
                  value={form.codigoFilialPadrao}
                  onChange={(e) => setForm((f) => ({ ...f, codigoFilialPadrao: e.target.value }))}
                >
                  <option value="">Selecionar</option>
                  {todasFiliais
                    .filter((f) => form.filiaisAcesso.includes(String(f.COD_FILIAL).trim()))
                    .map((f) => (
                      <option key={f.COD_FILIAL} value={String(f.COD_FILIAL).trim()}>
                        {f.FILIAL}
                      </option>
                    ))}
                </FieldSelect>
                {form.perfil === 'vendedora' && (
                  <FieldInput
                    label="Cód. vendedor"
                    value={form.codigoVendedor}
                    onChange={(e) => setForm((f) => ({ ...f, codigoVendedor: e.target.value }))}
                    placeholder="Ex: 0563"
                  />
                )}
              </div>
            )}

            {form.acessoTodasFiliais && form.perfil === 'vendedora' && (
              <FieldInput
                label="Cód. vendedor"
                value={form.codigoVendedor}
                onChange={(e) => setForm((f) => ({ ...f, codigoVendedor: e.target.value }))}
                placeholder="Ex: 0563"
              />
            )}
          </>
        )}

        {!isPlatformAdmin && contextos.length > 0 && (
          <div>
            <div className="text-[12px] text-[var(--ink-ghost)] uppercase tracking-wide mb-1">
              Perfil por contexto ({contextos.length})
            </div>
            <p className="text-[12px] text-[var(--ink-ghost)] mb-2">
              O mesmo login pode ter perfil diferente em cada grupo.
            </p>
            <div className="border border-[var(--border)] rounded-lg divide-y divide-[var(--border)]">
              {contextos.map((t) => (
                <div key={t.ID} className="flex items-center gap-3 px-3 py-2">
                  <span className="text-[13px] text-[var(--ink-muted)] flex-1 truncate">{t.NOME}</span>
                  <select
                    className="select-base !w-auto !min-w-[160px] !h-8 !text-[12px]"
                    value={form.perfilPorTenant[t.ID] ?? form.perfil}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        perfilPorTenant: { ...f.perfilPorTenant, [t.ID]: e.target.value },
                      }))
                    }
                  >
                    {perfisContexto.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
