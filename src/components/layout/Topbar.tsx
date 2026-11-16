import { signOut, useSession } from '@/lib/next-auth-react'
import Link from '@/lib/Link'
import { useRouter } from '@/lib/navigation'
import {
  BarChart3, ChevronDown, Bell, LogOut, User, ChevronRight, Sparkles, X,
  BookOpen, Target, HelpCircle, Settings,
} from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useLicenca } from '@/hooks/useLicenca'
import { cn } from '@/lib/utils'

const PERFIL_LABEL: Record<string, string> = {
  admin: 'Admin',
  proprietario: 'Proprietário',
  dono_grupo: 'Dono grupo',
  supervisora: 'Supervisora',
  gerente_loja: 'Ger. Loja',
  vendedora: 'Vendedora',
}

const TIPO_COLOR: Record<string, string> = {
  feature: 'bg-[var(--acc)] text-white',
  fix: 'bg-[var(--success)] text-white',
  melhoria: 'bg-[var(--warn)] text-white',
}

const TIPO_LABEL: Record<string, string> = {
  feature: 'Novo',
  fix: 'Correção',
  melhoria: 'Melhoria',
}

const iconBtn =
  'relative w-10 h-10 rounded-[11px] flex items-center justify-center text-[var(--ink-faint)] hover:bg-[var(--bg-subtle)] hover:text-[var(--acc)] transition-colors'

