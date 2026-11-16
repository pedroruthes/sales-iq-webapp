import { useEscopoFilial, isEscopoGrupo } from '@/components/layout/EscopoSelector'
import { useFiliaisAtivas } from '@/hooks/useFiliaisAtivas'
import { useCurrentUser } from '@/hooks/useSession'

/**
 * Hook centralizado de filtro de filial.
 * Integra com o EscopoSelector da sidebar: ao mudar o escopo global,
 * o filtro local acompanha; ao mudar o filtro local, atualiza o escopo.
 */
export function useFiltroFilial() {
  const user = useCurrentUser()
  const { codigo, setEscopo } = useEscopoFilial()
  const { filiaisAtivas } = useFiliaisAtivas()

  // Pode escolher se tem mais de uma loja no JWT (ou admin)
  const podeEscolher = user.isAdmin || user.filiais.length > 1
  const filiaisDisponiveis = user.filiais
  // Para FiltroBar que espera código de loja (não grupo), esvazia se for grupo
  const filialSel = isEscopoGrupo(codigo) ? '' : codigo

  const setFilialSel = (cod: string) => {
    if (!podeEscolher) return
    setEscopo(cod)
  }

  return {
    filialSel,
    setFilialSel,
    podeEscolher,
    filiaisAtivas,
    filiaisDisponiveis,
  }
}
