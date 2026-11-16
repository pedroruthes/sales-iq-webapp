/**
 * Permissionamento por perfil: visualizar | adicionar | editar | excluir.
 * Defaults em código; overrides em salesiq_perfil_permissoes (banco admin).
 */

export type AcaoPerm = 'visualizar' | 'adicionar' | 'editar' | 'excluir'
export type AcoesModulo = Record<AcaoPerm, boolean>

export type PerfilKey =
  | 'admin'
  | 'proprietario'
  | 'dono_grupo'
  | 'gerente_grupo'
  | 'analista'
  | 'supervisora'
  | 'gerente_loja'
  | 'vendedora'

export const ACOES: AcaoPerm[] = ['visualizar', 'adicionar', 'editar', 'excluir']

export const MODULOS_PERM = [
  { id: 'dashboard',    label: 'Dashboard',            grupo: 'Visão geral',   rota: '/dashboard',             menu: 'Dashboard' },
  { id: 'lojas',        label: 'Lojas',                grupo: 'Visão geral',   rota: '/dashboard/lojas',       menu: 'Lojas' },
  { id: 'vendas',       label: 'Vendas',               grupo: 'Análises',      rota: '/dashboard/vendas',      menu: 'Vendas' },
  { id: 'clientes',     label: 'Clientes',             grupo: 'Análises',      rota: '/dashboard/clientes',    menu: 'Clientes' },
  { id: 'estoque',      label: 'Estoque',              grupo: 'Análises',      rota: '/dashboard/estoque',     menu: 'Estoque' },
  { id: 'vendedores',   label: 'Vendedores',           grupo: 'Análises',      rota: '/dashboard/vendedores',  menu: 'Vendedores' },
  { id: 'indicadores',  label: 'Indicadores',          grupo: 'Admin',         rota: '/dashboard/indicadores', menu: 'Indicadores' },
  { id: 'ia',           label: 'IA & Insights',        grupo: 'Inteligência',  rota: '/dashboard/ia',          menu: 'IA & Insights' },
  { id: 'curva_abc',    label: 'Curva ABC',            grupo: 'Inteligência',  rota: '/dashboard/curva-abc',   menu: 'Curva ABC' },
  { id: 'score',        label: 'Score',                grupo: 'Performance',   rota: '/dashboard/score',       menu: 'Score' },
  { id: 'lista_vez',    label: 'Lista da Vez',         grupo: 'Performance',   rota: '/dashboard/lista-vez',   menu: 'Lista da Vez' },
  { id: 'gamificacao',  label: 'Gamificação',          grupo: 'Performance',   rota: '/dashboard/gamificacao', menu: 'Gamificação' },
  { id: 'pdca',         label: 'PDCA',                 grupo: 'Performance',   rota: '/dashboard/pdca',        menu: 'PDCA' },
  { id: 'crm',          label: 'CRM',                  grupo: 'CRM',           rota: '/dashboard/crm',         menu: 'CRM & Relacionamento' },
  { id: 'ranking',      label: 'Ranking lojas',        grupo: 'Comparativos',  rota: '/dashboard/ranking',     menu: 'Ranking lojas' },
  { id: 'comparativo',  label: 'Loja vs Rede',         grupo: 'Comparativos',  rota: '/dashboard/comparativo', menu: 'Loja vs Rede' },
  { id: 'metas',        label: 'Metas',                grupo: 'Configurações', rota: '/dashboard/metas',       menu: 'Metas' },
  { id: 'diario',       label: 'Diário de ações',      grupo: 'Configurações', rota: '/dashboard/diario',      menu: 'Diário de ações' },
  { id: 'transferencias', label: 'Transferências',     grupo: 'Configurações', rota: '/dashboard/transferencias', menu: 'Transferências' },
  { id: 'admin_perfis', label: 'Administração',        grupo: 'Admin',         rota: '/dashboard/admin',       menu: 'Administração' },
  { id: 'licencas',     label: 'Licenças',             grupo: 'Admin',         rota: '/dashboard/admin/licencas', menu: 'Licenças' },
] as const

export type ModuloId = (typeof MODULOS_PERM)[number]['id']

const V = (v: boolean, a = false, e = false, x = false): AcoesModulo => ({
  visualizar: v, adicionar: a, editar: e, excluir: x,
})

function todos(v = true): AcoesModulo {
  return V(v, v, v, v)
}

