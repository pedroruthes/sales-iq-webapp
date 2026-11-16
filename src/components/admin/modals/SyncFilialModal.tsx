import { useEffect, useState } from 'react'
import { Key, KeyRound, Loader2, Radio, Save } from 'lucide-react'
import { Button, Modal, FieldInput, FieldSelect } from '@/components/ui'
import type { AdminTenant, SyncFilial, SyncForm } from '@/types/admin'

interface SyncFilialModalProps {
  open: boolean
  onClose: () => void
  form: SyncForm
  setForm: React.Dispatch<React.SetStateAction<SyncForm>>
  tenantsComBanco: AdminTenant[]
  edit?: SyncFilial | null
  onSave: () => Promise<void> | void
  onRegenKey?: () => Promise<void> | void
  lockTenant?: boolean
}

export function SyncFilialModal({
  open,
  onClose,
  form,
  setForm,
  tenantsComBanco,
  edit,
  onSave,
  onRegenKey,
  lockTenant = false,
}: SyncFilialModalProps) {
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const isEdit = !!edit

  useEffect(() => {
    if (!open) {
      setSaving(false)
      setRegenerating(false)
    }
  }, [open])

  const canSave =
    form.filialNome.trim() &&
    form.tenantId &&
    (isEdit || form.filialCod.trim())

  const handleSave = async () => {
    if (!canSave || saving) return
    setSaving(true)
    try {
      await onSave()
    } finally {
      setSaving(false)
    }
  }

  const handleRegen = async () => {
    if (!onRegenKey || regenerating) return
    if (!confirm('Isso gera uma nova API Key e invalida a anterior. Continuar?')) return
    setRegenerating(true)
    try {
      await onRegenKey()
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={
        <span className="flex items-center gap-2 text-[14px]">
          <Radio className="w-4 h-4 text-[var(--acc)]" />
          {isEdit ? 'Editar filial' : 'Nova filial'}
        </span>
      }
      subtitle={
        isEdit
          ? `${edit.FILIAL_COD} · ${edit.TENANT_NOME ?? `Grupo ${edit.TENANT_ID}`}`
          : 'Cadastra no Sync Agent e vincula ao grupo'
      }
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={!canSave || saving}
            loading={saving}
          >
            {isEdit ? <Save className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
            {isEdit ? 'Salvar' : 'Criar e gerar chave'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <FieldInput
            label="Código *"
            value={form.filialCod}
            onChange={(e) => setForm((f) => ({ ...f, filialCod: e.target.value }))}
            placeholder="Ex: 1622"
            disabled={isEdit}
            autoFocus={!isEdit}
            
          />
          <FieldSelect
            label="Grupo *"
            value={form.tenantId}
            disabled={isEdit || lockTenant}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                tenantId: e.target.value ? parseInt(e.target.value, 10) : '',
              }))
            }
            
          >
            <option value="">Selecionar</option>
            {tenantsComBanco.map((t) => (
              <option key={t.ID} value={t.ID}>
                {t.NOME}
              </option>
            ))}
          </FieldSelect>
        </div>

        <FieldInput
          label="Nome da loja *"
          value={form.filialNome}
          onChange={(e) => setForm((f) => ({ ...f, filialNome: e.target.value }))}
          placeholder="Ex: HS MACEIO SHOPP"
          
        />

        <div className="grid grid-cols-2 gap-3">
          <FieldInput
            label="Frequência (min)"
            type="number"
            value={form.frequenciaMin}
            onChange={(e) =>
              setForm((f) => ({ ...f, frequenciaMin: parseInt(e.target.value, 10) || 15 }))
            }
            
          />
          <FieldSelect
            label="Sistema"
            value={form.sistemaOrigem}
            onChange={(e) => setForm((f) => ({ ...f, sistemaOrigem: e.target.value }))}
            
          >
            <option value="LinxPos">LinxPos</option>
            <option value="Generico">Genérico</option>
          </FieldSelect>
        </div>

        {isEdit && (
          <label className="flex items-center gap-2 text-[12px] text-[var(--ink)] cursor-pointer">
            <input
              type="checkbox"
              checked={form.ativo !== false}
              onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
              className="w-4 h-4 accent-[var(--acc)]"
            />
            Filial ativa
          </label>
        )}

        {isEdit && onRegenKey && (
          <button
            type="button"
            onClick={handleRegen}
            disabled={regenerating}
            className="flex items-center justify-center gap-2 h-9 border border-amber-200 bg-amber-50 text-amber-800 rounded-xl text-[12px] font-medium hover:bg-amber-100 disabled:opacity-50"
          >
            {regenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <KeyRound className="w-4 h-4" />
            )}
            Regenerar API Key
          </button>
        )}

        {!isEdit && (
          <p className="text-[12px] text-[var(--ink-muted)] bg-[var(--bg-subtle)] rounded-xl px-3 py-2.5 leading-relaxed">
            A API Key aparece só uma vez. A loja já fica vinculada ao grupo.
          </p>
        )}
      </div>
    </Modal>
  )
}
