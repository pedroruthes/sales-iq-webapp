
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Ban,
  DollarSign,
  Edit2,
  Plus,
  Search,
  Shield,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import axios from 'axios'
import { DashboardLayout } from '@/components/layout'
import { Button, Card } from '@/components/ui'
import { AdminToast } from '@/components/admin/AdminToast'
import { AdminTableFooter, pageItems } from '@/components/admin/AdminTableFooter'
import { RowActionsMenu } from '@/components/admin/RowActionsMenu'
import { StatusDotBadge } from '@/components/admin/StatusDotBadge'
import { LicencaModal } from '@/components/admin/modals/LicencaModal'
import { PagamentoLicencaModal } from '@/components/admin/modals/PagamentoLicencaModal'
import { useCurrentUser } from '@/hooks/useSession'
import { fmt } from '@/lib/utils'
import {
  emptyLicencaForm,
  emptyPagamentoForm,
  licencaFormFromAdmin,
  statusEfetivoLicenca,
  type AdminLicenca,
  type AdminTenant,
  type LicencaForm,
  type LicencaStatusUi,
  type PagamentoLicencaForm,
} from '@/types/admin'

const selectChevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")"

const STATUS_BADGE: Record<
  LicencaStatusUi,
  { label: string; variant: 'success' | 'warn' | 'danger' | 'neutral' }
> = {
  ativa: { label: 'Ativa', variant: 'success' },
  aviso: { label: 'Aviso', variant: 'warn' },
  bloqueada: { label: 'Bloqueada', variant: 'danger' },
  cancelada: { label: 'Cancelada', variant: 'neutral' },
}

