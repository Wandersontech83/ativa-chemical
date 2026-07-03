'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Filter, Route, Users, Navigation, X, Clock, DollarSign, Plus, ChevronRight } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { CLIENTES_SEED, PROSPECTS_SEED } from '@/lib/clientes-seed'
import { loadData } from '@/lib/storage'

type Cliente = typeof CLIENTES_SEED[0]

const STATUS_COR: Record<string, string> = {
  ativo:       '#10b981',
  inativo:     '#94a3b8',
  prospecto:   '#3b82f6',
  sem_compra:  '#f59e0b',
  inadimplente:'#ef4444',
}

const STATUS_LABEL: Record<string, string> = {
  ativo:       'Ativo',
  inativo:     'Inativo',
  prospecto:   'Prospect',
  sem_compra:  'Sem compra +90d',
  inadimplente:'Inadimplente',
}

export default function MapaPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const routeLayerRef = useRef<any>(null)

  const clientes: Cliente[] = loadData('clientes_geo', CLIENTES_SEED)

  const [filtroVendedor, setFiltroVendedor] = useState('todos')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroUF, setFiltroUF] = useState('todos')
  const [modoRota, setModoRota] = useState(false)
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [rotaInfo, setRotaInfo] = useState<{ dist: number; tempo: number; ordem: string[] } | null>(null)
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [calculandoRota, setCalculandoRota] = useState(false)

  const vendedores = Array.from(new Set(clientes.map(c => c.vendedor)))
  const ufs = Array.from(new Set(clientes.map(c => c.uf))).sort()

  const clientesFiltrados = clientes.filter(c => {
    if (filtroVendedor !== 'todos' && c.vendedor !== filtroVendedor) return false
    if (filtroStatus !== 'todos' && c.status !== filtroStatus) return false
    if (filtroUF !== 'todos' && c.uf !== filtroUF) return false
    return true
  })

  useEffect(() => {
    if (!mapRef.current) return
    import('leaflet').then(L => {
      if (leafletRef.current) return

      // Fix default icons
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, { center: [-15.77, -47.93], zoom: 4 })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map)
      leafletRef.current = { map, L }
      renderMarkers({ map, L }, clientesFiltrados)
      renderProspects({ map, L })
    })
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    if (!leafletRef.current) return
    const { map, L } = leafletRef.current
    renderMarkers({ map, L }, clientesFiltrados)
    // eslint-disable-next-line
  }, [filtroVendedor, filtroStatus, filtroUF])

  function renderMarkers({ map, L }: any, lista: Cliente[]) {
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    lista.forEach(c => {
      const cor = STATUS_COR[c.status] || '#64748b'
      const icon = L.divIcon({
        html: `<div style="width:14px;height:14px;background:${cor};border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
        className: '', iconSize: [14, 14], iconAnchor: [7, 7],
      })
      const marker = L.marker([c.lat, c.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:200px;font-family:sans-serif">
            <div style="font-weight:700;font-size:13px;color:#1e293b;margin-bottom:4px">${c.nome}</div>
            <div style="font-size:11px;color:#64748b;margin-bottom:6px">${c.cidade}/${c.uf} · ${c.vendedor}</div>
            <div style="display:flex;gap:8px;margin-bottom:8px">
              <span style="font-size:10px;background:${cor}20;color:${cor};padding:2px 6px;border-radius:10px;font-weight:600">${STATUS_LABEL[c.status]}</span>
            </div>
            ${c.faturamento12m > 0 ? `<div style="font-size:11px;color:#475569">Faturamento 12M: <strong>R$ ${c.faturamento12m.toLocaleString('pt-BR')}</strong></div>` : ''}
            ${c.ultima_compra ? `<div style="font-size:11px;color:#475569">Última compra: ${c.ultima_compra}</div>` : ''}
            <div style="margin-top:8px;display:flex;gap:6px">
              <a href="/clientes" style="font-size:11px;background:#06b6d4;color:white;padding:3px 8px;border-radius:6px;text-decoration:none">Ver cliente</a>
            </div>
          </div>
        `)
        .on('click', () => setClienteSelecionado(c))

      markersRef.current.push(marker)
    })
  }

  const prospectMarkersRef = useRef<any[]>([])

  function renderProspects({ map, L }: any) {
    prospectMarkersRef.current.forEach(m => m.remove())
    prospectMarkersRef.current = []
    const prospects = loadData('prospects', PROSPECTS_SEED)
    const COR_FUNIL: Record<string, string> = {
      novo: '#8b5cf6', contatado: '#6366f1', qualificado: '#7c3aed',
      proposta: '#f59e0b', convertido: '#10b981', perdido: '#94a3b8',
    }
    prospects
      .filter((p: any) => !['convertido', 'perdido'].includes(p.status))
      .forEach((p: any) => {
        const cor = COR_FUNIL[p.status] || '#8b5cf6'
        const icon = L.divIcon({
          html: `<div style="width:12px;height:12px;background:${cor};border:2px solid white;border-radius:3px;box-shadow:0 1px 4px rgba(0,0,0,.4);transform:rotate(45deg)"></div>`,
          className: '', iconSize: [12, 12], iconAnchor: [6, 6],
        })
        const marker = L.marker([p.lat, p.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width:180px;font-family:sans-serif">
              <div style="font-weight:700;font-size:12px;color:#1e293b;margin-bottom:3px">${p.nome}</div>
              <div style="font-size:10px;color:#64748b;margin-bottom:5px">${p.cidade}/${p.uf} · ${p.vendedor}</div>
              <span style="font-size:9px;background:${cor}20;color:${cor};padding:2px 6px;border-radius:10px;font-weight:700">◆ PROSPECT — ${p.status.toUpperCase()}</span>
              ${p.produto_alvo ? `<div style="font-size:10px;color:#0891b2;margin-top:5px">🎯 ${p.produto_alvo}</div>` : ''}
              ${p.observacoes ? `<div style="font-size:10px;color:#475569;margin-top:3px">${p.observacoes}</div>` : ''}
              <a href="/prospeccao" style="display:inline-block;margin-top:8px;font-size:10px;background:#7c3aed;color:white;padding:3px 8px;border-radius:6px;text-decoration:none">Ver prospecção</a>
            </div>
          `)
        prospectMarkersRef.current.push(marker)
      })
  }

  function toggleSelecionado(id: string) {
    setSelecionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function calcularRota() {
    if (selecionados.length < 2) return
    setCalculandoRota(true)
    try {
      const pontos = selecionados.map(id => clientes.find(c => c.id === id)!).filter(Boolean)
      const coords = pontos.map(p => `${p.lng},${p.lat}`).join(';')
      const res = await fetch(`https://router.project-osrm.org/trip/v1/driving/${coords}?roundtrip=false&source=first&destination=last&steps=false&geometries=geojson`)
      const data = await res.json()
      if (!data.trips?.[0]) return

      const { map, L } = leafletRef.current
      if (routeLayerRef.current) routeLayerRef.current.remove()
      routeLayerRef.current = L.geoJSON(data.trips[0].geometry, {
        style: { color: '#06b6d4', weight: 3, opacity: 0.8 }
      }).addTo(map)

      const dist = (data.trips[0].distance / 1000).toFixed(0)
      const tempo = Math.round(data.trips[0].duration / 60)
      const ordemIdx = data.waypoints.sort((a: any, b: any) => a.waypoint_index - b.waypoint_index).map((w: any) => w.trips_index)
      const ordemNomes = ordemIdx.map((i: number) => pontos[i]?.nome || '')

      setRotaInfo({ dist: Number(dist), tempo, ordem: ordemNomes })
      map.fitBounds(routeLayerRef.current.getBounds(), { padding: [30, 30] })

      const wpUrl = pontos.map(p => `${p.lat},${p.lng}`).join('/')
      window.open(`https://www.google.com/maps/dir/${wpUrl}`, '_blank')
    } catch (e) {
      console.error(e)
    } finally {
      setCalculandoRota(false)
    }
  }

  const totalSelecionados = clientesFiltrados.filter(c => selecionados.includes(c.id))

  return (
    <div className="flex flex-col h-full animate-fade-up" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mapa de Clientes</h1>
          <p className="text-slate-500 text-sm">{clientesFiltrados.length} clientes · OpenStreetMap</p>
        </div>
        <button
          onClick={() => { setModoRota(!modoRota); setSelecionados([]); setRotaInfo(null) }}
          className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all', modoRota ? 'bg-cyan-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50')}
        >
          <Route size={16} /> {modoRota ? 'Cancelar Rota' : 'Planejar Rota'}
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-3 flex-shrink-0 flex-wrap">
        <select value={filtroVendedor} onChange={e => setFiltroVendedor(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700">
          <option value="todos">Todos vendedores</option>
          {vendedores.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700">
          <option value="todos">Todos status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filtroUF} onChange={e => setFiltroUF(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700">
          <option value="todos">Todos UFs</option>
          {ufs.map(u => <option key={u} value={u}>{u}</option>)}
        </select>

        {/* Legenda */}
        <div className="ml-auto flex items-center gap-3 flex-wrap">
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ background: STATUS_COR[k] }} />
              <span className="text-xs text-slate-500">{v}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm rotate-45 flex-shrink-0" style={{ background: '#8b5cf6' }} />
            <span className="text-xs text-slate-500">Prospect funil</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 flex-1 min-h-0">
        {/* Mapa */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        </div>

        {/* Painel lateral */}
        <div className="w-72 flex flex-col gap-3 overflow-hidden">
          {/* Modo rota: lista para seleção */}
          {modoRota && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden" style={{ maxHeight: '55%' }}>
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">Selecionar paradas</p>
                <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-semibold">{selecionados.length} selecionados</span>
              </div>
              <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
                {clientesFiltrados.map(c => (
                  <div key={c.id} onClick={() => toggleSelecionado(c.id)}
                    className={cn('px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors flex items-center gap-2', selecionados.includes(c.id) && 'bg-cyan-50')}>
                    <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0', selecionados.includes(c.id) ? 'bg-cyan-500 border-cyan-500' : 'border-slate-300')}>
                      {selecionados.includes(c.id) && <span className="text-white text-[9px] font-bold">✓</span>}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{c.nome}</p>
                      <p className="text-[10px] text-slate-400">{c.cidade}/{c.uf}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-slate-100">
                <button onClick={calcularRota} disabled={selecionados.length < 2 || calculandoRota}
                  className="w-full py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all"
                  style={{ background: 'linear-gradient(135deg,#06b6d4,#2563eb)' }}>
                  {calculandoRota ? 'Calculando...' : `Calcular rota (${selecionados.length} paradas)`}
                </button>
              </div>
            </div>
          )}

          {/* Info da rota calculada */}
          {rotaInfo && (
            <div className="bg-white rounded-2xl border border-cyan-200 shadow-sm p-4">
              <p className="text-sm font-semibold text-cyan-800 mb-2">🗺️ Rota otimizada</p>
              <div className="flex gap-3 mb-3">
                <div className="flex-1 bg-cyan-50 rounded-xl p-2 text-center">
                  <p className="text-lg font-bold text-cyan-700">{rotaInfo.dist} km</p>
                  <p className="text-[10px] text-cyan-500">distância</p>
                </div>
                <div className="flex-1 bg-blue-50 rounded-xl p-2 text-center">
                  <p className="text-lg font-bold text-blue-700">{rotaInfo.tempo} min</p>
                  <p className="text-[10px] text-blue-500">tempo est.</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold mb-1">Ordem sugerida:</p>
              {rotaInfo.ordem.filter(Boolean).map((n, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-600 py-0.5">
                  <span className="w-4 h-4 rounded-full bg-cyan-100 text-cyan-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span className="truncate">{n}</span>
                </div>
              ))}
            </div>
          )}

          {/* Cliente selecionado no mapa */}
          {clienteSelecionado && !modoRota && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-bold text-slate-800 leading-tight">{clienteSelecionado.nome}</p>
                <button onClick={() => setClienteSelecionado(null)} className="text-slate-400 hover:text-slate-600 flex-shrink-0 ml-2"><X size={14} /></button>
              </div>
              <p className="text-xs text-slate-500 mb-3">{clienteSelecionado.cidade}/{clienteSelecionado.uf}</p>
              <div className="space-y-1.5 mb-3">
                <div className="flex justify-between text-xs"><span className="text-slate-500">Vendedor</span><span className="font-medium text-slate-700">{clienteSelecionado.vendedor}</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-500">Status</span><span className="font-semibold" style={{ color: STATUS_COR[clienteSelecionado.status] }}>{STATUS_LABEL[clienteSelecionado.status]}</span></div>
                {clienteSelecionado.faturamento12m > 0 && <div className="flex justify-between text-xs"><span className="text-slate-500">Fat. 12M</span><span className="font-bold text-slate-800">{formatCurrency(clienteSelecionado.faturamento12m)}</span></div>}
                {clienteSelecionado.ultima_compra && <div className="flex justify-between text-xs"><span className="text-slate-500">Última compra</span><span className="text-slate-700">{clienteSelecionado.ultima_compra}</span></div>}
              </div>
              <a href="/clientes" className="block w-full text-center py-1.5 rounded-xl text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg,#06b6d4,#2563eb)' }}>
                Ver cliente →
              </a>
            </div>
          )}

          {/* Resumo */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-sm font-semibold text-slate-800 mb-3">Resumo do mapa</p>
            <div className="space-y-2">
              {Object.entries(STATUS_LABEL).map(([k, v]) => {
                const count = clientesFiltrados.filter(c => c.status === k).length
                if (!count) return null
                return (
                  <div key={k} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: STATUS_COR[k] }} />
                    <span className="text-xs text-slate-600 flex-1">{v}</span>
                    <span className="text-xs font-bold text-slate-800">{count}</span>
                  </div>
                )
              })}
              <div className="border-t border-slate-100 pt-2 mt-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Fat. total 12M</span>
                  <span>{formatCurrency(clientesFiltrados.reduce((s, c) => s + c.faturamento12m, 0))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