function soLeitura(): AcoesModulo {
  return V(true, false, false, false)
}

function semAcesso(): AcoesModulo {
  return V(false, false, false, false)
}

/** Defaults por perfil — admin tem tudo; demais conforme papel. */
export const DEFAULTS: Record<string, Record<string, AcoesModulo>> = {
  admin: Object.fromEntries(MODULOS_PERM.map((m) => [m.id, todos()])),
  proprietario: Object.fromEntries(MODULOS_PERM.map((m) => [
    m.id,
    m.id === 'admin_perfis' || m.id === 'licencas' || m.id === 'indicadores' ? semAcesso() : todos(),
  ])),
  dono_grupo: Object.fromEntries(MODULOS_PERM.map((m) => [
    m.id,
    m.id === 'admin_perfis' || m.id === 'licencas' || m.id === 'indicadores' ? semAcesso() : todos(),
  ])),
  gerente_grupo: Object.fromEntries(MODULOS_PERM.map((m) => {
    if (m.id === 'admin_perfis' || m.id === 'licencas' || m.id === 'indicadores') return [m.id, semAcesso()]
    if (m.id === 'metas' || m.id === 'diario' || m.id === 'transferencias' || m.id === 'lista_vez') return [m.id, V(true, true, true, false)]
    return [m.id, V(true, false, false, false)]
  })),
  analista: Object.fromEntries(MODULOS_PERM.map((m) => [
    m.id,
    m.id === 'admin_perfis' || m.id === 'licencas' || m.id === 'indicadores' ? semAcesso() : soLeitura(),
  ])),
  supervisora: Object.fromEntries(MODULOS_PERM.map((m) => {
    if (['admin_perfis', 'licencas', 'indicadores'].includes(m.id)) return [m.id, semAcesso()]
    if (['metas', 'diario', 'crm', 'pdca', 'lista_vez'].includes(m.id)) return [m.id, V(true, true, true, false)]
    return [m.id, V(true, false, false, false)]
  })),
  gerente_loja: Object.fromEntries(MODULOS_PERM.map((m) => {
    if (['admin_perfis', 'licencas', 'indicadores', 'ranking', 'comparativo', 'lojas'].includes(m.id)) return [m.id, semAcesso()]
    if (['metas', 'diario', 'crm', 'pdca', 'transferencias', 'lista_vez'].includes(m.id)) return [m.id, V(true, true, true, false)]
    return [m.id, V(true, false, false, false)]
  })),
  vendedora: Object.fromEntries(MODULOS_PERM.map((m) => {
    if (['dashboard', 'vendas', 'estoque', 'crm', 'curva_abc', 'gamificacao', 'score'].includes(m.id))
      return [m.id, soLeitura()]
    if (m.id === 'diario' || m.id === 'lista_vez') return [m.id, V(true, true, true, false)]
    return [m.id, semAcesso()]
  })),
}

export function acoesPadrao(perfil: string, modulo: string): AcoesModulo {
  return DEFAULTS[perfil]?.[modulo] ?? semAcesso()
}

export function pode(
  perfil: string,
  modulo: string,
  acao: AcaoPerm,
  overrides?: Record<string, Record<string, AcoesModulo>> | null
): boolean {
  if (perfil === 'admin') return true
  const fromOverride = overrides?.[perfil]?.[modulo]?.[acao]
  if (typeof fromOverride === 'boolean') return fromOverride
  return !!acoesPadrao(perfil, modulo)[acao]
}

export function podeVerModulo(
  perfil: string,
  modulo: string,
  overrides?: Record<string, Record<string, AcoesModulo>> | null
): boolean {
  return pode(perfil, modulo, 'visualizar', overrides)
}

export function moduloDaRota(pathname: string): string | null {
  const path = pathname.replace(/\/$/, '') || '/dashboard'
  let best: { id: string; len: number } | null = null
  for (const m of MODULOS_PERM) {
    if (path === m.rota || path.startsWith(m.rota + '/')) {
      if (!best || m.rota.length > best.len) best = { id: m.id, len: m.rota.length }
    }
  }
  return best?.id ?? null
}

export function menusVisiveis(
  perfil: string,
  overrides?: Record<string, Record<string, AcoesModulo>> | null
): string[] {
  return MODULOS_PERM
    .filter((m) => podeVerModulo(perfil, m.id, overrides))
    .map((m) => m.menu)
}
