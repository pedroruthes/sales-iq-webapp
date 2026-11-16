import { useState, useEffect } from 'react'
import { Star, TrendingUp, TrendingDown, ChevronDown, Settings,
         Save, BarChart3, Target, RefreshCw, Info } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Card, Button } from '@/components/ui'
import { useContentLoading, useCurrentUser } from '@/hooks/useSession'
import { useFiliais } from '@/hooks/useFiliais'
import { cn, fmt } from '@/lib/utils'
import axios from 'axios'

type Aba = 'ranking' | 'historico' | 'config'

const selectChevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")"

function ScoreBar({ valor, cor }: { valor: number; cor: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', cor)}
          style={{ width: `${Math.min(valor, 100)}%` }} />
      </div>
      <span className="text-[12px] text-[var(--ink-ghost)] w-8 text-right">{valor?.toFixed(0)}</span>
    </div>
  )
}

function ScoreCircle({ score }: { score: number }) {
  const cor = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444'
  const label = score >= 80 ? 'Excelente' : score >= 60 ? 'Bom' : score >= 40 ? 'Regular' : 'Atencao'
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke={cor} strokeWidth="3"
            strokeDasharray={`${score} 100`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[13px] font-bold" style={{ color: cor }}>{score?.toFixed(0)}</span>
        </div>
      </div>
      <span className="text-[13px] font-medium" style={{ color: cor }}>{label}</span>
    </div>
  )
}

