import { useEffect } from 'react'
import { useRouter } from '@/lib/navigation'

/** Redireciona rota antiga → painel do sistema / indicadores em Análises. */
export default function AdminIndicadoresRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard/admin/painel')
  }, [router])
  return null
}
