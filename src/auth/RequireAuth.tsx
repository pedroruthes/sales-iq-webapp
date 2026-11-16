import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'

const REDE = ['admin','proprietario','dono_grupo','gerente_grupo','analista','supervisora','gerente_loja']
const ACESSO: Record<string, string[]> = {
  '/dashboard/admin':          ['admin'],
  '/dashboard/indicadores':    ['admin'],
  '/dashboard/ranking':        REDE,
  '/dashboard/comparativo':    REDE,
  '/dashboard/vendedores':     REDE,
  '/dashboard/clientes':       REDE,
  '/dashboard/diario':         REDE,
  '/dashboard/metas':          REDE,
  '/dashboard/lojas':          REDE,
  '/dashboard/ia':             REDE,
  '/dashboard/transferencias': [...REDE.filter((p) => p !== 'analista'), 'analista'],
  '/dashboard/pdca':           REDE,
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-faint text-sm">
        Carregando…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const pathname = location.pathname
  const perfil = user.perfil ?? ''
  for (const [rota, perfisPermitidos] of Object.entries(ACESSO)) {
    if (pathname.startsWith(rota) && !perfisPermitidos.includes(perfil)) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return <>{children}</>
}

export function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
