import { Users, Cake, ExternalLink } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui'
import { fmt, cn, upperNome } from '@/lib/utils'
import Link from '@/lib/Link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Resumo { totalCarteira: number; semVinculoPct: number; dormentes60: number; dormentes90: number }
interface Aniversariante { CODIGO_CLIENTE: string; CLIENTE_VAREJO: string; ANIVERSARIO: string; DDD_CELULAR: string; CELULAR: string }

interface Props { resumo?: Resumo; aniversariantes?: Aniversariante[] }

export function ClientesLojaMini({ resumo, aniversariantes = [] }: Props) {
  return (
    <Card padding="sm">
      <div className="flex items-center justify-between mb-3">
        <SectionTitle label="Clientes — loja" icon={Users} className="mb-0 flex-1" />
        <Link href="/dashboard/clientes" className="text-[12px] text-[var(--acc)] flex items-center gap-1">
          detalhar <ExternalLink className="w-2.5 h-2.5" />
        </Link>
      </div>

      {/* Stats mini */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 bg-[var(--bg-subtle)] rounded-lg p-2.5">
          <div className="text-[12px] text-[var(--ink-ghost)] uppercase mb-1">Carteira 12m</div>
          <div className="text-[16px] font-medium text-[var(--ink)]">
            {resumo?.totalCarteira?.toLocaleString('pt-BR') ?? '—'}
          </div>
        </div>
        <div className="flex-1 bg-[var(--bg-subtle)] rounded-lg p-2.5">
          <div className="text-[12px] text-[var(--ink-ghost)] uppercase mb-1">Sem vínculo</div>
          <div className={cn('text-[16px] font-medium',
            (resumo?.semVinculoPct ?? 0) > 20 ? 'text-[var(--danger)]'
            : (resumo?.semVinculoPct ?? 0) > 10 ? 'text-[var(--warn)]'
            : 'text-[var(--success)]')}>
            {resumo ? `${fmt.number(resumo.semVinculoPct, 0)}%` : '—'}
          </div>
          {(resumo?.semVinculoPct ?? 0) > 10 && (
            <div className="text-[12px] text-[var(--danger)]">atenção</div>
          )}
        </div>
      </div>

      {/* Aniversariantes */}
      <div className="text-[13px] text-[var(--ink-ghost)] uppercase tracking-wide mb-2 flex items-center gap-1">
        <Cake className="w-3 h-3" /> Aniversariantes esta semana
      </div>

      {aniversariantes.length === 0 ? (
        <div className="text-[12px] text-[var(--ink-ghost)] text-center py-2">Nenhum esta semana</div>
      ) : (
        <>
          <div className="flex flex-col divide-y divide-[var(--border)]">
            {aniversariantes.slice(0, 3).map(a => {
              const dtAniv = new Date((a as any).ANIVERSARIO_ESTE_ANO ?? a.ANIVERSARIO)
              const isHoje = new Date().getMonth() === dtAniv.getMonth() && new Date().getDate() === dtAniv.getDate()
              return (
                <div key={a.CODIGO_CLIENTE} className="flex items-center gap-2 py-1.5">
                  <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[12px] font-medium shrink-0',
                    isHoje ? 'bg-[var(--acc)] text-white' : 'bg-[var(--acc-pale)] text-[var(--acc)]')}>
                    {upperNome(a.CLIENTE_VAREJO).charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-[var(--ink)] truncate">{upperNome(a.CLIENTE_VAREJO)}</div>
                    <div className="text-[13px] text-[var(--ink-ghost)]">
                      {format(dtAniv, "dd/MM", { locale: ptBR })}
                      {isHoje && <span className="text-[var(--acc)] ml-1">hoje!</span>}
                    </div>
                  </div>
                  {(a.DDD_CELULAR || a.CELULAR) && (
                    <button onClick={() => window.open(`https://wa.me/55${a.DDD_CELULAR}${a.CELULAR}`)}
                      className="text-[12px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 shrink-0">
                      WA
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          {aniversariantes.length > 3 && (
            <div className="mt-1 px-2 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[13px] text-amber-700 flex items-center gap-1">
              <Cake className="w-3 h-3" />
              {aniversariantes.length} aniversariantes sem contato
            </div>
          )}
        </>
      )}
    </Card>
  )
}
