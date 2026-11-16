import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { formatDate } from '@/lib/utils'
import { KPIsFilial } from '@/types'

const qs = (p: Record<string,any>) => new URLSearchParams(
  Object.fromEntries(Object.entries(p).map(([k,v]) => [k, v instanceof Date ? formatDate(v) : String(v)]))
).toString()

export function useKPIsFilial(filiais: string[], inicio: Date, fim: Date, codigoVendedor?: string) {
  return useQuery({
    queryKey: ['kpis-filial', filiais, formatDate(inicio), formatDate(fim), codigoVendedor],
    queryFn: async () => {
      const params: any = { filiais: filiais.join(','), inicio: formatDate(inicio), fim: formatDate(fim) }
      if (codigoVendedor) params.codigoVendedor = codigoVendedor
      const { data } = await axios.get('/api/vendas/kpis', { params })
      return data.data as KPIsFilial[]
    },
    enabled: filiais.length > 0,
    staleTime: 1000 * 60 * 5,
  })
}

export function useFaturamentoDiario(filiais: string[], inicio: Date, fim: Date) {
  return useQuery({
    queryKey: ['fat-diario', filiais, formatDate(inicio), formatDate(fim)],
    queryFn: async () => {
      const { data } = await axios.get(`/api/vendas/diario?${qs({ filiais: filiais.join(','), inicio, fim })}`)
      return data.data
    },
    enabled: filiais.length > 0,
    staleTime: 1000 * 60 * 5,
  })
}

export function useComparativo(filiais: string[], dIA: Date, dFA: Date, dIAnt: Date, dFAnt: Date) {
  return useQuery({
    queryKey: ['comparativo', filiais, formatDate(dIA), formatDate(dIAnt)],
    queryFn: async () => {
      const { data } = await axios.get(`/api/vendas/comparativo?${qs({ filiais: filiais.join(','), dIA, dFA, dIAnt, dFAnt })}`)
      return data.data
    },
    enabled: filiais.length > 0,
    staleTime: 1000 * 60 * 5,
  })
}

export function useDistribuicaoPA(filiais: string[], inicio: Date, fim: Date) {
  return useQuery({
    queryKey: ['dist-pa', filiais, formatDate(inicio), formatDate(fim)],
    queryFn: async () => {
      const { data } = await axios.get(`/api/vendas/pa?${qs({ filiais: filiais.join(','), inicio, fim })}`)
      return data.data
    },
    enabled: filiais.length > 0,
    staleTime: 1000 * 60 * 5,
  })
}

export function useVolumePorHora(filiais: string[], inicio: Date, fim: Date) {
  return useQuery({
    queryKey: ['vol-hora', filiais, formatDate(inicio), formatDate(fim)],
    queryFn: async () => {
      const { data } = await axios.get(`/api/vendas/hora?${qs({ filiais: filiais.join(','), inicio, fim })}`)
      return data.data
    },
    enabled: filiais.length > 0,
    staleTime: 1000 * 60 * 5,
  })
}

export function useHeatmap(filiais: string[], inicio: Date, fim: Date) {
  return useQuery({
    queryKey: ['heatmap', filiais, formatDate(inicio), formatDate(fim)],
    queryFn: async () => {
      const { data } = await axios.get(`/api/vendas/heatmap?${qs({ filiais: filiais.join(','), inicio, fim })}`)
      return data.data
    },
    enabled: filiais.length > 0,
    staleTime: 1000 * 60 * 5,
  })
}

// Hook para buscar vendedores de todas as filiais (para o dashboard)
export function useVendedoresRede(filiais: string[], inicio: Date, fim: Date) {
  return useQuery({
    queryKey: ['vendedores-rede', filiais, formatDate(inicio), formatDate(fim)],
    queryFn: async () => {
      const unicas = [...new Set(filiais.map((f) => String(f).trim()).filter(Boolean))]
      // Uma chamada agregada evita duplicar quando o mesmo COD aparece em demo + real
      const { data } = await axios.get(`/api/vendas/vendedores?${qs({
        filiais: unicas.join(','),
        inicio,
        fim,
      })}`)
      const rows = (data.data ?? []) as Array<Record<string, unknown>>
      const seen = new Set<string>()
      return rows
        .filter((v) => {
          const key = `${String(v.codigoVendedor ?? '').trim()}|${String(v.codigoFilial ?? '').trim()}`
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        .sort((a, b) => Number(b.faturamento) - Number(a.faturamento)) as any[]
    },
    enabled: filiais.length > 0,
    staleTime: 1000 * 60 * 5,
  })
}
