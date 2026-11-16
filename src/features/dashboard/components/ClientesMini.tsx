import { Card, SectionTitle, Badge } from '@/components/ui'
import { Users, Cake, Moon, Unlink, ExternalLink } from 'lucide-react'
import { fmt, cn, upperNome } from '@/lib/utils'
import Link from '@/lib/Link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Resumo {
  totalCarteira: number; semVinculoQtd: number; semVinculoPct: number
  dormentes60: number; dormentes90: number
}

interface Aniversariante {
  CODIGO_CLIENTE: string; CLIENTE_VAREJO: string; ANIVERSARIO: string
  DIAS_SEM_COMPRA: number | null; DDD_CELULAR: string; CELULAR: string
}

interface Props {
  resumo?: Resumo | null
  aniversariantes?: Aniversariante[]
}

export function ClientesMini({ resumo, aniversariantes = [] }: Props) {
  return (
    <Card padding="sm">
      <div className="flex items-center justify-between mb-3">
        <SectionTitle label="Clientes" icon={Users} className="mb-0 flex-1" />
        <Link href="/dashboard/clientes"
          className="text-[12px] text-[var(--acc)] hover:text-[var(--acc-light)] flex items-center gap-1">
          detalhar <ExternalLink className="w-2.5 h-2.5" />
        </Link>
      </div>

      {/* KPIs mini */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-[var(--bg-subtle)] rounded-lg p-2.5">
          <div className="text-[12px] text-[var(--ink-ghost)] uppercase tracking-wide mb-1">Carteira 12m</div>
          <div className="text-[18px] font-medium text-[var(--ink)]">
            {resumo?.totalCarteira?.toLocaleString('pt-BR') ?? '—'}
          </div>
        </div>
        <div className="bg-[var(--bg-subtle)] rounded-lg p-2.5">
          <div className="text-[12px] text-[var(--ink-ghost)] uppercase tracking-wide mb-1">Sem vínculo</div>
          <div className={cn('text-[18px] font-medium',
            (resumo?.semVinculoPct ?? 0) > 20 ? 'text-[var(--danger)]'
            : (resumo?.semVinculoPct ?? 0) > 10 ? 'text-[var(--warn)]'
            : 'text-[var(--success)]')}>
            {resumo ? fmt.percent(resumo.semVinculoPct, 0) : '—'}
          </div>
          {(resumo?.semVinculoPct ?? 0) > 20 && (
            <div className="text-[12px] text-[var(--danger)]">acima do limite</div>
          )}
        </div>
        <div className="bg-[var(--bg-subtle)] rounded-lg p-2.5">
          <div className="text-[12px] text-[var(--ink-ghost)] uppercase tracking-wide mb-1 flex items-center gap-1">
            <Moon className="w-2.5 h-2.5" /> Dormentes 60d
          </div>
          <div className={cn('text-[18px] font-medium',
            (resumo?.dormentes60 ?? 0) > 50 ? 'text-[var(--warn)]' : 'text-[var(--ink)]')}>
            {resumo?.dormentes60?.toLocaleString('pt-BR') ?? '—'}
          </div>
        </div>
        <div className="bg-[var(--bg-subtle)] rounded-lg p-2.5">
          <div className="text-[12px] text-[var(--ink-ghost)] uppercase tracking-wide mb-1 flex items-center gap-1">
            <Moon className="w-2.5 h-2.5" /> Dormentes 90d+
          </div>
          <div className={cn('text-[18px] font-medium',
            (resumo?.dormentes90 ?? 0) > 30 ? 'text-[var(--danger)]' : 'text-[var(--warn)]')}>
            {resumo?.dormentes90?.toLocaleString('pt-BR') ?? '—'}
          </div>
        </div>
      </div>

      {/* Aniversariantes */}
      {aniversariantes.length > 0 && (
        <div>
          <div className="text-[13px] text-[var(--ink-ghost)] uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Cake className="w-3 h-3" /> Aniversariantes esta semana
          </div>
          <div className="flex flex-col gap-1.5">
            {aniversariantes.slice(0, 3).map(a => {
              const dtAniv  = new Date(a.ANIVERSARIO)
              const isHoje  = new Date().getMonth() === dtAniv.getMonth()
                && new Date().getDate() === dtAniv.getDate()
              return (
                <div key={a.CODIGO_CLIENTE}
                  className="flex items-center gap-2 py-1 border-b border-[var(--border)] last:border-0">
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-[13px] font-medium shrink-0',
                    isHoje ? 'bg-[var(--acc)] text-white' : 'bg-[var(--acc-pale)] text-[var(--acc)]'
                  )}>
                    {upperNome(a.CLIENTE_VAREJO || '?').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-[var(--ink)] truncate">{upperNome(a.CLIENTE_VAREJO)}</div>
                    <div className="text-[13px] text-[var(--ink-ghost)]">
                      {format(dtAniv, "dd 'de' MMM", { locale: ptBR })}
                      {isHoje && <span className="ml-1 text-[var(--acc)]">· hoje!</span>}
                    </div>
                  </div>
                  {(a.DDD_CELULAR || a.CELULAR) && (
                    <button
                      onClick={() => window.open(`https://wa.me/55${a.DDD_CELULAR}${a.CELULAR}`)}
                      className="text-[13px] px-2 py-0.5 rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors shrink-0">
                      WhatsApp
                    </button>
                  )}
                </div>
              )
            })}
            {aniversariantes.length > 3 && (
              <Link href="/dashboard/clientes"
                className="text-[12px] text-[var(--acc)] hover:underline">
                +{aniversariantes.length - 3} aniversariantes →
              </Link>
            )}
          </div>
        </div>
      )}

      {aniversariantes.length === 0 && (
        <div className="text-[12px] text-[var(--ink-ghost)] text-center py-2">
          Nenhum aniversariante esta semana
        </div>
      )}
    </Card>
  )
}
