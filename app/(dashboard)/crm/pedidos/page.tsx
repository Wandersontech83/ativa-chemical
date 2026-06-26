'use client'

import { useState } from 'react'
import { formatCurrency, formatDate, formatNumber, STATUS_LABELS, STATUS_COLORS, cn } from '@/lib/utils'
import { Search, ShoppingCart, CheckCircle, FileText, Truck, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const DEMO_PEDIDOS = [
  {
    id: 'ord-001', numero: 'PV-2024-001', cliente: 'Plastinova Indústria de Plásticos Ltda',
    status: 'faturado', total: 50400, custo_total: 29500, lucro_bruto: 15500, margem_percentual: 38.5,
    condicoes_pagamento: '30/60 dias', created_at: '2024-06-08', data_aprovacao: '2024-06-08',
    usuario: 'Ana Rodrigues', nfe_numero: '000001',
  },
  {
    id: 'ord-002', numero: 'PV-2024-002', cliente: 'Nordeste Química Distribuidora',
    status: 'em_logistica', total: 20720, custo_total: 12800, lucro_bruto: 5700, margem_percentual: 30.8,
    condicoes_pagamento: '30 dias', created_at: '2024-06-16', data_aprovacao: '2024-06-16',
    usuario: 'Lucas Ferreira', nfe_numero: null,
  },
  {
    id: 'ord-003', numero: 'PV-2024-003', cliente: 'Construtech Impermeabilizações Ltda',
    status: 'aguardando_aprovacao', total: 43568, custo_total: 27200, lucro_bruto: 11700, margem_percentual: 30.1,
    condicoes_pagamento: '30/60 dias', created_at: '2024-06-26', data_aprovacao: null,
    usuario: 'Ana Rodrigues', nfe_numero: null,
  },
]

export default function PedidosPage() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')

  const filtered = DEMO_PEDIDOS.filter((p) => {
    const matchSearch = search === '' ||
      p.numero.toLowerCase().includes(search.toLowerCase()) ||
      p.cliente.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'todos' || p.status === filterStatus
    return matchSearch && matchStatus
  })

  async function handleAprovar(id: string) {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1500)),
      {
        loading: 'Aprovando pedido...',
        success: 'Pedido aprovado! Reserva de estoque confirmada.',
        error: 'Erro ao aprovar',
      }
    )
  }

  async function handleEmitirNfe(id: string) {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 2000)),
      {
        loading: 'Emitindo NF-e no SEFAZ (homologação)...',
        success: 'NF-e autorizada! DANFE disponível para download.',
        error: 'Erro na emissão da NF-e',
      }
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pedidos de Venda</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {DEMO_PEDIDOS.length} pedidos · Total: {formatCurrency(DEMO_PEDIDOS.reduce((s, p) => s + p.total, 0))}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Aguard. Aprovação', count: DEMO_PEDIDOS.filter(p => p.status === 'aguardando_aprovacao').length, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Aprovados', count: DEMO_PEDIDOS.filter(p => p.status === 'aprovado').length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Em Logística', count: DEMO_PEDIDOS.filter(p => p.status === 'em_logistica').length, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Faturados', count: DEMO_PEDIDOS.filter(p => p.status === 'faturado').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((k) => (
          <div key={k.label} className={cn('rounded-xl p-4', k.bg)}>
            <div className={cn('text-3xl font-bold', k.color)}>{k.count}</div>
            <div className="text-xs text-slate-500 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar pedido ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9 py-1.5 w-64"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {['todos', 'aguardando_aprovacao', 'aprovado', 'faturado', 'em_logistica'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filterStatus === s ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              {s === 'todos' ? 'Todos' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Cliente</th>
              <th>Status</th>
              <th className="text-right">Total</th>
              <th className="text-right">Lucro Bruto</th>
              <th className="text-right">Margem</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td className="font-mono text-xs font-semibold text-primary-700">{p.numero}</td>
                <td>
                  <div className="font-medium text-slate-800 text-sm">{p.cliente}</div>
                  <div className="text-xs text-slate-400">{p.condicoes_pagamento}</div>
                </td>
                <td>
                  <span className={cn('badge w-fit', STATUS_COLORS[p.status])}>
                    {STATUS_LABELS[p.status]}
                  </span>
                </td>
                <td className="text-right font-semibold text-slate-800">{formatCurrency(p.total)}</td>
                <td className="text-right text-emerald-600 font-medium">{formatCurrency(p.lucro_bruto)}</td>
                <td className="text-right">
                  <span className={cn('text-sm font-semibold',
                    p.margem_percentual >= 35 ? 'text-emerald-600' : 'text-yellow-600'
                  )}>
                    {formatNumber(p.margem_percentual, 1)}%
                  </span>
                </td>
                <td className="text-sm text-slate-500">{formatDate(p.created_at)}</td>
                <td>
                  <div className="flex items-center gap-1">
                    <button className="btn-ghost py-1 px-2 text-xs">Ver</button>
                    {p.status === 'aguardando_aprovacao' && (
                      <button
                        onClick={() => handleAprovar(p.id)}
                        className="px-2 py-1 text-xs bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 font-medium"
                      >
                        <CheckCircle size={10} className="inline mr-1" />
                        Aprovar
                      </button>
                    )}
                    {p.status === 'aprovado' && !p.nfe_numero && (
                      <button
                        onClick={() => handleEmitirNfe(p.id)}
                        className="px-2 py-1 text-xs bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 font-medium"
                      >
                        <FileText size={10} className="inline mr-1" />
                        Emitir NF-e
                      </button>
                    )}
                    {p.status === 'faturado' && (
                      <span className="text-xs text-emerald-600 font-medium">
                        <FileText size={10} className="inline mr-1" />
                        NF {p.nfe_numero}
                      </span>
                    )}
                    {p.status === 'em_logistica' && (
                      <span className="text-xs text-orange-600 font-medium">
                        <Truck size={10} className="inline mr-1" />
                        Em trânsito
                      </span>
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
