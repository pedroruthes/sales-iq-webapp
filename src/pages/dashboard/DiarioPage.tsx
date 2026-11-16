import { useState, useEffect, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  BookOpen, Plus, X, Save, Trash2, Edit2, Sparkles,
  Building2, ChevronDown, Filter, TrendingUp, TrendingDown,
  Minus, Calendar, Tag, AlertTriangle, CheckCircle
} from 'lucide-react'
import { DashboardLayout }  from '@/components/layout'
import { Card, SectionTitle, Badge, FiltroBar, Button, type Periodo } from '@/components/ui'
import { useContentLoading, useCurrentUser } from '@/hooks/useSession'
import { useFiliais }       from '@/hooks/useFiliais'
import { CATEGORIAS, IMPACTOS, GRUPOS_CATEGORIA, type EntradaDiario } from '@/lib/diario-constantes'
import { getMesAtual, fmt, cn } from '@/lib/utils'
import axios from 'axios'

const COR_CATEGORIA = Object.fromEntries(CATEGORIAS.map(c => [c.value, c.cor]))
const LABEL_CATEGORIA = Object.fromEntries(CATEGORIAS.map(c => [c.value, c.label]))

const selectChevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")"

export default function DiarioPage() {
  const user    = useCurrentUser()
  const { data: filiais, isLoading: lFiliais } = useFiliais()

  const [periodo,      setPeriodo]      = useState<Periodo>({ label: 'Mês atual', ...getMesAtual() })
  const [filialFiltro, setFilialFiltro] = useState<string>('todas')
  const [catFiltro,    setCatFiltro]    = useState<string>('todas')
  const [menuFilial,   setMenuFilial]   = useState(false)
  const [entradas,     setEntradas]     = useState<EntradaDiario[]>([])
  const [loading,      setLoading]      = useState(true)
  const [insight,      setInsight]      = useState<string | null>(null)
  const [gerandoIA,    setGerandoIA]    = useState(false)

  // Formulário
  const [mostraForm,  setMostraForm]  = useState(false)
  const [editando,    setEditando]    = useState<EntradaDiario | null>(null)
  const [salvando,    setSalvando]    = useState(false)
  const [erroForm,    setErroForm]    = useState('')
  const formVazio = () => ({
    codigoFilial:    user.filialPadrao ?? '',
    dataAcao:        format(new Date(), 'yyyy-MM-dd'),
    dataFim:         '',
    categoria:       'PROMOCAO',
    subcategoria:    '',
    titulo:          '',
    descricao:       '',
    impactoEsperado: 'POSITIVO',
  })
  const [form, setForm] = useState(formVazio)
  const dataFimInvalida = !!form.dataFim && form.dataFim < form.dataAcao

  const carregarEntradas = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {
        inicio: format(periodo.inicio, 'yyyy-MM-dd'),
        fim:    format(periodo.fim,    'yyyy-MM-dd'),
      }
      if (filialFiltro !== 'todas') params.filial = filialFiltro
      if (catFiltro !== 'todas')    params.categoria = catFiltro
      const { data } = await axios.get('/api/diario', { params })
      setEntradas(data.data ?? [])
    } catch {}
    setLoading(false)
  }, [periodo, filialFiltro, catFiltro])

  useEffect(() => { carregarEntradas() }, [carregarEntradas])

  const mensagemErro = (err: any, padrao: string) => {
    const status = err?.response?.status
    const msg = err?.response?.data?.error
    if (status === 401) return 'Sessão expirada. Entre novamente.'
    if (msg === 'Sem permissao') return 'Você não tem acesso a esta loja.'
    return msg ?? padrao
  }

  const fecharForm = () => {
    setMostraForm(false)
    setEditando(null)
    setErroForm('')
    setForm(formVazio())
  }

  const salvar = async () => {
    if (!form.titulo.trim() || !form.descricao.trim() || dataFimInvalida) return
    setSalvando(true)
    setErroForm('')
    try {
      if (editando) {
        await axios.put('/api/diario', {
          id: editando.ID, codigoFilialOriginal: editando.CODIGO_FILIAL, ...form,
        })
      } else {
        await axios.post('/api/diario', form)
      }
      fecharForm()
      carregarEntradas()
    } catch (err) {
      setErroForm(mensagemErro(err, 'Não foi possível salvar a anotação'))
    }
    setSalvando(false)
  }

  const deletar = async (e: EntradaDiario) => {
    if (!confirm('Excluir esta anotação?')) return
    try {
      await axios.delete('/api/diario', { data: { id: e.ID, codigoFilial: e.CODIGO_FILIAL } })
      if (editando?.ID === e.ID) fecharForm()
    } catch (err) {
      alert(mensagemErro(err, 'Não foi possível excluir a anotação'))
    }
    carregarEntradas()
  }

  const editarEntrada = (e: EntradaDiario) => {
    setForm({
      codigoFilial:    e.CODIGO_FILIAL.trim(),
      dataAcao:        e.DATA_ACAO,
      dataFim:         e.DATA_FIM ?? '',
      categoria:       e.CATEGORIA,
      subcategoria:    e.SUBCATEGORIA ?? '',
      titulo:          e.TITULO,
      descricao:       e.DESCRICAO,
      impactoEsperado: e.IMPACTO_ESPERADO ?? 'NEUTRO',
    })
    setEditando(e)
    setErroForm('')
    setMostraForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const podeAlterar = (e: EntradaDiario) =>
    user.isProprietario || String(e.ID_USUARIO) === String(user.id)

  const gerarInsight = async () => {
    if (!entradas.length) return
    setGerandoIA(true)
    setInsight(null)
    try {
      const { data } = await axios.post('/api/diario/insights', { entradas })
      setInsight(data.insight)
    } catch {}
    setGerandoIA(false)
  }

  // Agrupar por data
  const porData = entradas.reduce((acc, e) => {
    const key = e.DATA_ACAO
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {} as Record<string, EntradaDiario[]>)

  const datas = Object.keys(porData).sort((a, b) => b.localeCompare(a))

  // Resumo por categoria
  const resumoCat = CATEGORIAS.map(cat => ({
    ...cat,
    total: entradas.filter(e => e.CATEGORIA === cat.value).length,
  })).filter(c => c.total > 0)

  const filiaisUsuario = new Set(user.filiais.map(f => f.trim()))
  const filiaisAcessiveis = (filiais ?? [])
    .map(f => ({ ...f, COD_FILIAL: f.COD_FILIAL.trim() }))
    .filter(f => user.isAdmin || filiaisUsuario.has(f.COD_FILIAL))

  const pageLoading = useContentLoading({
    filiaisLoading: lFiliais,
    waiting: [loading],
  })

  return (
    <DashboardLayout
      titulo="Diário de ações"
      subtitulo="Registro de ações e aprendizados"
      loading={pageLoading}
      actions={
        <>
          {user.isProprietario && (
            <div className="relative">
              <button type="button" onClick={() => setMenuFilial(!menuFilial)}
                className="filter-trigger">
                <Building2 className="w-3.5 h-3.5 text-[var(--ink-ghost)]" />
                <span className="max-w-[130px] truncate">
                  {filialFiltro === 'todas' ? 'Todas as lojas' : filiais?.find(f => f.COD_FILIAL === filialFiltro)?.FILIAL ?? filialFiltro}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--ink-ghost)]" />
              </button>
              {menuFilial && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuFilial(false)} />
                  <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-[var(--border)] rounded-xl py-1 shadow-lg z-20 max-h-60 overflow-y-auto">
                    <button onClick={() => { setFilialFiltro('todas'); setMenuFilial(false) }}
                      className={cn('w-full px-3 py-2 text-[13px] text-left', filialFiltro === 'todas' ? 'bg-[var(--acc-pale)] text-[var(--acc)]' : 'text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)]')}>
                      Todas as lojas
                    </button>
                    {filiaisAcessiveis.map(f => (
                      <button key={f.COD_FILIAL} onClick={() => { setFilialFiltro(f.COD_FILIAL); setMenuFilial(false) }}
                        className={cn('flex items-center justify-between w-full px-3 py-2 text-[13px] text-left', filialFiltro === f.COD_FILIAL ? 'bg-[var(--acc-pale)] text-[var(--acc)]' : 'text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)]')}>
                        <span>{f.FILIAL}</span>
                        <span className="text-[13px] text-[var(--ink-ghost)]">{f.COD_FILIAL}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <select value={catFiltro} onChange={e => setCatFiltro(e.target.value)}
            style={{ backgroundImage: selectChevron }}
            className="select-base !w-auto min-w-[180px]">
            <option value="todas">Todas as categorias</option>
            {GRUPOS_CATEGORIA.map(g => (
              <optgroup key={g} label={g}>
                {CATEGORIAS.filter(c => c.grupo === g).map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </optgroup>
            ))}
          </select>

          <FiltroBar periodo={periodo} onPeriodoChange={setPeriodo} />

          {entradas.length > 0 && (
            <Button variant="secondary" size="lg" onClick={gerarInsight} disabled={gerandoIA} loading={gerandoIA}>
              {!gerandoIA && <Sparkles className="w-4 h-4" />}
              {gerandoIA ? 'Analisando...' : 'Gerar insight com IA'}
            </Button>
          )}

          <Button
            variant={mostraForm ? 'secondary' : 'primary'}
            size="lg"
            onClick={() => (mostraForm ? fecharForm() : setMostraForm(true))}
          >
            {mostraForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {mostraForm ? 'Cancelar' : 'Nova anotação'}
          </Button>
        </>
      }
    >
        {/* Insight da IA */}
        {(insight || gerandoIA) && (
          <div className="bg-gradient-to-br from-[var(--acc-pale)] to-white border border-[var(--acc-border)] rounded-[14px] p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[var(--acc)] flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[12px] font-medium text-[var(--acc)]">Insights das anotações</span>
              <button onClick={() => setInsight(null)} className="ml-auto text-[var(--ink-ghost)] hover:text-[var(--ink-faint)]">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {gerandoIA
              ? <div className="text-[13px] text-[var(--ink-ghost)] animate-pulse">Analisando {entradas.length} anotações...</div>
              : <div className="text-[13px] text-[var(--ink-muted)] leading-relaxed whitespace-pre-wrap">{insight}</div>
            }
          </div>
        )}

        {/* Formulário de nova anotação */}
        {mostraForm && (
          <Card padding="sm">
            <SectionTitle label={editando ? 'Editar anotação' : 'Nova anotação'} icon={BookOpen} />
            <div className="grid grid-cols-2 gap-4">
              {/* Coluna esquerda */}
              <div className="flex flex-col gap-3">
                {/* Filial */}
                <div>
                  <label className="text-[12px] text-[var(--ink-ghost)] uppercase tracking-wide mb-1 block">Loja *</label>
                  <select value={form.codigoFilial} onChange={e => setForm(f => ({ ...f, codigoFilial: e.target.value }))}
                    style={{ backgroundImage: selectChevron }}
                    className="select-base">
                    <option value="">Selecionar loja</option>
                    {filiaisAcessiveis.map(f => (
                      <option key={f.COD_FILIAL} value={f.COD_FILIAL}>{f.FILIAL}</option>
                    ))}
                  </select>
                </div>

                {/* Período */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] text-[var(--ink-ghost)] uppercase tracking-wide mb-1 block">Data de início *</label>
                    <input type="date" value={form.dataAcao}
                      onChange={e => setForm(f => ({ ...f, dataAcao: e.target.value }))}
                      className="input-base" />
                  </div>
                  <div>
                    <label className="text-[12px] text-[var(--ink-ghost)] uppercase tracking-wide mb-1 block">Data final</label>
                    <input type="date" value={form.dataFim} min={form.dataAcao}
                      onChange={e => setForm(f => ({ ...f, dataFim: e.target.value }))}
                      className={cn('input-base', dataFimInvalida && '!border-[var(--danger)]')} />
                  </div>
                  <span className={cn('col-span-2 text-[11px] -mt-1',
                    dataFimInvalida ? 'text-[var(--danger)]' : 'text-[var(--ink-ghost)]')}>
                    {dataFimInvalida
                      ? 'A data final não pode ser anterior à data de início'
                      : 'Deixe a data final vazia para ações de um único dia'}
                  </span>
                </div>

                {/* Categoria */}
                <div>
                  <label className="text-[12px] text-[var(--ink-ghost)] uppercase tracking-wide mb-1 block">Categoria *</label>
                  <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                    style={{ backgroundImage: selectChevron }}
                    className="select-base">
                    {GRUPOS_CATEGORIA.map(g => (
                      <optgroup key={g} label={g}>
                        {CATEGORIAS.filter(c => c.grupo === g).map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Impacto esperado */}
                <div>
                  <label className="text-[12px] text-[var(--ink-ghost)] uppercase tracking-wide mb-1 block">Impacto esperado</label>
                  <div className="flex gap-2">
                    {IMPACTOS.map(imp => (
                      <button key={imp.value} onClick={() => setForm(f => ({ ...f, impactoEsperado: imp.value }))}
                        className={cn('flex-1 h-9 rounded-lg text-[13px] font-medium border transition-colors',
                          form.impactoEsperado === imp.value
                            ? 'text-white border-transparent'
                            : 'bg-white border-[var(--border)] text-[var(--ink-ghost)] hover:border-[var(--acc-border)]'
                        )}
                        style={form.impactoEsperado === imp.value ? { background: imp.cor } : {}}>
                        {imp.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Coluna direita */}
              <div className="flex flex-col gap-3">
                {/* Título */}
                <div>
                  <label className="text-[12px] text-[var(--ink-ghost)] uppercase tracking-wide mb-1 block">Título *</label>
                  <input type="text" value={form.titulo}
                    onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                    placeholder="Ex: Promoção relâmpago de calças femininas"
                    className="input-base" />
                </div>

                {/* Descrição */}
                <div className="flex-1">
                  <label className="text-[12px] text-[var(--ink-ghost)] uppercase tracking-wide mb-1 block">O que foi feito? *</label>
                  <textarea value={form.descricao}
                    onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                    rows={5}
                    placeholder="Descreva a ação em detalhes: o que foi feito, por quê, como foi executado, resultado observado..."
                    className="input-base !h-auto py-3 resize-none leading-relaxed" />
                </div>

                {erroForm && (
                  <div className="flex items-center gap-2 text-[12px] text-[var(--danger)]">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {erroForm}
                  </div>
                )}

                {/* Botão salvar */}
                <Button
                  variant="primary"
                  size="lg"
                  onClick={salvar}
                  disabled={salvando || !form.titulo.trim() || !form.descricao.trim() || !form.codigoFilial || dataFimInvalida}
                  loading={salvando}
                >
                  {!salvando && <Save className="w-4 h-4" />}
                  {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Registrar anotação'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Resumo por categoria */}
        {resumoCat.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] text-[var(--ink-ghost)]">{entradas.length} anotações:</span>
            {resumoCat.map(cat => (
              <button key={cat.value}
                onClick={() => setCatFiltro(catFiltro === cat.value ? 'todas' : cat.value)}
                className={cn('flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full border transition-colors font-medium',
                  catFiltro === cat.value ? 'text-white border-transparent' : 'bg-white border-[var(--border)] text-[var(--ink-muted)] hover:border-[var(--border)]'
                )}
                style={catFiltro === cat.value ? { background: cat.cor } : { borderColor: cat.cor + '44' }}>
                <span style={{ color: catFiltro === cat.value ? 'white' : cat.cor }}>●</span>
                {cat.label} ({cat.total})
              </button>
            ))}
          </div>
        )}

        {/* Timeline de anotações */}
        {datas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <BookOpen className="w-10 h-10 text-[var(--ink-ghost)] opacity-30" />
            <p className="text-[13px] text-[var(--ink-ghost)]">Nenhuma anotação no período</p>
            <button onClick={() => setMostraForm(true)}
              className="flex items-center gap-1.5 text-[13px] text-[var(--acc)] hover:underline">
              <Plus className="w-3.5 h-3.5" /> Fazer a primeira anotação
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {datas.map(data => {
              const itens = porData[data]
              const dtObj = parseISO(data)
              const diaSemana = format(dtObj, 'EEEE', { locale: ptBR })
              const dataFormatada = format(dtObj, "dd 'de' MMMM", { locale: ptBR })
              const isHoje = data === format(new Date(), 'yyyy-MM-dd')

              return (
                <div key={data}>
                  {/* Cabeçalho do dia */}
                  <div className="flex items-center gap-3 py-2 sticky top-0 bg-[var(--bg-page)] z-10">
                    <div className={cn('text-[12px] font-medium uppercase tracking-wide',
                      isHoje ? 'text-[var(--acc)]' : 'text-[var(--ink-ghost)]')}>
                      {isHoje ? 'Hoje' : diaSemana} · {dataFormatada}
                    </div>
                    <div className="flex-1 h-px bg-[var(--border)]" />
                    <span className="text-[13px] text-[var(--ink-ghost)]">{itens.length} anotação{itens.length > 1 ? 'ões' : ''}</span>
                  </div>

                  {/* Cards do dia */}
                  <div className="grid grid-cols-2 gap-3 pb-2">
                    {itens.map(entrada => {
                      const cor  = COR_CATEGORIA[entrada.CATEGORIA] ?? '#94a3b8'
                      const catLabel = LABEL_CATEGORIA[entrada.CATEGORIA] ?? entrada.CATEGORIA
                      const possuiFat = entrada.FAT_DIA && entrada.FAT_DIA > 0
                      const varFat = entrada.FAT_DIA_ANT && entrada.FAT_DIA_ANT > 0
                        ? ((entrada.FAT_DIA! - entrada.FAT_DIA_ANT) / entrada.FAT_DIA_ANT) * 100
                        : null

                      return (
                        <div key={entrada.ID}
                          className="bg-white border border-[var(--border)] rounded-[14px] p-4 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card2)] transition-all relative overflow-hidden group">

                          {/* Barra de cor da categoria */}
                          <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[14px]"
                            style={{ background: cor }} />

                          {/* Header do card */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[13px] font-medium px-2 py-0.5 rounded-full"
                                style={{ background: cor + '20', color: cor }}>
                                {catLabel}
                              </span>
                              {entrada.IMPACTO_ESPERADO && entrada.IMPACTO_ESPERADO !== 'NEUTRO' && (
                                entrada.IMPACTO_ESPERADO === 'POSITIVO'
                                  ? <TrendingUp className="w-3.5 h-3.5 text-[var(--success)]" />
                                  : <TrendingDown className="w-3.5 h-3.5 text-[var(--danger)]" />
                              )}
                              {user.isProprietario && (
                                <span className="text-[13px] text-[var(--ink-ghost)]">{entrada.NOME_FILIAL}</span>
                              )}
                            </div>

                            {/* Ações — aparecem no hover */}
                            {podeAlterar(entrada) && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => editarEntrada(entrada)}
                                className="w-6 h-6 flex items-center justify-center text-[var(--ink-ghost)] hover:text-[var(--acc)] hover:bg-[var(--acc-pale)] rounded-lg transition-colors">
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button onClick={() => deletar(entrada)}
                                className="w-6 h-6 flex items-center justify-center text-[var(--ink-ghost)] hover:text-[var(--danger)] hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            )}
                          </div>

                          {/* Título */}
                          <h3 className="text-[13px] font-medium text-[var(--ink)] mb-1.5 leading-snug">{entrada.TITULO}</h3>
                          {entrada.DATA_FIM && (
                            <div className="flex items-center gap-1 text-[12px] text-[var(--ink-ghost)] mb-1.5">
                              <Calendar className="w-3 h-3" />
                              {format(parseISO(entrada.DATA_ACAO), 'dd/MM')} a {format(parseISO(entrada.DATA_FIM), 'dd/MM/yyyy')}
                              {' · '}{entrada.DIAS_ACAO} dias
                            </div>
                          )}

                          {/* Descrição */}
                          <p className="text-[13px] text-[var(--ink-muted)] leading-relaxed line-clamp-3 mb-3">{entrada.DESCRICAO}</p>

                          {/* Footer */}
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] text-[var(--ink-ghost)]">
                              por {entrada.NOME_USUARIO}
                              {entrada.EDITADO_EM && ' · editado'}
                            </span>

                            {/* Faturamento do dia */}
                            {possuiFat && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[13px] text-[var(--ink-ghost)]">{entrada.DATA_FIM ? 'Fat. período:' : 'Fat. dia:'}</span>
                                <span className="text-[12px] font-medium text-[var(--ink)]">{fmt.currencyShort(entrada.FAT_DIA!)}</span>
                                {varFat !== null && (
                                  <span className={cn('text-[13px] font-medium flex items-center gap-0.5',
                                    varFat >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]')}>
                                    {varFat >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                    {varFat >= 0 ? '+' : ''}{fmt.percent(varFat, 0)} {entrada.DATA_FIM ? 'vs período ant.' : 'vs sem. ant.'}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
    </DashboardLayout>
  )
}
