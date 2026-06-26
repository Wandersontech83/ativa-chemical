'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, Zap, Shield, BarChart2, Package } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Credenciais inválidas')
      toast.success(`Bem-vindo, ${data.user.name}!`)
      router.push('/dashboard')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  const demoUsers = [
    { label: 'Administrador',    email: 'admin@ativachemical.com.br',   desc: 'Acesso total ao sistema' },
    { label: 'Gestor Comercial', email: 'gestor@ativachemical.com.br',  desc: 'CRM, pedidos e financeiro' },
    { label: 'Analista',         email: 'analista@ativachemical.com.br', desc: 'Estoque e consultas' },
  ]

  const features = [
    { icon: BarChart2, label: 'Dashboard analítico em tempo real' },
    { icon: Package,   label: 'Gestão de estoque com leitor NF-e' },
    { icon: Zap,       label: 'Agente IA monitorando 24/7' },
    { icon: Shield,    label: 'Emissão de NF-e integrada ao SEFAZ' },
  ]

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Painel esquerdo */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-14 overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0c1829 0%, #162035 50%, #091320 100%)' }}
      >
        {/* Grid bg */}
        <div className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(6,182,212,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.08) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Glow orbs — brand colors */}
        <div className="absolute top-20 right-20 w-80 h-80 rounded-full blur-[80px]"
          style={{ background: 'radial-gradient(ellipse, rgba(6,182,212,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-32 left-10 w-60 h-60 rounded-full blur-[60px]"
          style={{ background: 'radial-gradient(ellipse, rgba(37,99,235,0.10) 0%, transparent 70%)' }} />

        {/* Top */}
        <div className="relative z-10">
          {/* Logo real em fundo branco */}
          <div className="mb-16">
            <div className="inline-block bg-white rounded-2xl px-5 py-3 shadow-lg">
              <Image
                src="/logo.svg"
                alt="Ativa Chemical"
                width={200}
                height={56}
                className="h-12 w-auto object-contain"
                priority
              />
            </div>
          </div>

          <h1 className="font-display text-4xl font-bold text-white leading-tight mb-4">
            Gestão inteligente<br />
            <span style={{ background: 'linear-gradient(135deg, #22d3ee, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              para sua operação
            </span><br />
            química
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-md">
            ERP + CRM completo com automação N8N, Agente IA e emissão de NF-e
            integrada para distribuidoras de produtos químicos industriais.
          </p>
        </div>

        {/* Features */}
        <div className="relative z-10">
          <div className="grid grid-cols-2 gap-3">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.label} className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-2xl px-4 py-3 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-cyan-400" />
                  </div>
                  <span className="text-slate-300 text-xs font-medium leading-tight">{f.label}</span>
                </div>
              )
            })}
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex -space-x-2">
              {['C', 'A', 'L'].map((l, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0f172a] flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: ['#06b6d4','#2563eb','#10b981'][i] }}>
                  {l}
                </div>
              ))}
            </div>
            <p className="text-slate-400 text-xs">
              Carlos, Ana e Lucas usando agora<br />
              <span className="text-emerald-400 font-medium">● Sistema operacional</span>
            </p>
          </div>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#f8fafc]">
        <div className="w-full max-w-[380px]">
          {/* Logo mobile */}
          <div className="flex items-center justify-center mb-8 lg:hidden">
            <Image
              src="/logo.svg"
              alt="Ativa Chemical"
              width={180}
              height={50}
              className="h-10 w-auto object-contain"
              priority
            />
          </div>

          {/* Card form */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
            <h2 className="font-display text-2xl font-bold text-slate-900 mb-1">Entrar</h2>
            <p className="text-slate-400 text-sm mb-6">Acesse com suas credenciais corporativas</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="form-label">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="seuemail@ativachemical.com.br"
                  required autoComplete="email"
                />
              </div>

              <div>
                <label className="form-label">Senha</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="form-input pr-10"
                    placeholder="••••••••"
                    required autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary w-full justify-center py-2.5 mt-2 text-base">
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Entrando...' : 'Entrar no sistema'}
              </button>
            </form>

            {/* Demo */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
                Acesso rápido — Demo
              </p>
              <div className="space-y-2">
                {demoUsers.map(u => (
                  <button key={u.email} type="button"
                    onClick={() => { setEmail(u.email); setPassword('ativa2024') }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-cyan-50 hover:border-cyan-200 border border-transparent transition-all text-left group"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-700 group-hover:text-cyan-700">{u.label}</div>
                      <div className="text-[11px] text-slate-400">{u.desc}</div>
                    </div>
                    <div className="text-[10px] text-slate-300 group-hover:text-cyan-500 font-mono">→</div>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-3 text-center">
                Senha demo: <code className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-lg font-mono">ativa2024</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
