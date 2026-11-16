import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { format } from 'date-fns'

const fd = (d: Date) => format(d,'yyyy-MM-dd')
const bp = (filiais: string[], inicio: Date, fim: Date) => ({ filiais:filiais.join(','), inicio:fd(inicio), fim:fd(fim) })

export function useFaturamentoDiario(filiais: string[], inicio: Date, fim: Date) {
  return useQuery({ queryKey:['fat-diario',filiais,fd(inicio),fd(fim)],
    queryFn: async () => { const { data } = await axios.get('/api/vendas/diario', { params:bp(filiais,inicio,fim) }); return data.data },
    enabled: filiais.length>0, staleTime:1000*60*5 })
}
export function useHeatmap(filiais: string[], inicio: Date, fim: Date) {
  return useQuery({ queryKey:['heatmap',filiais,fd(inicio),fd(fim)],
    queryFn: async () => { const { data } = await axios.get('/api/vendas/heatmap', { params:bp(filiais,inicio,fim) }); return data.data },
    enabled: filiais.length>0, staleTime:1000*60*5 })
}
export function useComparativo(filiais: string[], iAt: Date, fAt: Date, iAnt: Date, fAnt: Date) {
  return useQuery({ queryKey:['comparativo',filiais,fd(iAt),fd(iAnt)],
    queryFn: async () => { const { data } = await axios.get('/api/vendas/comparativo', { params:{ filiais:filiais.join(','), inicioAtual:fd(iAt), fimAtual:fd(fAt), inicioAnterior:fd(iAnt), fimAnterior:fd(fAnt) } }); return data.data },
    enabled: filiais.length>0, staleTime:1000*60*5 })
}
export function useDistribuicaoPA(filiais: string[], inicio: Date, fim: Date) {
  return useQuery({ queryKey:['dist-pa',filiais,fd(inicio),fd(fim)],
    queryFn: async () => { const { data } = await axios.get('/api/vendas/pa', { params:bp(filiais,inicio,fim) }); return data.data },
    enabled: filiais.length>0, staleTime:1000*60*5 })
}
export function useVolumePorHora(filiais: string[], inicio: Date, fim: Date) {
  return useQuery({ queryKey:['vol-hora',filiais,fd(inicio),fd(fim)],
    queryFn: async () => { const { data } = await axios.get('/api/vendas/hora', { params:bp(filiais,inicio,fim) }); return data.data },
    enabled: filiais.length>0, staleTime:1000*60*5 })
}
