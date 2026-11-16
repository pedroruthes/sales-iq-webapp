import { useMemo } from 'react'
import { useCurrentUser } from '@/hooks/useSession'
import { useFiliais } from '@/hooks/useFiliais'
import {
  useEscopoFilial,
  isEscopoGrupo,
  parseEscopoGrupo,
} from '@/components/layout/EscopoSelector'

/**
 * Filiais efetivas para queries do painel.
 * Combina o escopo global da sidebar com o acesso do usuário.
 * - loja selecionada: só essa loja
 * - grupo selecionado (g:tenantId): todas as lojas do grupo no JWT
 * - sem seleção: todas as lojas do usuário
 */
export function useFiliaisAtivas(override?: string | null) {
  const user = useCurrentUser()
  const { data: filiais } = useFiliais()
  const { codigo: escopo } = useEscopoFilial()

  const codigoSel = (override !== undefined && override !== null ? override : escopo)?.trim() ?? ''

  const filiaisAtivas = useMemo(() => {
    const acesso = user.filiais.map((f) => String(f).trim()).filter(Boolean)
    const acessoSet = new Set(acesso)

    // Escopo de grupo: todas as lojas do tenant que o usuário pode ver
    if (isEscopoGrupo(codigoSel)) {
      const tid = parseEscopoGrupo(codigoSel)
      if (tid) {
        const doGrupo = (filiais ?? [])
          .filter((f) => Number(f._TENANT_ID) === tid)
          .map((f) => String(f.COD_FILIAL).trim())
          .filter((cod) => {
            if (!cod) return false
            if (!acesso.length || user.isAdmin) return true
            return acessoSet.has(cod)
          })
        if (doGrupo.length) return doGrupo
      }
    }

    // Loja individual
    if (codigoSel && !isEscopoGrupo(codigoSel)) {
      if (!acesso.length || acessoSet.has(codigoSel) || user.isAdmin) {
        return [codigoSel]
      }
      return acesso
    }

    return acesso
  }, [
    user.filiais,
    user.isAdmin,
    codigoSel,
    filiais,
  ])

  return {
    filiaisAtivas,
    codigoEscopo: codigoSel,
    temEscopo: !!codigoSel,
  }
}
