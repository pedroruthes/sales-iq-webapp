import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import Link from '@/lib/Link'
import {
  Activity,
  AlertTriangle,
  Building2,
  Database,
  KeyRound,
  RefreshCw,
  Server,
  Users,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Card, Button, KPICard, Badge } from '@/components/ui'
import { useCurrentUser } from '@/hooks/useSession'
import { cn, fmt } from '@/lib/utils'
import { useRouter } from '@/lib/navigation'

type Resumo = {
  gruposAtivos: number
  gruposDemo: number
  gruposInativos: number
  lojasVinculadas: number
  tenantsDbOk: number
  tenantsDbErro: number
  syncFiliais: number
  syncFiliaisAtivas: number
  syncSemSync7d: number
  emailsIndex: number
  usuariosAtivosTenants: number
  adminsCythera: number
  licencasAtivas: number
  licencasBloqueadas: number
  licencasVence7d: number
  licencasVence30d: number
  mrrEstimado: number
  syncOk: number
  syncAtrasado: number
  syncSemSinal: number
  syncErros24h: number
}

type AlertaSync = {
  tenant: string
  filial: string
  nome: string
  status: 'atrasado' | 'sem_sinal' | 'erros'
  detalhe: string
}

type LicencaAtencao = {
  ID: number
  TENANT: string
  STATUS: string
  DIAS: number
  LOJAS: number
  VALOR: number
  VENCIMENTO: string | null
}

type GrupoRecente = {
  id: number
  nome: string
  lojas: number
  db: boolean
  criado: string | null
}

