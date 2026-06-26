'use client'

import { useState } from 'react'
import { Bell, Search, ChevronDown } from 'lucide-react'
import type { User } from '@/lib/auth'
import Ticker from './Ticker'

const DEMO_NOTIFS = [
  { id: '1', texto: 'Proposta PROP-2024-002 sem resposta há 8 dias', tipo: 'alerta', tempo: '2h' },
  { id: '2', texto: 'Estoque crítico: Acetato de Etila (95 kg)', tipo: 'critico', tempo: '4h' },
  { id: '3', texto: 'Pedido PV-2024-003 aguardando aprovação', tipo: 'info', tempo: '6h' },
  { id: '4', texto: 'Contrato CT-2024-002 vence em 65 dias', tipo: 'alerta', tempo: '1d' },
]

export default function Header({ user }: { user: User }) {
  const [showNotifs, setShowNotifs] = useState(false)

  return (
    <div className="flex-shrink-0">
      {/* Ticker */}
      <Ticker />

      {/* Header bar */}
      <header className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center px-6 gap-4">
        {/* Search */}
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar produto, cliente, pedido..."
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {/* Notificações */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <Bell size={18} className="text-slate-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-full" />
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-sm">Notificações</span>
                  <span className="text-xs text-sky-600 font-medium cursor-pointer hover:underline">
                    Marcar todas como lidas
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {DEMO_NOTIFS.map(n => (
                    <div key={n.id} className="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          n.tipo === 'critico' ? 'bg-red-500' :
                          n.tipo === 'alerta'  ? 'bg-amber-400' : 'bg-sky-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-700 leading-relaxed">{n.texto}</p>
                          <span className="text-[10px] text-slate-400 mt-0.5">{n.tempo} atrás</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 bg-slate-50">
                  <span className="text-xs text-sky-600 font-medium cursor-pointer hover:underline">
                    Ver todos os alertas
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-slate-200" />

          {/* User chip */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-[13px] font-semibold text-slate-700">{user.name}</div>
              <div className="text-[10px] text-slate-400 capitalize">{user.role}</div>
            </div>
            <ChevronDown size={13} className="text-slate-400" />
          </div>
        </div>
      </header>
    </div>
  )
}
