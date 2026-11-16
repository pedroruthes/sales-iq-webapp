import { Check, Database, Store } from 'lucide-react'
import { Button, Modal } from '@/components/ui'
import { CopyButton } from '@/components/admin/CopyButton'
import type { ProvisionResult } from '@/types/admin'

interface ProvisionadoModalProps {
  data: ProvisionResult | null
  onClose: () => void
  onGoSync?: () => void
}

export function ProvisionadoModal({ data, onClose, onGoSync }: ProvisionadoModalProps) {
  if (!data) return null

  const temUsuario = !!(data.emailAdmin && data.senhaAdmin)

  return (
    <Modal
      open
      preventClose
      zIndex={60}
      headerAccent
      title={
        <span className="flex items-center gap-2 text-[14px]">
          <Database className="w-4 h-4" /> Grupo criado!
        </span>
      }
      subtitle={data.nome}
      footer={
        <>
          {onGoSync && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                onClose()
                onGoSync()
              }}
            >
              <Store className="w-3.5 h-3.5" /> Vincular lojas
            </Button>
          )}
          <Button variant="primary" size="md" onClick={onClose}>
            Entendi
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3 text-[12px]">
        <div className="grid grid-cols-2 gap-2 text-[13px]">
          <div className="bg-[var(--bg-subtle)] rounded-lg px-3 py-2">
            <div className="text-[13px] text-[var(--ink-ghost)]">Tenant ID</div>
            <div className="font-medium">{data.tenantId}</div>
          </div>
          <div className="bg-[var(--bg-subtle)] rounded-lg px-3 py-2">
            <div className="text-[13px] text-[var(--ink-ghost)]">Slug</div>
            <div className="font-medium">{data.slug}</div>
          </div>
          <div className="bg-[var(--bg-subtle)] rounded-lg px-3 py-2">
            <div className="text-[13px] text-[var(--ink-ghost)]">Banco</div>
            <div className="font-medium">
              {data.dbName} ({data.dbMode})
            </div>
          </div>
          <div className="bg-[var(--bg-subtle)] rounded-lg px-3 py-2">
            <div className="text-[13px] text-[var(--ink-ghost)]">Catálogo sync</div>
            <div className="font-medium">{data.catalogoTabelas} tabelas</div>
          </div>
        </div>
        {data.schemaAplicado && (
          <div className="flex items-center gap-2 text-[13px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            <Check className="w-3.5 h-3.5" />
            Tabelas do tenant criadas automaticamente
          </div>
        )}
        {temUsuario ? (
          <div>
            <div className="text-[12px] text-[var(--ink-ghost)] uppercase mb-1">Login do proprietário</div>
            <div className="flex items-center gap-2 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-3 py-2">
              <code className="text-[13px] flex-1 font-mono">{data.emailAdmin}</code>
              <CopyButton text={data.emailAdmin!} />
            </div>
            <div className="flex items-center gap-2 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-3 py-2 mt-1">
              <code className="text-[13px] flex-1 font-mono">{data.senhaAdmin}</code>
              <CopyButton text={data.senhaAdmin!} />
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-[var(--ink-muted)] bg-[var(--bg-subtle)] rounded-lg px-3 py-2">
            Nenhum usuário criado. Cadastre em <strong>Usuários</strong> e vincule a este grupo.
          </p>
        )}
        <p className="text-[12px] text-[var(--ink-muted)]">
          Próximo passo: vincule as lojas deste grupo.
        </p>
      </div>
    </Modal>
  )
}
