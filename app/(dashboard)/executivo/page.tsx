'use client'

import { formatCurrency, cn } from '@/lib/utils'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Users, Package, Ship, BarChart3, AlertTriangle, Zap, CheckCircle } from 'lucide-react'

const faturamentoMensal = [
  { mes: 'Jan', faturamento: 180000, despesas: 130000, lucro: 50000 },
  { mes: 'Fev', faturamento: 210000, despesas: 145000, lucro: 65000 },
  { mes: 'Mar', faturamento: 245000, despesas: 160000, lucro: 85000 },
  { mes: 'Abr', faturamento: 228000, despesas: 155000, lucro: 73000 },
  { mes: 'Mai', faturamento: 290000, despesas: 175000, lucro: 115000 },
  { mes: 'Jun', faturamento: 275000, despesas: 170000, lucro: 105000 },
  { mes: 'Jul', faturamento: 280000, despesas: 178000, lucro: 102000 },
  { mes: 'Ago', faturamento: 320000, despesas: 195000, lucro: 125000 },
  { mes: 'Set', faturamento: 295000, despesas: 188000, lucro: 107000 },
  { mes: 'Out', faturamento: 410000, despesas: 240000, lucro: 170000 },
  { mes: 'Nov', faturamento: 385000, despesas: 228000, lucro: 157000 },
  { mes: 'Dez', faturamento: 327500, despesas: 176970, lucro: 150530 },
]

const performanceClientes = [
  { cliente: 'PetroSul', valor: 500000 },
  { cliente: 'IndTex', valor: 385000 },
  { cliente: 'Agroquim', valor: 320000 },
  { cliente: 'Nordeste Q.', valor: 280000 },
  { cliente: 'Fab Têxtil', valor: 120000 },
]

const mixProdutos = [
  { name: 'Solventes', value: 38, fill: '#06b6d4' },
  { name: 'Resinas', value: 24, fill: '#2563eb' },
  { name: 'Pigmentos', value: 20, fill: '#7c3aed' },
  { name: 'Aditivos', value: 12, fill: '#0891b2' },
  { name: 'Outros', value: 6, fill: '#64748b' },
]

const kpiCards = [
  { label: 'Faturamento YTD', value: formatCurrency(3245500), delta: '+12.4%', up: true, icon: <DollarSign size={20} />, color: 'cyan' },
  { label: 'Lucro Líquido', value: formatCurrency(1105530), delta: '+8.7%', up: true, icon: <TrendingUp size={20} />, color: 'green' },
  { label: 'Margem Bruta', value: '40,0%', delta: '+1.2pp', up: true, icon: <BarChart3 size={20} />, color: 'blue' },
  { label: 'Clientes Ativos', value: '4', delta: '-1 inativo', up: false, icon: <Users size={20} />, color: 'purple' },
  { label: 'Importações Ativas', value: '3', delta: '1 em desembaraço', up: true, icon: <Ship size={20} />, color: 'cyan' },
  { label: 'Estoque Crítico', value: '1 item', delta: 'Acetato de Etila', up: false, icon: <Package size={20} />, color: 'red' },
  { label: 'Inadimplência', value: '4,5%', delta: '-0.5pp', up: true, icon: <AlertTriangle size={20} />, color: 'amber' },
  { label: 'Contratos Ativos', value: '2', delta: '1 vencendo', up: false, icon: <CheckCircle size={20} />, color: 'green' },
]

