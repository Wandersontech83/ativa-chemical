'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, MessageCircle, MapPin, Phone, Mail, TrendingUp,
  ShoppingCart, CalendarDays, FileText, Mic, MicOff, Send,
  Package, Clock, AlertTriangle, CheckCircle2, Star
} from 'lucide-react'
import { loadData, saveData, genId } from '@/lib/storage'
import { CLIENTES_SEED } from '@/lib/clientes-seed'
import { HISTORICO_CONSUMO, PRODUTOS_CATALOGO } from '@/lib/consultas-seed'
import { calcularHealthScore } from '@/lib/regions'
import { NEGOCIOS_SEED, type Negocio } from '@/lib/negocios-seed'

interface EventoTimeline {
  id: string
  tipo: 'compra' | 'visita' | 'proposta' | 'nota' | 'audio' | 'alerta'
  data: string
  titulo: string
  descricao?: string
  valor?: number
  status?: string
  autor?: string
  audioUrl?: string
}

const TIPO_COR: Record<string, string> = {
  compra:  '#10b981', visita: '#3b82f6', proposta: '#8b5cf6',
  nota:    '#64748b', audio:  '#f59e0b', alerta:   '#ef4444',
}
const TIPO_ICON: Record<string, string> = {
  compra: '🛒', visita: '📍', proposta: '📋', nota: '📝', audio: '🎙️', alerta: '⚠️',
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const fmtDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

export default function ClienteDetalhe() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const cliente = CLIENTES_SEED.find(c => c.id === id)
  const [timeline, setTimeline] = useState<EventoTimeline[]>([])
  const [notaTexto, setNotaTexto] = useState('')
  const [gravando, setGravando] = useState(false)
  const [transcricao, setTranscricao] = useState('')
  const [negociosCliente, setNegociosCliente] = useState<Negocio[]>([])
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (!cliente) return
    // Carregar eventos salvos
    const saved = loadData(`timeline_${id}`, [] as EventoTimeline[])

    // Gerar eventos sintéticos do seed
    const eventos: EventoTimeline[] = [...saved]

    // Compras do histórico
    HISTORICO_CONSUMO.filter(h => h.cliente_id === id).forEach(h => {
      const prod = PRODUTOS_CATALOGO.find(p => p.id === h.produto_id)
      if (!prod || !h.ultima_compra) return
      // Criar evento de última compra
      if (!eventos.find(e => e.id === `compra_${h.produto_id}`)) {
        eventos.push({
          id: `compra_${h.produto_id}`, tipo: 'compra', data: h.ultima_compra,
          titulo: `Compra: ${prod.nome}`, descricao: `${h.volume_medio_kg} kg/mês · frequência ${h.freq_meses} meses`,
          valor: h.valor_mensal, autor: 'Sistema',
        })
      }
      // Próxima recompra prevista como alerta
      const proxima = new Date(h.ultima_compra)
      proxima.setMonth(proxima.getMonth() + h.freq_meses)
      const diasRestantes = Math.ceil((proxima.getTime() - Date.now()) / 86400000)
      if (diasRestantes <= 14 && diasRestantes >= -7) {
        if (!eventos.find(e => e.id === `alerta_${h.produto_id}`)) {
          eventos.push({
            id: `alerta_${h.produto_id}`, tipo: 'alerta',
            data: proxima.toISOString().slice(0, 10),
            titulo: `Recompra prevista: ${prod.nome}`,
            descricao: diasRestantes < 0 ? `Vencido há ${Math.abs(diasRestantes)} dias` : `Em ${diasRestantes} dias`,
            autor: 'Radar',
          })
        }
      }
    })

    // Negócios
    const negs = loadData('negocios', NEGOCIOS_SEED).filter((n: Negocio) => n.cliente_id === id)
    setNegociosCliente(negs)
    negs.forEach((n: Negocio) => {
      if (!eventos.find(e => e.id === `neg_${n.id}`)) {
        eventos.push({
          id: `neg_${n.id}`, tipo: 'proposta', data: n.data_atualizacao,
          titulo: `Negócio: ${n.titulo}`, descricao: n.etapa === 'ganho' ? '✅ Ganho' : n.etapa === 'perdido' ? `❌ Perdido — ${n.motivo_perda}` : `Em ${n.etapa}`,
          valor: n.valor, autor: n.responsavel,
        })
      }
    })

    // Ordenar por data desc
    eventos.sort((a, b) => b.data.localeCompare(a.data))
    setTimeline(eventos)
  }, [id, cliente])

  if (!cliente) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-slate-400">Cliente não encontrado.</p>
        <button onClick={() => router.back()} className="text-blue-600 hover:underline text-sm">← Voltar</button>
      </div>
    )
  }

  const hs = calcularHealthScore(cliente)
  const historico = HISTORICO_CONSUMO.filter(h => h.cliente_id === id)
  const totalMensal = historico.reduce((a, h) => a + h.valor_mensal, 0)

  function adicionarNota() {
    if (!notaTexto.trim()) return
    const ev: EventoTimeline = {
      id: genId('nota'), tipo: 'nota', data: new Date().toISOString().slice(0, 10),
      titulo: 'Nota', descricao: notaTexto, autor: 'Wanderson Lima',
    }
    const nova = [ev, ...timeline]
    setTimeline(nova)
    saveData(`timeline_${id}`, nova.filter(e => e.tipo === 'nota' || e.tipo === 'audio'))
    setNotaTexto('')
  }

  function toggleGravacao() {
    if (gravando) {
      recognitionRef.current?.stop()
      setGravando(false)
      return
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Reconhecimento de voz não suportado neste navegador. Use Chrome.'); return }
    const rec = new SR()
    rec.lang = 'pt-BR'
    rec.continuous = true
    rec.interimResults = true
    rec.onresult = (e: any) => {
      const txt = Array.from(e.results).map((r: any) => r[0].transcript).join(' ')
      setTranscricao(txt)
    }
    rec.onend = () => { setGravando(false) }
    rec.start()
    recognitionRef.current = rec
    setGravando(true)
    setTranscricao('')
  }

  function salvarAudioNota() {
    if (!transcricao.trim()) return
    const ev: EventoTimeline = {
      id: genId('audio'), tipo: 'audio', data: new Date().toISOString().slice(0, 10),
      titulo: '🎙️ Nota de voz', descricao: transcricao, autor: 'Wanderson Lima',
    }
    const nova = [ev, ...timeline]
    setTimeline(nova)
    saveData(`timeline_${id}`, nova.filter(e => e.tipo === 'nota' || e.tipo === 'audio'))
    setTranscricao('')
    setGravando(false)
  }

  const diasSemCompra = cliente.ultima_compra
    ? Math.floor((Date.now() - new Date(cliente.ultima_compra).getTime()) / 86400000)
    : null

  return (
    <div className="space-y-5 animate-fade-up max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.push('/clientes')} className="mt-1 text-slate-400 hover:text-slate-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-800">{cliente.nome}</h1>
            <span className="rounded-full px-3 py-1 text-sm font-semibold" style={{ background: hs.cor + '22', color: hs.cor }}>
              ● {hs.label} ({hs.score}/100)
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">{cliente.cidade}/{cliente.uf} · {cliente.grupo} · Vendedor: {cliente.vendedor}</p>
        </div>
        <div className="flex gap-2">
          <a href={`https://wa.me/55?text=Olá! Entrando em contato da Ativa Chemical a respeito do seu atendimento.`} target="_blank"
            className="flex items-center gap-1.5 bg-emerald-600 text-white text-sm rounded-lg px-3 py-2 hover:bg-emerald-700">
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
          <a href={`/mapa?cliente=${id}`}
            className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm rounded-lg px-3 py-2 hover:bg-slate-50">
            <MapPin className="w-4 h-4" /> Ver no mapa
          </a>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Timeline principal */}
        <div className="col-span-2 space-y-4">
          {/* Adicionar nota */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-700 mb-3 text-sm">Registrar interação</h2>
            <div className="flex gap-2">
              <textarea
                value={notaTexto}
                onChange={e => setNotaTexto(e.target.value)}
                placeholder="Anotação, resultado de visita, próximos passos..."
                rows={2}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none"
              />
              <div className="flex flex-col gap-2">
                <button onClick={adicionarNota} className="bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700">
                  <Send className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleGravacao}
                  className={cn('rounded-lg px-3 py-2 transition-colors', gravando ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
                  title={gravando ? 'Parar gravação' : 'Nota de voz'}
                >
                  {gravando ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {transcricao && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700 font-medium mb-1">🎙️ Transcrição:</p>
                <p className="text-sm text-slate-700">{transcricao}</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={salvarAudioNota} className="bg-amber-500 text-white text-xs rounded-lg px-3 py-1.5 hover:bg-amber-600">Salvar nota de voz</button>
                  <button onClick={() => setTranscricao('')} className="text-xs text-slate-500 hover:underline">Descartar</button>
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" /> Timeline 360° ({timeline.length} eventos)
            </h2>
            {timeline.length === 0
              ? <p className="text-center text-slate-400 py-8 text-sm">Nenhum evento registrado ainda.</p>
              : (
                <div className="space-y-0">
                  {timeline.map((ev, i) => (
                    <div key={ev.id} className="flex gap-3">
                      {/* Linha do tempo */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-base border-2 border-white shadow-sm"
                          style={{ background: TIPO_COR[ev.tipo] + '22' }}>
                          {TIPO_ICON[ev.tipo]}
                        </div>
                        {i < timeline.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 my-1 min-h-[20px]" />}
                      </div>
                      {/* Conteúdo */}
                      <div className={cn('pb-4 flex-1 min-w-0', i === timeline.length - 1 ? '' : '')}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-slate-700">{ev.titulo}</span>
                          {ev.valor && <span className="text-xs font-bold" style={{ color: TIPO_COR[ev.tipo] }}>{fmt(ev.valor)}</span>}
                        </div>
                        {ev.descricao && <p className="text-xs text-slate-500">{ev.descricao}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-400">{fmtDate(ev.data)}</span>
                          {ev.autor && <span className="text-xs text-slate-300">·</span>}
                          {ev.autor && <span className="text-xs text-slate-400">{ev.autor}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        </div>

        {/* Painel lateral */}
        <div className="space-y-4">
          {/* KPIs do cliente */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <h2 className="font-semibold text-slate-700 text-sm">Resumo</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Faturamento 12M</span>
                <span className="font-bold text-slate-800">{fmt(cliente.faturamento12m)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Última compra</span>
                <span className={cn('font-medium', diasSemCompra && diasSemCompra > 90 ? 'text-red-500' : 'text-slate-700')}>
                  {cliente.ultima_compra ? `${diasSemCompra}d atrás` : '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Mensal estimado</span>
                <span className="font-bold text-emerald-600">{fmt(totalMensal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Status</span>
                <span className={cn('font-medium capitalize', {
                  'text-emerald-600': cliente.status === 'ativo',
                  'text-red-500': cliente.status === 'inadimplente',
                  'text-slate-400': cliente.status === 'inativo' || cliente.status === 'sem_compra',
                })}>{cliente.status.replace('_', ' ')}</span>
              </div>
            </div>

            {/* Health score bar */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Health score</span>
                <span className="font-semibold" style={{ color: hs.cor }}>{hs.score}/100</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full">
                <div className="h-2 rounded-full transition-all" style={{ width: `${hs.score}%`, background: hs.cor }} />
              </div>
            </div>
          </div>

          {/* Produtos consumidos */}
          {historico.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <h2 className="font-semibold text-slate-700 mb-3 text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-400" /> Produtos
              </h2>
              <div className="space-y-2">
                {historico.map(h => {
                  const prod = PRODUTOS_CATALOGO.find(p => p.id === h.produto_id)
                  if (!prod) return null
                  const proxima = new Date(h.ultima_compra)
                  proxima.setMonth(proxima.getMonth() + h.freq_meses)
                  const dias = Math.ceil((proxima.getTime() - Date.now()) / 86400000)
                  return (
                    <div key={h.produto_id} className="bg-slate-50 rounded-lg p-2.5">
                      <p className="text-xs font-medium text-slate-700">{prod.nome}</p>
                      <p className="text-xs text-slate-400">{h.volume_medio_kg} kg/mês · {fmt(h.valor_mensal)}</p>
                      <p className={cn('text-xs mt-0.5', dias < 0 ? 'text-red-500' : dias <= 14 ? 'text-amber-500' : 'text-slate-400')}>
                        Recompra: {dias < 0 ? `${Math.abs(dias)}d atraso` : `em ${dias}d`}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Negócios ativos */}
          {negociosCliente.filter(n => n.etapa !== 'ganho' && n.etapa !== 'perdido').length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <h2 className="font-semibold text-slate-700 mb-3 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" /> Negócios ativos
              </h2>
              <div className="space-y-2">
                {negociosCliente.filter(n => n.etapa !== 'ganho' && n.etapa !== 'perdido').map(n => (
                  <div key={n.id} className="bg-slate-50 rounded-lg p-2.5">
                    <p className="text-xs font-medium text-slate-700">{n.titulo}</p>
                    <p className="text-xs text-slate-400 capitalize">{n.etapa} · {fmt(n.valor)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
            <h2 className="font-semibold text-slate-700 mb-1 text-sm">Ações</h2>
            <a href={`/agenda?cliente=${id}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50">
              <CalendarDays className="w-4 h-4" /> Agendar visita
            </a>
            <a href={`/negocios`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50">
              <FileText className="w-4 h-4" /> Criar proposta
            </a>
            <a href={`/mapa?cliente=${id}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50">
              <MapPin className="w-4 h-4" /> Ver no mapa
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
