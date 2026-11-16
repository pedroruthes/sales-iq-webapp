import { useState } from 'react'
import { User, Lock, Save, Eye, EyeOff, Check, AlertTriangle, Shield } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Card, SectionTitle, Button } from '@/components/ui'
import { useContentLoading, useCurrentUser } from '@/hooks/useSession'
import { useFiliais }        from '@/hooks/useFiliais'
import { cn }                from '@/lib/utils'
import axios                 from 'axios'

const PERFIL_INFO: Record<string, { label: string; desc: string; cor: string }> = {
  admin:        { label: 'Administrador',   desc: 'Acesso total ao sistema e configurações globais', cor: 'bg-red-100 text-red-700 border-red-200' },
  proprietario: { label: 'Proprietário',    desc: 'Acesso total à rede de lojas',                   cor: 'bg-purple-100 text-purple-700 border-purple-200' },
  dono_grupo:   { label: 'Dono do grupo',   desc: 'Acesso às lojas do próprio grupo',               cor: 'bg-purple-100 text-purple-700 border-purple-200' },
  supervisora:  { label: 'Supervisora',     desc: 'Acesso a subconjunto de lojas',                  cor: 'bg-blue-100 text-blue-700 border-blue-200' },
  gerente_loja: { label: 'Gerente de loja', desc: 'Acesso a uma loja',                              cor: 'bg-green-100 text-green-700 border-green-200' },
  vendedora:    { label: 'Vendedora',       desc: 'Acesso ao dashboard e CRM da própria loja',      cor: 'bg-amber-100 text-amber-700 border-amber-200' },
}

