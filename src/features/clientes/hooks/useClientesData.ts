import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { formatDate } from '@/lib/utils'

const bp = (filiais: string[], inicio: Date, fim: Date) => ({
  filiais: filiais.join(','), inicio: formatDate(inicio), fim: formatDate(fim),
})

export function useClientesResumo(filiais: string[], inicio: Date, fim: Date) {
  return useQuery({
    queryKey: ['clientes-resumo', filiais, formatDate(inicio)],
    queryFn:  async () => { const { data } = await axios.get('/api/clientes/resumo', { params: bp(filiais, inicio, fim) }); return data.data },
    enabled: filiais.length > 0, staleTime: 1000 * 60 * 5,
  })
}

export function useAniversariantes(filiais: string[], janela: 'hoje'|'semana'|'mes' = 'semana') {
  return useQuery({
    queryKey: ['aniversariantes', filiais, janela],
    queryFn:  async () => { const { data } = await axios.get('/api/clientes/aniversariantes', { params: { filiais: filiais.join(','), janela } }); return data.data },
    enabled: filiais.length > 0, staleTime: 1000 * 60 * 10,
  })
}

export function useClientesDormentes(filiais: string[], diasMin = 60, diasMax = 9999) {
  return useQuery({
    queryKey: ['dormentes', filiais, diasMin, diasMax],
    queryFn:  async () => { const { data } = await axios.get('/api/clientes/dormentes', { params: { filiais: filiais.join(','), diasMin, diasMax } }); return data.data },
    enabled: filiais.length > 0, staleTime: 1000 * 60 * 10,
  })
}

export function useRankingClientes(filiais: string[], inicio: Date, fim: Date) {
  return useQuery({
    queryKey: ['ranking-clientes', filiais, formatDate(inicio)],
    queryFn:  async () => { const { data } = await axios.get('/api/clientes/ranking', { params: bp(filiais, inicio, fim) }); return data.data },
    enabled: filiais.length > 0, staleTime: 1000 * 60 * 5,
  })
}

export function useSemVinculo(filiais: string[], inicio: Date, fim: Date) {
  return useQuery({
    queryKey: ['sem-vinculo', filiais, formatDate(inicio)],
    queryFn:  async () => { const { data } = await axios.get('/api/vendedores/semvinculo', { params: bp(filiais, inicio, fim) }); return data.data },
    enabled: filiais.length > 0, staleTime: 1000 * 60 * 5,
  })
}
