import { Building2, Database, Save } from 'lucide-react'
import { Button, Modal, FieldInput } from '@/components/ui'
import type { AdminMeta, AdminTenant, GrupoForm } from '@/types/admin'

interface GrupoModalProps {
  open: boolean
  onClose: () => void
  form: GrupoForm
  setForm: React.Dispatch<React.SetStateAction<GrupoForm>>
  edit: AdminTenant | null
  meta: AdminMeta
  saving: boolean
  onSave: () => void
}

export function GrupoModal({
  open,
  onClose,
  form,
  setForm,
  edit,
  meta: _meta,
  saving,
  onSave,
}: GrupoModalProps) {
  const isEdit = !!edit
  const canSave = form.nome.trim().length > 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={
        <span className="flex items-center gap-2 text-[14px]">
          <Building2 className="w-4 h-4 text-[var(--acc)]" />
          {isEdit ? 'Editar grupo' : 'Novo grupo'}
        </span>
      }
      subtitle={
        isEdit
          ? 'Dados básicos do grupo'
          : 'Cria o grupo e o banco. Vincule lojas depois e cadastre usuários em Usuários.'
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
            {isEdit ? (
              <><Save className="w-3.5 h-3.5" /> Salvar</>
            ) : (
              <><Database className="w-3.5 h-3.5" /> Criar grupo</>
            )}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FieldInput
          label="Nome *"
          value={form.nome}
          onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
          placeholder="Ex: Grupo Nordeste"
          autoFocus
        />
        <FieldInput
          label="Descrição"
          value={form.descricao}
          onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
          placeholder="Opcional"
        />
        {!isEdit && (
          <p className="text-[12px] text-[var(--ink-muted)] bg-[var(--bg-subtle)] rounded-xl px-3.5 py-3 leading-relaxed">
            O banco é provisionado automaticamente. Lojas e usuários são cadastrados em
            passos separados — sem criar usuário nesta tela.
          </p>
        )}
      </div>
    </Modal>
  )
}
