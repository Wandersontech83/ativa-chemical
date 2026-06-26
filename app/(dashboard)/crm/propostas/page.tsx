'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatCurrency, formatDate, formatNumber, STATUS_LABELS, STATUS_COLORS, cn } from '@/lib/utils'
import { Plus, Search, FileText, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

const DEMO_PROPOSTAS = [
  {
    id: 'prop-001', numero: 'PROP-2024-001', cliente: 'Plastinova Indústria de Plásticos Ltda',
    status: 'aprovada', total: 50400, margem_percentual: 38.5,
    validade: '2024-07-15', data_envio: '2024-06-11', condicoes_pagamento: '30/60 dias',
    usuario: 'Ana Rodrigues',
  },
  {
    id: 'prop-002', numero: 'PROP-2024-002', cliente: 'ColorMax Tintas e Vernizes S.A.',
    status: 'enviada', total: 31920, margem_percentual: 32.0,
    validade: '2024-07-20', data_envio: '2024-06-18', condicoes_pagamento: '30 dias',
    usuario: 'Ana Rodrigues',
  },
  {
    id: 'prop-003', numero: 'PROP-2024-003', cliente: 'Flexibor Elastômeros Ltda',
    status: 'rascunho', total: 17696, margem_percentual: 41.0,
    validade: '2024-07-25', data_envio: null, condicoes_pagamento: 'À vista',
    usuario: 'Lucas Ferreira',
  },
  {
    id: 'prop-004', numero: 'PROP-2024-004', cliente: 'AgroQuim Sul Ltda',
    status: 'rejeitada', total: 35840, margem_percentual: 28.0,
    validade: '2024-06-30', data_envio: '2024-06-01', condicoes_pagamento: '30 dias',
    usuario: 'Ana Rodrigues',
  },
  {
    id: 'prop-005', numero: 'PROP-2024-005', cliente: 'AutoPrime Revestimentos Automotivos',
    status: 'enviada', total: 75600, margem_percentual: 35.5,
    validade: '2024-07-18', data_envio: '2024-06-23', condicoes_pagamento: '30/60/90 dias',
    usuario: 'Ana Rodrigues',
  },
]

const STATUS_ICONS: Record<string, typeof CheckCircle> = {
  aprovada: CheckCircle,
  rejeitada: XCircle,
  enviada: Clock,
  rascunho: FileText,
  expirada: XCircle,
}

export default function PropostasPage() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')

  const filtered = DEMO_PROPOSTAS.filter((p) => {
    const matchSearch = search === '' ||
      p.numero.toLowerCase().includes(search.toLowerCase()) ||
      p.cliente.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'todos' || p.status === filterStatus
    return matchSearch && matchStatus
  })

  const totalEnviadas = DEMO_PROPOSTAS.filter(p => p.status === 'enviada').reduce((s, p) => s + p.total, 0)
  const totalAprovadas = DEMO_PROPOSTAS.filter(p => p.status === 'aprovada').reduce((s, p) => s + p.total, 0)

  async function handleAprovar(id: string, numero: string) {
    toast.promise(
      fetch(`/api/propostas/${id}/aprovar`, { method: 'POST' }).then(r => r.json()),
      {
        loading: `Aprovando ${numero}...`,
        success: 'Proposta aprovada! Pedido de venda criado.',
        error: 'Erro ao aprovar proposta',
      }
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Propostas Comerciais</h1>
          <p className="text-slate-500 text-sm mt-0.5">{DEMO_PROPOSTAS.length} propostas · Em negociação: {formatCurrency(totalEnviadas)}</p>
        </div>
        <Link href="/dashboard/crm/propostas/nova" className="btn-primary">
          <Plus size={16} /> Nova Proposta
        </Link>
      </div>

      {/* KPIs resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Em Negociação', value: formatCurrency(totalEnviadas), color: 'text-blue-600', bg: 'bg-blue-50', count: DEMO_PROPOSTAS.filter(p => p.status === 'enviada').length },
          { label: 'Aprovadas', value: formatCurrency(totalAprovadas), color: 'text-emerald-600', bg: 'bg-emerald-50', count: DEMO_PROPOSTAS.filter(p => p.status === 'aprovada').length },
          { label: 'Rascunhos', value: `${DEMO_PROPOSTAS.filter(p => p.status === 'rascunho').length} proposta(s)`, color: 'text-slate-600', bg: 'bg-slate-50', count: null },
          { label: 'Margem Média', value: `${formatNumber(DEMO_PROPOSTAS.reduce((s, p) => s + p.margem_percentual, 0) / DEMO_PROPOSTAS.length, 1)}%`, color: 'text-primary-600', bg: 'bg-primary-50', count: null },
        ].map((k) => (
          <div key={k.label} className={cn('rounded-xl p-4', k.bg)}>
            <div className={cn('text-lg font-bold', k.color)}>{k.value}</div>
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
            placeholder="Buscar proposta ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9 py-1.5 w-64"
          />
        </div>
        <div className="flex gap-1">
          {['todos', 'rascunho', 'enviada', 'aprovada', 'rejeitada'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filterStatus === s ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              {s === 'todos' ? 'Todas' : STATUS_LABELS[s]}
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
              <th className="text-right">Margem</th>
              <th>Validade</th>
              <th>Responsável</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const StatusIcon = STATUS_ICONS[p.status] || FileText
              return (
                <tr key={p.id}>
                  <td className="font-mono text-xs font-semibold text-primary-700">{p.numero}</td>
                  <td>
                    <div className="font-medium text-slate-800 text-sm">{p.cliente}</div>
                    <div className="text-xs text-slate-400">{p.condicoes_pagamento}</div>
                  </td>
                  <td>
                    <span className={cn('badge flex items-center gap-1 w-fit', STATUS_COLORS[p.status])}>
                      <StatusIcon size={10} />
                      {STATUS_LABELS[p.status]}
                    </span>
                  </td>
                  <td className="text-right font-semibold text-slate-800">{formatCurrency(p.total)}</td>
                  <td className="text-right">
                    <span className={cn('text-sm font-medium',
                      p.margem_percentual >= 35 ? 'text-emerald-600' :
                      p.margem_percentual >= 25 ? 'text-yellow-600' : 'text-red-600'
                    )}>
                      {formatNumber(p.margem_percentual, 1)}%
                    </span>
                  </td>
                  <td className="text-sm text-slate-500">{formatDate(p.validade)}</td>
                  <td className="text-sm text-slate-500">{p.usuario}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button className="btn-ghost py-1 px-2 text-xs">Ver</button>
                      {p.status === 'rascunho' && (
                        <button className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium">
                          Enviar
                        </button>
                      )}
                      {p.status === 'enviada' && (
                        <button
                          onClick={() => handleAprovar(p.id, p.numero)}
                          className="px-2 py-1 text-xs bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors font-medium"
                        >
                          Aprovar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