export default function LicencasPage() {
  const user = useCurrentUser()
  const [licencas, setLicencas] = useState<AdminLicenca[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | LicencaStatusUi>('todos')
  const [pagina, setPagina] = useState(1)

  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<AdminLicenca | null>(null)
  const [form, setForm] = useState<LicencaForm>(emptyLicencaForm())
  const [tenantsDisp, setTenantsDisp] = useState<AdminTenant[]>([])
  const [loadingTenants, setLoadingTenants] = useState(false)
  const [saving, setSaving] = useState(false)
  const [erroModal, setErroModal] = useState('')

  const [pagLicenca, setPagLicenca] = useState<AdminLicenca | null>(null)
  const [formPag, setFormPag] = useState<PagamentoLicencaForm>(emptyPagamentoForm())
  const [savingPag, setSavingPag] = useState(false)
  const [erroPag, setErroPag] = useState('')

  const [toast, setToast] = useState({ msg: '', tipo: 'ok' as 'ok' | 'err' })
  const showToast = (msg: string, tipo: 'ok' | 'err' = 'ok') => {
    setToast({ msg, tipo })
    setTimeout(() => setToast({ msg: '', tipo: 'ok' }), 3200)
  }

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await axios.get('/api/admin/licenca')
      setLicencas(r.data.data ?? [])
    } catch {
      showToast('Erro ao carregar licenças', 'err')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const comStatus = useMemo(
    () =>
      licencas.map((l) => ({
        ...l,
        statusUi: statusEfetivoLicenca(l),
      })),
    [licencas]
  )

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return comStatus.filter((l) => {
      if (filtroStatus !== 'todos' && l.statusUi !== filtroStatus) return false
      if (!q) return true
      return (
        l.NOME_TENANT?.toLowerCase().includes(q) ||
        String(l.ID_TENANT).includes(q)
      )
    })
  }, [comStatus, busca, filtroStatus])

  useEffect(() => {
    setPagina(1)
  }, [busca, filtroStatus])

  const paginaAtual = pageItems(filtrados, pagina)

  const kpis = useMemo(() => {
    const ativas = comStatus.filter((l) => l.statusUi === 'ativa').length
    const aviso = comStatus.filter((l) => l.statusUi === 'aviso').length
    const bloqueadas = comStatus.filter((l) => l.statusUi === 'bloqueada').length
    const receita = comStatus
      .filter((l) => l.statusUi === 'ativa' || l.statusUi === 'aviso')
      .reduce((a, l) => a + (Number(l.VALOR_TOTAL) || 0), 0)
    return { ativas, aviso, bloqueadas, receita }
  }, [comStatus])

  const abrirNova = () => {
    setEditando(null)
    setForm(emptyLicencaForm())
    setErroModal('')
    setModalOpen(true)
  }

  const abrirEditar = (l: AdminLicenca) => {
    setEditando(l)
    setForm(licencaFormFromAdmin(l))
    setErroModal('')
    setModalOpen(true)
  }

  const carregarTenants = async () => {
    setLoadingTenants(true)
    try {
      const r = await axios.get('/api/admin/tenants')
      const todos: AdminTenant[] = r.data.data ?? []
      const comLicenca = new Set(
        licencas.filter((l) => l.STATUS !== 'cancelada').map((l) => l.ID_TENANT)
      )
      setTenantsDisp(todos.filter((t) => !comLicenca.has(t.ID)))
    } catch {
      setTenantsDisp([])
    } finally {
      setLoadingTenants(false)
    }
  }

  const salvarLicenca = async () => {
    setSaving(true)
    setErroModal('')
    try {
      if (editando) {
        await axios.patch('/api/admin/licenca', {
          id: editando.ID,
          ...form,
        })
        showToast('Licença atualizada')
      } else {
        await axios.post('/api/admin/licenca', form)
        showToast('Licença criada')
      }
      setModalOpen(false)
      setEditando(null)
      carregar()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      setErroModal(err?.response?.data?.error ?? 'Não foi possível salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const abrirPagamento = (l: AdminLicenca) => {
    setPagLicenca(l)
    setFormPag(emptyPagamentoForm(Number(l.VALOR_TOTAL) || 0))
    setErroPag('')
  }

  const salvarPagamento = async () => {
    if (!pagLicenca) return
    setSavingPag(true)
    setErroPag('')
    try {
      await axios.patch('/api/admin/licenca', {
        acao: 'pagar',
        id: pagLicenca.ID,
        idTenant: pagLicenca.ID_TENANT,
        ...formPag,
      })
      setPagLicenca(null)
      showToast('Pagamento registrado')
      carregar()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      setErroPag(err?.response?.data?.error ?? 'Erro ao registrar pagamento.')
    } finally {
      setSavingPag(false)
    }
  }

  const acaoStatus = async (l: AdminLicenca, acao: 'bloquear' | 'reativar' | 'cancelar') => {
    const labels = {
      bloquear: 'bloquear',
      reativar: 'reativar',
      cancelar: 'cancelar',
    }
    if (!window.confirm(`Confirma ${labels[acao]} a licença de ${l.NOME_TENANT}?`)) return
    try {
      await axios.patch('/api/admin/licenca', { acao, id: l.ID })
      showToast(
        acao === 'bloquear'
          ? 'Licença bloqueada'
          : acao === 'reativar'
            ? 'Licença reativada'
            : 'Licença cancelada'
      )
      carregar()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      showToast(err?.response?.data?.error ?? 'Falha na operação', 'err')
    }
  }

  if (!user.ready) {
    return (
      <DashboardLayout
        titulo="Licenças"
        subtitulo="Gestão de clientes, capacidade e renovações"
        loading
      >
        {null}
      </DashboardLayout>
    )
  }

  if (!user.isAdmin) return null

  return (
    <DashboardLayout
      titulo="Licenças"
      subtitulo="Gestão de clientes, capacidade e renovações"
      loading={loading && licencas.length === 0}
      actions={
        <Button variant="primary" size="lg" onClick={abrirNova}>
          <Plus className="w-4 h-4" /> Nova licença
        </Button>
      }
    >
      <AdminToast message={toast.msg} tipo={toast.tipo} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Clientes ativos', valor: kpis.ativas, cor: 'text-[var(--success)]', border: 'border-l-[var(--success)]' },
          { label: 'Com aviso', valor: kpis.aviso, cor: 'text-amber-600', border: 'border-l-amber-500' },
          { label: 'Bloqueados', valor: kpis.bloqueadas, cor: 'text-[var(--danger)]', border: 'border-l-[var(--danger)]' },
          { label: 'Receita mensal', valor: fmt.currency(kpis.receita), cor: 'text-[var(--acc)]', border: 'border-l-[var(--acc)]' },
        ].map((k) => (
          <div
            key={k.label}
            className={`bg-white border border-[var(--border)] border-l-4 ${k.border} rounded-xl p-3.5`}
          >
            <div className="text-[12px] text-[var(--ink-ghost)] mb-1">{k.label}</div>
            <div className={`text-[18px] font-medium ${k.cor}`}>{k.valor}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-xl">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-ghost)]" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar grupo…"
            className="input-base w-full pl-10"
          />
        </div>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value as typeof filtroStatus)}
          style={{ backgroundImage: selectChevron }}
          className="select-base !w-auto min-w-[160px]"
        >
          <option value="todos">Todos os status</option>
          <option value="ativa">Ativas</option>
          <option value="aviso">Com aviso</option>
          <option value="bloqueada">Bloqueadas</option>
          <option value="cancelada">Canceladas</option>
        </select>
      </div>

      {licencas.length === 0 ? (
        <Card>
          <div className="py-14 text-center">
            <Shield className="w-10 h-10 text-[var(--ink-ghost)] mx-auto mb-4 opacity-40" />
            <div className="text-[15px] text-[var(--ink)] font-medium mb-1">Nenhuma licença</div>
            <div className="text-[14px] text-[var(--ink-ghost)] mb-5">
              Cadastre a primeira licença para um grupo.
            </div>
            <Button variant="primary" size="lg" onClick={abrirNova}>
              <Plus className="w-4 h-4" /> Cadastrar licença
            </Button>
          </div>
        </Card>
      ) : filtrados.length === 0 ? (
        <Card>
          <div className="py-14 text-center">
            <Shield className="w-10 h-10 text-[var(--ink-ghost)] mx-auto mb-4 opacity-40" />
            <div className="text-[15px] text-[var(--ink)] font-medium mb-1">Nenhum resultado</div>
            <div className="text-[14px] text-[var(--ink-ghost)]">Ajuste a busca ou o filtro.</div>
          </div>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto bg-white border border-[var(--border)] rounded-xl">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]/50">
                  {['Grupo', 'Lojas', 'Valor/mês', 'Vencimento', 'Status', ''].map((h, i) => (
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
                {paginaAtual.map((l) => {
                  const st = STATUS_BADGE[l.statusUi]
                  const lotacao = (l.QTDE_CADASTRADA ?? 0) >= (l.QTDE_LOJAS ?? 0)
                  return (
                    <tr
                      key={l.ID}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-subtle)]/60 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="text-[14px] font-medium text-[var(--ink)]">{l.NOME_TENANT}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={
                            lotacao
                              ? 'text-[13px] font-medium text-[var(--danger)]'
                              : 'text-[13px] text-[var(--ink-muted)]'
                          }
                        >
                          {l.QTDE_CADASTRADA ?? 0}/{l.QTDE_LOJAS} lojas
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[13px] font-medium text-[var(--acc)]">
                        {fmt.currency(Number(l.VALOR_TOTAL) || 0)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[13px] text-[var(--ink)]">{l.DATA_VENCIMENTO}</div>
                        {l.DIAS_ATRASO > 0 ? (
                          <div className="text-[12px] text-[var(--danger)] mt-0.5">
                            {l.DIAS_ATRASO}d em atraso
                          </div>
                        ) : l.DIAS_RESTANTES >= 0 && l.DIAS_RESTANTES <= 7 ? (
                          <div className="text-[12px] text-amber-600 mt-0.5">
                            vence em {l.DIAS_RESTANTES}d
                          </div>
                        ) : null}
                      </td>
                      <td className="py-3 px-4">
                        <StatusDotBadge label={st.label} variant={st.variant} />
                      </td>
                      <td className="py-3 px-4 w-12">
                        <RowActionsMenu
                          title={l.NOME_TENANT}
                          subtitle={`Vence ${l.DATA_VENCIMENTO}`}
                          actions={[
                            {
                              id: 'edit',
                              label: 'Editar licença',
                              description: 'Lojas, preço e vigência',
                              icon: <Edit2 className="w-4 h-4" />,
                              onClick: () => abrirEditar(l),
                              tone: 'accent',
                            },
                            ...(l.STATUS !== 'cancelada'
                              ? [
                                  {
                                    id: 'pagar',
                                    label: 'Registrar pagamento',
                                    description: 'Renovar e atualizar vencimento',
                                    icon: <DollarSign className="w-4 h-4" />,
                                    onClick: () => abrirPagamento(l),
                                  },
                                ]
                              : []),
                            ...(l.STATUS === 'bloqueada'
                              ? [
                                  {
                                    id: 'reativar',
                                    label: 'Reativar',
                                    description: 'Desbloquear sem registrar pagamento',
                                    icon: <ToggleLeft className="w-4 h-4" />,
                                    onClick: () => acaoStatus(l, 'reativar'),
                                  },
                                ]
                              : l.STATUS !== 'cancelada'
                                ? [
                                    {
                                      id: 'bloquear',
                                      label: 'Bloquear',
                                      description: 'Impedir o acesso do grupo',
                                      icon: <ToggleRight className="w-4 h-4" />,
                                      onClick: () => acaoStatus(l, 'bloquear'),
                                      tone: 'warn' as const,
                                    },
                                  ]
                                : []),
                            ...(l.STATUS !== 'cancelada'
                              ? [
                                  {
                                    id: 'cancelar',
                                    label: 'Cancelar licença',
                                    description: 'Encerra o contrato deste grupo',
                                    icon: <Ban className="w-4 h-4" />,
                                    onClick: () => acaoStatus(l, 'cancelar'),
                                    tone: 'danger' as const,
                                  },
                                ]
                              : []),
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
            totalAll={licencas.length}
            page={pagina}
            onPageChange={setPagina}
            noun={{ singular: 'licença', plural: 'licenças' }}
          />
        </>
      )}

      <LicencaModal
        open={modalOpen}
        edit={!!editando}
        form={form}
        setForm={setForm}
        tenantsDisponiveis={tenantsDisp}
        loadingTenants={loadingTenants}
        onLoadTenants={carregarTenants}
        saving={saving}
        error={erroModal}
        onClose={() => {
          setModalOpen(false)
          setEditando(null)
          setErroModal('')
        }}
        onSave={salvarLicenca}
      />

      <PagamentoLicencaModal
        open={!!pagLicenca}
        tituloGrupo={pagLicenca?.NOME_TENANT}
        form={formPag}
        setForm={setFormPag}
        saving={savingPag}
        error={erroPag}
        onClose={() => {
          setPagLicenca(null)
          setErroPag('')
        }}
        onSave={salvarPagamento}
      />
    </DashboardLayout>
  )
}
