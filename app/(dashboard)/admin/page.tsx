'use client'

import { useState, useEffect, useRef } from 'react'
import { Shield, Lock, Eye, EyeOff, AlertTriangle, Users, DollarSign, TrendingUp, FileText, Clock, CheckCircle } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { loadData, saveData, genId } from '@/lib/storage'

interface LogAuditoria {
  id: string; ts: string; usuario: string; acao: string; modulo: string; detalhe: string
}

const LOGS_SEED: LogAuditoria[] = [
  { id:'log-001', ts:'2024-12-01 08:32', usuario:'Wanderson Lima', acao:'Acesso ADM', modulo:'Admin', detalhe:'Área ADM acessada' },
  { id:'log-002', ts:'2024-12-01 09:15', usuario:'Wanderson Lima', acao:'Alteração comissão', modulo:'Vendedores', detalhe:'Faixa 3 alterada: 3% → 3.5%' },
  { id:'log-003', ts:'2024-12-01 10:44', usuario:'Wanderson Lima', acao:'Transferência carteira', modulo:'CRM', detalhe:'3 clientes transferidos de Carlos Souza → Ana Lima' },
  { id:'log-004', ts:'2024-11-30 14:20', usuario:'Wanderson Lima', acao:'Alteração alíquota', modulo:'Calculadora', detalhe:'II Resina Epóxi: 10% → 12%' },
  { id:'log-005', ts:'2024-11-29 16:05', usuario:'Wanderson Lima', acao:'Acesso ADM', modulo:'Admin', detalhe:'Área ADM acessada' },
]

const SENHA_ADM = 'adm2024'
const TIMEOUT_MS = 15 * 60 * 1000

