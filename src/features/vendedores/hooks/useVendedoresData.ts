import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { formatDate } from '@/lib/utils'
import { KPIsVendedor } from '@/types'

export function useKPIsVendedores(filiaisOuFilial: string[] | string, inicio: Date, fim: Date) {
  // Aceita tanto string (uma filial) quanto array (múltiplas) por
  // compatibilidade com páginas antigas que ainda passam string
  const filiais: string[] = Array.isArray(filiaisOuFilial)
    ? filiaisOuFilial
    : (filiaisOuFilial ? [filiaisOuFilial] : [])

  return useQuery({
    queryKey: ['kpis-vendedores', filiais.join(','), formatDate(inicio), formatDate(fim)],
    queryFn:  async () => {
      const params: any = { inicio: formatDate(inicio), fim: formatDate(fim) }
      if (filiais.length) params.filial = filiais.join(',')
      const { data } = await axios.get('/api/vendedores/kpis', { params })
      return data.data as KPIsVendedor[]
    },
    // Proprietário não precisa de filial — enabled sempre true quando tem datas
    enabled: !!(inicio && fim), staleTime: 1000 * 60 * 5,
  })
}
