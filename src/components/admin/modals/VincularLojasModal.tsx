import { useCallback, useEffect, useState } from 'react'
import { Link2, Loader2, Plus, Store, Unlink } from 'lucide-react'
import axios from 'axios'
import { Modal, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { AdminTenant, LojaVinculo } from '@/types/admin'

interface VincularLojasModalProps {
  open: boolean
  tenant: AdminTenant | null
  onClose: () => void
  onNovaFilial: () => void
  onChanged?: () => void
}

export function VincularLojasModal({
  open,
  tenant,
  onClose,
  onNovaFilial,
  onChanged,
}: VincularLojasModalProps) {
  const [loading, setLoading] = useState(false)
  const [busyCod, setBusyCod] = useState<string | null>(null)
  const [vinculadas, setVinculadas] = useState<LojaVinculo[]>([])
  const [disponiveis, setDisponiveis] = useState<LojaVinculo[]>([])
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    if (!tenant) return
    setLoading(true)
    setErro('')
    try {
      const res = await axios.get('/api/admin/sync-filiais', {
        params: { modo: 'vinculo', tenantId: tenant.ID },
      })
      setVinculadas(res.data.vinculadas ?? [])
      setDisponiveis(res.data.disponiveis ?? [])
    } catch {
      setErro('Não foi possível carregar as lojas')
    }
    setLoading(false)
  }, [tenant])

  useEffect(() => {
    if (open && tenant) carregar()
  }, [open, tenant, carregar])

  const vincular = async (loja: LojaVinculo) => {
    if (!tenant || busyCod) return
    setBusyCod(loja.codigo)
    try {
      // Se já tem outro grupo dono, vincula só como visão
      const isOwner = !(loja.tenantIdOrigem && loja.tenantIdOrigem !== tenant.ID)
      await axios.post('/api/admin/sync-filiais', {
        action: 'vincular',
        tenantId: tenant.ID,
        filialCod: loja.codigo,
        syncId: loja.syncId,
        isOwner,
      })
      await carregar()
      onChanged?.()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      setErro(err?.response?.data?.error ?? 'Falha ao vincular')
    }
    setBusyCod(null)
  }

  const desvincular = async (loja: LojaVinculo) => {
    if (!tenant || busyCod) return
    if (!confirm(`Desvincular ${loja.nome} deste grupo? O cadastro de sync é mantido.`)) return
    setBusyCod(loja.codigo)
    try {
      await axios.post('/api/admin/sync-filiais', {
        action: 'desvincular',
        tenantId: tenant.ID,
        filialCod: loja.codigo,
      })
      await carregar()
      onChanged?.()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      setErro(err?.response?.data?.error ?? 'Falha ao desvincular')
    }
    setBusyCod(null)
  }

  if (!tenant) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={
        <span className="flex items-center gap-2 text-[14px]">
          <Store className="w-4 h-4 text-[var(--acc)]" />
          Lojas do grupo
        </span>
      }
      subtitle={tenant.NOME}
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose}>
            Fechar
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              onClose()
              onNovaFilial()
            }}
          >
            <Plus className="w-3.5 h-3.5" /> Nova filial
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {erro && (
          <div className="text-[13px] text-[var(--danger)] bg-[var(--danger-bg)] rounded-xl px-3 py-2">
            {erro}
          </div>
        )}

        {loading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--ink-ghost)]" />
          </div>
        ) : (
          <>
            <section>
              <h3 className="text-[12px] font-medium text-[var(--ink)] mb-2">
                Vinculadas ({vinculadas.length})
              </h3>
              {vinculadas.length === 0 ? (
                <div className="rounded-xl bg-[var(--bg-subtle)] px-4 py-5 text-[13px] text-[var(--ink-ghost)] text-center">
                  Nenhuma loja vinculada ainda
                </div>
              ) : (
                <div className="rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
                  {vinculadas.map((l) => (
                    <div
                      key={l.codigo}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] text-[var(--ink)] font-medium truncate">
                          {l.nome}
                        </div>
                        <div className="text-[12px] text-[var(--ink-ghost)] font-mono">
                          {l.codigo}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => desvincular(l)}
                        disabled={busyCod === l.codigo}
                        className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-[12px] text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--danger)] transition-colors disabled:opacity-50"
                      >
                        {busyCod === l.codigo ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Unlink className="w-3.5 h-3.5" />
                        )}
                        Desvincular
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h3 className="text-[12px] font-medium text-[var(--ink)] mb-1">
                Sem vínculo ({disponiveis.length})
              </h3>
              <p className="text-[12px] text-[var(--ink-ghost)] mb-2 leading-relaxed">
                Lojas cadastradas no Sync que ainda não pertencem a nenhum grupo.
              </p>
              {disponiveis.length === 0 ? (
                <div className="rounded-xl bg-[var(--bg-subtle)] px-4 py-5 text-[13px] text-[var(--ink-ghost)] text-center">
                  Nenhuma loja disponível. Crie uma nova filial.
                </div>
              ) : (
                <div className="rounded-xl border border-[var(--border)] divide-y divide-[var(--border)] max-h-56 overflow-y-auto">
                  {disponiveis.map((l) => (
                    <div
                      key={`${l.syncId}-${l.codigo}`}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] text-[var(--ink)] font-medium truncate">
                          {l.nome}
                        </div>
                        <div className="text-[12px] text-[var(--ink-ghost)] font-mono">
                          {l.codigo}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => vincular(l)}
                        disabled={busyCod === l.codigo}
                        className={cn(
                          'flex items-center gap-1.5 h-9 px-3 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50',
                          'bg-[var(--acc-pale)] text-[var(--acc)] hover:bg-[var(--acc)] hover:text-white'
                        )}
                      >
                        {busyCod === l.codigo ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Link2 className="w-3.5 h-3.5" />
                        )}
                        Vincular
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </Modal>
  )
}