const COLOR_MAP: Record<string, string> = {
  cyan: 'from-cyan-500 to-cyan-600', green: 'from-emerald-500 to-emerald-600',
  blue: 'from-blue-500 to-blue-600', purple: 'from-violet-500 to-violet-600',
  red: 'from-red-500 to-red-600', amber: 'from-amber-500 to-amber-600',
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.name}: {typeof p.value === 'number' && p.value > 999 ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

export default function ExecutivoPage() {
  const totalFaturamento = faturamentoMensal.reduce((s, m) => s + m.faturamento, 0)
  const totalLucro = faturamentoMensal.reduce((s, m) => s + m.lucro, 0)

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Painel Executivo</h1>
          <p className="text-slate-500 text-sm mt-0.5">Visão consolidada — Jan a Dez 2024</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl">
          <Zap size={14} className="text-cyan-400" />
          <span className="text-sm text-white font-medium">NEXUS Intelligence</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        {kpiCards.map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">{k.label}</p>
              <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white', COLOR_MAP[k.color])}>
                {k.icon}
              </div>
            </div>
            <p className="text-xl font-bold text-slate-800">{k.value}</p>
            <div className={cn('flex items-center gap-1 mt-1 text-xs font-medium', k.up ? 'text-emerald-600' : 'text-red-500')}>
              {k.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {k.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Faturamento Anual */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-slate-800">Faturamento, Despesas & Lucro — 2024</h2>
            <p className="text-xs text-slate-400 mt-0.5">Total: {formatCurrency(totalFaturamento)} • Lucro: {formatCurrency(totalLucro)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Margem média</p>
            <p className="text-lg font-bold text-cyan-600">{((totalLucro / totalFaturamento) * 100).toFixed(1)}%</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={faturamentoMensal} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
            <defs>
              <linearGradient id="gradFat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradLucro" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="faturamento" name="Faturamento" stroke="#06b6d4" fill="url(#gradFat)" strokeWidth={2.5} />
            <Area type="monotone" dataKey="despesas" name="Despesas" stroke="#f43f5e" fill="none" strokeWidth={1.5} strokeDasharray="4 2" />
            <Area type="monotone" dataKey="lucro" name="Lucro" stroke="#10b981" fill="url(#gradLucro)" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Performance por cliente */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Performance por Cliente (Top 5)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={performanceClientes} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis type="category" dataKey="cliente" tick={{ fontSize: 11, fill: '#64748b' }} width={70} />
              <Tooltip formatter={(v: any) => formatCurrency(v)} />
              <Bar dataKey="valor" name="Faturamento" fill="url(#gradBar)" radius={[0, 4, 4, 0]}>
                <defs>
                  <linearGradient id="gradBar" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
                {performanceClientes.map((_, i) => (
                  <Cell key={i} fill={`hsl(${195 + i * 15}, 80%, ${55 - i * 5}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Mix de produtos */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Mix de Produtos</h2>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie data={mixProdutos} cx="50%" cy="50%" innerRadius={60} outerRadius={88} dataKey="value" paddingAngle={3}>
                  {mixProdutos.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(v: any) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2.5">
              {mixProdutos.map(c => (
                <div key={c.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.fill }} />
                  <span className="text-sm text-slate-600 flex-1">{c.name}</span>
                  <span className="text-sm font-bold text-slate-800">{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status Operacional */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            title: 'Financeiro', icon: <DollarSign size={16} className="text-emerald-600" />, color: 'emerald',
            items: [
              { label: 'A Receber', value: formatCurrency(328000), ok: true },
              { label: 'A Pagar', value: formatCurrency(120850), ok: true },
              { label: 'Saldo Caixa', value: formatCurrency(394530), ok: true },
            ]
          },
          {
            title: 'Importações Ativas', icon: <Ship size={16} className="text-cyan-600" />, color: 'cyan',
            items: [
              { label: 'IMP-2024-001', value: 'Desembaraço', ok: true },
              { label: 'IMP-2024-002', value: 'Em Trânsito (18d)', ok: true },
              { label: 'IMP-2024-003', value: 'Pedido', ok: false },
            ]
          },
          {
            title: 'Alertas Ativos', icon: <AlertTriangle size={16} className="text-amber-600" />, color: 'amber',
            items: [
              { label: '2 Críticos', value: 'Inadimplência + Estoque', ok: false },
              { label: '2 Altos', value: 'Contrato + Pagamento', ok: false },
              { label: '2 Informativos', value: 'Fluxo + Estoque', ok: true },
            ]
          }
        ].map(panel => (
          <div key={panel.title} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              {panel.icon}
              <h3 className="font-semibold text-slate-800 text-sm">{panel.title}</h3>
            </div>
            <div className="space-y-2">
              {panel.items.map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{item.label}</span>
                  <span className={cn('text-xs font-semibold', item.ok ? 'text-emerald-600' : 'text-amber-600')}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* IA Executive Summary */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-5 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={16} className="text-cyan-400" />
          <span className="font-semibold text-cyan-300">NEXUS Agent — Resumo Executivo</span>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">
          A Ativa Chemical encerra 2024 com faturamento de <strong className="text-white">{formatCurrency(totalFaturamento)}</strong> e lucro líquido de <strong className="text-cyan-300">{formatCurrency(totalLucro)}</strong>
          {' '}(margem {((totalLucro / totalFaturamento) * 100).toFixed(1)}%). Destaques positivos: crescimento de 12,4% YoY, margem bruta em expansão (+1,2pp) e 3 importações ativas garantindo estoque para Q1 2025.
          Pontos de atenção: Fab Têxtil Nordeste inadimplente (R$ 43k), contrato Hunan Chemical vencendo em 28 dias e estoque crítico de Acetato de Etila.
          <strong className="text-white"> Recomendação: </strong>priorizar cobrança Fab Têxtil, renovar CT-2024-003 e emitir OC urgente para Acetato de Etila.
        </p>
      </div>
    </div>
  )
}
