import { useState, useEffect } from 'react'
import { useRouter } from '@/lib/navigation'
import { useAuth } from '@/auth/AuthContext'
import {
  BarChart3, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck,
  TrendingUp, Users, Target, Sparkles, Construction,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import linxPosLogo from '@/assets/linx-pos.png'
import linxMicrovixLogo from '@/assets/linx-microvix.png'

const DESTAQUES = [
  { icon: TrendingUp, titulo: 'Vendas em tempo real', desc: 'KPIs alinhados ao resumo do seu PDV' },
  { icon: Users, titulo: 'CRM da loja', desc: 'Carteira, dormentes e follow-up' },
  { icon: Target, titulo: 'Metas & ranking', desc: 'Gamificação para a equipe de vendas' },
]

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [modalRecuperar, setModalRecuperar] = useState(false)

  useEffect(() => {
    window.history.replaceState(null, '', window.location.href)
  }, [])

  async function onLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      const res = await login(email.trim().toLowerCase(), senha)
      if (!res.ok) { setErro(res.error || 'E-mail ou senha incorretos.'); return }
      window.history.replaceState(null, '', '/login')
      router.replace('/dashboard')
    } catch { setErro('Erro de conexão. Tente novamente.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Painel esquerdo (branding) ── */}
      <aside className="relative hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col overflow-hidden bg-[var(--acc)] text-white">
        {/* Atmosphere */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 10% 20%, rgba(255,255,255,0.18), transparent 55%),' +
              'radial-gradient(ellipse 50% 40% at 90% 80%, rgba(0,0,0,0.18), transparent 50%),' +
              'linear-gradient(165deg, #7b6cf0 0%, #6c5ce7 45%, #5a4bd6 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Orbs decorativos */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute bottom-10 -left-16 w-64 h-64 rounded-full bg-[#4a3cc4]/40 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center justify-center h-full px-10 xl:px-16 py-12">
          <div className="w-full max-w-[440px] flex flex-col items-start text-left">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[14px] bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-[20px] font-semibold tracking-[-0.03em] leading-tight">SalesIQ</div>
                <div className="text-[12px] text-white/65">by CytheraTech</div>
              </div>
            </div>

            {/* Headline */}
            <div className="mt-12 xl:mt-14">
              <div className="inline-flex items-center gap-1.5 text-[12px] font-medium text-white/80 bg-white/10 border border-white/15 rounded-full px-3 py-1 mb-5">
                <Sparkles className="w-3.5 h-3.5" />
                Inteligência comercial para redes de loja
              </div>
              <h2 className="text-[30px] xl:text-[36px] font-semibold tracking-[-0.035em] leading-[1.15]">
                Do PDV ao painel — visão clara da sua operação
              </h2>
              <p className="mt-4 text-[15px] text-white/75 leading-relaxed max-w-md">
                Sincronize vendas, estoque e equipe. Acompanhe metas, CRM e performance
                em um só lugar — com dados alinhados ao seu ERP.
              </p>
            </div>

            {/* Destaques */}
            <div className="mt-9 w-full grid grid-cols-1 gap-3">
              {DESTAQUES.map(({ icon: Icon, titulo, desc }) => (
                <div
                  key={titulo}
                  className="flex items-start gap-3.5 rounded-2xl bg-white/[0.08] border border-white/10 px-4 py-3.5 backdrop-blur-[2px]"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-[14px] font-medium tracking-[-0.01em]">{titulo}</div>
                    <div className="text-[12px] text-white/65 mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Integrações */}
            <div className="mt-12 flex flex-col items-start gap-3">
              <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/50">
                Integrado com
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-2xl bg-white px-5 py-3.5 shadow-sm">
                  <img
                    src={linxPosLogo}
                    alt="Linx POS"
                    className="h-9 w-auto object-contain"
                  />
                </div>
                <div className="rounded-2xl bg-white px-5 py-3.5 shadow-sm">
                  <img
                    src={linxMicrovixLogo}
                    alt="Linx Microvix"
                    className="h-9 w-auto object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Painel direito (login) ── */}
      <main className="relative flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-10 bg-[var(--bg-page)] overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 lg:hidden"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(108,92,231,0.12), transparent)',
          }}
        />

        <div className="relative w-full max-w-[400px] flex flex-col gap-4">
          {/* Brand mobile */}
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-[12px] bg-[var(--acc)] flex items-center justify-center shadow-sm">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[18px] font-semibold text-[var(--ink)] tracking-[-0.02em] leading-tight">
                SalesIQ
              </div>
              <div className="text-[12px] text-[var(--ink-ghost)]">by CytheraTech</div>
            </div>
          </div>

          <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden shadow-card2">
            <form onSubmit={onLogin} className="px-7 pt-7 pb-7 flex flex-col gap-5">
              <div>
                <h1 className="text-[22px] font-semibold text-[var(--ink)] tracking-[-0.02em] mb-1">
                  Bem-vindo de volta
                </h1>
                <p className="text-[13px] text-[var(--ink-faint)]">
                  Acesse o painel de gestão da sua rede
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[var(--ink-faint)]">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-ghost)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com.br"
                    required
                    autoFocus
                    className="input-base pl-10"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[var(--ink-faint)]">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-ghost)]" />
                  <input
                    type={verSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="input-base pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setVerSenha(!verSenha)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-ghost)] hover:text-[var(--ink-faint)]"
                  >
                    {verSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="text-right -mt-2">
                <button
                  type="button"
                  onClick={() => setModalRecuperar(true)}
                  className="text-[13px] font-medium text-[var(--acc)] hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>

              {erro && (
                <div className="text-[13px] text-[var(--danger)] bg-[var(--danger-bg)] border border-red-200/60 rounded-[10px] px-3.5 py-2.5">
                  {erro}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full h-11">
                {loading
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><span>Entrar</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <div className="border-t border-[var(--border)] px-7 py-3.5 flex items-center justify-between bg-[var(--bg-page)]">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                <span className="text-[12px] text-[var(--ink-ghost)]">Sistemas operacionais</span>
              </div>
              <a href="mailto:suporte@cytheratech.com.br" className="text-[12px] font-medium text-[var(--acc)] hover:underline">
                Suporte
              </a>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-[12px] text-[var(--ink-ghost)]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Conexão segura SSL</span>
            </div>
            <span className="text-[12px] text-[var(--ink-ghost)]">
              © 2026 <span className="text-[var(--acc)] font-medium">CytheraTech</span>
            </span>
          </div>
        </div>
      </main>

      <Modal
        open={modalRecuperar}
        onClose={() => setModalRecuperar(false)}
        title="Recuperar senha"
        size="sm"
        footer={
          <button type="button" className="btn-primary" onClick={() => setModalRecuperar(false)}>
            Entendi
          </button>
        }
      >
        <div className="flex flex-col items-center text-center gap-3 py-1">
          <div className="w-12 h-12 rounded-2xl bg-[var(--acc-pale)] border border-[var(--acc-border)] flex items-center justify-center">
            <Construction className="w-5 h-5 text-[var(--acc)]" />
          </div>
          <div>
            <p className="text-[15px] font-medium text-[var(--ink)] tracking-[-0.01em]">
              Em desenvolvimento
            </p>
            <p className="text-[13px] text-[var(--ink-faint)] mt-1.5 leading-relaxed">
              A recuperação de senha ainda não está disponível.
              Entre em contato com o suporte para redefinir o acesso.
            </p>
          </div>
          <a
            href="mailto:suporte@cytheratech.com.br"
            className="text-[13px] font-medium text-[var(--acc)] hover:underline"
          >
            suporte@cytheratech.com.br
          </a>
        </div>
      </Modal>
    </div>
  )
}
