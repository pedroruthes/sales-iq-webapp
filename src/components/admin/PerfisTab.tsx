import { Fragment, useEffect, useMemo, useState } from 'react'
import { Plus, Save, Shield } from 'lucide-react'
import axios from 'axios'
import { Button, Card, FieldInput, Modal, PageLoading } from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  ACOES,
  MODULOS_PERM,
  type AcaoPerm,
  type AcoesModulo,
} from '@/lib/permissoes'

type PerfilDef = { id: string; label: string; descricao: string; sistema: boolean }
type Matriz = Record<string, Record<string, AcoesModulo>>

const ACAO_LABEL: Record<AcaoPerm, { titulo: string; hint: string }> = {
  visualizar: { titulo: 'Visualizar', hint: 'Ver o módulo no menu e consultar dados' },
  adicionar:  { titulo: 'Adicionar',  hint: 'Criar novos registros neste módulo' },
  editar:     { titulo: 'Editar',     hint: 'Alterar registros existentes' },
  excluir:    { titulo: 'Excluir',    hint: 'Remover registros deste módulo' },
}

function matrizVazia(): Record<string, AcoesModulo> {
  return Object.fromEntries(
    MODULOS_PERM.map((m) => [m.id, {
      visualizar: false, adicionar: false, editar: false, excluir: false,
    }])
  )
}

