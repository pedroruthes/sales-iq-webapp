import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Save, Shield } from 'lucide-react'
import { Button, FieldInput, Modal } from '@/components/ui'
import { fmt } from '@/lib/utils'
import type { AdminTenant, LicencaForm } from '@/types/admin'

interface LicencaModalProps {
  open: boolean
  edit: boolean
  form: LicencaForm
  setForm: React.Dispatch<React.SetStateAction<LicencaForm>>
  tenantsDisponiveis: AdminTenant[]
  loadingTenants?: boolean
  onLoadTenants?: () => void
  saving: boolean
  error: string
  onClose: () => void
  onSave: () => void
}

export function LicencaModal({
  open,
  edit,
  form,
  setForm,
  tenantsDisponiveis,
  loadingTenants,
  onLoadTenants,
  saving,
  error,
  onClose,
  onSave,
}: LicencaModalProps) {
  const [showTenantList, setShowTenantList] = useState(false)

  useEffect(() => {
    if (!open) setShowTenantList(false)
  }, [open])

  const totalMensal = useMemo(() => {
    const q = parseFloat(form.qtdeLojas) || 0
    const v = parseFloat(form.valorPorLoja) || 0
    return q * v
  }, [form.qtdeLojas, form.valorPorLoja])

  const canSave =
    !!form.idTenant &&
    !!form.nomeTenant.trim() &&
    !!form.dataInicio &&
    !!form.dataVencimento &&
    Number(form.qtdeLojas) >= 1

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={
        <span className="flex items-center gap-2 text-[14px]">
          <Shield className="w-4 h-4 text-[var(--acc)]" />
          {edit ? 'Editar licença' : 'Nova licença'}
        </span>
      }
      subtitle={edit ? form.nomeTenant : 'Vincule um grupo e defina capacidade e vigência'}
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onSave}
            disabled={!canSave || saving}
            loading={saving}
          >
            <Save className="w-3.5 h-3.5" />
            {edit ? 'Salvar alterações' : 'Criar licença'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-[13px] font-medium text-[var(--ink-faint)] mb-1.5 block">
            Grupo / Tenant *
          </label>
          {edit ? (
            <div className="h-11 px-4 flex items-center rounded-[12px] border border-[var(--border)] bg-[var(--bg-subtle)] text-[14px] text-[var(--ink)]">
              {form.nomeTenant}
              <span className="ml-2 text-[12px] text-[var(--ink-ghost)]">ID {form.idTenant}</span>
            </div>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  onLoadTenants?.()
                  setShowTenantList((v) => !v)
                }}
                className="w-full h-11 px-4 bg-white border border-[var(--border)] rounded-[12px] text-[14px] text-left flex items-center justify-between focus:outline-none focus:border-[var(--acc)]"
              >
                <span className={form.nomeTenant ? 'text-[var(--ink)]' : 'text-[var(--ink-ghost)]'}>
                  {form.nomeTenant
                    ? `${form.nomeTenant} (ID ${form.idTenant})`
                    : 'Selecionar grupo cadastrado…'}
                </span>
                <ChevronDown className="w-4 h-4 text-[var(--ink-ghost)]" />
              </button>
              {showTenantList && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowTenantList(false)} />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[var(--border)] rounded-xl shadow-lg z-20 max-h-52 overflow-y-auto">
                    {loadingTenants ? (
                      <div className="px-3 py-2.5 text-[13px] text-[var(--ink-ghost)]">Buscando…</div>
                    ) : tenantsDisponiveis.length === 0 ? (
                      <div className="px-3 py-2.5 text-[13px] text-[var(--ink-ghost)]">
                        Todos os grupos já têm licença cadastrada
                      </div>
                    ) : (
                      tenantsDisponiveis.map((t) => (
                        <button
                          key={t.ID}
                          type="button"
                          onClick={() => {
                            setForm((f) => ({
                              ...f,
                              idTenant: String(t.ID),
                              nomeTenant: t.NOME,
                            }))
                            setShowTenantList(false)
                          }}
                          className="w-full px-3 py-2.5 text-left hover:bg-[var(--bg-subtle)] border-b border-[var(--border)] last:border-0"
                        >
                          <div className="text-[13px] font-medium text-[var(--ink)]">{t.NOME}</div>
                          <div className="text-[12px] text-[var(--ink-ghost)]">
                            ID {t.ID}
                            {t.DESCRICAO ? ` · ${t.DESCRICAO}` : ''}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FieldInput
            label="Qtde. lojas"
            type="number"
            min={1}
            value={form.qtdeLojas}
            onChange={(e) => setForm((f) => ({ ...f, qtdeLojas: e.target.value }))}
          />
          <FieldInput
            label="Valor / loja (R$)"
            type="number"
            step="0.01"
            min={0}
            value={form.valorPorLoja}
            onChange={(e) => setForm((f) => ({ ...f, valorPorLoja: e.target.value }))}
          />
          <FieldInput
            label="Carência (dias)"
            type="number"
            min={0}
            value={form.diasCarencia}
            onChange={(e) => setForm((f) => ({ ...f, diasCarencia: e.target.value }))}
          />
        </div>

        <div className="rounded-xl bg-[var(--acc-pale)] px-4 py-3 text-center text-[13px] text-[var(--acc)]">
          Total mensal: <strong>{fmt.currency(totalMensal)}</strong>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FieldInput
            label="Início"
            type="date"
            value={form.dataInicio}
            onChange={(e) => setForm((f) => ({ ...f, dataInicio: e.target.value }))}
          />
          <FieldInput
            label="Vencimento"
            type="date"
            value={form.dataVencimento}
            onChange={(e) => setForm((f) => ({ ...f, dataVencimento: e.target.value }))}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-[13px] text-red-600">
            {error}
          </div>
        )}
      </div>
    </Modal>
  )
}
