import { useState, useEffect } from 'react'
import axios from 'axios'
import { useCurrentUser } from '@/hooks/useSession'
import { Filial } from '@/types'

/**
 * Hook centralizado para obter as filiais disponíveis para o usuário.
 *
 * - Para admin/proprietario/dono_grupo sem filiais no token:
 *   busca da API /api/filiais (que filtra por tenant automaticamente)
 * - Para demais perfis: usa filiaisAcesso do token JWT (apenas os códigos,
 *   resolvidos via /api/filiais para obter nome/empresa/regiao também)
 *
 * Retorna { data, isLoading } no formato Filial[] — compatível com
 * páginas que esperam f.COD_FILIAL, f.FILIAL, etc.
 */
export function useFiliais() {
  const user = useCurrentUser()
  const [data, setData] = useState<Filial[] | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user.ready) {
      setIsLoading(true)
      return
    }

    let cancelado = false
    setIsLoading(true)
    setData(undefined)

    axios
      .get('/api/filiais')
      .then((r) => {
        if (cancelado) return
        setData((r.data?.data ?? []) as Filial[])
      })
      .catch(() => {
        if (!cancelado) setData([])
      })
      .finally(() => {
        if (!cancelado) setIsLoading(false)
      })

    return () => {
      cancelado = true
    }
  }, [user.ready, user.perfil])

  return { data, isLoading: !user.ready || isLoading }
}
