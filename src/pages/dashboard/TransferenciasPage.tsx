import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { DashboardLayout } from '@/components/layout'
import { Card, SectionTitle, Badge } from '@/components/ui'
import { useContentLoading, useCurrentUser } from '@/hooks/useSession'
import { fmt, cn } from '@/lib/utils'
import {
  ArrowRightLeft, Sparkles, RefreshCw, CheckCircle,
  Package, Truck, X, FileText, Settings2,
} from 'lucide-react'
import { RegrasTransferencia } from '@/features/transferencias/components/RegrasTransferencia'

type Status = 'sugerida' | 'aprovada' | 'em_execucao' | 'enviada' | 'concluida' | 'cancelada'

const STATUS_CONFIG: Record<Status, { label: string; cor: string; icon: any }> = {
  sugerida:     { label: 'Sugerida pela IA', cor: 'bg-purple-100 text-purple-700 border-purple-200', icon: Sparkles },
  aprovada:     { label: 'Aprovada',          cor: 'bg-blue-100 text-blue-700 border-blue-200',       icon: CheckCircle },
  em_execucao:  { label: 'Em execução',       cor: 'bg-amber-100 text-amber-700 border-amber-200',    icon: Package },
  enviada:      { label: 'Enviada',           cor: 'bg-cyan-100 text-cyan-700 border-cyan-200',       icon: Truck },
  concluida:    { label: 'Concluída',         cor: 'bg-green-100 text-green-700 border-green-200',    icon: CheckCircle },
  cancelada:    { label: 'Cancelada',         cor: 'bg-gray-100 text-gray-500 border-gray-200',       icon: X },
}

const ABAS = [
  { id: '',            label: 'Todas' },
  { id: 'sugerida',   label: 'Sugestões IA' },
  { id: 'aprovada',   label: 'Aprovadas' },
  { id: 'em_execucao',label: 'Em execução' },
  { id: 'enviada',    label: 'Enviadas' },
  { id: 'concluida',  label: 'Concluídas' },
]

