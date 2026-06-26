'use client'

import { useState } from 'react'
import { formatCurrency, formatDate, STATUS_LABELS, STATUS_COLORS, cn } from '@/lib/utils'
import { Plus, TrendingDown, DollarSign } from 'lucide-react'

const DEMO_DESPESAS = [
  { id: '1', categoria: 'Aluguel', descricao: 'Aluguel escritório e armazém - Junho', valor: 8500, data_lancamento: '2024-06-01', data_vencimento: '2024-06-10', status: 'pago' },
  { id: '2', categoria: 'Salarios', descricao: 'Folha de pagamento - Junho', valor: 28500, data_lancamento: '2024-06-30', data_vencimento: '2024-06-30', status: 'pendente' },
  { id: '3', categoria: 'Software', descricao: 'Microsoft 365 Business', valor: 890, data_lancamento: '2024-06-05', data_vencimento: '2024-06-10', status: 'pago' },
  { id: '4', categoria: 'Impostos', descricao: 'DAS - Simples Nacional junho', valor: 5680, data_lancamento: '2024-06-20', data_vencimento: '2024-06-20', status: 'pendente' },
  { id: '5', categoria: 'Servicos', descricao: 'Frete importação - container', valor: 12500, data_lancamento: '2024-06-10', data_vencimento: '2024-06-15', status: 'pago' },
]

const FATURAMENTO_BRUTO = 114688
const CMV = 68800
const totalDespesas = DEMO_DESPESAS.reduce((s, d) => s + d.valor, 0)
const lucroLiquido = FATURAMENTO_BRUTO - CMV - totalDespesas

export default function ComprasPage() {
  const [filterMes, setFilterMes] = useState('junho')

  const pagas = DEMO_DESPESAS.filter(d => d.status === 'pago').reduce((s, d) => s + d.valor, 0)
  const pendentes = DEMO_DESPESAS.filter(d => d.status === 'pendente').reduce((s, d) => s + d.valor, 0)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Compras & Despesas Operacionais</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gestão de custos operacionais — Junho 2024</p>
        </div>
        <button className="btn-primary"><Plus size={16} /> Nova Despesa</button>
      </div>

      {/* DRE Simplificada */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wider">DRE Simplificada — Junho 2024</h2>
        <div className="space-y-2 max-w-sm">
          {[
            { label: 'Faturamento Bruto', value: FATURAMENTO_BRUTO, color: 'text-slate-800 font-semibold' },
            { label: '(-) CMV (Custo Mercadoria Vendida)', value: -CMV, color: 'text-red-600' },
            { label: '= Lucro Bruto', value: FATURAMENTO_BRUTO - CMV, color: 'text-primary-700 font-semibold', border: true },
            { label: '(-) Despesas Operacionais', value: -totalDespesas, color: 'text-red-600' },
            { label: '= Lucro Líquido', value: lucroLiquido, color: lucroLiquido > 0 ? 'text-emerald-600 font-bold text-lg' : 'text-red-600 font-bold text-lg', border: true },
          ].map((row) => (
            <div key={row.label} className={cn('flex justify-between py-1.5', row.border && 'border-t border-slate-200 mt-1')}>
              <span className="text-sm text-slate-600">{row.label}</span>
              <span className={cn('text-sm', row.color)}>{formatCurrency(Math.abs(row.value))}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
          Margem líquida: {((lucroLiquido / FATURAMENTO_BRUTO) * 100).toFixed(1)}%
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 rounded-xl p-4">
          <div className="text-emerald-600 font-bold text-xl">{formatCurrency(pagas)}</div>
          <div className="text-xs text-slate-500 mt-0.5">Despesas pagas</div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4">
          <div className="text-yellow-600 font-bold text-xl">{formatCurrency(pendentes)}</div>
          <div className="text-xs text-slate-500 mt-0.5">A pagar</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="text-slate-700 font-bold text-xl">{formatCurrency(totalDespesas)}</div>
          <div className="text-xs text-slate-500 mt-0.5">Total do mês</div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Categoria</th>
              <th>Descrição</th>
              <th className="text-right">Valor</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_DESPESAS.map((d) => (
              <tr key={d.id}>
                <td>
                  <span className="badge-blue">{d.categoria}</span>
                </td>
                <td className="font-medium text-slate-700 text-sm">{d.descricao}</td>
                <td className="text-right font-semibold text-slate-800">{formatCurrency(d.valor)}</td>
                <td className="text-sm text-slate-500">{formatDate(d.data_vencimento)}</td>
                <td>
                  <span className={cn('badge', STATUS_COLORS[d.status])}>
                    {STATUS_LABELS[d.status]}
                  </span>
                </td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn-ghost py-1 px-2 text-xs">Editar</button>
                    {d.status === 'pendente' && (
                      <button className="px-2 py-1 text-xs bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 font-medium">
                        Pagar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
