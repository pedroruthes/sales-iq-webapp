import { CheckCircle } from 'lucide-react'
import { Button, FieldInput, FieldSelect, Modal } from '@/components/ui'
import type { PagamentoLicencaForm } from '@/types/admin'

interface PagamentoLicencaModalProps {
  open: boolean
  tituloGrupo?: string
  form: PagamentoLicencaForm
  setForm: React.Dispatch<React.SetStateAction<PagamentoLicencaForm>>
  saving: boolean
  error: string
  onClose: () => void
  onSave: () => void
}

export function PagamentoLicencaModal({
  open,
  tituloGrupo,
  form,
  setForm,
  saving,
  error,
  onClose,
  onSave,
}: PagamentoLicencaModalProps) {
  const canSave = !!form.dataPagamento && !!form.novoVencimento && Number(form.valor) >= 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Registrar pagamento"
      subtitle={tituloGrupo}
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
            className="!bg-[var(--success)] hover:!opacity-90"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Confirmar pagamento
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FieldInput
            label="Data do pagamento"
            type="date"
            value={form.dataPagamento}
            onChange={(e) => setForm((f) => ({ ...f, dataPagamento: e.target.value }))}
          />
          <FieldInput
            label="Novo vencimento"
            type="date"
            value={form.novoVencimento}
            onChange={(e) => setForm((f) => ({ ...f, novoVencimento: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FieldInput
            label="Valor (R$)"
            type="number"
            step="0.01"
            min={0}
            value={form.valor}
            onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
          />
          <FieldSelect
            label="Forma"
            value={form.formaPagamento}
            onChange={(e) => setForm((f) => ({ ...f, formaPagamento: e.target.value }))}
          >
            <option value="">Selecionar</option>
            <option value="Pix">Pix</option>
            <option value="Boleto">Boleto</option>
            <option value="Transferencia">Transferência</option>
            <option value="Cartao">Cartão</option>
          </FieldSelect>
        </div>
        <FieldInput
          label="Competência"
          hint="mm/aaaa"
          value={form.competencia}
          onChange={(e) => setForm((f) => ({ ...f, competencia: e.target.value }))}
          placeholder="03/2026"
        />
        <FieldInput
          label="Observação"
          value={form.obs}
          onChange={(e) => setForm((f) => ({ ...f, obs: e.target.value }))}
          placeholder="Referência, comprovante, etc."
        />
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-[13px] text-red-600">
            {error}
          </div>
        )}
      </div>
    </Modal>
  )
}
