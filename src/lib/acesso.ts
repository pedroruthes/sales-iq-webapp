// ============================================================
// SalesIQ — Controle de acesso centralizado
// Defaults + helpers; overrides CRUD em salesiq_perfil_permissoes
// ============================================================

import {
  menusVisiveis,
  moduloDaRota,
  pode as podeAcao,
  podeVerModulo,
  type AcaoPerm,
} from '@/lib/permissoes'

export type Perfil =
  | 'admin'
  | 'proprietario'
  | 'dono_grupo'
  | 'gerente_grupo'
  | 'analista'
  | 'supervisora'
  | 'gerente_loja'
  | 'vendedora'

export { menusVisiveis, moduloDaRota, podeAcao, podeVerModulo }
export type { AcaoPerm }

export function podeAcessar(perfil: string, rota: string): boolean {
  if (perfil === 'admin') return true
  const modulo = moduloDaRota(rota)
  if (!modulo) return true
  return podeVerModulo(perfil, modulo)
}

/** Escopo de lojas = o que está no JWT (independente do perfil). */
export function escopoFiliais(_perfil: string, filiaisAcesso: string[]): string[] {
  return filiaisAcesso
}

export function podeEditarMetasFilial(perfil: string): boolean {
  return podeAcao(perfil, 'metas', 'editar')
}
export function podeEditarMetasVendedor(perfil: string): boolean {
  return ['admin', 'proprietario', 'dono_grupo', 'gerente_grupo', 'supervisora', 'gerente_loja'].includes(perfil)
}

export function isVisaoRede(perfil: string): boolean {
  return ['admin', 'proprietario', 'dono_grupo', 'gerente_grupo', 'analista', 'supervisora'].includes(perfil)
}
