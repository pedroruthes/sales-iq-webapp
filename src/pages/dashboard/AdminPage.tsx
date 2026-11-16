import { useState, useEffect, useCallback, useMemo } from 'react'
import { Building2, Plus, Radio, Shield, Users } from 'lucide-react'
import axios from 'axios'
import { DashboardLayout } from '@/components/layout'
import { Button } from '@/components/ui'
import { useCurrentUser } from '@/hooks/useSession'
import { cn } from '@/lib/utils'
import { lojasSyncDoGrupo } from '@/lib/admin-sync'
import { AdminToast } from '@/components/admin/AdminToast'
import { GruposTab } from '@/components/admin/GruposTab'
import { UsuariosTab } from '@/components/admin/UsuariosTab'
import { SyncTab } from '@/components/admin/SyncTab'
import { PerfisTab } from '@/components/admin/PerfisTab'
import { GrupoModal } from '@/components/admin/modals/GrupoModal'
import { UsuarioModal } from '@/components/admin/modals/UsuarioModal'
import { SyncFilialModal } from '@/components/admin/modals/SyncFilialModal'
import { CredenciaisModal } from '@/components/admin/modals/CredenciaisModal'
import { ProvisionadoModal } from '@/components/admin/modals/ProvisionadoModal'
import { DetalheGrupoModal } from '@/components/admin/modals/DetalheGrupoModal'
import { VincularLojasModal } from '@/components/admin/modals/VincularLojasModal'
import {
  emptyGrupoForm,
  emptySyncForm,
  emptyUserForm,
  type AdminAba,
  type AdminMeta,
  type AdminTenant,
  type AdminUsuario,
  type GrupoForm,
  type ProvisionResult,
  type SyncCredenciais,
  type SyncFilial,
  type SyncForm,
  type UserForm,
} from '@/types/admin'

const ABAS: { id: AdminAba; icon: typeof Building2; label: string }[] = [
  { id: 'grupos', icon: Building2, label: 'Grupos' },
  { id: 'usuarios', icon: Users, label: 'Usuários' },
  { id: 'sync', icon: Radio, label: 'Filiais' },
  { id: 'perfis', icon: Shield, label: 'Perfis' },
]

function abaFromUrl(): AdminAba {
  if (typeof window === 'undefined') return 'grupos'
  const value = new URLSearchParams(window.location.search).get('aba') as AdminAba | null
  return value && ABAS.some((a) => a.id === value) ? value : 'grupos'
}

