import { useEffect, useState } from 'react'
import axios from 'axios'
import { useEscopoFilial } from '@/components/layout/EscopoSelector'

/** true = exibir colunas de produto/cor (parametro do grupo/loja). Default false. */
export function useMostrarProdutoCor() {
  const { codigo: filial } = useEscopoFilial()
  const [mostrar, setMostrar] = useState(false)

  useEffect(() => {
    let cancelled = false
    axios
      .get('/api/config/ui', { params: filial ? { filial } : {} })
      .then((r) => {
        if (!cancelled) setMostrar(!!r.data?.data?.mostrarProdutoCor)
      })
      .catch(() => {
        if (!cancelled) setMostrar(false)
      })
    return () => { cancelled = true }
  }, [filial])

  return mostrar
}
