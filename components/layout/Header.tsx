'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, Search, ChevronDown, MapPin, User, Package } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { User as AuthUser } from '@/lib/auth'
import Ticker from './Ticker'
import { CLIENTES_SEED, VENDEDORES_SEED } from '@/lib/clientes-seed'
import { REGIOES } from '@/lib/regions'
import { loadData } from '@/lib/storage'

const DEMO_NOTIFS = [
  { id: '1', texto: 'Proposta sem resposta há 8 dias — Verniz & Cor Rio', tipo: 'alerta', tempo: '2h' },
  { id: '2', texto: 'Estoque crítico: Acetato de Etila (95 kg)', tipo: 'critico', tempo: '4h' },
  { id: '3', texto: 'Pedido PV-2026-003 aguardando aprovação', tipo: 'info', tempo: '6h' },
  { id: '4', texto: 'Contrato CT-2026-002 vence em 65 dias', tipo: 'alerta', tempo: '1d' },
]

type ResultItem = {
  tipo: 'cliente' | 'vendedor' | 'regiao'
  label: string
  sub: string
  href: string
  icon: any
}

function buildResults(query: string): ResultItem[] {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  const results: ResultItem[] = []

  // Regiões
  REGIOES.forEach(r => {
    if (r.toLowerCase().includes(q)) {
      results.push({ tipo: 'regiao', label: `Região ${r}`, sub: 'Filtrar mapa por esta região', href: `/mapa?regiao=${r}`, icon: MapPin })
    }
  })

  // Vendedores
  const vendedores = loadData('vendedores', VENDEDORES_SEED)
  vendedores.forEach((v: any) => {
    if (v.nome.toLowerCase().includes(q)) {
      const nClientes = CLIENTES_SEED.filter(c => c.vendedor === v.nome).length
      results.push({ tipo: 'vendedor', label: v.nome, sub: `${nClientes} clientes · ${v.ufs?.join(', ')}`, href: `/vendedores?vendedor=${encodeURIComponent(v.nome)}`, icon: User })
    }
  })

  // Clientes
  const clientes = loadData('clientes_geo', CLIENTES_SEED)
  clientes
    .filter((c: any) => c.nome.toLowerCase().includes(q) || c.cidade.toLowerCase().includes(q))
    .slice(0, 5)
    .forEach((c: any) => {
      results.push({ tipo: 'cliente', label: c.nome, sub: `${c.cidade}/${c.uf} · ${c.status}`, href: '/clientes', icon: Package })
    })

  return results.slice(0, 8)
}

export default function Header({ user }: { user: AuthUser }) {
  const [showNotifs, setShowNotifs] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ResultItem[]>([])
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (query.length >= 2) {
      setResults(buildResults(query))
      setShowResults(true)
    } else {
      setResults([])
      setShowResults(false)
    }
  }, [query])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function navegar(item: ResultItem) {
    setQuery('')
    setShowResults(false)
    router.push(item.href)
  }

  const TIPO_COR: Record<string, string> = {
    cliente: 'bg-sky-50 text-sky-600',
    vendedor: 'bg-violet-50 text-violet-600',
    regiao: 'bg-emerald-50 text-emerald-600',
  }
  const TIPO_LABEL: Record<string, string> = {
    cliente: 'Cliente', vendedor: 'Vendedor', regiao: 'Região',
  }

  return (
    <div className="flex-shrink-0">
      <Ticker />

      <header className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center px-6 gap-4 relative z-40">
        {/* Smart Search */}
        <div className="flex-1 max-w-sm relative" ref={searchRef}>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setShowResults(true)}
            placeholder="Buscar cliente, vendedor, região..."
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl
              focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
          />

          {showResults && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
              {results.map((item, i) => {
                const Icon = item.icon
                return (
                  <button key={i} onClick={() => navegar(item)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${TIPO_COR[item.tipo]}`}>
                      <Icon size={13} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-semibold text-slate-800 truncate">{item.label}</p>
                      <p className="text-[10px] text-slate-400 truncate">{item.sub}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${TIPO_COR[item.tipo]}`}>
                      {TIPO_LABEL[item.tipo]}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {showResults && query.length >= 2 && results.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-100 px-4 py-3 z-50">
              <p className="text-xs text-slate-400">Nenhum resultado para "{query}"</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {/* Notificações */}
          <div className="relative">
            <button onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors">
              <Bell size={18} className="text-slate-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-full" />
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-sm">Notificações</span>
                  <span className="text-xs text-sky-600 font-medium cursor-pointer hover:underline">Marcar todas como lidas</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {DEMO_NOTIFS.map(n => (
                    <div key={n.id} className="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          n.tipo === 'critico' ? 'bg-red-500' : n.tipo === 'alerta' ? 'bg-amber-400' : 'bg-sky-400'
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
                  <span className="text-xs text-sky-600 font-medium cursor-pointer hover:underline">Ver todos os alertas</span>
                </div>
              </div>
            )}
          </div>

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
