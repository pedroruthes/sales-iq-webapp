import {
  useNavigate,
  useLocation,
  useSearchParams as useRRSearchParams,
} from 'react-router-dom'

/** Compat next/navigation useRouter */
export function useRouter() {
  const navigate = useNavigate()
  return {
    push: (path: string) => {
      void navigate(path)
    },
    replace: (path: string) => {
      void navigate(path, { replace: true })
    },
    back: () => {
      void navigate(-1)
    },
    prefetch: (_path: string) => {},
  }
}

/** Compat next/navigation usePathname */
export function usePathname() {
  return useLocation().pathname
}

/** Compat next/navigation useSearchParams — retorna URLSearchParams direto */
export function useSearchParams() {
  const [sp] = useRRSearchParams()
  return sp
}
