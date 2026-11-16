import { useMemo } from 'react'
import { useSession as useNextSession } from '@/lib/next-auth-react'

const EMPTY_FILIAIS: string[] = []

export function useCurrentUser() {
  const { data: session, status } = useNextSession()
  const perfil = (session?.user as { perfil?: string } | undefined)?.perfil
  const filiaisRaw = (session?.user as { filiaisAcesso?: string[] } | undefined)?.filiaisAcesso

  // useMemo evita recriar o array a cada render — quebra loops em
  // useEffects que dependem de `filiais` como dependência
  const filiais = useMemo(
    () => filiaisRaw ?? EMPTY_FILIAIS,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filiaisRaw?.join(',')]
  )

  const ready = status !== 'loading'

  return {
    status,
    ready,
    id:             (session?.user as { id?: string } | undefined)?.id,
    nome:           session?.user?.name ?? '',
    email:          session?.user?.email ?? '',
    perfil,
    idTenant:       (session?.user as { idTenant?: number } | undefined)?.idTenant,
    filiais,
    filialPadrao:   (session?.user as { codigoFilialPadrao?: string } | undefined)?.codigoFilialPadrao,
    codigoVendedor: (session?.user as { codigoVendedor?: string } | undefined)?.codigoVendedor,
    isAdmin:        perfil === 'admin',
    isProprietario: ['admin', 'proprietario', 'dono_grupo', 'gerente_grupo'].includes(perfil ?? ''),
    isDono:         perfil === 'dono_grupo',
    isSupervisora:  perfil === 'supervisora',
    isGerenteLoja:  perfil === 'gerente_loja',
    isVendedora:    perfil === 'vendedora',
    isGerenteGrupo: perfil === 'gerente_grupo',
    isVendedor:     perfil === 'vendedora',
  }
}

/**
 * True enquanto a página ainda não deve revelar conteúdo.
 * - sessão não pronta
 * - filiais ainda carregando (quando aplicável)
 * - qualquer query crítica ainda sem dado (com escopo ativo)
 */
export function useContentLoading(opts: {
  filiaisLoading?: boolean
  /** Códigos usados nas queries — se vazio e sessão pronta, não bloqueia por query */
  filiaisQuery?: string[]
  /** Flags: true = ainda carregando / sem dado */
  waiting?: boolean[]
}): boolean {
  const { ready } = useCurrentUser()
  const { filiaisLoading = false, filiaisQuery, waiting = [] } = opts

  if (!ready || filiaisLoading) return true

  const hasScope = filiaisQuery === undefined || filiaisQuery.length > 0
  if (!hasScope) return false

  return waiting.some(Boolean)
}
