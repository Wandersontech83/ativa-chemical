'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Package, FileText, ShoppingCart, AlertTriangle, Users, DollarSign, Clock } from 'lucide-react'

interface TickerItem {
  icon: React.ReactNode
  label: string
  value: string
  color: string
  highlight?: boolean
}

const DEMO_ITEMS: TickerItem[] = [
  { icon: <DollarSign size={12} />,    label: 'Faturamento Junho',      value: 'R$ 114.688',     color: 'text-emerald-400', highlight: true },
  { icon: <ShoppingCart size={12} />,  label: 'Pedidos em Aberto',      value: '2 pedidos',      color: 'text-sky-400' },
  { icon: <FileText size={12} />,      label: 'Propostas Enviadas',     value: '2 aguardando',   color: 'text-violet-400' },
  { icon: <AlertTriangle size={12} />, label: 'Estoque Crítico',        value: '3 produtos',     color: 'text-amber-400', highlight: true },
  { icon: <TrendingUp size={12} />,    label: 'Margem Média',           value: '34,8%',          color: 'text-emerald-400' },
  { icon: <Clock size={12} />,         label: 'Proposta PROP-2024-005', value: 'R$ 75.600 – vence em 22 dias', color: 'text-orange-400', highlight: true },
  { icon: <Users size={12} />,         label: 'Clientes Ativos',        value: '10 cadastrados', color: 'text-sky-400' },
  { icon: <Package size={12} />,       label: 'Contrato CT-2024-002',   value: 'Vence em 65 dias – ColorMax', color: 'text-violet-400', highlight: true },
  { icon: <DollarSign size={12} />,    label: 'Lucro Líquido Junho',    value: 'R$ 18.888',      color: 'text-emerald-400' },
  { icon: <ShoppingCart size={12} />,  label: 'PV-2024-002 em Trânsito','value': 'Nordeste Química – Entrega em 3 dias', value: 'Nordeste Química', color: 'text-sky-400' },
  { icon: <AlertTriangle size={12} />, label: 'Acetato de Etila',       value: 'Estoque 95 kg / mínimo 200 kg', color: 'text-red-400', highlight: true },
  { icon: <TrendingUp size={12} />,    label: 'Meta Mensal',            value: '87% atingida',   color: 'text-emerald-400' },
]

export default function Ticker() {
  const [items, setItems] = useState<TickerItem[]>(DEMO_ITEMS)

  const doubled = [...items, ...items]

  return (
    <div className="h-8 bg-sidebar-DEFAULT border-b border-white/5 overflow-hidden flex items-center relative">
      {/* Fade esquerda */}
      <div className="absolute left-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-r from-[#0f172a] to-transparent pointer-events-none" />
      {/* Fade direita */}
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-[#0f172a] to-transparent pointer-events-none" />

      <div className="ticker-track gap-0">
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2 px-5 text-xs whitespace-nowrap">
            <span className={item.color}>{item.icon}</span>
            <span className="text-slate-400 font-medium">{item.label}:</span>
            <span className={`font-semibold ${item.highlight ? item.color : 'text-slate-200'}`}>
              {item.value}
            </span>
            <span className="text-slate-600 ml-2">·</span>
          </span>
        ))}
      </div>
    </div>
  )
}
