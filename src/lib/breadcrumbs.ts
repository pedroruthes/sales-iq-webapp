/**
 * Breadcrumbs alinhados às seções do sidemenu.
 * Formato: Seção > Página (sem prefixar tudo com "Dashboard").
 */

export type Crumb = { label: string; href?: string }

const SECAO = {
  visao: 'Visão geral',
  analises: 'Análises',
  inteligencia: 'Inteligência',
  performance: 'Performance',
  crm: 'CRM',
  comparativos: 'Comparativos',
  config: 'Configurações',
  admin: 'Administrativo',
  conta: 'Conta',
} as const

/** Rotas exatas → breadcrumb */
const EXACT: Record<string, Crumb[]> = {
  '/dashboard': [
    { label: SECAO.visao },
    { label: 'Dashboard' },
  ],
  '/dashboard/lojas': [
    { label: SECAO.visao },
    { label: 'Lojas' },
  ],
  '/dashboard/vendas': [
    { label: SECAO.analises },
    { label: 'Vendas' },
  ],
  '/dashboard/clientes': [
    { label: SECAO.analises },
    { label: 'Clientes' },
  ],
  '/dashboard/estoque': [
    { label: SECAO.analises },
    { label: 'Estoque' },
  ],
  '/dashboard/vendedores': [
    { label: SECAO.analises },
    { label: 'Vendedores' },
  ],
  '/dashboard/indicadores': [
    { label: SECAO.analises },
    { label: 'Indicadores' },
  ],
  '/dashboard/ia': [
    { label: SECAO.inteligencia },
    { label: 'IA & Insights' },
  ],
  '/dashboard/transferencias': [
    { label: SECAO.inteligencia },
    { label: 'Transferências' },
  ],
  '/dashboard/score': [
    { label: SECAO.performance },
    { label: 'Score' },
  ],
  '/dashboard/lista-vez': [
    { label: SECAO.performance },
    { label: 'Lista da Vez' },
  ],
  '/dashboard/gamificacao': [
    { label: SECAO.performance },
    { label: 'Gamificação' },
  ],
  '/dashboard/pdca': [
    { label: SECAO.performance },
    { label: 'PDCA Digital' },
  ],
  '/dashboard/crm': [
    { label: SECAO.crm },
    { label: 'Relacionamento' },
  ],
  '/dashboard/ranking': [
    { label: SECAO.comparativos },
    { label: 'Ranking lojas' },
  ],
  '/dashboard/comparativo': [
    { label: SECAO.comparativos },
    { label: 'Loja vs Rede' },
  ],
  '/dashboard/metas': [
    { label: SECAO.config },
    { label: 'Metas' },
  ],
  '/dashboard/diario': [
    { label: SECAO.config },
    { label: 'Diário de ações' },
  ],
  '/dashboard/perfil': [
    { label: SECAO.conta },
    { label: 'Meu perfil' },
  ],
  '/dashboard/admin': [
    { label: SECAO.admin },
    { label: 'Painel' },
  ],
  '/dashboard/admin/licencas': [
    { label: SECAO.admin, href: '/dashboard/admin' },
    { label: 'Licenças' },
  ],
  '/dashboard/admin/painel': [
    { label: SECAO.admin, href: '/dashboard/admin' },
    { label: 'Painel' },
  ],
  '/dashboard/admin/sincronizacao': [
    { label: SECAO.admin, href: '/dashboard/admin' },
    { label: 'Sincronização' },
  ],
  '/dashboard/admin/perfis': [
    { label: SECAO.admin, href: '/dashboard/admin' },
    { label: 'Perfis' },
  ],
  '/dashboard/admin?aba=perfis': [
    { label: SECAO.admin, href: '/dashboard/admin' },
    { label: 'Perfis' },
  ],
}

/**
 * Resolve breadcrumb pela rota atual.
 * `extra` acrescenta níveis no final (ex.: nome da loja).
 */
export function breadcrumbFor(pathname: string, extra?: Crumb[]): Crumb[] {
  const base = EXACT[pathname]
  if (base) return extra?.length ? [...base, ...extra] : [...base]

  // Prefixo admin desconhecido
  if (pathname.startsWith('/dashboard/admin')) {
    return [
      { label: SECAO.admin, href: '/dashboard/admin' },
      { label: 'Painel' },
      ...(extra ?? []),
    ]
  }

  if (pathname.startsWith('/dashboard/')) {
    const slug = pathname.replace('/dashboard/', '').split('/')[0]
    const label = slug
      ? slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')
      : 'Dashboard'
    return [{ label: SECAO.visao }, { label }, ...(extra ?? [])]
  }

  return extra?.length ? extra : [{ label: 'Dashboard' }]
}