export default function ScorePage() {
  const user = useCurrentUser()
  const { data: filiais, isLoading: lFiliais } = useFiliais()
  const [aba,        setAba]        = useState<Aba>('ranking')
  const [filialSel,  setFilialSel]  = useState('')
  const [menuFilial, setMenuFilial] = useState(false)
  const [mes,        setMes]        = useState(new Date().getMonth()+1)
  const [ano,        setAno]        = useState(new Date().getFullYear())
  const [scores,     setScores]     = useState<any[]>([])
  const [historico,  setHistorico]  = useState<any[]>([])
  const [config,     setConfig]     = useState({ pesoMeta:40, pesoPa:30, pesoTm:20, pesoPa1:10, pa1Ideal:35 })
  const [loading,    setLoading]    = useState(true)
  const [salvando,   setSalvando]   = useState(false)
  const [snapshot,   setSnapshot]   = useState(false)

  const filiaisAcess = (filiais ?? []).filter(f => user.filiais.includes(f.COD_FILIAL.trim()))
  const filiaisParam = filialSel ? [filialSel] : user.filiais
  const nomeFilial   = filialSel
    ? filiaisAcess.find(f => f.COD_FILIAL.trim() === filialSel)?.FILIAL ?? filialSel
    : 'Todas as lojas'

  const carregar = async () => {
    setLoading(true)
    try {
      const params = { filiais: filiaisParam.join(','), mes, ano }
      if (aba === 'ranking') {
        const r = await axios.get('/api/score', { params })
        setScores(r.data.data ?? [])
        if (r.data.config) {
          const c = r.data.config
          setConfig({ pesoMeta: c.PESO_META, pesoPa: c.PESO_PA, pesoTm: c.PESO_TM, pesoPa1: c.PESO_PA1, pa1Ideal: c.PA1_IDEAL })
        }
      }
      if (aba === 'historico') {
        const r = await axios.get('/api/score/historico', { params })
        setHistorico(r.data.data ?? [])
      }
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { if (user.filiais.length) carregar() }, [aba, filialSel, mes, ano])

  const salvarConfig = async () => {
    setSalvando(true)
    try {
      await axios.post('/api/score/config', config)
      carregar()
    } catch {}
    finally { setSalvando(false) }
  }

  const [snapshotResult, setSnapshotResult] = useState<any>(null)
  const [snapshotErro, setSnapshotErro] = useState('')

  const gerarSnapshot = async () => {
    setSnapshot(true)
    setSnapshotErro('')
    setSnapshotResult(null)
    try {
      const r = await axios.post('/api/score/snapshot', { filiais: filiaisParam, mes, ano })
      setSnapshotResult(r.data)
      carregar()
      setTimeout(() => setSnapshotResult(null), 5000)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      setSnapshotErro(err?.response?.data?.error ?? 'Falha ao salvar snapshot')
      setTimeout(() => setSnapshotErro(''), 6000)
    } finally {
      setSnapshot(false)
    }
  }

  const meuScore = user.isVendedora
    ? scores.find(s => s.codigoVendedor?.trim() === user.codigoVendedor?.trim())
    : null

  const mesesLabels = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

  const pageLoading = useContentLoading({
    filiaisLoading: lFiliais,
    filiaisQuery: user.filiais,
    waiting: aba === 'config' ? [] : (user.filiais.length > 0 ? [loading] : []),
  })

  return (
    <DashboardLayout
      titulo="Score de Performance"
      subtitulo="Índice de desempenho por vendedora"
      loading={pageLoading}
      actions={
        <>
          {filiaisAcess.length > 1 && (
            <div className="relative">
              <button type="button" onClick={() => setMenuFilial(!menuFilial)}
                className="filter-trigger">
                <span className="max-w-[120px] truncate">{nomeFilial}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {menuFilial && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuFilial(false)} />
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-[var(--border)] rounded-xl py-1 shadow-lg z-20">
                    <button onClick={() => { setFilialSel(''); setMenuFilial(false) }}
                      className={cn('w-full px-3 py-2 text-[13px] text-left', !filialSel ? 'bg-[var(--acc-pale)] text-[var(--acc)]' : 'hover:bg-[var(--bg-subtle)] text-[var(--ink-muted)]')}>
                      Todas as lojas
                    </button>
                    {filiaisAcess.map(f => (
                      <button key={f.COD_FILIAL} onClick={() => { setFilialSel(f.COD_FILIAL.trim()); setMenuFilial(false) }}
                        className={cn('w-full px-3 py-2 text-[13px] text-left', filialSel===f.COD_FILIAL.trim() ? 'bg-[var(--acc-pale)] text-[var(--acc)]' : 'hover:bg-[var(--bg-subtle)] text-[var(--ink-muted)]')}>
                        {f.FILIAL}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          <select value={mes} onChange={e => setMes(parseInt(e.target.value))}
            style={{ backgroundImage: selectChevron }}
            className="select-base !w-auto min-w-[120px]">
            {mesesLabels.map((m,i) => <option key={i+1} value={i+1}>{m}/{ano}</option>)}
          </select>
          {(user.isGerenteLoja || user.isSupervisora || user.isAdmin || user.isProprietario) && (
            <Button variant="secondary" size="lg" onClick={gerarSnapshot} disabled={snapshot} loading={snapshot}>
              {!snapshot && <Save className="w-4 h-4" />}
              {snapshot ? 'Salvando...' : 'Salvar snapshot'}
            </Button>
          )}
        </>
      }
    >
        {/* Banner resultado snapshot */}
        {snapshotResult && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--success)] flex items-center justify-center shrink-0">
              <Save className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-[12px] font-medium text-[var(--success)]">Snapshot salvo com sucesso!</div>
              <div className="text-[12px] text-[var(--ink-ghost)]">
                {snapshotResult.salvos} vendedoras registradas · {snapshotResult.pontosGerados} eventos de gamificação processados
              </div>
            </div>
          </div>
        )}
        {snapshotErro && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[12px] text-[var(--danger)]">
            {snapshotErro}
          </div>
        )}

        {/* Card da vendedora logada */}
        {user.isVendedora && meuScore && (
          <div className="bg-gradient-to-r from-blue-500 to-[var(--acc)] rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] text-white/70 mb-1">Seu score â€” {mesesLabels[mes-1]}/{ano}</div>
                <div className="text-[18px] font-medium">{meuScore.apelido ?? meuScore.nomeVendedor?.split(' ')[0]}</div>
              </div>
              <ScoreCircle score={meuScore.score ?? 0} />
            </div>
            <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/20">
              {[
                { label:'Meta', valor: meuScore.scoreMeta },
                { label:'PA', valor: meuScore.scorePA },
                { label:'TM', valor: meuScore.scoreTM },
                { label:'PA1', valor: meuScore.scorePA1 },
              ].map(c => (
                <div key={c.label} className="text-center">
                  <div className="text-[13px] font-medium">{c.valor?.toFixed(0)}</div>
                  <div className="text-[13px] text-white/60">{c.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Abas */}
        <div className="flex gap-1 bg-[var(--bg-subtle)] p-1 rounded-xl w-fit">
          {([
            { id:'ranking' as Aba,   icon: Star,     label:'Ranking Score' },
            { id:'historico' as Aba, icon: BarChart3, label:'Historico' },
            ...(user.isAdmin || user.isGerenteLoja || user.isProprietario ? [{ id:'config' as Aba, icon: Settings, label:'Pesos' }] : []),
          ]).map(a => (
            <button key={a.id} onClick={() => setAba(a.id)}
              className={cn('flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all',
                aba===a.id ? 'bg-white text-[var(--acc)] shadow-[var(--shadow-card)]' : 'text-[var(--ink-ghost)] hover:text-[var(--ink-muted)]')}>
              <a.icon className="w-3.5 h-3.5" /> {a.label}
            </button>
          ))}
        </div>

        {/* â•â•â• ABA RANKING â•â•â• */}
        {aba === 'ranking' && (
          <>
            {/* FÃ³rmula */}
            <div className="flex items-center gap-2 px-1">
              <Info className="w-3.5 h-3.5 text-[var(--ink-ghost)]" />
              <span className="text-[12px] text-[var(--ink-ghost)]">
                Score = Meta({config.pesoMeta}%) + PA({config.pesoPa}%) + TM({config.pesoTm}%) + PA1 inverso({config.pesoPa1}%) | PA1 ideal: abaixo de {config.pa1Ideal}%
              </span>
            </div>

            {scores.length === 0 ? (
              <Card><div className="py-8 text-center text-[12px] text-[var(--ink-ghost)]">Sem dados no periodo</div></Card>
            ) : (
              <div className="flex flex-col gap-2">
                {scores.map((s, i) => {
                  const scoreCor = s.score >= 80 ? 'bg-green-500' : s.score >= 60 ? 'bg-amber-400' : s.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                  const isEu = user.isVendedora && s.codigoVendedor?.trim() === user.codigoVendedor?.trim()
                  return (
                    <div key={s.codigoVendedor + s.codigoFilial}
                      className={cn('bg-white border rounded-xl p-4 transition-colors',
                        isEu ? 'border-[var(--acc)] bg-[var(--acc-pale)]' : 'border-[var(--border)] hover:border-[var(--acc-border)]')}>
                      <div className="flex items-center gap-4">
                        {/* PosiÃ§Ã£o */}
                        <div className="text-[14px] font-bold text-[var(--ink-ghost)] w-6 text-center shrink-0">
                          {i+1}º
                        </div>
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full bg-[var(--acc-pale)] flex items-center justify-center text-[13px] font-bold text-[var(--acc)] shrink-0">
                          {(s.apelido ?? s.nomeVendedor)?.charAt(0)}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[12px] font-medium text-[var(--ink)] truncate">
                              {s.apelido ?? s.nomeVendedor?.split(' ')[0]}
                            </span>
                            {isEu && <span className="text-[13px] bg-[var(--acc)] text-white px-1.5 py-0.5 rounded-full">Voce</span>}
                            <span className="text-[12px] text-[var(--ink-ghost)] ml-auto">
                              {fmt.currency(s.faturamento ?? 0)}
                            </span>
                          </div>
                          {/* Barras de componentes */}
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <div>
                              <div className="text-[13px] text-[var(--ink-ghost)] mb-0.5">Meta</div>
                              <ScoreBar valor={s.scoreMeta ?? 0} cor="bg-blue-400" />
                            </div>
                            <div>
                              <div className="text-[13px] text-[var(--ink-ghost)] mb-0.5">PA</div>
                              <ScoreBar valor={s.scorePA ?? 0} cor="bg-[var(--acc)]" />
                            </div>
                            <div>
                              <div className="text-[13px] text-[var(--ink-ghost)] mb-0.5">TM</div>
                              <ScoreBar valor={s.scoreTM ?? 0} cor="bg-green-400" />
                            </div>
                            <div>
                              <div className="text-[13px] text-[var(--ink-ghost)] mb-0.5">PA1 inverso</div>
                              <ScoreBar valor={s.scorePA1 ?? 0} cor="bg-amber-400" />
                            </div>
                          </div>
                        </div>
                        {/* Score total */}
                        <ScoreCircle score={s.score ?? 0} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* â•â•â• ABA HISTÃ“RICO â•â•â• */}
        {aba === 'historico' && (
          <>
            {historico.length === 0 ? (
              <Card>
                <div className="py-10 flex flex-col items-center gap-3 text-center">
                  <BarChart3 className="w-8 h-8 text-[var(--ink-ghost)]" />
                  <div className="text-[13px] font-medium text-[var(--ink)]">Nenhum snapshot salvo</div>
                  <div className="text-[13px] text-[var(--ink-ghost)]">
                    Clique em "Salvar snapshot" para registrar o score de hoje
                  </div>
                </div>
              </Card>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      {['Data','Vendedora','Score','Meta','PA','TM','PA1','Faturamento'].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-[12px] font-medium text-[var(--ink-ghost)] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historico.map((h, i) => {
                      const score = Number(h.SCORE_TOTAL) || 0
                      return (
                      <tr key={i} className="border-b border-[var(--border)] hover:bg-[var(--bg-subtle)] transition-colors">
                        <td className="py-2.5 px-3 text-[13px] text-[var(--ink-ghost)]">{h.DATA_REF}</td>
                        <td className="py-2.5 px-3 text-[13px] font-medium text-[var(--ink)]">{h.NOME_VENDEDOR?.split(' ')[0]}</td>
                        <td className="py-2.5 px-3">
                          <span className={cn('text-[13px] font-bold',
                            score >= 80 ? 'text-[var(--success)]' :
                            score >= 60 ? 'text-amber-600' : 'text-[var(--danger)]')}>
                            {score.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[13px] text-[var(--ink-ghost)]">{(Number(h.SCORE_META) || 0).toFixed(0)}</td>
                        <td className="py-2.5 px-3 text-[13px] text-[var(--ink-ghost)]">{(Number(h.SCORE_PA) || 0).toFixed(0)}</td>
                        <td className="py-2.5 px-3 text-[13px] text-[var(--ink-ghost)]">{(Number(h.SCORE_TM) || 0).toFixed(0)}</td>
                        <td className="py-2.5 px-3 text-[13px] text-[var(--ink-ghost)]">{(Number(h.SCORE_PA1) || 0).toFixed(0)}</td>
                        <td className="py-2.5 px-3 text-[13px] text-[var(--ink-ghost)]">{fmt.currency(Number(h.FATURAMENTO) || 0)}</td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* â•â•â• ABA CONFIG â•â•â• */}
        {aba === 'config' && (
          <Card padding="sm">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4 text-[var(--acc)]" />
              <span className="text-[12px] font-medium text-[var(--ink)]">Pesos da formula do Score</span>
            </div>
            <div className="text-[13px] text-[var(--ink-ghost)] mb-4 leading-relaxed">
              A soma dos pesos deve ser 100%. O score final vai de 0 a 100.
            </div>

            <div className="flex flex-col gap-4">
              {[
                { key:'pesoMeta', label:'Meta de Faturamento', desc:'% do atingimento da meta mensal', cor:'bg-blue-400' },
                { key:'pesoPa',   label:'PA (Pecas por Atendimento)', desc:'% do atingimento da meta de PA', cor:'bg-[var(--acc)]' },
                { key:'pesoTm',   label:'TM (Ticket Medio)', desc:'% do atingimento da meta de TM', cor:'bg-green-400' },
                { key:'pesoPa1',  label:'PA1 Inverso', desc:'Quanto menor o PA1, maior o score', cor:'bg-amber-400' },
              ].map(p => (
                <div key={p.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="text-[13px] font-medium text-[var(--ink)]">{p.label}</span>
                      <div className="text-[12px] text-[var(--ink-ghost)]">{p.desc}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" min="0" max="100" step="5"
                        value={(config as any)[p.key]}
                        onChange={e => setConfig(c => ({ ...c, [p.key]: parseInt(e.target.value) }))}
                        className="w-16 h-8 px-2 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg text-[12px] text-center focus:outline-none focus:border-[var(--acc)]" />
                      <span className="text-[13px] text-[var(--ink-ghost)]">%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', p.cor)}
                      style={{ width: `${(config as any)[p.key]}%` }} />
                  </div>
                </div>
              ))}

              <div className="pt-2 border-t border-[var(--border)]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[13px] font-medium text-[var(--ink)]">PA1 ideal (referencia)</span>
                    <div className="text-[12px] text-[var(--ink-ghost)]">Abaixo deste valor = score PA1 maximo</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" max="100" step="5"
                      value={config.pa1Ideal}
                      onChange={e => setConfig(c => ({ ...c, pa1Ideal: parseInt(e.target.value) }))}
                      className="w-16 h-8 px-2 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg text-[12px] text-center focus:outline-none focus:border-[var(--acc)]" />
                    <span className="text-[13px] text-[var(--ink-ghost)]">%</span>
                  </div>
                </div>

                {/* Total dos pesos */}
                <div className={cn('flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium',
                  config.pesoMeta+config.pesoPa+config.pesoTm+config.pesoPa1 === 100
                    ? 'bg-green-50 text-[var(--success)]'
                    : 'bg-red-50 text-[var(--danger)]')}>
                  <span>Total dos pesos</span>
                  <span>{config.pesoMeta+config.pesoPa+config.pesoTm+config.pesoPa1}%
                    {config.pesoMeta+config.pesoPa+config.pesoTm+config.pesoPa1 !== 100 && ' âš  deve ser 100%'}
                  </span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={salvarConfig}
                disabled={salvando || config.pesoMeta+config.pesoPa+config.pesoTm+config.pesoPa1 !== 100}
                loading={salvando}
              >
                {!salvando && <Save className="w-4 h-4" />}
                {salvando ? 'Salvando...' : 'Salvar configuracao'}
              </Button>
            </div>
          </Card>
        )}
    </DashboardLayout>
  )
}

