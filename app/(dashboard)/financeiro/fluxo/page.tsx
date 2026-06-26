'use client'

import { useState } from 'react'
import { formatCurrency, cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts'

const fluxoDiario = [
  { dia: '01/12', entradas: 34000, saidas: 12000, saldo: 22000, acumulado: 312000 },
  { dia: '02/12', entradas: 0,     saidas: 27200, saldo: -27200, acumulado: 284800 },
  { dia: '03/12', entradas: 74500, saidas: 4800,  saldo: 69700, acumulado: 354500 },
  { dia: '04/12', entradas: 0,     saidas: 0,     saldo: 0,      acumulado: 354500 },
  { dia: '05/12', entradas: 0,     saidas: 12000, saldo: -12000, acumulado: 342500 },
  { dia: '08/12', entradas: 0,     saidas: 43120, saldo: -43120, acumulado: 299380 },
  { dia: '10/12', entradas: 120000,saidas: 0,     saldo: 120000, acumulado: 419380 },
  { dia: '15/12', entradas: 56000, saidas: 37730, saldo: 18270, acumulado: 437650 },
  { dia: '20/12', entradas: 0,     saidas: 43120, saldo: -43120, acumulado: 394530 },
  { dia: '25/12', entradas: 0,     saidas: 0,     saldo: 0,      acumulado: 394530 },
  { dia: '30/12', entradas: 43000, saidas: 0,     saldo: 43000,  acumulado: 437530 },
]

const fluxoMensal = [
  { mes: 'Jul', entradas: 280000, saidas: 195000, resultado: 85000 },
  { mes: 'Ago', entradas: 320000, saidas: 210000, resultado: 110000 },
  { mes: 'Set', entradas: 295000, saidas: 220000, resultado: 75000 },
  { mes: 'Out', entradas: 410000, saidas: 240000, resultado: 170000 },
  { mes: 'Nov', entradas: 385000, saidas: 228000, resultado: 157000 },
  { mes: 'Dez', entradas: 327500, saidas: 176970, resultado: 150530 },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function FluxoCaixaPage() {
  const [periodo, setPeriodo] = useState<'diario' | 'mensal'>('diario')

  const totalEntradas = fluxoMensal.reduce((s, m) => s + m.entradas, 0)
  const totalSaidas = fluxoMensal.reduce((s, m) => s + m.saidas, 0)
  const resultado = totalEntradas - totalSaidas
  const saldoAtual = 394530

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fluxo de Caixa</h1>
          <p className="text-slate-500 text-sm mt-0.5">Movimentações e projeções financeiras</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPeriodo('diario')} className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-colors', periodo === 'diario' ? 'bg-cyan-600 text-white' : 'bg-white text-slate-600 border border-slate-200')}>Diário</button>
          <button onClick={() => setPeriodo('mensal')} className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-colors', periodo === 'mensal' ? 'bg-cyan-600 text-white' : 'bg-white text-slate-600 border border-slate-200')}>Mensal</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Saldo Atual', value: formatCurrency(saldoAtual), color: 'text-slate-800', bg: 'from-cyan-500 to-blue-600', icon: <DollarSign size={18} className="text-white" />, textWhite: true },
          { label: 'Entradas (6M)', value: formatCurrency(totalEntradas), color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <TrendingUp size={18} className="text-emerald-500" /> },
          { label: 'Saídas (6M)', value: formatCurrency(totalSaidas), color: 'text-red-600', bg: 'bg-red-50', icon: <TrendingDown size={18} className="text-red-500" /> },
          { label: 'Resultado (6M)', value: formatCurrency(resultado), color: 'text-blue-600', bg: 'bg-blue-50', icon: <BarChart3 size={18} className="text-blue-500" /> },
        ].map((k, i) => (
          <div key={k.label} className={cn('rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-3', i === 0 ? 'bg-gradient-to-br ' + k.bg : 'bg-white')}>
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', i === 0 ? 'bg-white/20' : k.bg)}>{k.icon}</div>
            <div>
              <p className={cn('text-xs', i === 0 ? 'text-cyan-200' : 'text-slate-500')}>{k.label}</p>
              <p className={cn('text-lg font-bold', i === 0 ? 'text-white' : k.color)}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico principal */}
      {periodo === 'diario' ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Fluxo Diário — Dezembro 2024</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={fluxoDiario} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <defs>
                <linearGradient id="gradAcumulado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#e2e8f0" />
              <Area type="monotone" dataKey="acumulado" name="Saldo Acumulado" stroke="#06b6d4" fill="url(#gradAcumulado)" strokeWidth={2} />
              <Bar dataKey="entradas" name="Entradas" fill="#10b981" radius={[2, 2, 0, 0]} />
              <Bar dataKey="saidas" name="Saídas" fill="#f43f5e" radius={[2, 2, 0, 0]} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Fluxo Mensal — Jul–Dez 2024</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={fluxoMensal} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="entradas" name="Entradas" fill="#06b6d4" radius={[3, 3, 0, 0]} />
              <Bar dataKey="saidas" name="Saídas" fill="#f43f5e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="resultado" name="Resultado" fill="#2563eb" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabela detalhada */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Projeção {periodo === 'diario' ? 'Dezembro 2024' : 'Mensal'}</h2>
        </div>
        <table className="data-table">
          <thead><tr>
            <th>{periodo === 'diario' ? 'Data' : 'Mês'}</th>
            <th className="text-right">Entradas</th>
            <th className="text-right">Saídas</th>
            <th className="text-right">Resultado</th>
            {periodo === 'diario' && <th className="text-right">Saldo Acumulado</th>}
          </tr></thead>
          <tbody>
            {(periodo === 'diario' ? fluxoDiario : fluxoMensal).map((row: any) => {
              const resultado = (row.resultado ?? row.saldo)
              return (
                <tr key={row.dia ?? row.mes}>
                  <td className="font-medium text-slate-700">{row.dia ?? row.mes}</td>
                  <td className="text-right text-emerald-600 font-medium">{formatCurrency(row.entradas)}</td>
                  <td className="text-right text-red-500 font-medium">{formatCurrency(row.saidas)}</td>
                  <td className={cn('text-right font-bold', resultado >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                    {resultado >= 0 ? '+' : ''}{formatCurrency(resultado)}
                  </td>
                  {periodo === 'diario' && <td className="text-right font-bold text-cyan-700">{formatCurrency(row.acumulado)}</td>}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* IA Analysis */}
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-cyan-800 mb-1">⚡ NEXUS Agent — Análise de Caixa</p>
        <p className="text-sm text-cyan-700">
          Saldo atual de <strong>{formatCurrency(saldoAtual)}</strong> com tendência positiva. Pico de saída previsto em 08/12 ({formatCurrency(43120)}).
          Recomendo antecipar recebimento da IndTex Plásticos (parcela 2/2 = {formatCurrency(74500)}) para garantir cobertura.
          Resultado projetado para dezembro: <strong>{formatCurrency(150530)}</strong>.
        </p>
      </div>
    </div>
  )
}
