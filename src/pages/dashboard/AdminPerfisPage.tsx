import { useEffect } from 'react'
import { useRouter } from '@/lib/navigation'
import { PageLoading } from '@/components/ui'

/** Rota legada — Perfis agora vive como aba em /dashboard/admin */
export default function PerfisRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/admin?aba=perfis')
  }, [router])

  return <PageLoading />
}
