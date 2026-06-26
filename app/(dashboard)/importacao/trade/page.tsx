'use client'

import { formatCurrency, cn } from '@/lib/utils'
import { Ship, Globe, Clock, TrendingDown, BarChart3, Package, DollarSign, Zap } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

const importacoesPorMes = [
  { mes: 'Jul', valor: 82000, processos: 2 },
  { mes: 'Ago', valor: 95000, processos: 3 },
  { mes: 'Set', valor: 68000, processos: 2 },
  { mes: 'Out', valor: 124000, processos: 4 },
  { mes: 'Nov', valor: 110000, processos: 3 },
  { mes: 'Dez', valor: 133650, processos: 3 },
]

const leadTimePorFornecedor = [
  { fornecedor: 'Hunan Chemical', leadtime: 43, desembaraco: 4 },
  { fornecedor: 'GZ Poly', leadtime: 40, desembaraco: 5 },
  { fornecedor: 'SinoResin', leadtime: 52, desembaraco: 6 },
]

const cambioHistorico = [
  { mes: 'Jul', cny: 0.73, usd: 4.95 },
  { mes: 'Ago', cny: 0.74, usd: 4.98 },
  { mes: 'Set', cny: 0.75, usd: 5.01 },
  { mes: 'Out', cny: 0.76, usd: 5.04 },
  { mes: 'Nov', cny: 0.76, usd: 5.05 },
  { mes: 'Dez', cny: 0.77, usd: 5.05 },
]

const mixOrigem = [
  { name: 'China', value: 85, fill: '#06b6d4' },
  { name: 'Brasil', value: 12, fill: '#2563eb' },
  { name: 'Alemanha', value: 3, fill: '#7c3aed' },
]

const processosAtivos = [
  { numero: 'IMP-2024-001', fornecedor: 'Hunan Chemical', status: 'Desembaraço', eta: '28/11', diasAtraso: 3, valor: 56300 },
  { numero: 'IMP-2024-002', fornecedor: 'GZ Poly Materials', status: 'Em Trânsito', eta: '18/12', diasAtraso: 0, valor: 37730 },
  { numero: 'IMP-2024-003', fornecedor: 'SinoResin Chemical', status: 'Pedido', eta: '25/01', diasAtraso: 0, valor: 21680 },
]

export default function TradeDashboardPage() {
  const totalImportado6m = importacoesPorMes.reduce((s, m) => s + m.valor, 0)
  const leadTimeMedio = Math.round(leadTimePorFornecedor.reduce((s, f) => s + f.leadtime, 0) / leadTimePorFornecedor.length)

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Trade Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Análise de importações e inteligência cambial</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-cyan-50 border border-cyan-200 rounded-xl">
          <Globe size={15} className="text-cyan-600" />
          <span className="text-sm font-semibold text-cyan-700">Importações China & Mundo</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Importado (6M)', value: formatCurrency(totalImportado6m), icon: <DollarSign size={18} className="text-cyan-500" />, bg: 'bg-cyan-50' },
          { label: 'Containers Ativos', value: '2', icon: <Ship size={18} className="text-blue-500" />, bg: 'bg-blue-50' },
          { label: 'Lead Time Médio', value: `${leadTimeMedio} dias`, icon: <Clock size={18} className="text-amber-500" />, bg: 'bg-amber-50' },
          { label: 'Desp. Aduaneiro Médio', value: '5 dias', icon: <BarChart3 size={18} className="text-emerald-500" />, bg: 'bg-emerald-50' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', k.bg)}>{k.icon}</div>
            <div><p className="text-xs text-slate-500">{k.label}</p><p className="text-lg font-bold text-slate-800">{k.value}</p></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Volume de importações */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Volume Importado por Mês (R$)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={importacoesPorMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip formatter={(v: any, n: any) => [n === 'valor' ? formatCurrency(v) : v, n === 'valor' ? 'Valor' : 'Processos']} />
              <Bar dataKey="valor" name="valor" fill="#06b6d4" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Câmbio histórico */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Evolução Cambial — CNY e USD</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={cambioHistorico}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip formatter={(v: any, n: any) => [`R$ ${v.toFixed(3)}`, n === 'cny' ? 'CNY/BRL' : 'USD/BRL']} />
              <Line type="monotone" dataKey="cny" name="cny" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3, fill: '#06b6d4' }} />
              <Line type="monotone" dataKey="usd" name="usd" stroke="#2563eb" strokeWidth={2} dot={{ r: 3, fill: '#2563eb' }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-slate-500">
            <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-cyan-500" />CNY atual: R$ 0,770</div>
            <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-blue-600" />USD atual: R$ 5,050</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Lead time por fornecedor */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Lead Time por Fornecedor (dias)</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={leadTimePorFornecedor} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis type="category" dataKey="fornecedor" tick={{ fontSize: 11, fill: '#64748b' }} width={110} />
              <Tooltip />
              <Bar dataKey="leadtime" name="Lead Time Total" fill="#06b6d4" radius={[0, 3, 3, 0]} />
              <Bar dataKey="desembaraco" name="Desembaraço" fill="#2563eb" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Mix de origem */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Mix por País de Origem</h2>
          <div className="flex flex-col items-center">
            <PieChart width={140} height={140}>
              <Pie data={mixOrigem} cx={70} cy={70} innerRadius={42} outerRadius={65} dataKey="value" paddingAngle={3}>
                {mixOrigem.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
              <Tooltip formatter={(v: any) => `${v}%`} />
            </PieChart>
            <div className="w-full space-y-1.5 mt-2">
              {mixOrigem.map(c => (
                <div key={c.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.fill }} />
                    <span className="text-xs text-slate-600">{c.name}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-800">{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Processos ativos */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Processos Ativos</h2>
          <a href="/importacao" className="text-xs text-cyan-600 hover:underline">Ver todos →</a>
        </div>
        <table className="data-table">
          <thead><tr><th>Processo</th><th>Fornecedor</th><th>Status</th><th>ETA</th><th className="text-right">Valor (BRL)</th><th>Situação</th></tr></thead>
          <tbody>
            {processosAtivos.map(p => (
              <tr key={p.numero}>
                <td className="font-mono text-xs text-cyan-700">{p.numero}</td>
                <td className="font-medium text-slate-800">{p.fornecedor}</td>
                <td><span className="badge-blue text-xs">{p.status}</span></td>
                <td className="text-slate-500 text-sm">{p.eta}</td>
                <td className="text-right font-bold text-slate-800">{formatCurrency(p.valor)}</td>
                <td>
                  {p.diasAtraso > 0
                    ? <span className="text-xs font-semibold text-red-600">⚠ {p.diasAtraso}d atraso</span>
                    : <span className="text-xs font-semibold text-emerald-600">✓ No prazo</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* IA Trade */}
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-4 flex items-start gap-3">
        <Zap size={16} className="text-cyan-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-cyan-800">NEXUS Agent — Inteligência Trade</p>
          <p className="text-sm text-cyan-700 mt-1">
            CNY/BRL em alta (+5,5% vs Jan). Recomendo antecipar próxima ordem Hunan Chemical antes de novo ajuste cambial (economia estimada: R$ 4.200).
            IMP-2024-001 em desembaraço há 3 dias — acione Despacho Alfa para verificar pendência.
            Lead time SinoResin (52 dias) acima da média — avaliar fornecedor alternativo para Q1 2025.
          </p>
        </div>
      </div>
    </div>
  )
}
