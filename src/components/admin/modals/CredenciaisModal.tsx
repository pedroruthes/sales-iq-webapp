import { AlertTriangle, Check, Download } from 'lucide-react'
import { Button, Modal } from '@/components/ui'
import { CopyButton } from '@/components/admin/CopyButton'
import type { SyncCredenciais } from '@/types/admin'

function baixarEnv(creds: SyncCredenciais) {
  const conteudo = [
    `# SalesIQ Sync Agent — Filial ${creds.filialCod} (${creds.filialNome})`,
    `# Gerado em ${new Date().toLocaleString('pt-BR')}`,
    ``,
    `ERP_HOST=localhost`,
    `ERP_PORT=1433`,
    `ERP_DATABASE=NOME_DO_BANCO`,
    `ERP_USER=salesiq_reader`,
    `ERP_PASSWORD=`,
    `ERP_TRUST_CERT=true`,
    ``,
    `FILIAL_COD=${creds.filialCod}`,
    `TENANT_ID=${creds.tenantId}`,
    ``,
    `SALESIQ_API_URL=${typeof window !== 'undefined' ? window.location.origin : 'https://app.salesiq.com.br'}`,
    `SALESIQ_API_KEY=${creds.apiKey}`,
    ``,
    `FREQUENCIA_MIN=15`,
    `BATCH_SIZE=100`,
    `LOG_LEVEL=info`,
    `PANEL_PORT=9100`,
  ].join('\n')

  const blob = new Blob([conteudo], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `.env.filial-${creds.filialCod}`
  a.click()
  URL.revokeObjectURL(url)
}

interface CredenciaisModalProps {
  creds: SyncCredenciais | null
  onClose: () => void
}

export function CredenciaisModal({ creds, onClose }: CredenciaisModalProps) {
  if (!creds) return null

  return (
    <Modal
      open
      preventClose
      zIndex={60}
      headerAccent
      title={creds.regenerada ? 'API Key regenerada!' : 'Filial cadastrada com sucesso!'}
      subtitle="Guarde as credenciais abaixo antes de fechar"
      footer={
        <>
          <Button variant="secondary" size="md" onClick={() => baixarEnv(creds)}>
            <Download className="w-3.5 h-3.5" /> Baixar .env
          </Button>
          <Button variant="primary" size="md" onClick={onClose}>
            Confirmo que guardei
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[13px] text-amber-800">
            <strong>A API Key não será exibida novamente.</strong> Copie agora.
          </div>
        </div>
        <div>
          <div className="text-[12px] text-[var(--ink-ghost)] uppercase tracking-wide mb-1">Filial</div>
          <div className="text-[12px] font-medium text-[var(--ink)]">
            {creds.filialCod} — {creds.filialNome}
          </div>
        </div>
        <div>
          <div className="text-[12px] text-[var(--ink-ghost)] uppercase tracking-wide mb-1.5">API Key</div>
          <div className="flex items-center gap-2 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-3 py-2">
            <code className="text-[13px] text-[var(--ink)] flex-1 break-all font-mono">{creds.apiKey}</code>
            <CopyButton text={creds.apiKey} />
          </div>
        </div>
        <div>
          <div className="text-[12px] text-[var(--ink-ghost)] uppercase tracking-wide mb-1.5">
            Painel local (http://localhost:9100)
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-3 py-2">
              <div className="text-[13px] text-[var(--ink-ghost)] mb-0.5">Usuário</div>
              <div className="flex items-center justify-between gap-2">
                <code className="text-[13px] font-mono text-[var(--ink)]">{creds.usuarioPainel}</code>
                <CopyButton text={creds.usuarioPainel} />
              </div>
            </div>
            <div className="bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-3 py-2">
              <div className="text-[13px] text-[var(--ink-ghost)] mb-0.5">Senha</div>
              <div className="flex items-center justify-between gap-2">
                <code className="text-[13px] font-mono text-[var(--ink)]">{creds.senhaPainel}</code>
                <CopyButton text={creds.senhaPainel} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <Check className="w-3.5 h-3.5" />
          Loja vinculada ao grupo automaticamente
        </div>
      </div>
    </Modal>
  )
}
