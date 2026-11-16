import { useState, useEffect } from 'react'
import { format, subDays, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Heart, Moon, Crown, Cake, Users, MessageCircle,
  Mail, Send, ChevronDown, Filter, Sparkles,
  Phone, Star, TrendingDown, Gift, CheckCircle,
  Clock, AlertTriangle, Copy, Edit2, X
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Card, SectionTitle, Badge } from '@/components/ui'
import { useContentLoading, useCurrentUser } from '@/hooks/useSession'
import { useFiliais }     from '@/hooks/useFiliais'
import { fmt, cn, upperNome } from '@/lib/utils'
import axios              from 'axios'
import { MetaContatoRetorno } from '@/features/crm/components/MetaContatoRetorno'
import { CrmModelosPanel, type CrmModelo } from '@/features/crm/components/CrmModelosPanel'
import {
  DiasSemCompraFilter,
  DEFAULT_DIAS_RANGE,
  labelDiasRange,
  type DiasRange,
} from '@/features/clientes/components/DiasSemCompraFilter'

type AbaId = 'aniversariantes' | 'dormentes' | 'vip' | 'reativacao' | 'modelos'

interface Cliente {
  CODIGO_CLIENTE: string; CLIENTE_VAREJO: string; FILIAL: string
  DDD_CELULAR: string; CELULAR: string; EMAIL: string | null
  ULTIMA_COMPRA: string | null; DIAS_SEM_COMPRA: number | null
  CONCEITO: string | null; TIPO_VAREJO: string | null
  MES_ANIV?: number; DIA_ANIV?: number
  totalGasto?: number; totalCompras?: number
}

