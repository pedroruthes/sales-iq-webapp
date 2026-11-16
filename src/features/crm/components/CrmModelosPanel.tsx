import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CheckCircle, Copy, ChevronDown, Mail, MessageCircle,
  Plus, Save, Trash2, Edit2, X, Building2,
} from 'lucide-react'
import axios from 'axios'
import { Card, SectionTitle, Button, FieldInput, FieldSelect } from '@/components/ui'
import { cn } from '@/lib/utils'

export type CrmModelo = {
  id: number | string
  codigoFilial?: string
  nome: string
  tipo: string
  canal: string
  emoji?: string | null
  texto: string
  virtual?: boolean
}

type FilialOpt = { COD_FILIAL: string; FILIAL: string }

const TIPOS = [
  { value: 'aniversario', label: 'Aniversário' },
  { value: 'reativacao', label: 'Reativação' },
  { value: 'vip', label: 'VIP' },
  { value: 'geral', label: 'Geral' },
]

const COR_TIPO: Record<string, string> = {
  aniversario: 'bg-pink-100 text-pink-700 border-pink-200',
  reativacao: 'bg-amber-100 text-amber-700 border-amber-200',
  vip: 'bg-purple-100 text-purple-700 border-purple-200',
  geral: 'bg-[var(--bg-subtle)] text-[var(--ink-muted)] border-[var(--border)]',
}

const EMPTY_FORM = {
  nome: '',
  tipo: 'geral',
  canal: 'whatsapp',
  emoji: '💬',
  texto: '',
}

const selectChevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")"

type Props = {
  codigoFilial: string
  nomeFilial: string
  filiais?: FilialOpt[]
  onUsar?: (modelo: CrmModelo) => void
}

