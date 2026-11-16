import Link from '@/lib/Link'
import { usePathname } from '@/lib/navigation'
import { useSession } from '@/lib/next-auth-react'
import { useState } from 'react'
import {
  LayoutDashboard, TrendingUp, Users, Package, Star,
  Building2, Trophy, ArrowLeftRight, Sparkles, ClipboardList,
  ChevronDown, BarChart3, RefreshCw, Target, BookOpen,
  Heart, Shield, KeyRound, Activity, Gauge
} from 'lucide-react'
import { EscopoSelector } from './EscopoSelector'
import { cn } from '@/lib/utils'
import type { Perfil } from '@/lib/acesso'

const TODOS  = ['admin','proprietario','dono_grupo','gerente_grupo','analista','supervisora','gerente_loja','vendedora'] as Perfil[]
const SEM_VEND = ['admin','proprietario','dono_grupo','gerente_grupo','analista','supervisora','gerente_loja'] as Perfil[]
const ADMIN  = ['admin'] as Perfil[]

type NavItem = {
  label: string
  href: string
  icon: typeof LayoutDashboard
  perfis: Perfil[]
  badge?: string
  badgeColor?: string
  soon?: boolean
}

type NavSection = {
  section: string
  perfis?: Perfil[]
  items: NavItem[]
}

