import axios from 'axios'

const TOKEN_KEY = 'salesiq_token'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/** Faz axios global (usado nas páginas) apontar para o backend com Bearer. */
export function installAxiosDefaults() {
  axios.defaults.baseURL = baseURL
  axios.interceptors.request.use((config) => {
    const token = getStoredToken()
    if (token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })
  axios.interceptors.response.use(
    (r) => r,
    (error) => {
      if (error?.response?.status === 401) {
        const path = window.location.pathname
        if (!path.startsWith('/login') && !path.startsWith('/api/auth')) {
          setStoredToken(null)
          if (!window.location.pathname.startsWith('/login')) {
            window.location.assign('/login')
          }
        }
      }
      return Promise.reject(error)
    }
  )
}