export default function AdminPainelPage() {
  const user = useCurrentUser()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [alertas, setAlertas] = useState<AlertaSync[]>([])
  const [licencas, setLicencas] = useState<LicencaAtencao[]>([])
  const [grupos, setGrupos] = useState<GrupoRecente[]>([])
  const [geradoEm, setGeradoEm] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await axios.get('/api/admin/overview')
      const d = r.data.data
      setResumo(d?.resumo ?? null)
      setAlertas(d?.alertasSync ?? [])
      setLicencas(d?.licencasAtencao ?? [])
      setGrupos(d?.gruposRecentes ?? [])
      setGeradoEm(d?.geradoEm ?? null)
    } catch {
      setResumo(null)
      setAlertas([])
      setLicencas([])
      setGrupos([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user.ready && !user.isAdmin) router.replace('/dashboard')
  }, [user.ready, user.isAdmin, router])

  useEffect(() => {
    if (user.isAdmin) void carregar()
  }, [user.isAdmin, carregar])

  if (!user.isAdmin) return null

  return (
    <DashboardLayout
      titulo="Painel do sistema"
      subtitulo="Visão operacional da plataforma — grupos, licenças, sync e usuários"
      actions={
        <Button variant="secondary" size="md" onClick={carregar} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      }
    >
      {geradoEm && (
        <div className="text-[11px] text-[var(--ink-ghost)] -mt-1">
          Atualizado em {fmt.date(geradoEm, 'dd/MM/yyyy HH:mm')}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5">
        <KPICard label="Grupos ativos" valor={resumo?.gruposAtivos ?? 0} formato="numero" destaque="primary" />
        <KPICard label="Lojas vinculadas" valor={resumo?.lojasVinculadas ?? 0} formato="numero" />
        <KPICard label="Licenças ativas" valor={resumo?.licencasAtivas ?? 0} formato="numero" destaque="success" />
        <KPICard
          label="Vencem em 7d"
          valor={resumo?.licencasVence7d ?? 0}
          formato="numero"
          destaque={(resumo?.licencasVence7d ?? 0) > 0 ? 'warn' : 'neutral'}
        />
        <KPICard
          label="Bloqueadas"
          valor={resumo?.licencasBloqueadas ?? 0}
          formato="numero"
          destaque={(resumo?.licencasBloqueadas ?? 0) > 0 ? 'danger' : 'neutral'}
        />
        <KPICard label="MRR estimado" valor={resumo?.mrrEstimado ?? 0} formato="moeda" destaque="primary" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5">
        <KPICard label="Sync OK" valor={resumo?.syncOk ?? 0} formato="numero" destaque="success" />
        <KPICard
          label="Sync atrasado"
          valor={resumo?.syncAtrasado ?? 0}
          formato="numero"
          destaque={(resumo?.syncAtrasado ?? 0) > 0 ? 'warn' : 'neutral'}
        />
        <KPICard
          label="Sem sinal"
          valor={resumo?.syncSemSinal ?? 0}
          formato="numero"
          destaque={(resumo?.syncSemSinal ?? 0) > 0 ? 'danger' : 'neutral'}
        />
        <KPICard
          label="Erros sync 24h"
          valor={resumo?.syncErros24h ?? 0}
          formato="numero"
          destaque={(resumo?.syncErros24h ?? 0) > 0 ? 'danger' : 'neutral'}
        />
        <KPICard label="Usuários (tenants)" valor={resumo?.usuariosAtivosTenants ?? 0} formato="numero" />
        <KPICard
          label="DB com erro"
          valor={resumo?.tenantsDbErro ?? 0}
          formato="numero"
          destaque={(resumo?.tenantsDbErro ?? 0) > 0 ? 'danger' : 'success'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card padding="sm" className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-[var(--warn)]" />
            <span className="text-[13px] font-medium text-[var(--ink)]">Alertas de sincronização</span>
            <Link href="/dashboard/admin/sincronizacao" className="ml-auto text-[12px] text-[var(--acc)] hover:underline">
              Ver sincronização
            </Link>
          </div>
          {loading ? (
            <div className="text-[13px] text-[var(--ink-ghost)] py-6 text-center">Carregando…</div>
          ) : !alertas.length ? (
            <div className="text-[13px] text-[var(--ink-ghost)] py-6 text-center">Nenhum alerta no momento</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--ink-ghost)] text-left">
                    <th className="py-2 font-medium">Grupo</th>
                    <th className="py-2 font-medium">Loja</th>
                    <th className="py-2 font-medium">Status</th>
                    <th className="py-2 font-medium">Detalhe</th>
                  </tr>
                </thead>
                <tbody>
                  {alertas.map((a) => (
                    <tr key={`${a.tenant}-${a.filial}-${a.status}`} className="border-b border-[var(--border)] last:border-0">
                      <td className="py-2 text-[var(--ink-muted)]">{a.tenant}</td>
                      <td className="py-2">
                        <div className="font-medium text-[var(--ink)]">{a.nome}</div>
                        <div className="text-[11px] text-[var(--ink-ghost)]">{a.filial}</div>
                      </td>
                      <td className="py-2">
                        <Badge
                          variant={
                            a.status === 'sem_sinal' ? 'danger' : a.status === 'atrasado' ? 'warn' : 'info'
                          }
                        >
                          {a.status === 'sem_sinal' ? 'Sem sinal' : a.status === 'atrasado' ? 'Atrasado' : 'Erros'}
                        </Badge>
                      </td>
                      <td className="py-2 text-[var(--ink-muted)]">{a.detalhe}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="w-4 h-4 text-[var(--acc)]" />
            <span className="text-[13px] font-medium text-[var(--ink)]">Licenças em atenção</span>
            <Link href="/dashboard/admin/licencas" className="ml-auto text-[12px] text-[var(--acc)] hover:underline">
              Ver todas
            </Link>
          </div>
          {loading ? (
            <div className="text-[13px] text-[var(--ink-ghost)] py-6 text-center">Carregando…</div>
          ) : !licencas.length ? (
            <div className="text-[13px] text-[var(--ink-ghost)] py-6 text-center">Nenhuma licença crítica</div>
          ) : (
            <ul className="space-y-2">
              {licencas.map((l) => (
                <li key={l.ID} className="flex items-start justify-between gap-2 py-1.5 border-b border-[var(--border)] last:border-0">
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-[var(--ink)] truncate">{l.TENANT}</div>
                    <div className="text-[11px] text-[var(--ink-ghost)]">
                      {l.LOJAS} loja{l.LOJAS === 1 ? '' : 's'} · {fmt.currencyShort(l.VALOR)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant={l.STATUS === 'bloqueada' ? 'danger' : l.DIAS <= 7 ? 'warn' : 'info'}>
                      {l.STATUS === 'bloqueada' ? 'Bloqueada' : `${l.DIAS}d`}
                    </Badge>
                    {l.VENCIMENTO && (
                      <div className="text-[10px] text-[var(--ink-ghost)] mt-0.5">{fmt.date(l.VENCIMENTO)}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card padding="sm">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-[var(--acc)]" />
            <span className="text-[13px] font-medium text-[var(--ink)]">Grupos recentes</span>
            <Link href="/dashboard/admin" className="ml-auto text-[12px] text-[var(--acc)] hover:underline">
              Administração
            </Link>
          </div>
          {loading ? (
            <div className="text-[13px] text-[var(--ink-ghost)] py-6 text-center">Carregando…</div>
          ) : !grupos.length ? (
            <div className="text-[13px] text-[var(--ink-ghost)] py-6 text-center">Sem grupos</div>
          ) : (
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--ink-ghost)] text-left">
                  <th className="py-2 font-medium">Grupo</th>
                  <th className="py-2 font-medium text-right">Lojas</th>
                  <th className="py-2 font-medium">DB</th>
                  <th className="py-2 font-medium text-right">Criado</th>
                </tr>
              </thead>
              <tbody>
                {grupos.map((g) => (
                  <tr key={g.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-2 font-medium text-[var(--ink)]">{g.nome}</td>
                    <td className="py-2 text-right tabular-nums">{g.lojas}</td>
                    <td className="py-2">
                      <Badge variant={g.db ? 'success' : 'warn'}>{g.db ? 'OK' : 'Sem DB'}</Badge>
                    </td>
                    <td className="py-2 text-right text-[var(--ink-muted)]">
                      {g.criado ? fmt.date(g.criado) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-2 mb-3">
            <Server className="w-4 h-4 text-[var(--acc)]" />
            <span className="text-[13px] font-medium text-[var(--ink)]">Atalhos</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: '/dashboard/admin', label: 'Grupos e usuários', icon: Users, hint: 'Cadastros' },
              { href: '/dashboard/admin/licencas', label: 'Licenças', icon: KeyRound, hint: 'Contratos' },
              { href: '/dashboard/admin/sincronizacao', label: 'Sincronização', icon: Activity, hint: 'Agentes' },
              { href: '/dashboard/admin?aba=sync', label: 'Filiais sync', icon: Database, hint: 'API keys' },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl border border-[var(--border)] px-3 py-3',
                  'hover:bg-[var(--bg-subtle)] transition-colors'
                )}
              >
                <a.icon className="w-4 h-4 text-[var(--acc)] shrink-0" />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-[var(--ink)] truncate">{a.label}</div>
                  <div className="text-[11px] text-[var(--ink-ghost)]">{a.hint}</div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
            <div className="rounded-lg bg-[var(--bg-subtle)] px-3 py-2">
              <div className="text-[var(--ink-ghost)]">E-mails indexados</div>
              <div className="text-[16px] font-medium tabular-nums text-[var(--ink)]">{resumo?.emailsIndex ?? 0}</div>
            </div>
            <div className="rounded-lg bg-[var(--bg-subtle)] px-3 py-2">
              <div className="text-[var(--ink-ghost)]">Sem sync há 7d+</div>
              <div className="text-[16px] font-medium tabular-nums text-[var(--ink)]">{resumo?.syncSemSync7d ?? 0}</div>
            </div>
            <div className="rounded-lg bg-[var(--bg-subtle)] px-3 py-2">
              <div className="text-[var(--ink-ghost)]">DBs OK</div>
              <div className="text-[16px] font-medium tabular-nums text-[var(--ink)]">{resumo?.tenantsDbOk ?? 0}</div>
            </div>
            <div className="rounded-lg bg-[var(--bg-subtle)] px-3 py-2">
              <div className="text-[var(--ink-ghost)]">Admins Cythera</div>
              <div className="text-[16px] font-medium tabular-nums text-[var(--ink)]">{resumo?.adminsCythera ?? 0}</div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