function CardTransferencia({ t, onAction, perfil }: { t: any; onAction: (id: number, action: string) => void; perfil: string }) {
  const status = t.STATUS as Status
  const cfg    = STATUS_CONFIG[status] ?? STATUS_CONFIG.sugerida
  const Icon   = cfg.icon

  const podeAprovar    = ['supervisora', 'dono_grupo', 'proprietario', 'admin', 'gerente_grupo', 'gerente_loja'].includes(perfil) && status === 'sugerida'
  const podeIniciar    = status === 'aprovada'
  const podeEnviar     = status === 'em_execucao'
  const podeReceber    = status === 'enviada'
  const podeCancelar   = ['sugerida', 'aprovada'].includes(status)

  return (
    <div className="bg-white border border-[var(--border)] rounded-xl shadow-[var(--shadow-card)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
          status === 'sugerida' ? 'bg-purple-100' : status === 'concluida' ? 'bg-green-100' : 'bg-[var(--acc-pale)]')}>
          <Icon className={cn('w-3.5 h-3.5', status === 'sugerida' ? 'text-purple-600' : status === 'concluida' ? 'text-green-600' : 'text-[var(--acc)]')} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-mono font-medium text-[var(--ink-ghost)]">{t.PROTOCOLO}</span>
            <span className={cn('text-[13px] font-medium px-2 py-0.5 rounded-full border', cfg.cor)}>
              {cfg.label}
            </span>
            {t.SCORE_URGENCIA >= 8 && (
              <span className="text-[13px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                Urgente
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-[13px] text-[var(--ink-muted)]">
            <span className="font-medium">{t.NOME_ORIGEM ?? t.FILIAL_ORIGEM}</span>
            <ArrowRightLeft className="w-3 h-3 text-[var(--ink-ghost)]" />
            <span className="font-medium">{t.NOME_DESTINO ?? t.FILIAL_DESTINO}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <div className="text-[13px] font-medium text-[var(--ink)]">{t.QTD_ITENS ?? 0} SKUs</div>
            <div className="text-[12px] text-[var(--ink-ghost)]">{fmt.currencyShort(t.VALOR_TOTAL ?? 0)} em custo</div>
          </div>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-3 gap-0 border-b border-[var(--border)]">
        <div className="px-4 py-2.5 border-r border-[var(--border)]">
          <div className="text-[13px] text-[var(--ink-ghost)] uppercase tracking-wide mb-0.5">Score urgência</div>
          <div className={cn('text-[14px] font-semibold',
            (t.SCORE_URGENCIA ?? 0) >= 8 ? 'text-[var(--danger)]' :
            (t.SCORE_URGENCIA ?? 0) >= 5 ? 'text-[var(--warn)]' : 'text-[var(--success)]')}>
            {t.SCORE_URGENCIA ?? 0}/10
          </div>
        </div>
        <div className="px-4 py-2.5 border-r border-[var(--border)]">
          <div className="text-[13px] text-[var(--ink-ghost)] uppercase tracking-wide mb-0.5">Previsão receita</div>
          <div className="text-[14px] font-semibold text-[var(--success)]">
            +{fmt.currencyShort(t.PREVISAO_RECEITA ?? 0)}
          </div>
        </div>
        <div className="px-4 py-2.5">
          <div className="text-[13px] text-[var(--ink-ghost)] uppercase tracking-wide mb-0.5">Gerado em</div>
          <div className="text-[13px] text-[var(--ink-muted)]">
            {t.CRIADO_EM ? new Date(t.CRIADO_EM).toLocaleDateString('pt-BR') : '—'}
          </div>
        </div>
      </div>

      {/* Motivo IA */}
      {t.MOTIVO && (
        <div className="px-4 py-2.5 bg-purple-50 border-b border-purple-100">
          <div className="flex items-start gap-2">
            <Sparkles className="w-3 h-3 text-purple-500 shrink-0 mt-0.5" />
            <p className="text-[12px] text-purple-700 leading-relaxed">{t.MOTIVO}</p>
          </div>
        </div>
      )}

      {/* Itens sempre visíveis */}
      <div className="px-4 py-3 bg-[var(--bg-subtle)] border-b border-[var(--border)]">
        <div className="text-[12px] text-[var(--ink-ghost)] uppercase tracking-wide font-medium mb-2">
          Itens da ocorrência
        </div>
        <ItensTransferencia idTransferencia={t.ID} />
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2 px-4 py-2.5">
        {podeAprovar && (
          <button onClick={() => onAction(t.ID, 'aprovar')}
            className="flex items-center gap-1.5 px-3 h-7 bg-[var(--acc)] hover:opacity-90 rounded-lg text-[12px] text-white font-medium transition-colors">
            <CheckCircle className="w-3 h-3" /> Aprovar transferência
          </button>
        )}
        {podeIniciar && (
          <button onClick={() => onAction(t.ID, 'iniciar_execucao')}
            className="flex items-center gap-1.5 px-3 h-7 bg-[var(--acc)] hover:opacity-90 rounded-lg text-[12px] text-white font-medium transition-colors">
            <Package className="w-3 h-3" /> Iniciar separação
          </button>
        )}
        {podeEnviar && (
          <button onClick={() => onAction(t.ID, 'confirmar_envio')}
            className="flex items-center gap-1.5 px-3 h-7 bg-[var(--acc)] hover:opacity-90 rounded-lg text-[12px] text-white font-medium transition-colors">
            <Truck className="w-3 h-3" /> Confirmar envio
          </button>
        )}
        {podeReceber && (
          <button onClick={() => onAction(t.ID, 'confirmar_recebimento')}
            className="flex items-center gap-1.5 px-3 h-7 bg-[var(--success)] hover:opacity-90 rounded-lg text-[12px] text-white font-medium transition-colors">
            <CheckCircle className="w-3 h-3" /> Confirmar recebimento
          </button>
        )}
        <button onClick={() => onAction(t.ID, 'ver_documento')}
          className="flex items-center gap-1.5 px-3 h-7 bg-white border border-[var(--border)] hover:border-[var(--acc-border)] rounded-lg text-[12px] text-[var(--ink-muted)] font-medium transition-colors ml-auto">
          <FileText className="w-3 h-3" /> Ver documento
        </button>
        {podeCancelar && (
          <button onClick={() => onAction(t.ID, 'cancelar')}
            className="flex items-center gap-1.5 px-3 h-7 bg-white border border-[var(--border)] hover:border-red-300 hover:text-[var(--danger)] rounded-lg text-[12px] text-[var(--ink-ghost)] font-medium transition-colors">
            <X className="w-3 h-3" /> Cancelar
          </button>
        )}
      </div>
    </div>
  )
}