export function PerfisTab() {
  const [data, setData] = useState<Matriz>({})
  const [perfis, setPerfis] = useState<PerfilDef[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [perfilAtivo, setPerfilAtivo] = useState('')
  const [msg, setMsg] = useState('')
  const [modalNovo, setModalNovo] = useState(false)
  const [novoLabel, setNovoLabel] = useState('')
  const [novoDesc, setNovoDesc] = useState('')
  const [criando, setCriando] = useState(false)

  const carregar = async () => {
    setLoading(true)
    try {
      const { data: res } = await axios.get('/api/admin/perfis')
      const lista: PerfilDef[] = res.perfis ?? []
      setPerfis(lista)
      setData(res.data ?? {})
      setPerfilAtivo((atual) =>
        atual && lista.some((p) => p.id === atual) ? atual : (lista[0]?.id ?? '')
      )
    } catch {
      setPerfis([])
      setData({})
    }
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  const grupos = useMemo(() => [...new Set(MODULOS_PERM.map((m) => m.grupo))], [])
  const ativo = perfis.find((p) => p.id === perfilAtivo)

  const toggle = (modulo: string, acao: AcaoPerm) => {
    if (!perfilAtivo) return
    setData((prev) => {
      const atual = prev[perfilAtivo]?.[modulo] ?? {
        visualizar: false, adicionar: false, editar: false, excluir: false,
      }
      const next = { ...atual, [acao]: !atual[acao] }
      if (acao === 'visualizar' && !next.visualizar) {
        next.adicionar = false
        next.editar = false
        next.excluir = false
      }
      if (acao !== 'visualizar' && next[acao]) next.visualizar = true
      return {
        ...prev,
        [perfilAtivo]: { ...(prev[perfilAtivo] ?? matrizVazia()), [modulo]: next },
      }
    })
  }

  const marcarLinha = (modulo: string, ligar: boolean) => {
    if (!perfilAtivo) return
    setData((prev) => ({
      ...prev,
      [perfilAtivo]: {
        ...(prev[perfilAtivo] ?? matrizVazia()),
        [modulo]: {
          visualizar: ligar,
          adicionar: ligar,
          editar: ligar,
          excluir: ligar,
        },
      },
    }))
  }

  const salvar = async () => {
    setSaving(true)
    setMsg('')
    try {
      await axios.post('/api/admin/perfis', { permissoes: data })
      setMsg('Permissões salvas com sucesso')
    } catch {
      setMsg('Erro ao salvar permissões')
    }
    setSaving(false)
  }

  const criarPerfil = async () => {
    if (!novoLabel.trim()) return
    setCriando(true)
    try {
      const nomeCriado = novoLabel.trim()
      const { data: res } = await axios.post('/api/admin/perfis', {
        action: 'criar',
        label: nomeCriado,
        descricao: novoDesc.trim(),
      })
      setModalNovo(false)
      setNovoLabel('')
      setNovoDesc('')
      await carregar()
      if (res.id) setPerfilAtivo(res.id)
      setMsg(`Perfil “${nomeCriado}” criado — ajuste as permissões e salve`)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      setMsg(err?.response?.data?.error ?? 'Erro ao criar perfil')
    }
    setCriando(false)
  }

  if (loading) return <PageLoading />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="max-w-xl">
          <h2 className="text-[15px] font-medium text-[var(--ink)] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[var(--acc)]" />
            Perfis e permissões
          </h2>
          <p className="text-[13px] text-[var(--ink-muted)] mt-1 leading-relaxed">
            Defina o que cada perfil pode fazer em cada módulo do sistema.
            Use os interruptores para liberar ou bloquear <strong className="font-medium text-[var(--ink)]">Visualizar</strong>,{' '}
            <strong className="font-medium text-[var(--ink)]">Adicionar</strong>,{' '}
            <strong className="font-medium text-[var(--ink)]">Editar</strong> e{' '}
            <strong className="font-medium text-[var(--ink)]">Excluir</strong>.
            Você também pode criar perfis novos sob medida para a sua operação.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {msg && <span className="text-[12px] text-[var(--ink-muted)] max-w-[240px]">{msg}</span>}
          <Button variant="secondary" size="md" onClick={() => setModalNovo(true)}>
            <Plus className="w-3.5 h-3.5" /> Novo perfil
          </Button>
          <Button variant="primary" size="md" onClick={salvar} loading={saving} disabled={!perfilAtivo}>
            <Save className="w-3.5 h-3.5" /> Salvar permissões
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {perfis.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => { setPerfilAtivo(p.id); setMsg('') }}
            title={p.descricao || p.label}
            className={cn(
              'px-3.5 py-2 rounded-xl text-[13px] font-medium border transition-colors text-left',
              perfilAtivo === p.id
                ? 'bg-[var(--acc)] text-white border-[var(--acc)] shadow-sm'
                : 'bg-white text-[var(--ink-muted)] border-[var(--border)] hover:border-[var(--acc-border)] hover:text-[var(--ink)]'
            )}
          >
            <span className="block">{p.label}</span>
            {!p.sistema && (
              <span className={cn(
                'text-[10px] font-normal',
                perfilAtivo === p.id ? 'text-white/80' : 'text-[var(--ink-ghost)]'
              )}>
                Personalizado
              </span>
            )}
          </button>
        ))}
        {perfis.length === 0 && (
          <p className="text-[13px] text-[var(--ink-ghost)]">Nenhum perfil carregado. Crie o primeiro.</p>
        )}
      </div>

      {ativo && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/40 px-4 py-3">
          <div className="text-[14px] font-medium text-[var(--ink)]">{ativo.label}</div>
          <p className="text-[12px] text-[var(--ink-muted)] mt-0.5">
            {ativo.descricao || 'Sem descrição — configure as permissões abaixo módulo a módulo.'}
            {ativo.sistema ? ' · Perfil do sistema' : ' · Perfil personalizado'}
          </p>
        </div>
      )}

      <Card padding="sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-3 py-2.5 text-[11px] uppercase tracking-wide text-[var(--ink-ghost)] font-medium">
                  Módulo
                </th>
                {ACOES.map((a) => (
                  <th key={a} className="px-2 py-2.5 text-center min-w-[100px]">
                    <div className="text-[11px] uppercase tracking-wide text-[var(--ink-ghost)] font-medium">
                      {ACAO_LABEL[a].titulo}
                    </div>
                    <div className="text-[10px] font-normal text-[var(--ink-ghost)] normal-case tracking-normal mt-0.5 leading-snug hidden sm:block">
                      {ACAO_LABEL[a].hint}
                    </div>
                  </th>
                ))}
                <th className="px-2 py-2.5 text-[11px] uppercase text-[var(--ink-ghost)] font-medium text-center w-24">
                  Tudo
                </th>
              </tr>
            </thead>
            <tbody>
              {grupos.map((g) => (
                <Fragment key={g}>
                  <tr>
                    <td colSpan={6} className="px-3 pt-4 pb-1 text-[11px] uppercase tracking-wide text-[var(--ink-ghost)]">
                      {g}
                    </td>
                  </tr>
                  {MODULOS_PERM.filter((m) => m.grupo === g).map((m) => {
                    const ac = data[perfilAtivo]?.[m.id] ?? {
                      visualizar: false, adicionar: false, editar: false, excluir: false,
                    }
                    const tudoOn = ac.visualizar && ac.adicionar && ac.editar && ac.excluir
                    return (
                      <tr key={m.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-subtle)]/50">
                        <td className="px-3 py-3">
                          <div className="text-[13px] font-medium text-[var(--ink-muted)]">{m.label}</div>
                        </td>
                        {ACOES.map((acao) => (
                          <td key={acao} className="px-2 py-3 text-center">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={ac[acao]}
                              aria-label={`${ACAO_LABEL[acao].titulo} em ${m.label}`}
                              title={ACAO_LABEL[acao].hint}
                              onClick={() => toggle(m.id, acao)}
                              className={cn(
                                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                                ac[acao] ? 'bg-[var(--acc)]' : 'bg-[var(--border-md)]'
                              )}
                            >
                              <span
                                className="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform"
                                style={{ transform: ac[acao] ? 'translateX(18px)' : 'translateX(2px)' }}
                              />
                            </button>
                          </td>
                        ))}
                        <td className="px-2 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => marcarLinha(m.id, !tudoOn)}
                            className="text-[11px] font-medium text-[var(--acc)] hover:underline"
                          >
                            {tudoOn ? 'Limpar' : 'Liberar'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={modalNovo}
        onClose={() => setModalNovo(false)}
        title={
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-[var(--acc)]" />
            Novo perfil
          </span>
        }
        subtitle="Crie um perfil com nome completo e descreva o papel. Depois configure cada permissão."
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setModalNovo(false)}>Cancelar</Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => void criarPerfil()}
              loading={criando}
              disabled={!novoLabel.trim()}
            >
              Criar perfil
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <FieldInput
            label="Nome do perfil *"
            value={novoLabel}
            onChange={(e) => setNovoLabel(e.target.value)}
            placeholder="Ex: Gerente regional"
            autoFocus
          />
          <FieldInput
            label="Descrição"
            value={novoDesc}
            onChange={(e) => setNovoDesc(e.target.value)}
            placeholder="Ex: Responsável por lojas de uma região, sem acesso a admin"
          />
          <p className="text-[12px] text-[var(--ink-ghost)] leading-relaxed">
            O identificador interno é gerado a partir do nome (ex.: gerente_regional).
            Ao criar, todas as permissões começam desligadas — você liga só o necessário.
          </p>
        </div>
      </Modal>
    </div>
  )
}
