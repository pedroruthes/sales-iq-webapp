import { useState, useEffect } from 'react'
import { Cake, MessageCircle, Mail, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui'
import { fmt, cn, upperNome } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import axios from 'axios'

type Janela = 'hoje' | 'semana' | 'mes'

interface Aniversariante {
  CODIGO_CLIENTE: string; CLIENTE_VAREJO: string; ANIVERSARIO: string
  MES_ANIV: number; DIA_ANIV: number
  ULTIMA_COMPRA: string | null; DIAS_SEM_COMPRA: number | null
  DDD_CELULAR: string; CELULAR: string; EMAIL: string | null; FILIAL: string
}

const POR_PAGINA = 10

interface Props { filiais: string[] }

export function Aniversariantes({ filiais }: Props) {
  const [janela, setJanela]   = useState<Janela>('semana')
  const [dados,  setDados]    = useState<Aniversariante[]>([])
  const [loading, setLoading] = useState(false)
  const [pagina, setPagina]   = useState(1)

  // Contadores por janela
  const [contHoje,   setContHoje]   = useState<number | null>(null)
  const [contSemana, setContSemana] = useState<number | null>(null)
  const [contMes,    setContMes]    = useState<number | null>(null)

  // Carrega contadores das 3 janelas simultaneamente
  useEffect(() => {
    if (!filiais?.length) return
    const f = filiais.join(',')
    Promise.all([
      axios.get('/api/clientes/aniversariantes', { params: { filiais: f, janela: 'hoje' } }),
      axios.get('/api/clientes/aniversariantes', { params: { filiais: f, janela: 'semana' } }),
      axios.get('/api/clientes/aniversariantes', { params: { filiais: f, janela: 'mes' } }),
    ]).then(([h, s, m]) => {
      setContHoje(h.data.data?.length ?? 0)
      setContSemana(s.data.data?.length ?? 0)
      setContMes(m.data.data?.length ?? 0)
    }).catch(() => {})
  }, [filiais?.join(',')])

  // Carrega dados da janela ativa
  useEffect(() => {
    if (!filiais?.length) return
    setLoading(true)
    setPagina(1)
    axios.get('/api/clientes/aniversariantes', {
      params: { filiais: filiais.join(','), janela }
    }).then(r => setDados(r.data.data ?? []))
      .catch(() => setDados([]))
      .finally(() => setLoading(false))
  }, [janela, filiais?.join(',')])

  const hoje = new Date()
  const totalPaginas = Math.ceil(dados.length / POR_PAGINA)
  const paginaAtual  = dados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  return (
    <Card padding="sm">
      {/* Header com contadores */}
      <div className="flex items-center justify-between mb-3">
        <SectionTitle label="Aniversariantes" icon={Cake} className="mb-0 flex-1" />

        <div className="flex items-center gap-1">
          {([
            { id: 'hoje'   as Janela, label: 'Hoje',       cont: contHoje   },
            { id: 'semana' as Janela, label: 'Esta semana', cont: contSemana },
            { id: 'mes'    as Janela, label: 'Este mês',    cont: contMes    },
          ]).map(op => (
            <button key={op.id} onClick={() => setJanela(op.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-lg text-[12px] font-medium transition-all',
                janela === op.id
                  ? 'bg-[var(--acc)] text-white shadow-sm'
                  : 'bg-[var(--bg-subtle)] text-[var(--ink-ghost)] hover:text-[var(--acc)]'
              )}>
              {op.label}
              {op.cont !== null && (
                <span className={cn('text-[13px] px-1 rounded-full font-medium',
                  janela === op.id ? 'bg-white/20 text-white' : 'bg-[var(--border)] text-[var(--ink-ghost)]')}>
                  {op.cont}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="py-6 text-center text-[13px] text-[var(--ink-ghost)] animate-pulse">Carregando...</div>
      ) : paginaAtual.length === 0 ? (
        <div className="py-8 text-center">
          <Cake className="w-8 h-8 text-[var(--ink-ghost)] opacity-20 mx-auto mb-2" />
          <p className="text-[13px] text-[var(--ink-ghost)]">
            Nenhum aniversariante {janela === 'hoje' ? 'hoje' : janela === 'semana' ? 'esta semana' : 'este mês'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-[var(--border)]">
          {paginaAtual.map(a => {
            const isHoje  = a.MES_ANIV === hoje.getMonth() + 1 && a.DIA_ANIV === hoje.getDate()
            const dtExib  = new Date(hoje.getFullYear(), a.MES_ANIV - 1, a.DIA_ANIV)
            const temFone = a.DDD_CELULAR || a.CELULAR
            const waNro   = `55${a.DDD_CELULAR ?? ''}${a.CELULAR ?? ''}`
            const msgWA   = encodeURIComponent(
              `Olá ${a.CLIENTE_VAREJO.split(' ')[0]}! 🎂 Parabéns pelo seu aniversário! Temos uma surpresa especial para você na loja.`
            )
            const assunto = encodeURIComponent(`Feliz Aniversário, ${a.CLIENTE_VAREJO.split(' ')[0]}!`)
            const corpo   = encodeURIComponent(
              `Olá ${a.CLIENTE_VAREJO.split(' ')[0]},\n\nParabéns pelo seu aniversário! 🎂\nTemos uma surpresa especial esperando por você na loja.\n\nAté breve!`
            )

            return (
              <div key={a.CODIGO_CLIENTE}
                className={cn('flex items-center gap-3 py-2.5 hover:bg-[var(--bg-subtle)] -mx-1 px-1 rounded-lg transition-colors',
                  isHoje && 'bg-[var(--acc-pale)]')}>

                {/* Avatar */}
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-medium shrink-0',
                  isHoje ? 'bg-[var(--acc)] text-white' : 'bg-[var(--acc-pale)] text-[var(--acc)]')}>
                  {upperNome(a.CLIENTE_VAREJO).charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-medium text-[var(--ink)] truncate">{upperNome(a.CLIENTE_VAREJO)}</span>
                    {isHoje && (
                      <span className="text-[13px] bg-[var(--acc)] text-white px-1.5 py-0.5 rounded-full shrink-0">hoje!</span>
                    )}
                  </div>
                  <div className="text-[12px] text-[var(--ink-ghost)] flex items-center gap-2">
                    <span>{format(dtExib, "dd 'de' MMM", { locale: ptBR })}</span>
                    {a.DIAS_SEM_COMPRA !== null && (
                      <span className={cn(
                        a.DIAS_SEM_COMPRA > 180 ? 'text-[var(--danger)]'
                        : a.DIAS_SEM_COMPRA > 90 ? 'text-[var(--warn)]'
                        : 'text-[var(--ink-ghost)]'
                      )}>
                        · última compra há {a.DIAS_SEM_COMPRA}d
                      </span>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {temFone && (
                    <button
                      onClick={() => window.open(`https://wa.me/${waNro}?text=${msgWA}`, '_blank')}
                      title="Enviar WhatsApp"
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-colors">
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {a.EMAIL && (
                    <button
                      onClick={() => window.open(`mailto:${a.EMAIL}?subject=${assunto}&body=${corpo}`, '_blank')}
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
      )}

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
          <span className="text-[12px] text-[var(--ink-ghost)]">
            {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, dados.length)} de {dados.length}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-[var(--border)] hover:border-[var(--acc-border)] disabled:opacity-40 transition-colors">
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
                    pg === pagina ? 'bg-[var(--acc)] text-white' : 'border border-[var(--border)] hover:border-[var(--acc-border)] text-[var(--ink-ghost)]')}>
                  {pg}
                </button>
              )
            })}
            <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-[var(--border)] hover:border-[var(--acc-border)] disabled:opacity-40 transition-colors">
              <ChevronRight className="w-3.5 h-3.5 text-[var(--ink-ghost)]" />
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}