export function Topbar({ titulo, breadcrumb }: {
  titulo?: string
  breadcrumb?: { label: string; href?: string }[]
}) {
  const { data: session } = useSession()
  const router = useRouter()
  const [menu, setMenu] = useState(false)
  const [notif, setNotif] = useState(false)
  const [aba, setAba] = useState<'alertas' | 'novidades'>('alertas')
  const { data: licenca } = useLicenca()

  const dispensarAlerta = async (key: string) => {
    try {
      await axios.post('/api/alertas', { action: 'dispensar_alerta', key, horas: 24 })
      refetch()
    } catch { /* ignore */ }
  }

  const marcarNovidadesLidas = async () => {
    try {
      await axios.post('/api/alertas', { action: 'marcar_novidades' })
      refetch()
    } catch { /* ignore */ }
  }

  const { data: alertasData, refetch } = useQuery({
    queryKey: ['alertas'],
    queryFn: async () => {
      const { data } = await axios.get('/api/alertas')
      return data
    },
    staleTime: 0,
    refetchInterval: 1000 * 60 * 10,
  })

  const perfil = (session?.user as { perfil?: string } | undefined)?.perfil ?? ''
  const nomeCompleto = session?.user?.name ?? ''
  const partesNome = nomeCompleto.trim().split(/\s+/).filter(Boolean)
  const nomeCurto = partesNome.length <= 1
    ? (partesNome[0] ?? '')
    : `${partesNome[0]} ${partesNome[partesNome.length - 1]}`
  const iniciais = (
    partesNome.length <= 1
      ? (partesNome[0]?.[0] ?? '?')
      : `${partesNome[0][0]}${partesNome[partesNome.length - 1][0]}`
  ).toUpperCase()

  const notifLicenca = (licenca?.status === 'aviso' || licenca?.status === 'bloqueada')
    ? [{ key: 'licenca', tipo: 'alerta', titulo: 'Licença', texto: licenca?.mensagem ?? 'Licença vencida', tempo: 'agora', prioridade: 0 }]
    : []

  const alertas = [...notifLicenca, ...(alertasData?.alertas ?? [])]
  const novidades = alertasData?.novidades ?? []
  const novidadesNaoLidas = alertasData?.novidadesNaoLidas ?? 0
  const totalBadge = alertas.filter((a: { tipo: string }) => a.tipo === 'alerta').length
  const notifTotal = totalBadge + novidadesNaoLidas

  const crumbs = (breadcrumb ?? []).filter(b => b.label?.trim())

  return (
    <header
      className="bg-white/90 backdrop-blur-md border-b border-[var(--border)] flex items-center px-4 lg:px-6 gap-2.5 shrink-0 z-20"
      style={{ height: 'var(--topbar-h)' }}
    >
      <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity shrink-0">
        <div className="w-8 h-8 bg-[var(--acc)] rounded-[10px] flex items-center justify-center shadow-sm">
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        <span className="text-[15px] font-semibold text-[var(--ink)] tracking-[-0.02em] leading-none hidden sm:inline">
          SalesIQ
        </span>
      </Link>

      <div className="w-px h-5 bg-[var(--border-md)] shrink-0" />

      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
        {crumbs.length > 0 ? (
          crumbs.map((b, i) => {
            const isLast = i === crumbs.length - 1
            return (
              <span key={`${b.label}-${i}`} className="flex items-center gap-1.5 min-w-0 shrink last:shrink-0">
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-[var(--ink-ghost)] shrink-0 opacity-70" />}
                {b.href && !isLast ? (
                  <Link
                    href={b.href}
                    className="text-[13px] text-[var(--ink-ghost)] hover:text-[var(--acc)] transition-colors truncate leading-snug"
                  >
                    {b.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      'text-[13px] truncate leading-snug',
                      isLast ? 'text-[var(--ink)] font-medium' : 'text-[var(--ink-ghost)]'
                    )}
                    title={b.label}
                  >
                    {b.label}
                  </span>
                )}
              </span>
            )
          })
        ) : titulo ? (
          <span className="text-[13px] font-medium text-[var(--ink)] truncate leading-snug">{titulo}</span>
        ) : null}
      </nav>

      <div className="flex items-center gap-0.5 shrink-0">
        <Link href="/dashboard/diario" className={iconBtn} title="Diário de ações" aria-label="Diário de ações">
          <BookOpen className="w-5 h-5" />
        </Link>
        <Link href="/dashboard/metas" className={iconBtn} title="Metas" aria-label="Metas">
          <Target className="w-5 h-5" />
        </Link>
        <a
          href="mailto:suporte@cytheratech.com.br"
          className={cn(iconBtn, 'hidden sm:flex')}
          title="Ajuda / Suporte"
          aria-label="Ajuda"
        >
          <HelpCircle className="w-5 h-5" />
        </a>
        <Link href="/dashboard/perfil" className={cn(iconBtn, 'hidden sm:flex')} title="Configurações" aria-label="Configurações">
          <Settings className="w-5 h-5" />
        </Link>

        <div className="relative">
          <button
            type="button"
            onClick={() => { setNotif(!notif); setMenu(false) }}
            aria-label="Notificações"
            className={cn(iconBtn, notif && 'bg-[var(--bg-subtle)] text-[var(--acc)]')}
          >
            <Bell className="w-5 h-5" />
            {notifTotal > 0 && (
              <span className="absolute top-1 right-1 min-w-[8px] h-2 bg-[var(--danger)] rounded-full" />
            )}
          </button>

          {notif && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotif(false)} />
              <div className="absolute right-0 top-full mt-2 w-[360px] bg-white border border-[var(--border)] rounded-2xl shadow-[var(--shadow-card2)] z-20 overflow-hidden">
                <div className="px-4 pt-3.5 pb-2 flex items-center justify-between">
                  <div>
                    <div className="text-[14px] font-semibold text-[var(--ink)] leading-snug">Notificações</div>
                    <div className="text-[12px] text-[var(--ink-ghost)] leading-snug mt-0.5">
                      Alertas e novidades da plataforma
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotif(false)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--ink-ghost)] hover:bg-[var(--bg-subtle)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex mx-3 p-1 rounded-[10px] bg-[var(--bg-page)]">
                  <button
                    type="button"
                    onClick={() => setAba('alertas')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[12px] font-medium rounded-[8px] transition-colors',
                      aba === 'alertas' ? 'bg-white text-[var(--ink)] shadow-sm' : 'text-[var(--ink-ghost)] hover:text-[var(--ink-muted)]'
                    )}
                  >
                    Alertas
                    {totalBadge > 0 && (
                      <span className="bg-[var(--danger)] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none">
                        {totalBadge}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAba('novidades'); marcarNovidadesLidas() }}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[12px] font-medium rounded-[8px] transition-colors',
                      aba === 'novidades' ? 'bg-white text-[var(--ink)] shadow-sm' : 'text-[var(--ink-ghost)] hover:text-[var(--ink-muted)]'
                    )}
                  >
                    Novidades
                    {novidadesNaoLidas > 0 && (
                      <span className="bg-[var(--acc)] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none">
                        {novidadesNaoLidas}
                      </span>
                    )}
                  </button>
                </div>

                <div className="mt-2 max-h-80 overflow-y-auto">
                  {aba === 'alertas' && (
                    alertas.length === 0 ? (
                      <div className="py-10 text-center px-4">
                        <Bell className="w-7 h-7 text-[var(--ink-ghost)] mx-auto mb-2 opacity-40" />
                        <div className="text-[13px] text-[var(--ink-ghost)] leading-snug">Nenhum alerta no momento</div>
                      </div>
                    ) : alertas.map((n: { key?: string; tipo: string; titulo: string; texto: string; tempo: string }, i: number) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-3.5 border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-page)] transition-colors group">
                        <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', n.tipo === 'alerta' ? 'bg-[var(--danger)]' : 'bg-[var(--acc)]')} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-[var(--ink)] mb-0.5 leading-snug">{n.titulo}</div>
                          <div className="text-[12px] text-[var(--ink-faint)] leading-relaxed">{n.texto}</div>
                          <div className="text-[11px] text-[var(--ink-ghost)] mt-1 leading-normal">{n.tempo}</div>
                        </div>
                        {n.key && (
                          <button
                            type="button"
                            onClick={() => dispensarAlerta(n.key!)}
                            className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-[var(--bg-subtle)] transition-all shrink-0"
                            title="Dispensar por 24h"
                          >
                            <X className="w-3.5 h-3.5 text-[var(--ink-ghost)]" />
                          </button>
                        )}
                      </div>
                    ))
                  )}

                  {aba === 'novidades' && (
                    novidades.length === 0 ? (
                      <div className="py-10 text-center px-4">
                        <Sparkles className="w-7 h-7 text-[var(--ink-ghost)] mx-auto mb-2 opacity-40" />
                        <div className="text-[13px] text-[var(--ink-ghost)] leading-snug">Nenhuma novidade</div>
                      </div>
                    ) : novidades.map((n: { LIDA?: boolean; TIPO: string; VERSAO: string; DATA: string; TITULO: string; DESCRICAO?: string }, i: number) => (
                      <div
                        key={i}
                        className={cn(
                          'px-4 py-3.5 border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-page)] transition-colors',
                          !n.LIDA && 'bg-[var(--acc-pale)]/40'
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-md leading-none', TIPO_COLOR[n.TIPO] ?? 'bg-[var(--bg-subtle)] text-[var(--ink-ghost)]')}>
                            {TIPO_LABEL[n.TIPO] ?? n.TIPO}
                          </span>
                          <span className="text-[11px] text-[var(--ink-ghost)] leading-normal">v{n.VERSAO}</span>
                          <span className="text-[11px] text-[var(--ink-ghost)] ml-auto leading-normal">{n.DATA}</span>
                        </div>
                        <div className="text-[13px] font-medium text-[var(--ink)] mb-0.5 leading-snug">{n.TITULO}</div>
                        {n.DESCRICAO && <div className="text-[12px] text-[var(--ink-faint)] leading-relaxed">{n.DESCRICAO}</div>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="w-px h-5 bg-[var(--border-md)] mx-1.5" />

        <div className="relative">
          <button
            type="button"
            onClick={() => { setMenu(!menu); setNotif(false) }}
            className={cn(
              'flex items-center gap-2.5 rounded-[12px] py-1 pl-1 pr-1.5 transition-colors max-w-[260px]',
              'hover:bg-[var(--bg-subtle)]',
              menu && 'bg-[var(--bg-subtle)]'
            )}
          >
            <div className="w-8 h-8 rounded-full bg-[var(--acc)] flex items-center justify-center text-[11px] font-semibold text-white shrink-0">
              {iniciais}
            </div>
            <div className="hidden md:flex flex-col items-start min-w-0 py-0.5">
              <span className="text-[13px] font-medium text-[var(--ink)] truncate leading-snug max-w-[160px]" title={nomeCompleto}>
                {nomeCurto}
              </span>
              <span className="text-[11px] text-[var(--ink-ghost)] truncate leading-normal max-w-[160px]">
                {PERFIL_LABEL[perfil] ?? perfil}
              </span>
            </div>
            <ChevronDown className={cn(
              'w-3.5 h-3.5 text-[var(--ink-ghost)] shrink-0 transition-transform hidden md:block',
              menu && 'rotate-180'
            )} />
          </button>

          {menu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-[var(--border)] rounded-2xl py-1.5 shadow-[var(--shadow-card2)] z-20 overflow-hidden">
                <div className="px-4 py-3.5 border-b border-[var(--border)] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--acc)] flex items-center justify-center text-[13px] font-semibold text-white shrink-0">
                    {iniciais}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-[var(--ink)] truncate leading-snug">
                      {nomeCompleto}
                    </div>
                    <div className="text-[12px] text-[var(--ink-ghost)] truncate leading-snug mt-0.5">
                      {session?.user?.email}
                    </div>
                    <div className="text-[11px] text-[var(--acc)] font-medium mt-1 leading-normal">
                      {PERFIL_LABEL[perfil] ?? perfil}
                    </div>
                  </div>
                </div>
                <div className="py-1">
                  <Link
                    href="/dashboard/perfil"
                    onClick={() => setMenu(false)}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-[var(--ink-muted)] hover:bg-[var(--bg-page)] hover:text-[var(--acc)] transition-colors leading-snug"
                  >
                    <User className="w-4 h-4" /> Meu perfil
                  </Link>
                  <button
                    type="button"
                    onClick={async () => { setMenu(false); await signOut({ redirect: false }); router.push('/login') }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-colors leading-snug"
                  >
                    <LogOut className="w-4 h-4" /> Sair
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