export function CrmModelosPanel({ codigoFilial, nomeFilial, filiais = [], onUsar }: Props) {
  const lojas = useMemo(
    () =>
      filiais
        .map((f) => ({
          cod: String(f.COD_FILIAL).trim(),
          nome: String(f.FILIAL || f.COD_FILIAL).trim(),
        }))
        .filter((f) => f.cod),
    [filiais]
  )

  const inicial = useMemo(() => {
    if (codigoFilial && codigoFilial !== 'todas') return String(codigoFilial).trim()
    return lojas[0]?.cod ?? ''
  }, [codigoFilial, lojas])

  const [lojaAtiva, setLojaAtiva] = useState(inicial)
  const [modelos, setModelos] = useState<CrmModelo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<number | string | null>(null)
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [expandido, setExpandido] = useState<string | number | null>(null)
  const [copiado, setCopiado] = useState<string | number | null>(null)
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    setLojaAtiva(inicial)
  }, [inicial])

  const nomeLojaAtiva =
    lojas.find((l) => l.cod === lojaAtiva)?.nome
    || (lojaAtiva === String(codigoFilial).trim() ? nomeFilial : lojaAtiva)

  const carregar = useCallback(async () => {
    if (!lojaAtiva) {
      setModelos([])
      setLoading(false)
      return
    }
    setLoading(true)
    setErro('')
    try {
      const { data } = await axios.get('/api/crm/modelos', {
        params: { filiais: lojaAtiva },
      })
      const lista = (data.data ?? []) as CrmModelo[]
      setModelos(lista)
      if (!lista.length) {
        // Fallback: tenta seed explícito e recarrega
        try {
          await axios.post('/api/crm/modelos', { codigoFilial: lojaAtiva, seed: true })
          const again = await axios.get('/api/crm/modelos', { params: { filiais: lojaAtiva } })
          setModelos(again.data.data ?? [])
        } catch {
          /* keep empty */
        }
      }
    } catch (e: unknown) {
      setModelos([])
      setErro(axios.isAxiosError(e) ? (e.response?.data?.error ?? e.message) : 'Erro ao carregar modelos')
    }
    setLoading(false)
  }, [lojaAtiva])

  useEffect(() => { void carregar() }, [carregar])

  const salvar = async () => {
    if (!form.nome.trim() || !form.texto.trim() || !lojaAtiva) return
    setSaving(true)
    setErro('')
    try {
      if (editId != null) {
        await axios.put('/api/crm/modelos', {
          id: editId,
          codigoFilial: lojaAtiva,
          ...form,
        })
      } else {
        await axios.post('/api/crm/modelos', { codigoFilial: lojaAtiva, ...form })
      }
      setCriando(false)
      setEditId(null)
      setForm(EMPTY_FORM)
      setMsg('Modelo salvo nesta loja!')
      setTimeout(() => setMsg(''), 2500)
      await carregar()
    } catch {
      setErro('Erro ao salvar. Verifique permissão de edição no CRM.')
    }
    setSaving(false)
  }

  const remover = async (m: CrmModelo) => {
    if (m.virtual || typeof m.id === 'string') {
      setErro('Salve o modelo nesta loja antes de remover.')
      return
    }
    if (!confirm(`Remover o modelo "${m.nome}" desta loja?`)) return
    try {
      await axios.delete('/api/crm/modelos', {
        data: { id: m.id, codigoFilial: m.codigoFilial || lojaAtiva },
      })
      await carregar()
    } catch {
      setErro('Erro ao remover')
    }
  }

  const iniciarEdicao = (m: CrmModelo) => {
    setEditId(m.id)
    setCriando(true)
    setForm({
      nome: m.nome,
      tipo: m.tipo,
      canal: m.canal,
      emoji: m.emoji || '💬',
      texto: m.texto,
    })
  }

  if (!lojaAtiva && !lojas.length) {
    return (
      <Card padding="sm">
        <p className="text-[13px] text-[var(--ink-ghost)] py-6 text-center">
          Nenhuma loja disponível para cadastrar modelos.
        </p>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <SectionTitle label={`Modelos — ${nomeLojaAtiva}`} icon={MessageCircle} className="mb-0" />
          <p className="text-[13px] text-[var(--ink-ghost)] mt-1">
            Defaults do sistema por loja. Edite livremente — cada loja tem a sua cópia.
            Variáveis: {'{nome}'}, {'{loja}'}, {'{desconto}'}, {'{dias}'}, {'{telefone_loja}'}.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {lojas.length > 0 && (
            <div className="relative min-w-[200px]">
              <Building2 className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-ghost)] pointer-events-none" />
              <select
                value={lojaAtiva}
                onChange={(e) => {
                  setLojaAtiva(e.target.value)
                  setCriando(false)
                  setEditId(null)
                }}
                style={{ backgroundImage: selectChevron }}
                className="select-base !pl-8"
              >
                {lojas.map((l) => (
                  <option key={l.cod} value={l.cod}>{l.nome}</option>
                ))}
              </select>
            </div>
          )}
          {msg && <span className="text-[12px] text-[var(--success)]">{msg}</span>}
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setCriando(true)
              setEditId(null)
              setForm(EMPTY_FORM)
            }}
          >
            <Plus className="w-3.5 h-3.5" /> Novo modelo
          </Button>
        </div>
      </div>

      {erro && (
        <div className="text-[13px] text-[var(--danger)] bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {erro}
        </div>
      )}

      {criando && (
        <Card padding="sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[14px] font-medium text-[var(--ink)]">
              {editId != null ? 'Editar modelo' : 'Novo modelo'}
              <span className="text-[12px] text-[var(--ink-ghost)] font-normal ml-2">({nomeLojaAtiva})</span>
            </div>
            <button type="button" onClick={() => { setCriando(false); setEditId(null) }} className="text-[var(--ink-ghost)]">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <FieldInput
              label="Nome *"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            />
            <FieldInput
              label="Emoji"
              value={form.emoji}
              onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
            />
            <FieldSelect
              label="Tipo"
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </FieldSelect>
            <FieldSelect
              label="Canal"
              value={form.canal}
              onChange={(e) => setForm((f) => ({ ...f, canal: e.target.value }))}
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="email">E-mail</option>
            </FieldSelect>
          </div>
          <label className="text-[12px] text-[var(--ink-ghost)] uppercase tracking-wide">Texto *</label>
          <textarea
            value={form.texto}
            onChange={(e) => setForm((f) => ({ ...f, texto: e.target.value }))}
            rows={8}
            className="w-full mt-1 px-3 py-2 text-[13px] border border-[var(--border)] rounded-xl bg-[var(--bg-subtle)] focus:outline-none focus:border-[var(--acc)] font-mono"
            placeholder="Olá, {nome}! ..."
          />
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="secondary" size="md" onClick={() => { setCriando(false); setEditId(null) }}>
              Cancelar
            </Button>
            <Button variant="primary" size="md" onClick={salvar} disabled={saving || !form.nome.trim() || !form.texto.trim()} loading={saving}>
              <Save className="w-3.5 h-3.5" /> Salvar nesta loja
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <Card padding="sm">
          <div className="py-8 text-center text-[13px] text-[var(--ink-ghost)]">Carregando modelos padrão…</div>
        </Card>
      ) : !modelos.length && !criando ? (
        <Card padding="sm">
          <div className="py-8 text-center">
            <MessageCircle className="w-8 h-8 text-[var(--ink-ghost)] mx-auto mb-3 opacity-40" />
            <div className="text-[14px] text-[var(--ink)] font-medium mb-1">Não foi possível carregar os padrões</div>
            <div className="text-[13px] text-[var(--ink-ghost)] mb-4">
              Tente novamente ou crie um modelo manualmente.
            </div>
            <Button variant="secondary" size="md" onClick={() => void carregar()} disabled={saving}>
              Tentar de novo
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {modelos.map((modelo) => {
            const aberto = expandido === modelo.id
            return (
              <div
                key={String(modelo.id)}
                className="bg-white border border-[var(--border)] rounded-[14px] p-4 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[18px] shrink-0">{modelo.emoji || '💬'}</span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-[var(--ink)] truncate">{modelo.nome}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={cn('text-[11px] px-1.5 py-0.5 rounded-full border font-medium', COR_TIPO[modelo.tipo] ?? COR_TIPO.geral)}>
                          {modelo.tipo}
                        </span>
                        <span className="text-[11px] text-[var(--ink-ghost)] flex items-center gap-1">
                          {modelo.canal === 'whatsapp'
                            ? <MessageCircle className="w-2.5 h-2.5" />
                            : <Mail className="w-2.5 h-2.5" />}
                          {modelo.canal}
                        </span>
                        {modelo.virtual && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            padrão
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={() => setExpandido(aberto ? null : modelo.id)} className="text-[var(--ink-ghost)]">
                    <ChevronDown className={cn('w-4 h-4 transition-transform', aberto && 'rotate-180')} />
                  </button>
                </div>

                {aberto && (
                  <div className="mt-3 bg-[var(--bg-subtle)] rounded-lg p-3 text-[12px] text-[var(--ink-muted)] leading-relaxed whitespace-pre-wrap font-mono border border-[var(--border)]">
                    {modelo.texto}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(modelo.texto)
                      setCopiado(modelo.id)
                      setTimeout(() => setCopiado(null), 2000)
                    }}
                    className="flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--ink-ghost)] hover:text-[var(--acc)]"
                  >
                    {copiado === modelo.id
                      ? <CheckCircle className="w-3 h-3 text-[var(--success)]" />
                      : <Copy className="w-3 h-3" />}
                    {copiado === modelo.id ? 'Copiado!' : 'Copiar'}
                  </button>
                  {onUsar && (
                    <button
                      type="button"
                      onClick={() => onUsar(modelo)}
                      className="flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-lg bg-[var(--acc-pale)] border border-[var(--acc-border)] text-[var(--acc)] font-medium"
                    >
                      Usar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => iniciarEdicao(modelo)}
                    className="flex items-center gap-1 text-[12px] px-2.5 py-1.5 rounded-lg text-[var(--ink-ghost)] hover:text-[var(--acc)]"
                  >
                    <Edit2 className="w-3 h-3" /> Editar
                  </button>
                  {!modelo.virtual && (
                    <button
                      type="button"
                      onClick={() => void remover(modelo)}
                      className="flex items-center gap-1 text-[12px] px-2.5 py-1.5 rounded-lg text-[var(--ink-ghost)] hover:text-[var(--danger)]"
                    >
                      <Trash2 className="w-3 h-3" /> Remover
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
