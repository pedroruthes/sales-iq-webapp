import { useMemo } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { api, setStoredToken } from '@/api/client'
import type { ReactNode } from 'react'

/** Compat next-auth/react useSession */
export function useSession() {
  const { user, loading } = useAuth()
  return useMemo(
    () => ({
      data: user
        ? {
            user: {
              ...user,
              name: user.name,
              email: user.email,
            },
          }
        : null,
      status: (loading ? 'loading' : user ? 'authenticated' : 'unauthenticated') as
        | 'loading'
        | 'authenticated'
        | 'unauthenticated',
    }),
    [user, loading]
  )
}

export async function signIn(
  _provider: string,
  opts: { email?: string; password?: string; redirect?: boolean }
) {
  try {
    const { data } = await api.post('/api/auth/login', {
      email: opts.email,
      password: opts.password,
    })
    setStoredToken(data.token)
    return { ok: true as const, error: undefined }
  } catch (e: any) {
    return {
      ok: false as const,
      error: e?.response?.data?.error || 'CredentialsSignin',
    }
  }
}

export async function signOut(opts?: { callbackUrl?: string; redirect?: boolean }) {
  try {
    await api.post('/api/auth/logout')
  } catch {
    /* ignore */
  }
  setStoredToken(null)
  if (opts?.redirect !== false) {
    window.location.assign(opts?.callbackUrl || '/login')
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  return children as any
}
