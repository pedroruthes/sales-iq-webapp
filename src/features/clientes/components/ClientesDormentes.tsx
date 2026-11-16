import { useState } from 'react'
import { Moon, MessageCircle, Mail, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import { Card, SectionTitle, Badge } from '@/components/ui'
import { fmt, cn, upperNome } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Dormente {
  CODIGO_CLIENTE: string; CLIENTE_VAREJO: string; FILIAL: string
  ULTIMA_COMPRA: string | null; DIAS_SEM_COMPRA: number
  DDD_CELULAR: string; CELULAR: string; EMAIL: string | null
  CONCEITO: string | null; TIPO_VAREJO: string | null
}

const POR_PAGINA = 10

export function ClientesDormentes({ dados, titulo = 'Clientes dormentes' }: { dados: Dormente[]; titulo?: string }) {
  const [pagina, setPagina] = useState(1)
  const totalPaginas = Math.ceil(dados.length / POR_PAGINA)
  const paginaAtual  = dados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  if (!dados.length) return (
    <Card>
      <SectionTitle label={titulo} icon={Moon} />
      <div className="py-6 text-center text-[13px] text-[var(--ink-ghost)]">Nenhum cliente dormente no período</div>
    </Card>
  )

  return (
    <Card padding="sm">
      <div className="flex items-center justify-between mb-3">
        <SectionTitle label={titulo} icon={Moon} className="mb-0 flex-1" />
        <Badge variant="warn">{dados.length} clientes</Badge>
      </div>

      <div className="flex flex-col divide-y divide-[var(--border)]">
        {paginaAtual.map(c => {
          const temFone = c.DDD_CELULAR || c.CELULAR
          const waNro   = `55${c.DDD_CELULAR ?? ''}${c.CELULAR ?? ''}`
          const nome1   = c.CLIENTE_VAREJO.split(' ')[0]
          const msgWA   = encodeURIComponent(
            `Olá ${nome1}! Sentimos sua falta na loja. Temos novidades incríveis esperando por você! 😊`
          )
          const assunto = encodeURIComponent(`Sentimos sua falta, ${nome1}!`)
          const corpo   = encodeURIComponent(
            `Olá ${nome1},\n\nFaz um tempo que não te vemos por aqui!\nTemos novidades e ofertas especiais esperando por você.\n\nAté breve!`
          )
          const severidade = c.DIAS_SEM_COMPRA > 180 ? 'danger' : c.DIAS_SEM_COMPRA > 90 ? 'warn' : 'neutral'

          return (
            <div key={c.CODIGO_CLIENTE}
              className="flex items-center gap-3 py-2.5 hover:bg-[var(--bg-subtle)] -mx-1 px-1 rounded-lg transition-colors">

              <div className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[13px] font-medium text-[var(--ink-ghost)] shrink-0">
                {upperNome(c.CLIENTE_VAREJO).charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-[var(--ink)] truncate">{upperNome(c.CLIENTE_VAREJO)}</div>
                <div className="text-[12px] text-[var(--ink-ghost)] flex items-center gap-2 flex-wrap">
                  {c.ULTIMA_COMPRA && (
                    <span>última compra: {format(new Date(c.ULTIMA_COMPRA), "dd/MM/yy", { locale: ptBR })}</span>
                  )}
                  <span className={cn('font-medium',
                    severidade === 'danger' ? 'text-[var(--danger)]'
                    : severidade === 'warn'  ? 'text-[var(--warn)]'
                    : 'text-[var(--ink-ghost)]')}>
                    {c.DIAS_SEM_COMPRA}d sem comprar
                  </span>
                  {c.CONCEITO && <span className="text-[var(--ink-ghost)]">· {c.CONCEITO}</span>}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {temFone && (
                  <button
                    onClick={() => window.open(`https://wa.me/${waNro}?text=${msgWA}`, '_blank')}
                    title="Enviar WhatsApp"
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-colors">
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>
                )}
                {c.EMAIL && (
                  <button
                    onClick={() => window.open(`mailto:${c.EMAIL}?subject=${assunto}&body=${corpo}`, '_blank')}
                    title="Enviar e-mail"
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--acc-pale)] hover:bg-[var(--acc)] hover:text-white text-[var(--acc)] transition-colors">
                    <Mail className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
          <span className="text-[12px] text-[var(--ink-ghost)]">
            {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, dados.length)} de {dados.length}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-[var(--border)] disabled:opacity-40 hover:border-[var(--acc-border)] transition-colors">
              <ChevronLeft className="w-3.5 h-3.5 text-[var(--ink-ghost)]" />
            </button>
            {Array.from({ length: Math.min(totalPaginas, 5) }, (_, i) => {
              const pg = totalPaginas <= 5 ? i + 1
                : pagina <= 3 ? i + 1
                : pagina >= totalPaginas - 2 ? totalPaginas - 4 + i
                : pagina - 2 + i
              return (
                <button key={pg} onClick={() => setPagina(pg)}
                  className={cn('w-7 h-7 flex items-center justify-center rounded-lg text-[12px] font-medium transition-colors',
                    pg === pagina ? 'bg-[var(--acc)] text-white' : 'border border-[var(--border)] text-[var(--ink-ghost)] hover:border-[var(--acc-border)]')}>
                  {pg}
                </button>
              )
            })}
            <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-[var(--border)] disabled:opacity-40 hover:border-[var(--acc-border)] transition-colors">
              <ChevronRight className="w-3.5 h-3.5 text-[var(--ink-ghost)]" />
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}
