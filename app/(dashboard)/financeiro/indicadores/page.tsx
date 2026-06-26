'use client'

import { formatCurrency, cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Percent, AlertTriangle } from 'lucide-react'
import { RadialBarChart, RadialBar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const indicadores = {
  faturamento: 1925000,
  custo_produtos: 1155000,
  despesas_operacionais: 228000,
  resultado_operacional: 542000,
  ebitda: 580000,
  margem_bruta: 40.0,
  margem_liquida: 28.2,
  inadimplencia: 4.5,
  liquidez_corrente: 2.4,
  receita_recorrente: 720000,
}

const evolucaoFaturamento = [
  { mes: 'Jul', valor: 280000, lucro: 75000 },
  { mes: 'Ago', valor: 320000, lucro: 92000 },
  { mes: 'Set', valor: 295000, lucro: 81000 },
  { mes: 'Out', valor: 410000, lucro: 128000 },
  { mes: 'Nov', valor: 385000, lucro: 110000 },
  { mes: 'Dez', valor: 327500, lucro: 95000 },
]

const composicaoReceita = [
  { name: 'Solventes', value: 38, fill: '#06b6d4' },
  { name: 'Resinas', value: 24, fill: '#2563eb' },
  { name: 'Pigmentos', value: 20, fill: '#7c3aed' },
  { name: 'Aditivos', value: 12, fill: '#0891b2' },
  { name: 'Outros', value: 6, fill: '#64748b' },
]

const radialData = [{ name: 'Margem Bruta', value: indicadores.margem_bruta, fill: '#06b6d4' }]

const KPICard = ({ label, value, sub, trend, color, icon }: any) => (
  <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm text-slate-500">{label}</p>
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', color === 'cyan' ? 'bg-cyan-50' : color === 'green' ? 'bg-emerald-50' : color === 'red' ? 'bg-red-50' : 'bg-blue-50')}>
        {icon}
      </div>
    </div>
    <p className="text-2xl font-bold text-slate-800">{value}</p>
    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    {trend !== undefined && (
      <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', trend >= 0 ? 'text-emerald-600' : 'text-red-600')}>
        {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {trend >= 0 ? '+' : ''}{trend}% vs mês anterior
      </div>
    )}
  </div>
)

export default function IndicadoresPage() {
  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Indicadores Financeiros</h1>
        <p className="text-slate-500 text-sm mt-0.5">Performance acumulada 2024 — Jan a Dez</p>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Faturamento Bruto" value={formatCurrency(indicadores.faturamento)} sub="Acumulado 2024" trend={8.5} color="cyan" icon={<DollarSign size={16} className="text-cyan-600" />} />
        <KPICard label="EBITDA" value={formatCurrency(indicadores.ebitda)} sub={`Margem: ${(indicadores.ebitda / indicadores.faturamento * 100).toFixed(1)}%`} trend={12.3} color="green" icon={<BarChart3 size={16} className="text-emerald-600" />} />
        <KPICard label="Resultado Operacional" value={formatCurrency(indicadores.resultado_operacional)} sub="Após despesas fixas" trend={6.1} color="blue" icon={<TrendingUp size={16} className="text-blue-600" />} />
        <KPICard label="Receita Recorrente" value={formatCurrency(indicadores.receita_recorrente)} sub="Contratos + recompras" trend={4.2} color="cyan" icon={<Percent size={16} className="text-cyan-600" />} />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Margem Bruta" value={`${indicadores.margem_bruta}%`} sub="Após CPV" trend={1.2} color="green" icon={<Percent size={16} className="text-emerald-600" />} />
        <KPICard label="Margem Líquida" value={`${indicadores.margem_liquida}%`} sub="Após IR estimado" trend={0.8} color="blue" icon={<Percent size={16} className="text-blue-600" />} />
        <KPICard label="Inadimplência" value={`${indicadores.inadimplencia}%`} sub="Sobre faturamento" trend={-0.5} color="red" icon={<AlertTriangle size={16} className="text-red-500" />} />
        <KPICard label="Liquidez Corrente" value={`${indicadores.liquidez_corrente}x`} sub="Meta: > 1,5x" color="green" icon={<DollarSign size={16} className="text-emerald-600" />} />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-2 gap-5">
        {/* Evolução Faturamento */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Evolução — Faturamento vs Lucro</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={evolucaoFaturamento} margin={{ top: 5, right: 15, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip formatter={(v: any) => formatCurrency(v)} />
              <Line type="monotone" dataKey="valor" name="Faturamento" stroke="#06b6d4" strokeWidth={2.5} dot={{ fill: '#06b6d4', r: 4 }} />
              <Line type="monotone" dataKey="lucro" name="Lucro" stroke="#2563eb" strokeWidth={2.5} dot={{ fill: '#2563eb', r: 4 }} strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Composição de Receita */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Composição da Receita por Categoria</h2>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={composicaoReceita} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {composicaoReceita.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(v: any) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {composicaoReceita.map(c => (
                <div key={c.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c.fill }} />
                  <span className="text-sm text-slate-600 flex-1">{c.name}</span>
                  <span className="text-sm font-bold text-slate-800">{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Demonstração de Resultado */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-800 to-slate-700">
          <h2 className="font-semibold text-white">DRE Simplificada — 2024</h2>
        </div>
        <div className="p-5 space-y-2 text-sm">
          {[
            { label: 'Receita Bruta de Vendas', value: indicadores.faturamento, level: 0, type: 'positive' },
            { label: '(-) Custo dos Produtos Vendidos (CPV)', value: -indicadores.custo_produtos, level: 1, type: 'negative' },
            { label: '= Lucro Bruto', value: indicadores.faturamento - indicadores.custo_produtos, level: 0, type: 'total' },
            { label: '(-) Despesas Operacionais', value: -indicadores.despesas_operacionais, level: 1, type: 'negative' },
            { label: '= EBITDA', value: indicadores.ebitda, level: 0, type: 'ebitda' },
            { label: '(-) Depreciação e Amortização (est.)', value: -38000, level: 1, type: 'negative' },
            { label: '= Resultado Operacional (EBIT)', value: indicadores.resultado_operacional, level: 0, type: 'total' },
            { label: '(-) Impostos Estimados (12%)', value: -(indicadores.resultado_operacional * 0.12), level: 1, type: 'negative' },
            { label: '= Lucro Líquido', value: indicadores.resultado_operacional * 0.88, level: 0, type: 'final' },
          ].map(row => (
            <div key={row.label} className={cn('flex items-center justify-between py-1.5', row.level === 0 ? 'border-t border-slate-100' : 'pl-4', row.type === 'total' || row.type === 'ebitda' || row.type === 'final' ? 'font-bold' : '')}>
              <span className={cn(row.level === 1 ? 'text-slate-500' : 'text-slate-700')}>{row.label}</span>
              <span className={cn(
                'font-semibold',
                row.type === 'final' ? 'text-cyan-700 text-base' : row.type === 'ebitda' ? 'text-blue-700' : row.type === 'total' ? 'text-slate-800' : row.value < 0 ? 'text-red-600' : 'text-emerald-600'
              )}>
                {row.value < 0 ? `(${formatCurrency(Math.abs(row.value))})` : formatCurrency(row.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
