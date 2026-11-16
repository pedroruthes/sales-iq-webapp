
import type { ReactNode } from 'react'
import { usePathname } from '@/lib/navigation'
import { useSessaoUnica } from '@/hooks/useSessaoUnica'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'
import { PageHeader, PageLoading } from '@/components/ui'
import { breadcrumbFor, type Crumb } from '@/lib/breadcrumbs'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  /** Título da página (aparece no PageHeader e fallback no topbar) */
  titulo?: string
  /** Subtítulo descritivo abaixo do título */
  subtitulo?: string
  /**
   * Breadcrumb opcional. Se omitido, usa a hierarquia do menu (Seção > Página).
   * Se informado, substitui o padrão.
   */
  breadcrumb?: Crumb[]
  /** Níveis extras após o breadcrumb padrão (ex.: nome da loja) */
  breadcrumbExtra?: Crumb[]
  /** Ações do header (filtros, botões) */
  actions?: ReactNode
  /** Largura máxima do conteúdo, ex: max-w-[900px] */
  maxWidth?: string
  /** Se true, não renderiza PageHeader (página controla o header) */
  hideHeader?: boolean
  /** Conteúdo sem o wrapper page-content (casos especiais como lojas com sidebar) */
  bare?: boolean
  /** Enquanto true, mantém shell e troca o corpo por PageLoading */
  loading?: boolean
  loadingLabel?: string
}

export function DashboardLayout({
  children,
  titulo,
  subtitulo,
  breadcrumb,
  breadcrumbExtra,
  actions,
  maxWidth,
  hideHeader = false,
  bare = false,
  loading = false,
  loadingLabel,
}: Props) {
  useSessaoUnica()
  const pathname = usePathname()

  const crumbs = breadcrumb?.length
    ? breadcrumb
    : breadcrumbFor(pathname, breadcrumbExtra)

  const body = loading ? <PageLoading label={loadingLabel} /> : children

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-page)] overflow-hidden">
      <Topbar titulo={titulo} breadcrumb={crumbs} />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[var(--bg-page)] min-w-0">
          {bare ? (
            body
          ) : (
            <div className={cn('page-content', maxWidth)}>
              {!hideHeader && titulo && (
                <PageHeader title={titulo} subtitle={subtitulo} actions={loading ? undefined : actions} />
              )}
              {body}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
