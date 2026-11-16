import { useEffect, useRef, useState } from 'react'
import { useSession, signOut } from '@/lib/next-auth-react'
import axios from 'axios'

const STORAGE_KEY = 'salesiq_session_token'
const CHECK_INTERVAL = 30 * 1000 // verificar a cada 30 segundos

export function useSessaoUnica() {
  const { data: session, status } = useSession()
  const tokenRef = useRef<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const registrado = useRef(false)

  // Registrar sessão após login
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user || registrado.current) return
    registrado.current = true

    const registrar = async () => {
      try {
        const tokenSalvo = localStorage.getItem(STORAGE_KEY)

        // Se já tem token, verificar se ainda é válido
        if (tokenSalvo) {
          const r = await axios.get('/api/sessao', {
            headers: { 'x-session-token': tokenSalvo }
          })
          if (r.data.valida) {
            tokenRef.current = tokenSalvo
            return
          }
        }

        // Registrar nova sessão
        const r = await axios.post('/api/sessao', {})
        if (r.data.token) {
          tokenRef.current = r.data.token
          localStorage.setItem(STORAGE_KEY, r.data.token)
        }
      } catch (e: any) {
        // Se 409 = já logado em outro lugar mas veio de refresh — forçar
        if (e?.response?.status === 409) {
          try {
            const r = await axios.post('/api/sessao', { forcar: true })
            if (r.data.token) {
              tokenRef.current = r.data.token
              localStorage.setItem(STORAGE_KEY, r.data.token)
            }
          } catch {}
        }
      }
    }

    registrar()
  }, [status, session])

  // Verificar periodicamente
  useEffect(() => {
    if (status !== 'authenticated') return

    const verificar = async () => {
      const token = tokenRef.current ?? localStorage.getItem(STORAGE_KEY)
      if (!token) return

      try {
        const r = await axios.get('/api/sessao', {
          headers: { 'x-session-token': token }
        })
        if (!r.data.valida && r.data.motivo === 'sessao_invalida') {
          localStorage.removeItem(STORAGE_KEY)
          await signOut({ callbackUrl: '/login?motivo=sessao_expirada' })
        }
      } catch {}
    }

    intervalRef.current = setInterval(verificar, CHECK_INTERVAL)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [status])

  // Limpar sessão ao deslogar
  useEffect(() => {
    if (status === 'unauthenticated') {
      try { axios.delete('/api/sessao') } catch {}
      localStorage.removeItem(STORAGE_KEY)
      tokenRef.current = null
      registrado.current = false
    }
  }, [status])
}