// â”€â”€ Componente de linha de cliente â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ClienteRow({
  c, modelo, loja, codigoFilial, origem, jaContatado, onContato,
}: {
  c: Cliente
  modelo?: string
  loja?: string
  codigoFilial?: string
  origem: string
  jaContatado?: boolean
  onContato?: (canal: 'whatsapp' | 'email') => void
}) {
  const temFone = c.DDD_CELULAR || c.CELULAR
  const nome1   = c.CLIENTE_VAREJO.split(' ')[0]
  const waNro   = `55${c.DDD_CELULAR ?? ''}${c.CELULAR ?? ''}`

  const textoFinal = (modelo ?? '')
    .replace(/{nome}/g,  nome1)
    .replace(/{loja}/g,  loja ?? 'nossa loja')
    .replace(/{dias}/g,  String(c.DIAS_SEM_COMPRA ?? ''))
    .replace(/{desconto}/g, '15')
    .replace(/{data}/g,  format(new Date(), "dd/MM", { locale: ptBR }))
    .replace(/{hora}/g,  '14h')
    .replace(/{telefone_loja}/g, '')

  const msgEnc   = encodeURIComponent(textoFinal)
  const assunto  = encodeURIComponent(`Ola ${nome1}!`)
  const corpoEnc = encodeURIComponent(textoFinal)

  const sev = (c.DIAS_SEM_COMPRA ?? 0) > 180 ? 'danger'
            : (c.DIAS_SEM_COMPRA ?? 0) > 90  ? 'warn' : 'neutral'

  const registrarEAbrir = async (canal: 'whatsapp' | 'email', url: string) => {
    if (codigoFilial && c.CODIGO_CLIENTE) {
      try {
        await axios.post('/api/crm/contatos', {
          codigoFilial,
          codigoCliente: c.CODIGO_CLIENTE,
          canal,
          origem,
        })
        onContato?.(canal)
      } catch { /* não bloqueia o contato */ }
    }
    window.open(url, '_blank')
  }

  return (
    <div className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-subtle)] -mx-1 px-1 rounded-lg transition-colors">
      <div className="w-7 h-7 rounded-full bg-[var(--acc-pale)] flex items-center justify-center text-[12px] font-medium text-[var(--acc)] shrink-0">
        {upperNome(c.CLIENTE_VAREJO).charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-[13px] font-medium text-[var(--ink)] truncate">{upperNome(c.CLIENTE_VAREJO)}</div>
          {jaContatado && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 shrink-0">
              já contatado
            </span>
          )}
        </div>
        <div className="text-[13px] text-[var(--ink-ghost)] flex items-center gap-2">
          {c.DIAS_SEM_COMPRA !== null && (
            <span className={cn(sev === 'danger' ? 'text-[var(--danger)]' : sev === 'warn' ? 'text-[var(--warn)]' : '')}>
              {c.DIAS_SEM_COMPRA}d sem comprar
            </span>
          )}
          {c.CONCEITO && <span>· {c.CONCEITO}</span>}
          {c.totalGasto && <span>· {fmt.currencyShort(c.totalGasto)}</span>}
          {c.MES_ANIV && <span>· aniv: {c.DIA_ANIV}/{c.MES_ANIV}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {temFone && (
          <button
            onClick={() => registrarEAbrir('whatsapp', `https://wa.me/${waNro}?text=${msgEnc}`)}
            title="WhatsApp"
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
          </button>
        )}
        {c.EMAIL && (
          <button
            onClick={() => registrarEAbrir('email', `mailto:${c.EMAIL}?subject=${assunto}&body=${corpoEnc}`)}
            title="E-mail"
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--acc-pale)] hover:bg-[var(--acc)] hover:text-white text-[var(--acc)] transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

// â”€â”€ Pagina principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function CRMPage() {
  const user = useCurrentUser()
  const { data: filiais, isLoading: lFiliais } = useFiliais()
  const [aba,         setAba]         = useState<AbaId>('aniversariantes')
  const [filialSel,   setFilialSel]   = useState('todas')
  const [menuFilial,  setMenuFilial]  = useState(false)
  const [clientes,    setClientes]    = useState<Cliente[]>([])
  const [loading,     setLoading]     = useState(true)
  const [modeloSel,   setModeloSel]   = useState<CrmModelo | null>(null)
  const [modelosLoja, setModelosLoja] = useState<CrmModelo[]>([])
  const [diasRange,   setDiasRange]   = useState<DiasRange>({
    ...DEFAULT_DIAS_RANGE,
    presetId: '90',
    diasMin: 90,
  })
  const [kpis,        setKpis]        = useState<any>(null)
  const [kpisReady,   setKpisReady]   = useState(false)
  const [contatados,  setContatados]  = useState<Set<string>>(new Set())
  const [versaoMetas, setVersaoMetas] = useState(0)

  const filiaisAcess = (filiais ?? []).filter(f => user.filiais.map(x=>x.trim()).includes(f.COD_FILIAL.trim()))
  const filiaisParam = filialSel === 'todas' ? user.filiais : [filialSel]
  const nomeFilial   = filiaisAcess.find(f => f.COD_FILIAL === filialSel)?.FILIAL ?? 'todas as lojas'

  const resolverCodFilial = (c: Cliente) => {
    if (filialSel !== 'todas') return filialSel
    const byName = filiaisAcess.find(f =>
      String(f.FILIAL || '').trim().toLowerCase() === String(c.FILIAL || '').trim().toLowerCase()
    )
    return byName?.COD_FILIAL ?? filiaisParam[0] ?? ''
  }

  const origemAba =
    aba === 'aniversariantes' ? 'aniversariantes'
    : aba === 'dormentes' ? 'dormentes'
    : aba === 'reativacao' ? 'reativacao'
    : 'vip'

  // Carregar KPIs CRM do mês
  useEffect(() => {
    if (!filiaisParam.length) {
      setKpisReady(true)
      return
    }
    setKpisReady(false)
    Promise.all([
      axios.get('/api/crm/kpis', { params: { filiais: filiaisParam.join(',') } })
        .then(r => setKpis(r.data))
        .catch(() => setKpis(null)),
      axios.get('/api/crm/contatos', { params: { filiais: filiaisParam.join(','), dias: 7 } })
        .then(r => setContatados(new Set((r.data.data ?? []).map((x: string) => String(x).trim()))))
        .catch(() => setContatados(new Set())),
    ]).finally(() => setKpisReady(true))
  }, [filiaisParam.join(',')])

  // Carregar clientes conforme a aba
  useEffect(() => {
    if (aba === 'modelos') return
    setLoading(true)
    setClientes([])
    const params: any = { filiais: filiaisParam.join(',') }

    let endpoint = ''
    if (aba === 'aniversariantes') { endpoint = '/api/clientes/aniversariantes'; params.janela = 'mes' }
    else if (aba === 'dormentes' || aba === 'reativacao') {
      endpoint = '/api/clientes/dormentes'
      params.diasMin = diasRange.diasMin
      params.diasMax = diasRange.diasMax
    }
    else if (aba === 'vip')        { endpoint = '/api/crm/vip' }

    if (!endpoint) { setLoading(false); return }

    axios.get(endpoint, { params })
      .then(r => setClientes(r.data.data ?? []))
      .catch(() => setClientes([]))
      .finally(() => setLoading(false))
  }, [aba, filialSel, diasRange.diasMin, diasRange.diasMax, diasRange.presetId, filiaisParam.join(',')])

  // Carrega modelos da loja selecionada (ou da primeira) para campanhas
  useEffect(() => {
    const filial = filialSel !== 'todas' ? filialSel : (filiaisParam[0] ?? '')
    if (!filial) {
      setModelosLoja([])
      return
    }
    axios.get('/api/crm/modelos', { params: { filiais: filial } })
      .then((r) => setModelosLoja(r.data.data ?? []))
      .catch(() => setModelosLoja([]))
  }, [filialSel, filiaisParam.join(',')])

  // Modelo sugerido por aba a partir dos cadastrados na loja
  useEffect(() => {
    if (aba === 'modelos') return
    const tipoPreferido =
      aba === 'aniversariantes' ? 'aniversario'
      : aba === 'dormentes' || aba === 'reativacao' ? 'reativacao'
      : aba === 'vip' ? 'vip'
      : null
    if (!tipoPreferido) return
    const match = modelosLoja.find((m) => m.tipo === tipoPreferido)
    setModeloSel(match ?? modelosLoja[0] ?? null)
  }, [aba, modelosLoja])

  const r = kpis?.resumo
  const pctMeta = r?.percentualMetaContatos
  const pctFat = r?.percentualFatReativados
  const corMeta = pctMeta == null ? 'text-[var(--ink)]'
    : pctMeta >= 100 ? 'text-[var(--success)]'
    : pctMeta >= 80 ? 'text-[var(--acc)]'
    : 'text-[var(--danger)]'

  const ABAS: { id: AbaId; label: string; icon: any; desc: string; cor: string }[] = [
    { id: 'aniversariantes', label: 'Aniversariantes',  icon: Cake,          desc: 'Parabéns e ofertas especiais', cor: 'text-pink-600' },
    { id: 'dormentes',       label: 'Inativos',         icon: Moon,          desc: 'Clientes sem compra recente',  cor: 'text-amber-600' },
    { id: 'reativacao',      label: 'Reativação',       icon: TrendingDown,  desc: 'Recuperar clientes perdidos',  cor: 'text-red-600' },
    { id: 'vip',             label: 'Clientes VIP',     icon: Crown,         desc: 'Melhores compradores',         cor: 'text-purple-600' },
    { id: 'modelos',         label: 'Modelos de msg',   icon: MessageCircle, desc: 'Mensagens prontas para usar',  cor: 'text-[var(--acc)]' },
  ]

  const pageLoading = useContentLoading({
    filiaisLoading: lFiliais,
    filiaisQuery: filiaisParam,
    waiting: [
      !kpisReady,
      ...(aba !== 'modelos' ? [loading] : []),
    ],
  })

  return (
    <DashboardLayout
      titulo="CRM"
      subtitulo="Relacionamento e comunicação com clientes"
      loading={pageLoading}
      actions={
        <div className="relative">
          <button type="button" onClick={() => setMenuFilial(!menuFilial)}
            className="filter-trigger">
            <span className="max-w-[140px] truncate">
              {filialSel === 'todas' ? 'Todas as lojas' : nomeFilial}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--ink-ghost)]" />
          </button>
          {menuFilial && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuFilial(false)} />
              <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-[var(--border)] rounded-xl py-1 shadow-lg z-20 max-h-60 overflow-y-auto">
                <button onClick={() => { setFilialSel('todas'); setMenuFilial(false) }}
                  className={cn('w-full px-3 py-2 text-[13px] text-left', filialSel === 'todas' ? 'bg-[var(--acc-pale)] text-[var(--acc)]' : 'text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)]')}>
                  Todas as lojas
                </button>
                {filiaisAcess.map(f => (
                  <button key={f.COD_FILIAL} onClick={() => { setFilialSel(f.COD_FILIAL); setMenuFilial(false) }}
                    className={cn('flex items-center justify-between w-full px-3 py-2 text-[13px] text-left', filialSel === f.COD_FILIAL ? 'bg-[var(--acc-pale)] text-[var(--acc)]' : 'text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)]')}>
                    <span>{f.FILIAL}</span>
                    <span className="text-[13px] text-[var(--ink-ghost)]">{f.COD_FILIAL}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      }
    >
        {/* Strip indicador CRM */}
        {(
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white border border-[var(--border)] border-l-4 border-l-[var(--acc)] rounded-xl p-3.5 shadow-[var(--shadow-card)]">
              <div className="text-[12px] text-[var(--ink-ghost)] font-medium mb-1">Meta contatos / mês</div>
              <div className="text-[18px] font-medium text-[var(--acc)]">{r?.metaContatos || '—'}</div>
              {(r?.metaContatos ?? 0) > 0 && (
                <div className="text-[11px] text-[var(--ink-ghost)] mt-0.5">
                  ≈ {Number(r?.ritmoDiario ?? 0).toFixed(1)}/dia ({r?.diasUteis ?? 0} dias úteis)
                </div>
              )}
            </div>
            <div className={cn(
              'bg-white border border-[var(--border)] border-l-4 rounded-xl p-3.5 shadow-[var(--shadow-card)]',
              pctMeta != null && pctMeta >= 100 ? 'border-l-[var(--success)]' : pctMeta != null && pctMeta >= 80 ? 'border-l-[var(--acc)]' : 'border-l-[var(--warn)]'
            )}>
              <div className="text-[12px] text-[var(--ink-ghost)] font-medium mb-1">Contatos no mês</div>
              <div className={cn('text-[18px] font-medium', corMeta)}>{r?.contatosRealizados ?? 0}</div>
              <div className="text-[11px] text-[var(--ink-ghost)] mt-0.5">
                hoje: {r?.contatosHoje ?? 0}
                {pctMeta != null && ` · ${fmt.number(pctMeta, 0)}% da meta`}
              </div>
            </div>
            <div className={cn(
              'bg-white border border-[var(--border)] border-l-4 rounded-xl p-3.5 shadow-[var(--shadow-card)]',
              pctMeta != null && pctMeta >= 100 ? 'border-l-[var(--success)]' : pctMeta != null && pctMeta >= 80 ? 'border-l-[var(--acc)]' : 'border-l-[var(--warn)]'
            )}>
              <div className="text-[12px] text-[var(--ink-ghost)] font-medium mb-1">% meta atingida</div>
              <div className={cn('text-[18px] font-medium', corMeta)}>
                {pctMeta != null ? `${fmt.number(pctMeta, 0)}%` : '—'}
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                <div
                  className={cn('h-full rounded-full', pctMeta != null && pctMeta >= 100 ? 'bg-[var(--success)]' : pctMeta != null && pctMeta >= 80 ? 'bg-[var(--acc)]' : 'bg-[var(--warn)]')}
                  style={{ width: `${Math.min(pctMeta ?? 0, 100)}%` }}
                />
              </div>
            </div>
            <div className="bg-white border border-[var(--border)] border-l-4 border-l-[var(--info)] rounded-xl p-3.5 shadow-[var(--shadow-card)]">
              <div className="text-[12px] text-[var(--ink-ghost)] font-medium mb-1">Fat. reativados</div>
              <div className="text-[18px] font-medium text-[var(--info)]">{fmt.currencyShort(r?.faturamentoReativados ?? 0)}</div>
              <div className="text-[11px] text-[var(--ink-ghost)] mt-0.5">
                {pctFat != null ? `${fmt.number(pctFat, 1)}% do fat.` : '—'}
                {r?.clientesReativados ? ` · ${r.clientesReativados} clientes` : ''}
              </div>
            </div>
          </div>
        )}

        <MetaContatoRetorno filiais={filiaisParam} versao={versaoMetas} />

        {/* Cards de aba */}
        <div className="grid grid-cols-5 gap-3">
          {ABAS.map(a => {
            const Icon = a.icon
            const ativo = aba === a.id
            return (
              <button key={a.id} onClick={() => setAba(a.id)}
                className={cn('flex flex-col items-start gap-2 p-3.5 rounded-[14px] border transition-all text-left',
                  ativo
                    ? 'bg-[var(--acc-pale)] border-[var(--acc-border)] shadow-[var(--shadow-card2)]'
                    : 'bg-white border-[var(--border)] hover:border-[var(--acc-border)] shadow-[var(--shadow-card)]')}>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center',
                  ativo ? 'bg-[var(--acc)] text-white' : 'bg-[var(--bg-subtle)] ' + a.cor)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className={cn('text-[13px] font-medium', ativo ? 'text-[var(--acc)]' : 'text-[var(--ink)]')}>{a.label}</div>
                  <div className="text-[13px] text-[var(--ink-ghost)]">{a.desc}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Aba: Modelos */}
        {aba === 'modelos' && (
          <CrmModelosPanel
            codigoFilial={filialSel === 'todas' ? (filiaisAcess[0]?.COD_FILIAL?.trim() ?? '') : filialSel}
            nomeFilial={
              filialSel === 'todas'
                ? (filiaisAcess[0]?.FILIAL ?? 'Loja')
                : nomeFilial
            }
            filiais={filiaisAcess}
            onUsar={(m) => {
              setModeloSel(m)
              setAba(
                m.tipo === 'vip' ? 'vip'
                : m.tipo === 'reativacao' ? 'reativacao'
                : 'aniversariantes'
              )
            }}
          />
        )}

        {/* Abas com lista de clientes */}
        {aba !== 'modelos' && (
          <div className="grid grid-cols-[1fr_300px] gap-4">

            {/* Lista de clientes */}
            <Card padding="sm">
              <div className="flex items-center justify-between mb-3">
                <SectionTitle
                  label={
                    aba === 'aniversariantes' ? 'Aniversariantes do mês'
                    : aba === 'dormentes'     ? 'Clientes inativos'
                    : aba === 'reativacao'    ? 'Clientes para reativar'
                    : 'Clientes VIP'
                  }
                  icon={ABAS.find(a => a.id === aba)?.icon}
                  className="mb-0 flex-1"
                />
                <Badge variant="neutral">{clientes.length} clientes</Badge>
              </div>

              {(aba === 'dormentes' || aba === 'reativacao') && (
                <div className="mb-3 pb-3 border-b border-[var(--border)]">
                  <div className="text-[11px] text-[var(--ink-ghost)] mb-1.5">
                    Sem compra · {labelDiasRange(diasRange)}
                  </div>
                  <DiasSemCompraFilter value={diasRange} onChange={setDiasRange} compact />
                </div>
              )}

              {clientes.length === 0 ? (
                <div className="py-8 text-center text-[13px] text-[var(--ink-ghost)]">
                  Nenhum cliente encontrado
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  {clientes.slice(0, 100).map(c => (
                    <ClienteRow
                      key={c.CODIGO_CLIENTE}
                      c={c}
                      modelo={modeloSel?.texto}
                      loja={nomeFilial}
                      codigoFilial={resolverCodFilial(c)}
                      origem={origemAba}
                      jaContatado={contatados.has(String(c.CODIGO_CLIENTE).trim())}
                      onContato={() => {
                        setContatados(prev => new Set([...prev, String(c.CODIGO_CLIENTE).trim()]))
                        setVersaoMetas(n => n + 1)
                        axios.get('/api/crm/kpis', { params: { filiais: filiaisParam.join(',') } })
                          .then(r => setKpis(r.data))
                          .catch(() => {})
                      }}
                    />
                  ))}
                </div>
              )}
            </Card>

            {/* Painel lateral: modelo selecionado + dicas */}
            <div className="flex flex-col gap-3">

              {/* Modelo ativo */}
              <Card padding="sm">
                <SectionTitle label="Mensagem ativa" icon={Send} />
                {modeloSel ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px]">{modeloSel.emoji}</span>
                      <span className="text-[13px] font-medium text-[var(--ink)]">{modeloSel.nome}</span>
                    </div>
                    <div className="bg-[var(--bg-subtle)] rounded-lg p-2.5 text-[12px] text-[var(--ink-muted)] leading-relaxed whitespace-pre-wrap font-mono max-h-[180px] overflow-y-auto border border-[var(--border)]">
                      {modeloSel.texto}
                    </div>
                    <div className="text-[13px] text-[var(--ink-ghost)] bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
                      {'{nome}'} e {'{loja}'} sao substituidos automaticamente em cada mensagem
                    </div>
                    <button onClick={() => setAba('modelos')}
                      className="text-[12px] text-[var(--acc)] hover:underline flex items-center gap-1">
                      <Edit2 className="w-3 h-3" /> Trocar modelo
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setAba('modelos')}
                    className="w-full py-3 text-[13px] text-[var(--acc)] border border-dashed border-[var(--acc-border)] rounded-lg hover:bg-[var(--acc-pale)] transition-colors">
                    + Selecionar modelo de mensagem
                  </button>
                )}
              </Card>

              {/* Dicas por aba */}
              <Card padding="sm">
                <SectionTitle label="Dicas para esta campanha" icon={Sparkles} />
                <div className="flex flex-col gap-2 text-[12px] text-[var(--ink-muted)]">
                  {aba === 'aniversariantes' && <>
                    <p>🎂 <strong>Melhor horario:</strong> envie pela manha, antes das 10h. A taxa de resposta e 3x maior.</p>
                    <p>🎁 <strong>Ofereca algo real:</strong> desconto de 10-20% ou brinde gera muito mais retorno que uma mensagem so de parabens.</p>
                    <p>📱 <strong>WhatsApp primeiro:</strong> se nao abrir, tente e-mail depois de 2 dias.</p>
                    <p>âœ¨ <strong>Personalize:</strong> mencione a ultima peca que a pessoa comprou para criar conexao.</p>
                  </>}
                  {(aba === 'dormentes' || aba === 'reativacao') && <>
                    <p>â° <strong>Timing importa:</strong> clientes de 45-90 dias tem 60% mais chance de voltar do que os de 180d+.</p>
                    <p>👰 <strong>Incentivo funciona:</strong> ofereca um desconto real. "Sentimos sua falta" sem oferta tem baixa conversao.</p>
                    <p>📅 <strong>Nao insista:</strong> maximo de 2 contatos por semana para nao ser bloqueado.</p>
                    <p>🎏 <strong>Segmente:</strong> clientes que compraram muito valem uma oferta maior.</p>
                  </>}
                  {aba === 'vip' && <>
                    <p>👑 <strong>Trate de forma unica:</strong> acesso exclusivo, horario VIP ou preview de colecao nova.</p>
                    <p>📞 <strong>Ligue, nao so mensagem:</strong> clientes VIP valorizam o contato pessoal.</p>
                    <p>🎁 <strong>Brinde surpresa:</strong> um mimo inesperado na proxima compra cria fidelidade duradoura.</p>
                    <p>📊 <strong>Foque em LTV:</strong> manter um VIP ativo vale 10x mais do que conquistar um novo cliente.</p>
                  </>}
                </div>
              </Card>

            </div>
          </div>
        )}
    </DashboardLayout>
  )
}