export default function AdminPage() {
  const user = useCurrentUser()
  const [aba, setAba] = useState<AdminAba>('grupos')
  const [tenants, setTenants] = useState<AdminTenant[]>([])
  const [usuarios, setUsuarios] = useState<AdminUsuario[]>([])
  const [syncFiliais, setSyncFiliais] = useState<SyncFilial[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingSync, setLoadingSync] = useState(false)
  const [saving, setSaving] = useState(false)
  const [meta, setMeta] = useState<AdminMeta>({ multiDb: true })

  const [modalGrupo, setModalGrupo] = useState(false)
  const [modalUser, setModalUser] = useState(false)
  const [modalSync, setModalSync] = useState(false)
  const [modalCredenciais, setModalCredenciais] = useState<SyncCredenciais | null>(null)
  const [modalProvisionado, setModalProvisionado] = useState<ProvisionResult | null>(null)
  const [modalDetalhe, setModalDetalhe] = useState<AdminTenant | null>(null)
  const [modalVincular, setModalVincular] = useState<AdminTenant | null>(null)
  const [grupoEdit, setGrupoEdit] = useState<AdminTenant | null>(null)
  const [userEdit, setUserEdit] = useState<AdminUsuario | null>(null)
  const [syncEdit, setSyncEdit] = useState<SyncFilial | null>(null)
  const [syncFiltroTenant, setSyncFiltroTenant] = useState<number | null>(null)
  const [lockSyncTenant, setLockSyncTenant] = useState(false)
  const [usuariosFiltroGrupo, setUsuariosFiltroGrupo] = useState('')

  const [toastMsg, setToastMsg] = useState('')
  const [toastTipo, setToastTipo] = useState<'ok' | 'err'>('ok')
  const [demoLoading, setDemoLoading] = useState(false)
  const [grupoForm, setGrupoForm] = useState<GrupoForm>(emptyGrupoForm())
  const [syncForm, setSyncForm] = useState<SyncForm>(emptySyncForm())
  const [userForm, setUserForm] = useState<UserForm>(emptyUserForm())

  const showToast = (msg: string, tipo: 'ok' | 'err' = 'ok') => {
    setToastMsg(msg)
    setToastTipo(tipo)
    setTimeout(() => setToastMsg(''), 4000)
  }

  useEffect(() => {
    setAba(abaFromUrl())
  }, [])

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [tRes, uRes] = await Promise.all([
        axios.get('/api/admin/tenants'),
        axios.get('/api/admin/usuarios'),
      ])
      setTenants(tRes.data.data ?? [])
      if (tRes.data.meta) setMeta(tRes.data.meta)
      setUsuarios(uRes.data.data ?? [])
    } catch (e) {
      console.error(e)
      showToast('Erro ao carregar dados do admin', 'err')
    }
    setLoading(false)
  }, [])

  const carregarSync = useCallback(async () => {
    setLoadingSync(true)
    try {
      const res = await axios.get('/api/admin/sync-filiais')
      setSyncFiliais(res.data.data ?? [])
    } catch (e) {
      console.error(e)
      showToast('Erro ao carregar filiais', 'err')
    }
    setLoadingSync(false)
  }, [])

  useEffect(() => {
    carregar()
    carregarSync()
  }, [carregar, carregarSync])

  useEffect(() => {
    if (aba === 'sync' || modalDetalhe || modalVincular) carregarSync()
  }, [aba, modalDetalhe, modalVincular, carregarSync])

  const tenantsComBanco = useMemo(
    () => tenants.filter((t) => t.dbProvisionado && t.ATIVO),
    [tenants]
  )

  const filiaisTenant = (idTenant: number | null) => {
    if (!idTenant) return []
    const tenant = tenants.find((t) => Number(t.ID) === Number(idTenant))
    return lojasSyncDoGrupo(
      tenant ?? { ID: idTenant, NOME: '', DESCRICAO: null, ATIVO: true, filiais: [] },
      syncFiliais
    ).map((f) => ({
      COD_FILIAL: String(f.FILIAL_COD).trim(),
      FILIAL: f.FILIAL_NOME,
      _TENANT_ID: Number(f.TENANT_ID),
    }))
  }

  const salvarGrupo = async () => {
    if (!grupoForm.nome.trim()) return
    setSaving(true)
    try {
      if (grupoEdit) {
        await axios.put('/api/admin/tenants', {
          id: grupoEdit.ID,
          nome: grupoForm.nome,
          descricao: grupoForm.descricao,
          filiais: grupoEdit.filiais ?? [],
          ativo: grupoEdit.ATIVO,
        })
        showToast('Grupo atualizado!')
      } else {
        const res = await axios.post('/api/admin/tenants', {
          nome: grupoForm.nome,
          descricao: grupoForm.descricao,
          filiais: [],
          emailAdmin: grupoForm.emailAdmin || undefined,
          senhaAdmin: grupoForm.senhaAdmin || undefined,
          nomeAdmin: grupoForm.nomeAdmin || undefined,
          slug: grupoForm.slug || undefined,
        })
        setModalProvisionado({
          ...res.data,
          senhaAdmin: grupoForm.senhaAdmin || undefined,
          emailAdmin: grupoForm.emailAdmin || res.data.emailAdmin,
          nome: grupoForm.nome,
        })
        showToast(res.data.mensagem || 'Grupo criado!')
      }
      setModalGrupo(false)
      setGrupoForm(emptyGrupoForm())
      setGrupoEdit(null)
      carregar()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      showToast('Erro: ' + (err?.response?.data?.error ?? 'tente novamente'), 'err')
    }
    setSaving(false)
  }

  const toggleTenant = async (id: number, ativo: boolean) => {
    try {
      await axios.patch('/api/admin/tenants', { id, ativo })
      carregar()
      if (modalDetalhe?.ID === id) {
        setModalDetalhe((t) => (t ? { ...t, ATIVO: ativo } : t))
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      showToast('Erro: ' + (err?.response?.data?.error ?? 'falha ao alterar'), 'err')
    }
  }

  const salvarUser = async () => {
    if (!userForm.nome.trim() || !userForm.email.trim()) return
    setSaving(true)
    try {
      const isPlatformAdmin =
        userForm.perfil === 'admin' ||
        (userEdit != null && userEdit.ID_TENANT == null && !(userEdit.ID_TENANTS?.length))
      const acessoTodas = !!userForm.acessoTodasFiliais
      const filiaisPayload = isPlatformAdmin || acessoTodas ? [] : userForm.filiaisAcesso

      if (userEdit) {
        await axios.put('/api/admin/usuarios', {
          id: userEdit.ID,
          nome: userForm.nome,
          email: userForm.email,
          perfil: userForm.perfil,
          perfilPorTenant: userForm.perfilPorTenant,
          filiais: filiaisPayload,
          acessoTodasFiliais: acessoTodas,
          idTenants: isPlatformAdmin ? [] : userForm.idTenants,
          idTenant: isPlatformAdmin ? null : (userForm.idTenants[0] ?? userEdit.ID_TENANT),
          idTenantOrigem: userEdit.ID_TENANT,
          membershipIds: userEdit.membershipIds,
          codigoFilialPadrao: userForm.codigoFilialPadrao,
          codigoVendedor: userForm.codigoVendedor,
          ativo: userEdit.ATIVO,
        })
        showToast('Usuário atualizado!')
      } else {
        if (!userForm.senha.trim()) {
          showToast('Informe a senha', 'err')
          setSaving(false)
          return
        }
        if (
          !isPlatformAdmin &&
          !(acessoTodas && userForm.idTenants.length > 0) &&
          userForm.filiaisAcesso.length === 0
        ) {
          showToast(acessoTodas ? 'Selecione ao menos um grupo' : 'Selecione ao menos uma loja', 'err')
          setSaving(false)
          return
        }
        await axios.post('/api/admin/usuarios', {
          ...userForm,
          filiais: filiaisPayload,
          acessoTodasFiliais: acessoTodas,
          idTenants: isPlatformAdmin ? [] : userForm.idTenants,
          idTenant: isPlatformAdmin ? null : userForm.idTenants[0],
          perfilPorTenant: userForm.perfilPorTenant,
        })
        showToast(isPlatformAdmin ? 'Administrador criado!' : 'Usuário criado!')
      }
      setModalUser(false)
      setUserEdit(null)
      setUserForm(emptyUserForm())
      carregar()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      showToast('Erro: ' + (err?.response?.data?.error ?? 'tente novamente'), 'err')
    }
    setSaving(false)
  }

  const resetarSenha = async (u: AdminUsuario, novaSenha: string) => {
    try {
      const tenants = u.ID_TENANTS?.length
        ? u.ID_TENANTS
        : u.ID_TENANT != null
          ? [u.ID_TENANT]
          : [null]
      for (const tid of tenants) {
        await axios.post('/api/admin/reset-senha', {
          id: (tid != null && u.membershipIds?.[tid]) ? u.membershipIds[tid] : u.ID,
          novaSenha,
          idTenant: tid,
        })
      }
      showToast('Senha alterada!')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      showToast('Erro: ' + (err?.response?.data?.error ?? 'falha ao resetar'), 'err')
      throw e
    }
  }

  const toggleUser = async (u: AdminUsuario) => {
    try {
      await axios.patch('/api/admin/usuarios', {
        id: u.ID,
        ativo: !u.ATIVO,
        idTenant: u.ID_TENANT,
        idTenants: u.ID_TENANTS ?? (u.ID_TENANT != null ? [u.ID_TENANT] : []),
        membershipIds: u.membershipIds,
      })
      carregar()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      showToast('Erro: ' + (err?.response?.data?.error ?? 'falha ao alterar'), 'err')
    }
  }

  const abrirEditGrupo = (t: AdminTenant) => {
    setGrupoEdit(t)
    setGrupoForm({
      ...emptyGrupoForm(),
      nome: t.NOME,
      descricao: t.DESCRICAO ?? '',
      filiais: Array.isArray(t.filiais) ? t.filiais.map((f) => String(f).trim()) : [],
      slug: t.SLUG ?? '',
    })
    setModalDetalhe(null)
    setModalGrupo(true)
  }

  const abrirEditUser = (u: AdminUsuario) => {
    setUserEdit(u)
    const idTenants = u.ID_TENANTS?.length
      ? u.ID_TENANTS
      : u.ID_TENANT != null
        ? [u.ID_TENANT]
        : []
    const filiaisAcesso = u.filiaisAcesso
      ? u.filiaisAcesso.split(',').map((f) => f.trim()).filter(Boolean)
      : []
    const acessoTodas =
      !!u.ACESSO_TODAS_FILIAIS ||
      (filiaisAcesso.length === 0 && idTenants.length > 0 && u.PERFIL !== 'admin')
    setUserForm({
      nome: u.NOME,
      email: u.EMAIL,
      senha: '',
      perfil: u.PERFIL,
      idTenants,
      perfilPorTenant: Object.fromEntries(idTenants.map((tid) => [tid, u.PERFIL])),
      codigoFilialPadrao: u.CODIGO_FILIAL_PADRAO ?? '',
      codigoVendedor: u.CODIGO_VENDEDOR ?? '',
      filiaisAcesso: acessoTodas ? [] : filiaisAcesso,
      acessoTodasFiliais: acessoTodas,
    })
    setModalUser(true)
  }

  const abrirNovaSync = (tenantId?: number) => {
    setSyncEdit(null)
    setSyncForm({
      ...emptySyncForm(),
      tenantId: tenantId ?? syncFiltroTenant ?? '',
    })
    setLockSyncTenant(!!tenantId)
    setModalSync(true)
  }

  const abrirEditSync = (f: SyncFilial) => {
    setSyncEdit(f)
    setSyncForm({
      id: f.ID,
      filialCod: f.FILIAL_COD,
      filialNome: f.FILIAL_NOME,
      tenantId: f.TENANT_ID,
      frequenciaMin: f.FREQUENCIA_MIN,
      sistemaOrigem: f.SISTEMA_ORIGEM ?? 'LinxPos',
      ativo: f.ATIVO,
    })
    setLockSyncTenant(false)
    setModalSync(true)
  }

  const salvarSync = async () => {
    try {
      if (syncEdit) {
        await axios.patch('/api/admin/sync-filiais', {
          id: syncEdit.ID,
          filialNome: syncForm.filialNome,
          frequenciaMin: syncForm.frequenciaMin,
          sistemaOrigem: syncForm.sistemaOrigem,
          ativo: syncForm.ativo,
          tenantId: syncForm.tenantId || undefined,
        })
        showToast('Filial atualizada!')
        setModalSync(false)
        setSyncEdit(null)
        setSyncForm(emptySyncForm())
        carregarSync()
        carregar()
        return
      }

      if (!syncForm.filialCod.trim() || !syncForm.filialNome.trim() || !syncForm.tenantId) {
        showToast('Preencha código, nome e grupo', 'err')
        return
      }
      const res = await axios.post('/api/admin/sync-filiais', syncForm)
      setModalSync(false)
      setSyncForm(emptySyncForm())
      setLockSyncTenant(false)
      setModalCredenciais(res.data)
      carregarSync()
      carregar()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      showToast('Erro: ' + (err?.response?.data?.error ?? 'tente novamente'), 'err')
    }
  }

  const regenApiKey = async (filial?: SyncFilial) => {
    const alvo = filial ?? syncEdit
    if (!alvo) return
    if (
      !confirm(
        `Isso regenera a API Key da filial ${alvo.FILIAL_COD} e invalida a anterior. Continuar?`
      )
    )
      return
    try {
      const res = await axios.patch('/api/admin/sync-filiais', {
        id: alvo.ID,
        regenKey: true,
        filialCod: alvo.FILIAL_COD,
        tenantId: alvo.TENANT_ID,
      })
      setModalCredenciais({
        ...res.data,
        filialCod: alvo.FILIAL_COD,
        filialNome: alvo.FILIAL_NOME,
        tenantId: alvo.TENANT_ID,
        regenerada: true,
      })
      showToast('API Key regenerada!')
    } catch {
      showToast('Erro ao regenerar chave', 'err')
    }
  }

  const toggleSyncFilial = async (id: number, ativo: boolean) => {
    try {
      await axios.patch('/api/admin/sync-filiais', { id, ativo })
      carregarSync()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      showToast('Erro: ' + (err?.response?.data?.error ?? 'falha ao alterar'), 'err')
    }
  }

  const abrirVincular = (t: AdminTenant) => {
    setModalVincular(t)
  }

  const criarOuAtualizarDemo = async () => {
    setDemoLoading(true)
    try {
      const fonte = tenants.find((t) => !t.IS_DEMO && t.dbProvisionado && t.ATIVO)
      const res = await axios.post(
        '/api/admin/demo',
        { refresh: true, sourceTenantId: fonte?.ID },
        { timeout: 300_000 }
      )
      showToast(res.data.mensagem || 'Demonstração pronta!')
      if (res.data.emailDemo && res.data.senhaDemo) {
        setModalProvisionado({
          nome: 'Empresa Demonstração',
          tenantId: res.data.tenantId,
          slug: 'demonstracao',
          dbName: 'demo',
          dbMode: 'local',
          catalogoTabelas: Object.values(res.data.tabelas ?? {} as Record<string, number>).reduce(
            (a: number, b: unknown) => a + Number(b || 0),
            0
          ),
          schemaAplicado: true,
          emailAdmin: res.data.emailDemo,
          senhaAdmin: res.data.senhaDemo,
          mensagem: res.data.mensagem,
        })
      }
      carregar()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      showToast('Erro: ' + (err?.response?.data?.error ?? 'falha na demonstração'), 'err')
    }
    setDemoLoading(false)
  }

  const tabAction =
    aba === 'grupos' ? (
      <Button
        variant="primary"
        size="lg"
        onClick={() => {
          setGrupoEdit(null)
          setGrupoForm(emptyGrupoForm())
          setModalGrupo(true)
        }}
      >
        <Plus className="w-4 h-4" /> Novo grupo
      </Button>
    ) : aba === 'usuarios' ? (
      <Button
        variant="primary"
        size="lg"
        onClick={() => {
          setUserEdit(null)
          setUserForm(emptyUserForm())
          setModalUser(true)
        }}
      >
        <Plus className="w-4 h-4" /> Novo usuário
      </Button>
    ) : aba === 'sync' ? (
      <Button variant="primary" size="lg" onClick={() => abrirNovaSync()}>
        <Plus className="w-4 h-4" /> Nova filial
      </Button>
    ) : null

  if (!user.ready) {
    return (
      <DashboardLayout
        titulo="Administração"
        subtitulo="Painel administrativo do sistema"
        loading
      >
        {null}
      </DashboardLayout>
    )
  }

  if (!user.isAdmin) return null

  return (
    <DashboardLayout
      titulo="Administração"
      subtitulo="Painel administrativo do sistema"
      loading={loading && tenants.length === 0 && usuarios.length === 0}
    >
      <AdminToast message={toastMsg} tipo={toastTipo} />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5 bg-[var(--bg-subtle)] p-1.5 rounded-[14px] w-fit overflow-x-auto">
          {ABAS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAba(a.id)}
              className={cn(
                'flex items-center gap-2 px-5 h-11 rounded-[12px] text-[14px] font-medium transition-all whitespace-nowrap',
                aba === a.id
                  ? 'bg-white text-[var(--acc)] shadow-[var(--shadow-card)]'
                  : 'text-[var(--ink-ghost)] hover:text-[var(--ink-muted)]'
              )}
            >
              <a.icon className="w-4 h-4" /> {a.label}
            </button>
          ))}
        </div>
        {tabAction}
      </div>

      {aba === 'grupos' && (
        <GruposTab
          tenants={tenants}
          usuarios={usuarios}
          syncFiliais={syncFiliais}
          loading={loading}
          onNovo={() => {
            setGrupoEdit(null)
            setGrupoForm(emptyGrupoForm())
            setModalGrupo(true)
          }}
          onDemo={criarOuAtualizarDemo}
          demoLoading={demoLoading}
          onOpen={(t) => setModalDetalhe(t)}
          onVincularLojas={abrirVincular}
          onToggle={toggleTenant}
          onVerUsuarios={(t) => {
            setUsuariosFiltroGrupo(String(t.ID))
            setAba('usuarios')
          }}
        />
      )}

      {aba === 'usuarios' && (
        <UsuariosTab
          usuarios={usuarios}
          tenants={tenants}
          loading={loading}
          initialFiltroGrupo={usuariosFiltroGrupo}
          onNovo={() => {
            setUserEdit(null)
            setUserForm(emptyUserForm())
            setModalUser(true)
          }}
          onEdit={abrirEditUser}
          onToggle={toggleUser}
          onResetSenha={resetarSenha}
        />
      )}

      {aba === 'sync' && (
        <SyncTab
          syncFiliais={syncFiliais}
          tenants={tenantsComBanco}
          loading={loadingSync}
          filtroTenantId={syncFiltroTenant}
          onFiltroTenant={setSyncFiltroTenant}
          onRefresh={carregarSync}
          onNovo={() => abrirNovaSync()}
          onEdit={abrirEditSync}
          onToggle={toggleSyncFilial}
          onRegenKey={regenApiKey}
        />
      )}

      {aba === 'perfis' && <PerfisTab />}

      <GrupoModal
        open={modalGrupo}
        onClose={() => {
          setModalGrupo(false)
          setGrupoEdit(null)
          setGrupoForm(emptyGrupoForm())
        }}
        form={grupoForm}
        setForm={setGrupoForm}
        edit={grupoEdit}
        meta={meta}
        saving={saving}
        onSave={salvarGrupo}
      />

      <UsuarioModal
        open={modalUser}
        onClose={() => {
          setModalUser(false)
          setUserEdit(null)
          setUserForm(emptyUserForm())
        }}
        form={userForm}
        setForm={setUserForm}
        edit={userEdit}
        tenantsComBanco={tenantsComBanco}
        filiais={userForm.idTenants.flatMap((tid) => filiaisTenant(tid))}
        saving={saving}
        onSave={salvarUser}
      />

      <SyncFilialModal
        open={modalSync}
        onClose={() => {
          setModalSync(false)
          setSyncEdit(null)
          setSyncForm(emptySyncForm())
          setLockSyncTenant(false)
        }}
        form={syncForm}
        setForm={setSyncForm}
        tenantsComBanco={tenantsComBanco}
        edit={syncEdit}
        lockTenant={lockSyncTenant}
        onSave={salvarSync}
        onRegenKey={syncEdit ? () => regenApiKey() : undefined}
      />

      <VincularLojasModal
        open={!!modalVincular}
        tenant={modalVincular}
        onClose={() => setModalVincular(null)}
        onNovaFilial={() => {
          const tid = modalVincular?.ID
          setModalVincular(null)
          if (tid) abrirNovaSync(tid)
        }}
        onChanged={() => {
          carregar()
          carregarSync()
        }}
      />

      <DetalheGrupoModal
        tenant={modalDetalhe}
        syncFiliais={syncFiliais}
        usuarios={usuarios}
        saving={saving}
        onClose={() => setModalDetalhe(null)}
        onSaveInfo={async (t, data) => {
          setSaving(true)
          try {
            await axios.put('/api/admin/tenants', {
              id: t.ID,
              nome: data.nome,
              descricao: data.descricao,
              filiais: t.filiais ?? [],
              ativo: t.ATIVO,
            })
            showToast('Grupo atualizado!')
            setModalDetalhe((prev) =>
              prev ? { ...prev, NOME: data.nome, DESCRICAO: data.descricao || null } : prev
            )
            carregar()
          } catch (e: unknown) {
            const err = e as { response?: { data?: { error?: string } } }
            showToast('Erro: ' + (err?.response?.data?.error ?? 'tente novamente'), 'err')
          }
          setSaving(false)
        }}
        onToggle={toggleTenant}
        onVincularLojas={abrirVincular}
      />

      <ProvisionadoModal
        data={modalProvisionado}
        onClose={() => setModalProvisionado(null)}
        onGoSync={() => {
          const tid = modalProvisionado?.tenantId
          setModalProvisionado(null)
          if (tid) {
            const t = tenants.find((x) => x.ID === tid)
            if (t) abrirVincular(t)
            else {
              setAba('sync')
              setSyncFiltroTenant(tid)
              abrirNovaSync(tid)
            }
          }
        }}
      />

      <CredenciaisModal
        creds={modalCredenciais}
        onClose={() => setModalCredenciais(null)}
      />
    </DashboardLayout>
  )
}