function ItensTransferencia({ idTransferencia }: { idTransferencia: number }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['transf-itens', idTransferencia],
    queryFn: async () => {
      const { data } = await axios.get(`/api/transferencias/${idTransferencia}/itens`)
      return data.data ?? []
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  if (isLoading) return <div className="text-[12px] text-[var(--ink-ghost)] py-2">Carregando itens...</div>
  if (isError) {
    return (
      <div className="flex items-center justify-between gap-2 py-2">
        <span className="text-[12px] text-[var(--danger)]">
          Erro ao carregar itens{(error as any)?.response?.data?.error ? `: ${(error as any).response.data.error}` : ''}
        </span>
        <button type="button" onClick={() => void refetch()} className="text-[12px] text-[var(--acc)] font-medium">
          Tentar de novo
        </button>
      </div>
    )
  }
  if (!data?.length) return <div className="text-[12px] text-[var(--ink-ghost)] py-2">Nenhum item nesta ocorrência.</div>

  return (
    <div className="flex flex-col gap-1">
      {data.map((item: any, idx: number) => (
        <div key={item.ID ?? `${item.PRODUTO}-${item.COR_PRODUTO}-${item.POSICAO_GRADE}-${idx}`}
          className="flex items-center gap-3 bg-white border border-[var(--border)] rounded-lg px-3 py-2">
          <div className="flex-1 min-w-0">
            <span className="text-[13px] font-medium text-[var(--ink)]">{item.PRODUTO}</span>
            <span className="text-[12px] text-[var(--ink-ghost)] ml-2">Cor: {item.COR_PRODUTO}</span>
            <span className="text-[12px] text-[var(--ink-ghost)] ml-2">
              Tam. {item.NOME_TAMANHO ?? item.POSICAO_GRADE}
            </span>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[13px] font-medium text-[var(--ink)]">
              {item.QTDE_APROVADA ?? item.QTDE_SUGERIDA} peças
            </div>
            <div className="text-[13px] text-[var(--ink-ghost)]">{fmt.currencyShort(item.VALOR_TOTAL ?? 0)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function TransferenciasPage() {
  const user        = useCurrentUser()
  const qc          = useQueryClient()
  const [aba, setAba]           = useState('')
  const [modo, setModo]         = useState<'lista' | 'regras'>('lista')
  const [gerandoIA, setGerandoIA] = useState(false)
  const [toast, setToast]       = useState('')

  const { data, error } = useQuery({
    queryKey: ['transferencias', aba],
    queryFn: async () => {
      const { data } = await axios.get('/api/transferencias', { params: aba ? { status: aba } : {} })
      return data.data ?? []
    },
    staleTime: 1000 * 60 * 2,
  })

  const loading = useContentLoading({
    waiting: [data === undefined],
  })

  if (error) {
    return (
      <DashboardLayout titulo="Transferências">
        <div className="text-[13px] text-[var(--danger)]">Erro ao carregar transferências.</div>
      </DashboardLayout>
    )
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const gerarSugestoes = async () => {
    setGerandoIA(true)
    try {
      const { data } = await axios.post('/api/transferencias/gerar')
      showToast(data.message ?? (data.geradas ? `${data.geradas} gerada(s)` : 'Concluído'))
      qc.invalidateQueries({ queryKey: ['transferencias'] })
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      const detalhe = err?.response?.data?.error
      showToast(detalhe ? `Erro: ${detalhe}` : 'Erro ao gerar sugestões. Tente novamente.')
    } finally {
      setGerandoIA(false)
    }
  }

  const handleAction = async (id: number, action: string) => {
    if (action === 'ver_documento') {
      window.open(`/api/transferencias/${id}/documento`, '_blank')
      return
    }
    try {
      await axios.patch('/api/transferencias', { id, action })
      showToast('Atualizado com sucesso!')
      qc.invalidateQueries({ queryKey: ['transferencias'] })
    } catch (e: any) {
      showToast('Erro: ' + (e?.response?.data?.error ?? 'tente novamente'))
    }
  }

  const contadores = {
    sugerida:    data?.filter((t: any) => t.STATUS === 'sugerida').length ?? 0,
    aprovada:    data?.filter((t: any) => t.STATUS === 'aprovada').length ?? 0,
    em_execucao: data?.filter((t: any) => t.STATUS === 'em_execucao').length ?? 0,
    enviada:     data?.filter((t: any) => t.STATUS === 'enviada').length ?? 0,
  }

  const lista = aba ? data?.filter((t: any) => t.STATUS === aba) : data

  const podeGerar = ['supervisora', 'dono_grupo', 'proprietario', 'admin', 'gerente_grupo', 'gerente_loja'].includes(user.perfil ?? '')
  const podeRegras = ['supervisora', 'dono_grupo', 'proprietario', 'admin', 'gerente_grupo'].includes(user.perfil ?? '')

  return (
    <DashboardLayout
      titulo="Transferências"
      subtitulo="Sugestões de transferência entre lojas"
      loading={modo === 'lista' ? loading : false}
      actions={
        <div className="flex items-center gap-2">
          {podeRegras && (
            <button
              type="button"
              onClick={() => setModo(modo === 'regras' ? 'lista' : 'regras')}
              className={cn(
                'flex items-center gap-2 px-3 h-9 rounded-xl text-[13px] font-medium border transition-all',
                modo === 'regras'
                  ? 'bg-[var(--acc-pale)] border-[var(--acc-border)] text-[var(--acc)]'
                  : 'bg-white border-[var(--border)] text-[var(--ink-muted)] hover:border-[var(--acc-border)]'
              )}
            >
              <Settings2 className="w-3.5 h-3.5" />
              Regras
            </button>
          )}
          {podeGerar && modo === 'lista' && (
            <button onClick={gerarSugestoes} disabled={gerandoIA}
              className="flex items-center gap-2 px-4 h-9 bg-[var(--acc)] hover:opacity-90 disabled:opacity-50 rounded-xl text-[13px] text-white font-medium transition-all shadow-[var(--shadow-card)]">
              {gerandoIA
                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                : <Sparkles className="w-3.5 h-3.5" />}
              {gerandoIA ? 'Analisando...' : 'Gerar sugestões com IA'}
            </button>
          )}
        </div>
      }
    >
        {/* Toast */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-xl shadow-lg text-[12px] text-white bg-[var(--acc)]">
            {toast}
          </div>
        )}

        {modo === 'regras' && podeRegras && (
          <RegrasTransferencia />
        )}

        {modo === 'lista' && (
        <>
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Sugestões pendentes', valor: contadores.sugerida, cor: 'text-purple-600', border: 'border-l-purple-500' },
            { label: 'Aprovadas',           valor: contadores.aprovada,    cor: 'text-blue-600',   border: 'border-l-blue-500' },
            { label: 'Em execução',         valor: contadores.em_execucao, cor: 'text-amber-600',  border: 'border-l-amber-500' },
            { label: 'Enviadas',            valor: contadores.enviada,     cor: 'text-cyan-600',   border: 'border-l-cyan-500' },
          ].map((k, i) => (
            <div
              key={i}
              className={cn(
                'bg-white border border-[var(--border)] border-l-4 rounded-xl p-3.5 shadow-[var(--shadow-card)]',
                k.border
              )}
            >
              <div className="text-[12px] text-[var(--ink-ghost)] font-medium mb-1">{k.label}</div>
              <div className={cn('text-[18px] font-medium', k.cor)}>{k.valor}</div>
            </div>
          ))}
        </div>

        {/* Abas */}
        <div className="flex gap-1 bg-[var(--bg-subtle)] p-1 rounded-xl w-fit">
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all',
                aba === a.id ? 'bg-white text-[var(--acc)] shadow-[var(--shadow-card)]' : 'text-[var(--ink-ghost)] hover:text-[var(--ink-muted)]')}>
              {a.label}
              {a.id && (contadores as any)[a.id] > 0 && (
                <span className="bg-[var(--acc)] text-white text-[13px] font-bold px-1.5 py-px rounded-full">
                  {(contadores as any)[a.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Lista */}
        {!lista?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ArrowRightLeft className="w-10 h-10 text-[var(--ink-ghost)] opacity-30 mb-3" />
            <div className="text-[13px] font-medium text-[var(--ink-muted)] mb-1">
              {aba ? 'Nenhuma transferência neste status' : 'Nenhuma transferência encontrada'}
            </div>
            {podeGerar && !aba && (
              <div className="text-[13px] text-[var(--ink-ghost)]">
                Clique em "Gerar sugestões com IA" para analisar o estoque das lojas
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {lista.map((t: any) => (
              <CardTransferencia key={t.ID} t={t} onAction={handleAction} perfil={user.perfil ?? ''} />
            ))}
          </div>
        )}
        </>
        )}
    </DashboardLayout>
  )
}
