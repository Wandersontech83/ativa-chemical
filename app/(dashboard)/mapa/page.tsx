'use client'

import { useState, useEffect, useRef } from 'react'
import { Route, Navigation, X, MessageCircle, Calendar, Zap, Layers, Star, MapPin } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { CLIENTES_SEED, PROSPECTS_SEED } from '@/lib/clientes-seed'
import { loadData } from '@/lib/storage'
import {
  UF_REGIAO, REGIOES, REGIAO_COR, getUFsRegiao,
  calcularHealthScore, calcularPrioridade, explicarPrioridade,
  type Regiao,
} from '@/lib/regions'

type Cliente = typeof CLIENTES_SEED[0] & { prio?: number }

const STATUS_COR: Record<string, string> = {
  ativo: '#10b981', inativo: '#94a3b8', prospecto: '#3b82f6',
  sem_compra: '#f59e0b', inadimplente: '#ef4444',
}
const STATUS_LABEL: Record<string, string> = {
  ativo: 'Ativo', inativo: 'Inativo', prospecto: 'Prospect',
  sem_compra: 'Sem compra +90d', inadimplente: 'Inadimplente',
}

export default function MapaPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const prospectMarkersRef = useRef<any[]>([])
  const routeLayerRef = useRef<any>(null)
  const heatLayerRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)

  const clientes: Cliente[] = loadData('clientes_geo', CLIENTES_SEED)

  const [filtroVendedor, setFiltroVendedor] = useState('todos')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroUF, setFiltroUF] = useState('todos')
  const [filtroRegiao, setFiltroRegiao] = useState('todas')
  const [modoRota, setModoRota] = useState(false)
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [rotaInfo, setRotaInfo] = useState<{
    dist: number; tempo: number
    paradas: { nome: string; cidade: string; uf: string; prio: number }[]
  } | null>(null)
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [calculandoRota, setCalculandoRota] = useState(false)
  const [limitParadas, setLimitParadas] = useState(8)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'ok' | 'denied'>('idle')
  const [heatmapAtivo, setHeatmapAtivo] = useState(false)

  const vendedores = Array.from(new Set(clientes.map(c => c.vendedor)))
  const ufsDisponiveis = filtroRegiao !== 'todas'
    ? getUFsRegiao(filtroRegiao as Regiao).filter(uf => clientes.some(c => c.uf === uf))
    : Array.from(new Set(clientes.map(c => c.uf))).sort()

  const clientesFiltrados = clientes.filter(c => {
    if (filtroVendedor !== 'todos' && c.vendedor !== filtroVendedor) return false
    if (filtroStatus !== 'todos' && c.status !== filtroStatus) return false
    if (filtroUF !== 'todos' && c.uf !== filtroUF) return false
    if (filtroRegiao !== 'todas' && UF_REGIAO[c.uf] !== filtroRegiao) return false
    return true
  })

  const origemLat = userLocation?.lat ?? -15.77
  const origemLng = userLocation?.lng ?? -47.93

  const clientesComPrio = [...clientesFiltrados].map(c => ({
    ...c,
    prio: calcularPrioridade(c, origemLat, origemLng),
  })).sort((a, b) => b.prio - a.prio)

  const topCliente = modoRota && clientesComPrio.length > 0 ? clientesComPrio[0] : null

  function pedirLocalizacao() {
    if (!navigator.geolocation) { setGeoStatus('denied'); return }
    setGeoStatus('loading')
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        setGeoStatus('ok')
        if (leafletRef.current) renderUserPin(leafletRef.current.map, leafletRef.current.L, loc)
      },
      () => setGeoStatus('denied'),
      { timeout: 8000 }
    )
  }

  function renderUserPin(map: any, L: any, loc: { lat: number; lng: number }) {
    if (userMarkerRef.current) userMarkerRef.current.remove()
    const icon = L.divIcon({
      html: `<div style="position:relative;width:20px;height:20px">
        <div style="width:20px;height:20px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 2px 10px rgba(37,99,235,.6)"></div>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:7px;height:7px;background:white;border-radius:50%"></div>
      </div>`,
      className: '', iconSize: [20, 20], iconAnchor: [10, 10],
    })
    userMarkerRef.current = L.marker([loc.lat, loc.lng], { icon, zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup('<strong>📍 Você está aqui</strong><br><small>Ponto de partida da rota</small>')
      .openPopup()
  }

  useEffect(() => {
    if (!mapRef.current) return
    import('leaflet').then(L => {
      if (leafletRef.current) return
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })
      const map = L.map(mapRef.current!, { center: [-15.77, -47.93], zoom: 4 })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 18,
      }).addTo(map)
      leafletRef.current = { map, L }
      renderMarkers(map, L, clientesFiltrados)
      renderProspects(map, L)
    })
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    if (!leafletRef.current) return
    const { map, L } = leafletRef.current
    renderMarkers(map, L, clientesFiltrados)

    // Auto zoom na região
    if (filtroRegiao !== 'todas' && clientesFiltrados.length > 0) {
      const bounds = clientesFiltrados.map(c => [c.lat, c.lng] as [number, number])
      try { map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 }) } catch {}
    }

    // Heatmap
    if (heatmapAtivo) renderHeatmap(map, L, clientesFiltrados)
    else if (heatLayerRef.current) { heatLayerRef.current.remove(); heatLayerRef.current = null }
    // eslint-disable-next-line
  }, [filtroVendedor, filtroStatus, filtroUF, filtroRegiao, heatmapAtivo])

  function renderMarkers(map: any, L: any, lista: Cliente[]) {
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    lista.forEach(c => {
      const cor = STATUS_COR[c.status] || '#64748b'
      const hs = calcularHealthScore(c)
      const prio = calcularPrioridade(c, origemLat, origemLng)
      const expl = explicarPrioridade(c, origemLat, origemLng)
      const wa = `https://wa.me/55?text=${encodeURIComponent(`Olá! Sou da Ativa Chemical, gostaria de conversar sobre nossos produtos. Obrigado!`)}`
      const icon = L.divIcon({
        html: `<div style="position:relative;width:16px;height:16px">
          <div style="width:14px;height:14px;background:${cor};border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>
          ${hs.score < 40 ? `<div style="position:absolute;top:-3px;right:-3px;width:7px;height:7px;background:#ef4444;border:1.5px solid white;border-radius:50%"></div>` : ''}
        </div>`,
        className: '', iconSize: [16, 16], iconAnchor: [8, 8],
      })
      const marker = L.marker([c.lat, c.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:210px;font-family:sans-serif;line-height:1.4">
            <div style="font-weight:700;font-size:13px;color:#1e293b;margin-bottom:2px">${c.nome}</div>
            <div style="font-size:11px;color:#64748b;margin-bottom:6px">${c.cidade}/${c.uf} · ${UF_REGIAO[c.uf]} · ${c.vendedor}</div>
            <div style="display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap">
              <span style="font-size:10px;background:${cor}22;color:${cor};padding:2px 6px;border-radius:10px;font-weight:600">${STATUS_LABEL[c.status]}</span>
              <span style="font-size:10px;background:${hs.cor}22;color:${hs.cor};padding:2px 6px;border-radius:10px;font-weight:600">● ${hs.label}</span>
            </div>
            ${c.faturamento12m > 0 ? `<div style="font-size:11px;color:#475569">Fat. 12M: <strong>R$ ${c.faturamento12m.toLocaleString('pt-BR')}</strong></div>` : ''}
            ${c.ultima_compra ? `<div style="font-size:11px;color:#475569">Última compra: ${c.ultima_compra}</div>` : ''}
            <div style="font-size:10px;color:#7c3aed;margin-top:4px;font-style:italic">${expl}</div>
            <div style="margin-top:8px;display:flex;gap:6px">
              <a href="/clientes" style="font-size:10px;background:#06b6d4;color:white;padding:3px 10px;border-radius:6px;text-decoration:none;font-weight:600">Ver cliente</a>
              <a href="${wa}" target="_blank" style="font-size:10px;background:#25D366;color:white;padding:3px 10px;border-radius:6px;text-decoration:none;font-weight:600">WhatsApp</a>
            </div>
          </div>
        `)
        .on('click', () => setClienteSelecionado(c))
      markersRef.current.push(marker)
    })
  }

  function renderProspects(map: any, L: any) {
    prospectMarkersRef.current.forEach(m => m.remove())
    prospectMarkersRef.current = []
    const prospects = loadData('prospects', PROSPECTS_SEED)
    const COR_FUNIL: Record<string, string> = {
      novo: '#8b5cf6', contatado: '#6366f1', qualificado: '#7c3aed', proposta: '#f59e0b',
    }
    prospects
      .filter((p: any) => !['convertido', 'perdido'].includes(p.status))
      .forEach((p: any) => {
        const cor = COR_FUNIL[p.status] || '#8b5cf6'
        const icon = L.divIcon({
          html: `<div style="width:12px;height:12px;background:${cor};border:2px solid white;border-radius:3px;box-shadow:0 1px 4px rgba(0,0,0,.4);transform:rotate(45deg)"></div>`,
          className: '', iconSize: [12, 12], iconAnchor: [6, 6],
        })
        const wa = `https://wa.me/55?text=${encodeURIComponent(`Olá, ${p.nome}! Sou da Ativa Chemical, gostaríamos de apresentar nossos produtos químicos.`)}`
        const marker = L.marker([p.lat, p.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width:180px;font-family:sans-serif">
              <div style="font-weight:700;font-size:12px;color:#1e293b;margin-bottom:3px">${p.nome}</div>
              <div style="font-size:10px;color:#64748b;margin-bottom:5px">${p.cidade}/${p.uf} · ${p.vendedor}</div>
              <span style="font-size:9px;background:${cor}22;color:${cor};padding:2px 8px;border-radius:10px;font-weight:700">◆ PROSPECT — ${p.status.toUpperCase()}</span>
              ${p.produto_alvo ? `<div style="font-size:10px;color:#0891b2;margin-top:5px">🎯 ${p.produto_alvo}</div>` : ''}
              <div style="margin-top:8px;display:flex;gap:6px">
                <a href="/prospeccao" style="font-size:10px;background:#7c3aed;color:white;padding:3px 8px;border-radius:6px;text-decoration:none;font-weight:600">Prospecção</a>
                <a href="${wa}" target="_blank" style="font-size:10px;background:#25D366;color:white;padding:3px 8px;border-radius:6px;text-decoration:none;font-weight:600">WhatsApp</a>
              </div>
            </div>
          `)
        prospectMarkersRef.current.push(marker)
      })
  }

  async function renderHeatmap(map: any, L: any, lista: Cliente[]) {
    try {
      if (!(window as any).L?.heatLayer) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement('script')
          s.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js'
          s.onload = () => res(); s.onerror = () => rej()
          document.head.appendChild(s)
        })
      }
      if (heatLayerRef.current) heatLayerRef.current.remove()
      const pts = lista.map(c => [c.lat, c.lng, Math.min(c.faturamento12m / 500000, 1)] as [number, number, number])
      heatLayerRef.current = (window as any).L.heatLayer(pts, {
        radius: 45, blur: 35, maxZoom: 10,
        gradient: { 0.2: '#10b981', 0.5: '#f59e0b', 1.0: '#ef4444' },
      }).addTo(map)
    } catch {}
  }

  // Rota automática por prioridade
  async function calcularRotaAuto() {
    const pontos = clientesComPrio.slice(0, limitParadas)
    if (pontos.length < 2) return
    await executarRota(pontos)
  }

  // Rota manual com selecionados
  async function calcularRotaManual() {
    const pontos = selecionados
      .map(id => clientesComPrio.find(c => c.id === id)!)
      .filter(Boolean)
    if (pontos.length < 2) return
    await executarRota(pontos)
  }

  async function executarRota(pontos: Cliente[]) {
    setCalculandoRota(true)
    try {
      const waypoints = userLocation
        ? [`${origemLng},${origemLat}`, ...pontos.map(p => `${p.lng},${p.lat}`)]
        : pontos.map(p => `${p.lng},${p.lat}`)

      const res = await fetch(
        `https://router.project-osrm.org/trip/v1/driving/${waypoints.join(';')}?roundtrip=false&source=first&destination=last&steps=false&geometries=geojson`
      )
      const data = await res.json()
      if (!data.trips?.[0]) return

      const { map, L } = leafletRef.current
      if (routeLayerRef.current) routeLayerRef.current.remove()
      routeLayerRef.current = L.geoJSON(data.trips[0].geometry, {
        style: { color: '#06b6d4', weight: 3.5, opacity: 0.85 }
      }).addTo(map)

      const dist = Math.round(data.trips[0].distance / 1000)
      const tempo = Math.round(data.trips[0].duration / 60)

      // BUG FIX: sort by trip_index (position within trip), skip origin waypoint
      const sorted = [...data.waypoints].sort((a: any, b: any) => a.trip_index - b.trip_index)
      const clientWaypoints = userLocation ? sorted.filter((w: any) => w.waypoint_index > 0) : sorted

      const paradas = clientWaypoints.map((w: any) => {
        const idx = userLocation ? w.waypoint_index - 1 : w.waypoint_index
        const c = pontos[idx]
        return c ? { nome: c.nome, cidade: c.cidade, uf: c.uf, prio: c.prio ?? 0 } : null
      }).filter(Boolean) as any[]

      setRotaInfo({ dist, tempo, paradas })
      map.fitBounds(routeLayerRef.current.getBounds(), { padding: [30, 30] })

      const gmUrl = (userLocation
        ? [{ lat: origemLat, lng: origemLng }, ...pontos]
        : pontos
      ).map(p => `${p.lat},${p.lng}`).join('/')
      window.open(`https://www.google.com/maps/dir/${gmUrl}`, '_blank')
    } catch (e) {
      console.error(e)
    } finally {
      setCalculandoRota(false)
    }
  }

  function toggleSelecionado(id: string) {
    setSelecionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function mudarRegiao(r: string) {
    setFiltroRegiao(r)
    setFiltroUF('todos')
  }

  function iniciarRota() {
    setModoRota(true)
    setSelecionados([])
    setRotaInfo(null)
    pedirLocalizacao()
  }

  return (
    <div className="flex flex-col animate-fade-up" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mapa de Clientes</h1>
          <p className="text-slate-500 text-sm">
            {clientesFiltrados.length} clientes visíveis
            {filtroRegiao !== 'todas' && (
              <span className="ml-1 font-semibold" style={{ color: REGIAO_COR[filtroRegiao as Regiao] }}>
                · Região {filtroRegiao}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setHeatmapAtivo(!heatmapAtivo)}
            className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all',
              heatmapAtivo ? 'bg-amber-500 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50')}>
            <Layers size={14} /> Heatmap
          </button>
          <button
            onClick={modoRota ? () => { setModoRota(false); setSelecionados([]); setRotaInfo(null) } : iniciarRota}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
              modoRota ? 'bg-cyan-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50')}>
            <Route size={16} /> {modoRota ? 'Cancelar Rota' : 'Planejar Rota'}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-3 flex-shrink-0 flex-wrap items-center">
        <select value={filtroRegiao} onChange={e => mudarRegiao(e.target.value)}
          className="text-xs border-2 border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 font-semibold">
          <option value="todas">Todas regiões</option>
          {REGIOES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
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
          {ufsDisponiveis.map(u => <option key={u} value={u}>{u}</option>)}
        </select>

        {/* Chips rápidos de região */}
        <div className="flex gap-1">
          {REGIOES.map(r => (
            <button key={r} onClick={() => mudarRegiao(filtroRegiao === r ? 'todas' : r)}
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold border transition-all"
              style={{
                background: filtroRegiao === r ? REGIAO_COR[r] : REGIAO_COR[r] + '18',
                color: filtroRegiao === r ? 'white' : REGIAO_COR[r],
                borderColor: REGIAO_COR[r] + '60',
              }}>
              {r}
            </button>
          ))}
        </div>

        {/* Legenda compacta */}
        <div className="ml-auto flex items-center gap-3 flex-wrap">
          {['ativo', 'sem_compra', 'inadimplente', 'inativo'].map(k => (
            <div key={k} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COR[k] }} />
              <span className="text-[10px] text-slate-500">{STATUS_LABEL[k]}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm rotate-45" style={{ background: '#8b5cf6' }} />
            <span className="text-[10px] text-slate-500">Prospect funil</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 flex-1 min-h-0">
        {/* Mapa */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
          {geoStatus === 'ok' && (
            <div className="absolute bottom-3 left-3 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-lg">
              <Navigation size={10} /> Localização ativa — rota parte daqui
            </div>
          )}
          {geoStatus === 'denied' && (
            <div className="absolute bottom-3 left-3 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-lg">
              📍 GPS negado — usando centro do Brasil como origem
            </div>
          )}
        </div>

        {/* Painel lateral */}
        <div className="w-72 flex flex-col gap-3 overflow-y-auto">

          {/* MODO ROTA */}
          {modoRota && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
              {/* Status GPS */}
              <div className={cn('px-4 py-2.5 border-b border-slate-100 flex items-center gap-2 text-xs',
                geoStatus === 'ok' ? 'bg-blue-50' : geoStatus === 'loading' ? 'bg-slate-50' : 'bg-amber-50')}>
                <Navigation size={12} className={geoStatus === 'ok' ? 'text-blue-600' : geoStatus === 'loading' ? 'text-slate-500' : 'text-amber-600'} />
                <span className="text-slate-600 font-medium leading-tight">
                  {geoStatus === 'idle'    && 'Obtendo sua localização...'}
                  {geoStatus === 'loading' && 'Detectando GPS...'}
                  {geoStatus === 'ok'      && 'Saindo da sua localização atual'}
                  {geoStatus === 'denied'  && 'Sem GPS — usando centro do Brasil'}
                </span>
              </div>

              {/* Limite de paradas */}
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2">
                <span className="text-xs text-slate-500 flex-1">Máx. paradas/dia:</span>
                <input type="number" min={2} max={15} value={limitParadas}
                  onChange={e => setLimitParadas(Math.max(2, Number(e.target.value)))}
                  className="w-14 border border-slate-200 rounded-lg px-2 py-1 text-xs text-center font-semibold" />
              </div>

              {/* Badge "visitar primeiro" */}
              {topCliente && (
                <div className="mx-3 mt-3 mb-1 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                  <Star size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-amber-700 tracking-wide">VISITAR PRIMEIRO</p>
                    <p className="text-xs font-semibold text-slate-800 truncate mt-0.5">{topCliente.nome}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{topCliente.cidade}/{topCliente.uf} · {topCliente.prio} pts</p>
                    <p className="text-[10px] text-violet-600 mt-0.5 italic">{explicarPrioridade(topCliente, origemLat, origemLng)}</p>
                  </div>
                </div>
              )}

              {/* Cabeçalho lista */}
              <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-600">{selecionados.length} selecionados de {clientesFiltrados.length}</p>
                <button onClick={() => setSelecionados(clientesComPrio.slice(0, limitParadas).map(c => c.id))}
                  className="text-[10px] text-cyan-600 hover:underline font-medium">top {limitParadas}</button>
              </div>

              {/* Lista clientes ordenados por prioridade */}
              <div className="overflow-y-auto divide-y divide-slate-50" style={{ maxHeight: 200 }}>
                {clientesComPrio.map((c, idx) => (
                  <div key={c.id} onClick={() => toggleSelecionado(c.id)}
                    className={cn('px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors flex items-center gap-2',
                      selecionados.includes(c.id) && 'bg-cyan-50')}>
                    <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0',
                      selecionados.includes(c.id) ? 'bg-cyan-500 border-cyan-500' : 'border-slate-300')}>
                      {selecionados.includes(c.id) && <span className="text-white text-[9px] font-bold">✓</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-800 truncate">{c.nome}</p>
                      <p className="text-[10px] text-slate-400">{c.cidade}/{c.uf}</p>
                    </div>
                    <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0',
                      idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-violet-50 text-violet-600')}>
                      {idx === 0 ? '⭐' : `${c.prio}p`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Botões de rota */}
              <div className="p-3 border-t border-slate-100 space-y-2">
                <button onClick={calcularRotaAuto} disabled={clientesFiltrados.length < 2 || calculandoRota}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)' }}>
                  <Zap size={14} />
                  {calculandoRota ? 'Calculando...' : 'Melhor rota automática'}
                </button>
                {selecionados.length >= 2 && (
                  <button onClick={calcularRotaManual} disabled={calculandoRota}
                    className="w-full py-1.5 rounded-xl text-xs font-semibold border border-cyan-300 text-cyan-700 hover:bg-cyan-50 transition-colors">
                    Usar selecionados ({selecionados.length})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Info rota calculada */}
          {rotaInfo && (
            <div className="bg-white rounded-2xl border border-cyan-200 shadow-sm p-4">
              <p className="text-sm font-bold text-cyan-800 mb-3 flex items-center gap-1.5">
                <Route size={14} className="text-cyan-600" /> Rota otimizada
              </p>
              <div className="flex gap-2 mb-3">
                <div className="flex-1 bg-cyan-50 rounded-xl p-2.5 text-center">
                  <p className="text-lg font-bold text-cyan-700">{rotaInfo.dist} km</p>
                  <p className="text-[10px] text-cyan-500">distância</p>
                </div>
                <div className="flex-1 bg-blue-50 rounded-xl p-2.5 text-center">
                  <p className="text-lg font-bold text-blue-700">
                    {Math.floor(rotaInfo.tempo / 60)}h{String(rotaInfo.tempo % 60).padStart(2, '0')}
                  </p>
                  <p className="text-[10px] text-blue-500">no carro</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold mb-2 uppercase tracking-wide">Ordem otimizada:</p>
              {rotaInfo.paradas.map((p, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 border-b border-slate-50 last:border-0">
                  <span className={cn('w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 shrink-0',
                    i === 0 ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-600')}>
                    {i === 0 ? '★' : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-800 truncate">{p.nome}</p>
                    <p className="text-[10px] text-slate-400">{p.cidade}/{p.uf}</p>
                  </div>
                </div>
              ))}
              <a href="/agenda"
                className="mt-3 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)' }}>
                <Calendar size={12} /> Agendar este roteiro →
              </a>
            </div>
          )}

          {/* Cliente selecionado */}
          {clienteSelecionado && !modoRota && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-start justify-between mb-1">
                <p className="text-sm font-bold text-slate-800 leading-tight pr-2">{clienteSelecionado.nome}</p>
                <button onClick={() => setClienteSelecionado(null)} className="text-slate-300 hover:text-slate-600 flex-shrink-0"><X size={14} /></button>
              </div>
              {(() => {
                const hs = calcularHealthScore(clienteSelecionado)
                const regiao = UF_REGIAO[clienteSelecionado.uf]
                return (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-slate-500">{clienteSelecionado.cidade}/{clienteSelecionado.uf}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: REGIAO_COR[regiao] + '20', color: REGIAO_COR[regiao] }}>{regiao}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: hs.cor + '20', color: hs.cor }}>● {hs.label}</span>
                    </div>
                    <div className="space-y-1.5 mb-3">
                      <div className="flex justify-between text-xs"><span className="text-slate-500">Vendedor</span><span className="font-medium">{clienteSelecionado.vendedor}</span></div>
                      {clienteSelecionado.faturamento12m > 0 && <div className="flex justify-between text-xs"><span className="text-slate-500">Fat. 12M</span><span className="font-bold">{formatCurrency(clienteSelecionado.faturamento12m)}</span></div>}
                      {clienteSelecionado.ultima_compra && <div className="flex justify-between text-xs"><span className="text-slate-500">Última compra</span><span>{clienteSelecionado.ultima_compra}</span></div>}
                    </div>
                  </>
                )
              })()}
              <div className="flex gap-2">
                <a href="/clientes" className="flex-1 text-center py-1.5 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg,#06b6d4,#2563eb)' }}>
                  Ver cliente
                </a>
                <a href={`https://wa.me/55?text=${encodeURIComponent('Olá! Sou da Ativa Chemical.')}`} target="_blank"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 text-white">
                  <MessageCircle size={11} /> WA
                </a>
              </div>
            </div>
          )}

          {/* Resumo */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-sm font-semibold text-slate-800 mb-3">
              Resumo {filtroRegiao !== 'todas' ? <span style={{ color: REGIAO_COR[filtroRegiao as Regiao] }}>{filtroRegiao}</span> : 'geral'}
            </p>
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
              <div className="border-t border-slate-100 pt-2 mt-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Fat. 12M total</span>
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