export default function PerfilPage() {
  const user    = useCurrentUser()
  const { data: filiais, isLoading: lFiliais } = useFiliais()

  const [senhaAtual,  setSenhaAtual]  = useState('')
  const [novaSenha,   setNovaSenha]   = useState('')
  const [confirmar,   setConfirmar]   = useState('')
  const [verAtual,    setVerAtual]    = useState(false)
  const [verNova,     setVerNova]     = useState(false)
  const [salvando,    setSalvando]    = useState(false)
  const [sucesso,     setSucesso]     = useState('')
  const [erro,        setErro]        = useState('')

  const perfilInfo  = PERFIL_INFO[user.perfil ?? ''] ?? PERFIL_INFO['vendedora']
  const filiaisUser = filiais?.filter(f => user.filiais.includes(f.COD_FILIAL)) ?? []

  const salvarSenha = async () => {
    setErro('')
    if (!senhaAtual || !novaSenha || !confirmar) { setErro('Preencha todos os campos'); return }
    if (novaSenha !== confirmar) { setErro('As senhas não coincidem'); return }
    if (novaSenha.length < 8)   { setErro('A senha deve ter pelo menos 8 caracteres'); return }
    setSalvando(true)
    try {
      await axios.put('/api/admin/usuarios', {
        id: user.id,
        resetarSenha: true,
        senhaAtual,
        novaSenha,
      })
      setSucesso('Senha alterada com sucesso!')
      setSenhaAtual(''); setNovaSenha(''); setConfirmar('')
      setTimeout(() => setSucesso(''), 3000)
    } catch (e: any) {
      setErro(e.response?.data?.error ?? 'Erro ao alterar senha')
    }
    setSalvando(false)
  }

  const loading = useContentLoading({ filiaisLoading: lFiliais })

  return (
    <DashboardLayout
      titulo="Meu perfil"
      subtitulo="Dados da conta e alteração de senha"
      maxWidth="max-w-[640px]"
      loading={loading}
    >
        {/* Info do usuário */}
        <Card padding="sm">
          <SectionTitle label="Informações do usuário" icon={User} />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-[var(--acc-pale)] flex items-center justify-center text-[20px] font-medium text-[var(--acc)] shrink-0">
              {user.nome?.charAt(0) ?? 'A'}
            </div>
            <div>
              <div className="text-[16px] font-medium text-[var(--ink)]">{user.nome}</div>
              <div className="text-[12px] text-[var(--ink-ghost)]">{user.email}</div>
              <span className={cn('inline-block mt-1.5 text-[12px] font-medium px-2.5 py-0.5 rounded-full border', perfilInfo.cor)}>
                {perfilInfo.label}
              </span>
            </div>
          </div>
          <div className="bg-[var(--bg-subtle)] rounded-lg px-3 py-2.5 text-[13px] text-[var(--ink-ghost)] flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 text-[var(--acc)] shrink-0 mt-0.5" />
            {perfilInfo.desc}
          </div>
        </Card>

        {/* Lojas de acesso */}
        <Card padding="sm">
          <SectionTitle label="Lojas de acesso" icon={Shield} />
          {filiaisUser.length === 0 ? (
            <div className="text-[13px] text-[var(--ink-ghost)]">Acesso a todas as lojas da rede</div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {filiaisUser.map(f => (
                <div key={f.COD_FILIAL} className="flex items-center gap-2 py-1.5 border-b border-[var(--border)] last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--acc)] shrink-0" />
                  <span className="text-[12px] text-[var(--ink)] flex-1">{f.FILIAL}</span>
                  <span className="text-[12px] text-[var(--ink-ghost)]">{f.COD_FILIAL.trim()}</span>
                </div>
              ))}
              <div className="text-[12px] text-[var(--ink-ghost)] mt-1">
                {filiaisUser.length} loja{filiaisUser.length > 1 ? 's' : ''} vinculada{filiaisUser.length > 1 ? 's' : ''}
              </div>
            </div>
          )}
        </Card>

        {/* Alterar senha */}
        <Card padding="sm">
          <SectionTitle label="Alterar senha" icon={Lock} />

          {sucesso && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[var(--success-bg)] border border-green-200 rounded-lg text-[13px] text-[var(--success)] mb-3">
              <Check className="w-3.5 h-3.5 shrink-0" /> {sucesso}
            </div>
          )}
          {erro && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[var(--danger-bg)] border border-red-200 rounded-lg text-[13px] text-[var(--danger)] mb-3">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {erro}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {/* Senha atual */}
            <div>
              <label className="text-[12px] text-[var(--ink-ghost)] uppercase tracking-wide mb-1 block">Senha atual</label>
              <div className="relative">
                <input type={verAtual ? 'text' : 'password'} value={senhaAtual}
                  onChange={e => setSenhaAtual(e.target.value)}
                  className="input-base pr-10" />
                <button type="button" onClick={() => setVerAtual(!verAtual)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-ghost)]">
                  {verAtual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Nova senha */}
            <div>
              <label className="text-[12px] text-[var(--ink-ghost)] uppercase tracking-wide mb-1 block">Nova senha</label>
              <div className="relative">
                <input type={verNova ? 'text' : 'password'} value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="input-base pr-10" />
                <button type="button" onClick={() => setVerNova(!verNova)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-ghost)]">
                  {verNova ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Força da senha */}
              {novaSenha && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex gap-1 flex-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={cn('h-1 flex-1 rounded-full transition-all',
                        novaSenha.length >= i * 3
                          ? i <= 1 ? 'bg-[var(--danger)]'
                          : i <= 2 ? 'bg-[var(--warn)]'
                          : i <= 3 ? 'bg-[var(--acc)]'
                          : 'bg-[var(--success)]'
                          : 'bg-[var(--border)]'
                      )} />
                    ))}
                  </div>
                  <span className="text-[12px] text-[var(--ink-ghost)]">
                    {novaSenha.length < 4 ? 'fraca' : novaSenha.length < 7 ? 'média' : novaSenha.length < 10 ? 'boa' : 'forte'}
                  </span>
                </div>
              )}
            </div>

            {/* Confirmar */}
            <div>
              <label className="text-[12px] text-[var(--ink-ghost)] uppercase tracking-wide mb-1 block">Confirmar nova senha</label>
              <input type="password" value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                className={cn('input-base',
                  confirmar && novaSenha !== confirmar
                    ? '!border-[var(--danger)] focus:!border-[var(--danger)]'
                    : confirmar && novaSenha === confirmar
                    ? '!border-[var(--success)] focus:!border-[var(--success)]'
                    : ''
                )} />
              {confirmar && novaSenha !== confirmar && (
                <p className="text-[12px] text-[var(--danger)] mt-1">As senhas não coincidem</p>
              )}
            </div>

            <Button variant="primary" size="lg" onClick={salvarSenha} disabled={salvando} loading={salvando} className="mt-1">
              {!salvando && <Save className="w-4 h-4" />}
              {salvando ? 'Salvando...' : 'Alterar senha'}
            </Button>
          </div>
        </Card>
    </DashboardLayout>
  )
}
