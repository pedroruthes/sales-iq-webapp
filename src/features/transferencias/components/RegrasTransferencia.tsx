import { useEffect, useState } from 'react'
import axios from 'axios'
import { Plus, Trash2, Save, Settings2 } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { useFiliais } from '@/hooks/useFiliais'
import { cn } from '@/lib/utils'

type Grupo = { nome: string; filiais: string[] }
type Par = { a: string; b: string; bidirecional?: boolean }

export function RegrasTransferencia() {
  const { data: filiais } = useFiliais()
  const [mesmaRegiao, setMesmaRegiao] = useState(false)
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [pares, setPares] = useState<Par[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const lista = filiais ?? []

  useEffect(() => {
    axios.get('/api/transferencias/regras')
      .then((r) => {
        const d = r.data.data
        if (!d) return
        setMesmaRegiao(!!d.mesmaRegiao)
        setGrupos(d.grupos ?? [])
        setPares(d.pares ?? [])
      })
      .catch(() => setMsg('Erro ao carregar regras'))
      .finally(() => setLoading(false))
  }, [])

  const salvar = async () => {
    setSaving(true)
    setMsg('')
    try {
      await axios.put('/api/transferencias/regras', { mesmaRegiao, grupos, pares })
      setMsg('Regras salvas')
      setTimeout(() => setMsg(''), 2500)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      setMsg(err?.response?.data?.error ?? 'Falha ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const toggleFilialGrupo = (gi: number, cod: string) => {
    setGrupos((prev) => prev.map((g, i) => {
      if (i !== gi) return g
      const set = new Set(g.filiais)
      if (set.has(cod)) set.delete(cod)
      else set.add(cod)
      return { ...g, filiais: [...set] }
    }))
  }

  if (loading) {
    return <div className="text-[13px] text-[var(--ink-ghost)] py-8 text-center">Carregando regras…</div>
  }

  return (
    <div className="flex flex-col gap-4">
      <Card padding="sm">
        <div className="flex items-start gap-3">
          <Settings2 className="w-4 h-4 text-[var(--acc)] mt-0.5 shrink-0" />
          <div className="text-[13px] text-[var(--ink-muted)] leading-relaxed">
            Defina <strong>grupos</strong> (lojas que podem transferir entre si) e/ou
            <strong> pares</strong> explícitos. Sem regras, qualquer loja do escopo pode transferir com qualquer outra.
          </div>
        </div>
        <label className="flex items-center gap-2 mt-3 text-[13px] text-[var(--ink)] cursor-pointer">
          <input
            type="checkbox"
            checked={mesmaRegiao}
            onChange={(e) => setMesmaRegiao(e.target.checked)}
            className="rounded border-[var(--border)]"
          />
          Exigir mesma região cadastrada no sync
        </label>
      </Card>

      <Card padding="sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[13px] font-medium text-[var(--ink)]">Grupos de lojas</div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setGrupos((g) => [...g, { nome: `Grupo ${g.length + 1}`, filiais: [] }])}
          >
            <Plus className="w-3.5 h-3.5" /> Grupo
          </Button>
        </div>
        {!grupos.length && (
          <div className="text-[13px] text-[var(--ink-ghost)] py-2">Nenhum grupo — adicione um para limitar por cluster (ex.: distância).</div>
        )}
        <div className="flex flex-col gap-3">
          {grupos.map((g, gi) => (
            <div key={gi} className="border border-[var(--border)] rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <input
                  value={g.nome}
                  onChange={(e) => setGrupos((prev) => prev.map((x, i) => i === gi ? { ...x, nome: e.target.value } : x))}
                  className="input-base flex-1 !h-8 text-[13px]"
                  placeholder="Nome do grupo"
                />
                <button
                  type="button"
                  onClick={() => setGrupos((prev) => prev.filter((_, i) => i !== gi))}
                  className="p-1.5 text-[var(--ink-ghost)] hover:text-[var(--danger)]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {lista.map((f) => {
                  const cod = String(f.COD_FILIAL).trim()
                  const on = g.filiais.includes(cod)
                  return (
                    <button
                      key={cod}
                      type="button"
                      onClick={() => toggleFilialGrupo(gi, cod)}
                      className={cn(
                        'px-2 py-1 rounded-lg text-[12px] border transition-colors',
                        on
                          ? 'bg-[var(--acc-pale)] border-[var(--acc-border)] text-[var(--acc)] font-medium'
                          : 'bg-white border-[var(--border)] text-[var(--ink-ghost)] hover:border-[var(--acc-border)]'
                      )}
                    >
                      {f.FILIAL || cod}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card padding="sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[13px] font-medium text-[var(--ink)]">Pares (loja ↔ loja)</div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPares((p) => [...p, { a: '', b: '', bidirecional: true }])}
          >
            <Plus className="w-3.5 h-3.5" /> Par
          </Button>
        </div>
        {!pares.length && (
          <div className="text-[13px] text-[var(--ink-ghost)] py-2">Nenhum par explícito.</div>
        )}
        <div className="flex flex-col gap-2">
          {pares.map((p, i) => (
            <div key={i} className="flex items-center gap-2 flex-wrap">
              <select
                value={p.a}
                onChange={(e) => setPares((prev) => prev.map((x, j) => j === i ? { ...x, a: e.target.value } : x))}
                className="select-base !h-8 text-[13px] min-w-[140px]"
              >
                <option value="">Origem</option>
                {lista.map((f) => (
                  <option key={f.COD_FILIAL} value={String(f.COD_FILIAL).trim()}>{f.FILIAL || f.COD_FILIAL}</option>
                ))}
              </select>
              <span className="text-[12px] text-[var(--ink-ghost)]">↔</span>
              <select
                value={p.b}
                onChange={(e) => setPares((prev) => prev.map((x, j) => j === i ? { ...x, b: e.target.value } : x))}
                className="select-base !h-8 text-[13px] min-w-[140px]"
              >
                <option value="">Destino</option>
                {lista.map((f) => (
                  <option key={f.COD_FILIAL} value={String(f.COD_FILIAL).trim()}>{f.FILIAL || f.COD_FILIAL}</option>
                ))}
              </select>
              <label className="flex items-center gap-1 text-[12px] text-[var(--ink-muted)]">
                <input
                  type="checkbox"
                  checked={p.bidirecional !== false}
                  onChange={(e) => setPares((prev) => prev.map((x, j) => j === i ? { ...x, bidirecional: e.target.checked } : x))}
                />
                Ida e volta
              </label>
              <button
                type="button"
                onClick={() => setPares((prev) => prev.filter((_, j) => j !== i))}
                className="p-1.5 text-[var(--ink-ghost)] hover:text-[var(--danger)]"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="primary" size="md" onClick={salvar} loading={saving} disabled={saving}>
          <Save className="w-4 h-4" /> Salvar regras
        </Button>
        {msg && <span className="text-[13px] text-[var(--ink-muted)]">{msg}</span>}
      </div>
    </div>
  )
}