export default function AdminPage() {
  const [autenticado, setAutenticado] = useState(false)
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [aba, setAba] = useState<'dashboard' | 'auditoria' | 'config'>('dashboard')
  const [logs, setLogs] = useState<LogAuditoria[]>(() => loadData('audit_logs', LOGS_SEED))
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [tempoRestante, setTempoRestante] = useState(TIMEOUT_MS)
  const [configTimeout, setConfigTimeout] = useState(15)

  function resetTimer() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setTempoRestante(configTimeout * 60 * 1000)
    timerRef.current = setTimeout(() => { setAutenticado(false); setSenha('') }, configTimeout * 60 * 1000)
  }

  useEffect(() => {
    if (!autenticado) return
    resetTimer()
    const tick = setInterval(() => setTempoRestante(p => Math.max(0, p - 1000)), 1000)
    return () => { clearInterval(tick); if (timerRef.current) clearTimeout(timerRef.current) }
  }, [autenticado, configTimeout])

  function autenticar() {
    if (senha === SENHA_ADM) {
      setAutenticado(true)
      setErro('')
      const log: LogAuditoria = { id: genId('log'), ts: new Date().toLocaleString('pt-BR').replace(',',''), usuario: 'Wanderson Lima', acao: 'Acesso ADM', modulo: 'Admin', detalhe: 'Área ADM acessada com re-autenticação' }
      const novosLogs = [log, ...logs]
      saveData('audit_logs', novosLogs)
      setLogs(novosLogs)
    } else {
      setErro('Senha incorreta')
    }
  }

  const minutos = Math.floor(tempoRestante / 60000)
  const segundos = Math.floor((tempoRestante % 60000) / 1000)

  if (!autenticado) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] animate-fade-up">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-10 w-full max-w-sm">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center shadow-xl">
              <Shield size={28} className="text-cyan-400" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-slate-800 text-center mb-1">Área Administrativa</h1>
          <p className="text-sm text-slate-400 text-center mb-6">Re-autenticação necessária</p>
          <div className="space-y-3">
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={e => setSenha(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && autenticar()}
                placeholder="Senha ADM"
                className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400"
              />
              <button onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {mostrarSenha ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {erro && <p className="text-xs text-red-500 text-center">{erro}</p>}
            <button onClick={autenticar}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#0c1829,#162035)' }}>
              Entrar na área ADM
            </button>
          </div>
          <p className="text-[10px] text-slate-300 text-center mt-4">Sessão expira após {configTimeout} min de inatividade</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-up" onMouseMove={resetTimer} onKeyDown={resetTimer}>
      {/* Header com timer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center">
            <Shield size={18} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Área Administrativa</h1>
            <p className="text-slate-500 text-sm">Acesso restrito — somente admin</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium', tempoRestante < 120000 ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')}>
            <Clock size={13} />
            Sessão: {minutos}:{String(segundos).padStart(2,'0')}
          </div>
          <button onClick={() => { setAutenticado(false); setSenha('') }} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors">
            Encerrar sessão
          </button>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-2">
        {[{ k:'dashboard', l:'Dashboard Sensível' }, { k:'auditoria', l:'Log de Auditoria' }, { k:'config', l:'Configurações' }].map(a => (
          <button key={a.k} onClick={() => setAba(a.k as any)}
            className={cn('px-4 py-2 rounded-xl text-sm font-semibold transition-colors', aba === a.k ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50')}>
            {a.l}
          </button>
        ))}
      </div>

      {/* ABA DASHBOARD SENSÍVEL */}
      {aba === 'dashboard' && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {[
              { l:'Faturamento Real YTD', v:'R$ 3.245.500', delta:'+12,4%', icon:<DollarSign size={18} className="text-cyan-500" />, bg:'bg-cyan-50' },
              { l:'Lucro Líquido Real', v:'R$ 1.105.530', delta:'34,1% margem', icon:<TrendingUp size={18} className="text-emerald-500" />, bg:'bg-emerald-50' },
              { l:'Comissão total paga', v:'R$ 48.750', delta:'Dez/2024', icon:<Users size={18} className="text-blue-500" />, bg:'bg-blue-50' },
              { l:'Custo Importações', v:'R$ 612.800', delta:'6 processos', icon:<FileText size={18} className="text-violet-500" />, bg:'bg-violet-50' },
            ].map(k => (
              <div key={k.l} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', k.bg)}>{k.icon}</div>
                <div><p className="text-xs text-slate-500">{k.l}</p><p className="text-xl font-bold text-slate-900">{k.v}</p><p className="text-xs text-slate-400">{k.delta}</p></div>
              </div>
            ))}
          </div>

          {/* Comissões por vendedor */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100"><h3 className="font-semibold text-slate-800">Comissões por Vendedor — Dez/2024</h3></div>
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-100"><th className="text-left px-5 py-2.5 text-xs text-slate-500 font-medium">Vendedor</th><th className="text-right px-5 py-2.5 text-xs text-slate-500 font-medium">Faturamento</th><th className="text-right px-5 py-2.5 text-xs text-slate-500 font-medium">Margem</th><th className="text-right px-5 py-2.5 text-xs text-slate-500 font-medium">% Faixa</th><th className="text-right px-5 py-2.5 text-xs text-slate-500 font-medium">Comissão</th></tr></thead>
              <tbody>
                {[
                  { nome:'Carlos Souza',   fat:485000, margem:34.6, pct:2.5, comissao:12125 },
                  { nome:'Wanderson Lima', fat:327500, margem:35.1, pct:3.5, comissao:11463 },
                  { nome:'Ana Lima',       fat:298000, margem:34.2, pct:2.5, comissao:7450 },
                  { nome:'Marcos Pereira', fat:215000, margem:34.4, pct:2.5, comissao:5375 },
                ].map(v => (
                  <tr key={v.nome} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{v.nome}</td>
                    <td className="px-5 py-3 text-right">{formatCurrency(v.fat)}</td>
                    <td className="px-5 py-3 text-right text-emerald-600 font-semibold">{v.margem}%</td>
                    <td className="px-5 py-3 text-right">{v.pct}%</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-900">{formatCurrency(v.comissao)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA AUDITORIA */}
      {aba === 'auditoria' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Log de Auditoria</h3>
            <span className="text-xs text-slate-400">{logs.length} registros</span>
          </div>
          <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
            {logs.map(l => (
              <div key={l.id} className="px-5 py-3 flex items-start gap-4 hover:bg-slate-50">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield size={13} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-800">{l.acao}</span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{l.modulo}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{l.detalhe}</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">{l.usuario} · {l.ts}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA CONFIG */}
      {aba === 'config' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Timeout da sessão ADM (minutos)</label>
            <div className="flex items-center gap-4">
              <input type="range" min="5" max="60" value={configTimeout} onChange={e => setConfigTimeout(Number(e.target.value))} className="flex-1" />
              <span className="text-lg font-bold text-cyan-600 w-16">{configTimeout} min</span>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">Alíquotas PIS/COFINS-Importação</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">PIS-Importação (%)</label>
                <input type="number" step="0.01" defaultValue={2.10} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">COFINS-Importação (%)</label>
                <input type="number" step="0.01" defaultValue={9.65} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
              </div>
            </div>
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1"><AlertTriangle size={11} /> Alíquotas definidas por lei — alterar somente após mudança legislativa.</p>
          </div>
        </div>
      )}
    </div>
  )
}
