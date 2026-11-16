import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { format } from 'date-fns'
import { KPIsFilial, KPIsVendedor } from '@/types'

const fd = (d: Date) => format(d,'yyyy-MM-dd')

export function useKPIsFilial(p: { filiais:string[]; inicio:Date; fim:Date; enabled?:boolean }) {
  return useQuery({
    queryKey: ['kpis-filial', p.filiais, fd(p.inicio), fd(p.fim)],
    queryFn: async () => {
      const { data } = await axios.get('/api/vendas/kpis', { params:{ filiais:p.filiais.join(','), inicio:fd(p.inicio), fim:fd(p.fim) } })
      return data.data as KPIsFilial[]
    },
    enabled: p.enabled!==false && p.filiais.length>0,
    staleTime: 1000*60*5,
  })
}

export function useKPIsVendedores(p: { filial:string; inicio:Date; fim:Date; enabled?:boolean }) {
  return useQuery({
    queryKey: ['kpis-vendedores', p.filial, fd(p.inicio), fd(p.fim)],
    queryFn: async () => {
      const { data } = await axios.get('/api/vendas/vendedores', { params:{ filial:p.filial, inicio:fd(p.inicio), fim:fd(p.fim) } })
      return data.data as KPIsVendedor[]
    },
    enabled: p.enabled!==false && !!p.filial,
    staleTime: 1000*60*5,
  })
}
