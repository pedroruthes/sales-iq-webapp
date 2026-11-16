import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { formatDate } from '@/lib/utils'

const bp = (filiais: string[], inicio: Date, fim: Date, consolidado?: boolean) => ({
  filiais: filiais.join(','), inicio: formatDate(inicio), fim: formatDate(fim),
  ...(consolidado !== undefined ? { consolidado: consolidado ? '1' : '0' } : {}),
})

export function useCurvaABC(
  filiais: string[],
  inicio: Date,
  fim: Date,
  consolidado?: boolean,
  enabled = true
) {
  return useQuery({
    queryKey: ['curva-abc', filiais, formatDate(inicio), formatDate(fim), consolidado],
    queryFn: async () => {
      const { data } = await axios.get('/api/estoque/abc', { params: bp(filiais, inicio, fim, consolidado) })
      return data.data
    },
    enabled: filiais.length > 0 && enabled,
    staleTime: 1000 * 60 * 10,
  })
}

export function useGiroPorGrupo(
  filiais: string[],
  inicio: Date,
  fim: Date,
  consolidado?: boolean,
  enabled = true
) {
  return useQuery({
    queryKey: ['giro-grupo', filiais, formatDate(inicio), formatDate(fim), consolidado],
    queryFn: async () => {
      const { data } = await axios.get('/api/estoque/giro', { params: bp(filiais, inicio, fim, consolidado) })
      return data.data
    },
    enabled: filiais.length > 0 && enabled,
    staleTime: 1000 * 60 * 10,
  })
}

export function useProdutosParados(filiais: string[], dias = 60, enabled = true) {
  return useQuery({
    queryKey: ['parados', filiais, dias],
    queryFn: async () => {
      const { data } = await axios.get('/api/estoque/parados', {
        params: { filiais: filiais.join(','), dias }
      })
      return data.data
    },
    enabled: filiais.length > 0 && enabled,
    staleTime: 1000 * 60 * 10,
  })
}

export function useParadosComEstoque(filiais: string[], dias = 60, enabled = true) {
  return useQuery({
    queryKey: ['parados-estoque', filiais, dias],
    queryFn: async () => {
      const { data } = await axios.get('/api/estoque/parados-com-estoque', {
        params: { filiais: filiais.join(','), dias }
      })
      return data.data
    },
    enabled: filiais.length > 0 && enabled,
    staleTime: 1000 * 60 * 10,
  })
}

export function useRuptura(filiais: string[], diasVenda = 30, enabled = true) {
  return useQuery({
    queryKey: ['ruptura', filiais, diasVenda],
    queryFn: async () => {
      const { data } = await axios.get('/api/estoque/ruptura', {
        params: { filiais: filiais.join(','), diasVenda }
      })
      return data.data
    },
    enabled: filiais.length > 0 && enabled,
    staleTime: 1000 * 60 * 10,
  })
}

export function useResumoEstoque(filiais: string[], inicio: Date, fim: Date, enabled = true) {
  return useQuery({
    queryKey: ['resumo-estoque', filiais, formatDate(inicio), formatDate(fim)],
    queryFn: async () => {
      const { data } = await axios.get('/api/estoque/resumo', { params: bp(filiais, inicio, fim) })
      return data.data
    },
    enabled: filiais.length > 0 && enabled,
    staleTime: 1000 * 60 * 10,
  })
}