const NAV: NavSection[] = [
  { section: 'Visão geral', items: [
    { label: 'Dashboard', href: '/dashboard',       icon: LayoutDashboard, perfis: TODOS     },
    { label: 'Lojas',     href: '/dashboard/lojas', icon: Building2,       perfis: SEM_VEND  },
  ]},
  { section: 'Análises', items: [
    { label: 'Vendas',       href: '/dashboard/vendas',       icon: TrendingUp, perfis: TODOS    },
    { label: 'Clientes',     href: '/dashboard/clientes',     icon: Users,      perfis: SEM_VEND },
    { label: 'Estoque',      href: '/dashboard/estoque',      icon: Package,    perfis: TODOS    },
    { label: 'Vendedores',   href: '/dashboard/vendedores',   icon: Star,       perfis: SEM_VEND },
  ]},
  { section: 'Inteligência', perfis: SEM_VEND, items: [
    { label: 'IA & Insights',  href: '/dashboard/ia',             icon: Sparkles,       badge: 'Novo', badgeColor: 'success', perfis: SEM_VEND },
    { label: 'Curva ABC',      href: '/dashboard/estoque',        icon: BarChart3,      perfis: TODOS    },
    { label: 'OTB',            href: '/dashboard/estoque/otb',    icon: RefreshCw,      soon: true,   perfis: SEM_VEND },
    { label: 'Transferências', href: '/dashboard/transferencias', icon: ArrowLeftRight, perfis: SEM_VEND },
  ]},
  { section: 'Performance', perfis: TODOS, items: [
    { label: 'Score',         href: '/dashboard/score',       icon: Star,          perfis: TODOS },
    { label: 'Lista da Vez',  href: '/dashboard/lista-vez',   icon: Users,         perfis: TODOS },
    { label: 'Gamificação',   href: '/dashboard/gamificacao', icon: Trophy,        perfis: TODOS },
    { label: 'PDCA Digital',  href: '/dashboard/pdca',        icon: ClipboardList, perfis: SEM_VEND },
  ]},
  { section: 'CRM', perfis: TODOS, items: [
    { label: 'Relacionamento', href: '/dashboard/crm', icon: Heart, perfis: TODOS },
  ]},
  { section: 'Comparativos', perfis: SEM_VEND, items: [
    { label: 'Ranking lojas', href: '/dashboard/ranking',     icon: Trophy,         perfis: SEM_VEND },
    { label: 'Loja vs Rede',  href: '/dashboard/comparativo', icon: ArrowLeftRight, perfis: SEM_VEND },
  ]},
  { section: 'Configurações', perfis: SEM_VEND, items: [
    { label: 'Metas',           href: '/dashboard/metas',  icon: Target,   perfis: SEM_VEND },
    { label: 'Diário de ações', href: '/dashboard/diario', icon: BookOpen, perfis: SEM_VEND },
  ]},
  { section: 'Admin', perfis: ADMIN, items: [
    { label: 'Painel',         href: '/dashboard/admin/painel',        icon: Gauge,    perfis: ADMIN },
    { label: 'Indicadores',    href: '/dashboard/indicadores',         icon: BarChart3, perfis: ADMIN },
    { label: 'Administração',  href: '/dashboard/admin',               icon: Shield,   perfis: ADMIN },
    { label: 'Licenças',       href: '/dashboard/admin/licencas',      icon: KeyRound, perfis: ADMIN },
    { label: 'Sincronização',  href: '/dashboard/admin/sincronizacao', icon: Activity, perfis: ADMIN },
  ]},
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const perfil = ((session?.user as { perfil?: string } | undefined)?.perfil ?? '') as Perfil
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const pode = (p?: Perfil[]) => !p || p.includes(perfil)

  // Coleta todos os hrefs visíveis para escolher o match mais específico
  const hrefsVisiveis = NAV.flatMap(s => {
    if (!pode(s.perfis)) return []
    return s.items.filter(i => !i.soon && pode(i.perfis)).map(i => i.href)
  })

  const matchRoute = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  // Só o href mais longo que casa com a rota fica ativo
  // (evita /dashboard/admin ativo em /dashboard/admin/licencas)
  const hrefAtivo = hrefsVisiveis
    .filter(matchRoute)
    .sort((a, b) => b.length - a.length)[0]

  const ativo = (href: string) => href === hrefAtivo

  return (
    <aside
      className="bg-white border-r border-[var(--border)] flex flex-col shrink-0 h-full min-h-0"
      style={{ width: 'var(--sidebar-w)' }}
    >
      <EscopoSelector />

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 pb-4 min-h-0 border-t border-[var(--border)]">
        {NAV.map(s => {
          if (!pode(s.perfis)) return null
          const itens = s.items.filter(i => pode(i.perfis))
          if (!itens.length) return null

          const isCollapsed = collapsed[s.section]
          const hasActive = itens.some(i => !i.soon && ativo(i.href))

          return (
            <div key={s.section} className="mb-1.5">
              <button
                type="button"
                onClick={() => setCollapsed(c => ({ ...c, [s.section]: !c[s.section] }))}
                className="w-full flex items-center justify-between gap-2 px-2.5 pt-3 pb-1.5"
              >
                <span className={cn(
                  'text-[11px] font-semibold uppercase tracking-[0.04em] leading-normal truncate',
                  hasActive ? 'text-[var(--acc)]' : 'text-[var(--ink-ghost)]'
                )}>
                  {s.section}
                </span>
                <ChevronDown className={cn(
                  'w-3.5 h-3.5 text-[var(--ink-ghost)] shrink-0 transition-transform duration-200',
                  isCollapsed && '-rotate-90'
                )} />
              </button>

              {!isCollapsed && (
                <div className="flex flex-col gap-0.5">
                  {itens.map(item => {
                    const Icon = item.icon
                    const isAtivo = !item.soon && ativo(item.href)
                    return (
                      <Link
                        key={`${item.href}-${item.label}`}
                        href={item.soon ? '#' : item.href}
                        onClick={e => item.soon && e.preventDefault()}
                        aria-disabled={item.soon}
                        title={item.label}
                        className={cn(
                          'group flex items-center gap-2.5 rounded-[10px] px-2.5 min-h-[40px] py-2 text-[13px] transition-colors',
                          isAtivo
                            ? 'bg-[var(--acc)] text-white font-medium shadow-sm'
                            : 'text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--ink)]',
                          item.soon && 'opacity-45 cursor-not-allowed hover:bg-transparent hover:text-[var(--ink-muted)]'
                        )}
                      >
                        <Icon className={cn(
                          'w-4 h-4 shrink-0',
                          isAtivo ? 'text-white' : 'text-[var(--ink-ghost)] group-hover:text-[var(--ink-faint)]'
                        )} />
                        <span className="flex-1 min-w-0 truncate leading-snug">
                          {item.label}
                        </span>
                        {item.soon && (
                          <span className="shrink-0 text-[10px] font-medium leading-none bg-[var(--warn-bg)] text-[var(--warn)] rounded-md px-1.5 py-1 whitespace-nowrap">
                            Em breve
                          </span>
                        )}
                        {item.badge && !item.soon && (
                          <span className={cn(
                            'shrink-0 text-[10px] font-semibold leading-none px-1.5 py-1 rounded-md whitespace-nowrap',
                            isAtivo
                              ? 'bg-white/20 text-white'
                              : item.badgeColor === 'success'
                                ? 'bg-[var(--success-bg)] text-[var(--success)]'
                                : 'bg-[var(--acc-pale)] text-[var(--acc)]'
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="px-4 py-3 border-t border-[var(--border)] shrink-0">
        <div className="flex items-center gap-2 min-h-[20px]">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-40" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--success)]" />
          </span>
          <span className="text-[11px] text-[var(--ink-ghost)] font-medium leading-normal">
            SalesIQ · v2.1.0
          </span>
        </div>
      </div>
    </aside>
  )
}

