import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export interface StatusLicenca {
  status:        'ativa' | 'aviso' | 'bloqueada' | 'sem_licenca'
  diasRestantes: number
  diasAtraso:    number
  vencimento:    string | null
  mensagem:      string | null
  bloqueada:     boolean
}

export function useLicenca() {
  return useQuery({
    queryKey: ['licenca'],
    queryFn:  async () => {
      const r = await axios.get('/api/licenca')
      return r.data as StatusLicenca
    },
    staleTime: 1000 * 60 * 30,
    refetchInterval: 1000 * 60 * 60,
  })
}
