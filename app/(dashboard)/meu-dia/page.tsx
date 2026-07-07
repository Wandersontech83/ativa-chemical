'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { CalendarDays, MapPin, MessageCircle, CheckCircle2, Clock, AlertTriangle, TrendingUp, Zap, Navigation, Phone } from 'lucide-react'
import { loadData, saveData } from '@/lib/storage'
import { CLIENTES_SEED, VENDEDORES_SEED } from '@/lib/clientes-seed'
import { HISTORICO_CONSUMO, PRODUTOS_CATALOGO } from '@/lib/consultas-seed'
import { calcularHealthScore } from '@/lib/regions'
import { NEGOCIOS_SEED, TAREFAS_SEED, type TarefaFollowUp, type Negocio } from '@/lib/negocios-seed'

interface Visita {
  id: string; cliente_id: string; cliente_nome: string; cliente_cidade: string; cliente_uf: string
  data: string; hora: string; vendedor: string; objetivo: string; observacoes: string
  status: 'agendada' | 'concluida' | 'cancelada'; lembrete: boolean; check_in?: string
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export default function MeuDiaPage() {
  const [visitas, setVisitas] = useState<Visita[]>([])
  const [negocios, setNegocios] = useState<Negocio[]>([])
  const [tarefas, setTarefas] = useState<TarefaFollowUp[]>([])
  const [horaAtual, setHoraAtual] = useState('')
  const [nomeUsuario] = useState('Wanderson Lima')

  const hoje = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    setVisitas(loadData('agenda_visitas', []))
    setNegocios(loadData('negocios', NEGOCIOS_SEED))
    setTarefas(loadData('tarefas_followup', TAREFAS_SEED))
    const tick = () => setHoraAtual(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
    tick()
    const t = setInterval(tick, 60000)
    return () => clearInterval(t)
  }, [])

  const saudacao = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  // Visitas de hoje
  const visitasHoje = visitas.filter(v => v.data === hoje && v.status !== 'cancelada')
  const visitasConcluidas = visitasHoje.filter(v => v.status === 'concluida').length
  const visitasPendentes = visitasHoje.filter(v => v.status === 'agendada')

  // Próxima visita
  const proximaVisita = visitasPendentes.sort((a, b) => a.hora.localeCompare(b.hora))[0]

  // Tarefas vencidas/vencendo hoje
  const tarefasUrgentes = tarefas.filter(t => !t.concluida && t.data_venc <= hoje)

  // Negócios com fechamento próximo (≤ 7 dias)
  const negociosExpirando = negocios
    .filter(n => n.etapa !== 'ganho' && n.etapa !== 'perdido' && n.data_fechamento_prev)
    .map(n => ({ ...n, dias: Math.ceil((new Date(n.data_fechamento_prev!).getTime() - Date.now()) / 86400000) }))
    .filter(n => n.dias >= 0 && n.dias <= 7)
    .sort((a, b) => a.dias - b.dias)

  // Radar de recompra — próximos 7 dias
  const radarUrgente = HISTORICO_CONSUMO
    .filter(h => h.ultima_compra && h.freq_meses > 0)
    .map(h => {
      const proxima = new Date(h.ultima_compra)
      proxima.setMonth(proxima.getMonth() + h.freq_meses)
      const dias = Math.ceil((proxima.getTime() - Date.now()) / 86400000)
      const cliente = CLIENTES_SEED.find(c => c.id === h.cliente_id)
      const produto = PRODUTOS_CATALOGO.find(p => p.id === h.produto_id)
      return { ...h, dias, cliente, produto }
    })
    .filter(h => h.dias >= 0 && h.dias <= 7 && h.cliente)
    .sort((a, b) => a.dias - b.dias)
    .slice(0, 5)

  // Clientes esquecidos — sem visita há >60 dias
  const esquecidos = CLIENTES_SEED
    .filter(c => c.status === 'ativo' && c.ultima_compra)
    .map(c => {
      const dias = Math.floor((Date.now() - new Date(c.ultima_compra).getTime()) / 86400000)
      return { ...c, diasSemCompra: dias }
    })
    .filter(c => c.diasSemCompra > 60)
    .sort((a, b) => b.diasSemCompra - a.diasSemCompra)
    .slice(0, 3)

  function concluirVisita(id: string) {
    const obs = prompt('Observação da visita (opcional):') ?? ''
    const now = new Date().toISOString()
    const atualizadas = visitas.map(v => v.id === id ? { ...v, status: 'concluida' as const, check_in: now, observacoes: obs || v.observacoes } : v)
    setVisitas(atualizadas)
    saveData('agenda_visitas', atualizadas)
  }

  function concluirTarefa(id: string) {
    const atualizadas = tarefas.map(t => t.id === id ? { ...t, concluida: true } : t)
    setTarefas(atualizadas)
    saveData('tarefas_followup', atualizadas)
  }

  return (
    <div className="space-y-5 animate-fade-up max-w-4xl">
      {/* Header saudação */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-sm">{horaAtual} · {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <h1 className="text-2xl font-bold mt-1">{saudacao()}, {nomeUsuario.split(' ')[0]}! 👋</h1>
            <p className="text-blue-100 text-sm mt-1">
              {visitasHoje.length > 0
                ? `${visitasHoje.length} visita${visitasHoje.length > 1 ? 's' : ''} hoje · ${visitasConcluidas} concluída${visitasConcluidas !== 1 ? 's' : ''}`
                : 'Nenhuma visita agendada para hoje'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{visitasConcluidas}/{visitasHoje.length}</div>
            <p className="text-blue-200 text-xs mt-1">visitas hoje</p>
          </div>
        </div>
        {visitasHoje.length > 0 && (
          <div className="mt-4 h-2 bg-blue-500/40 rounded-full">
            <div className="h-2 bg-white rounded-full transition-all" style={{ width: `${visitasHoje.length > 0 ? (visitasConcluidas / visitasHoje.length) * 100 : 0}%` }} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Coluna principal */}
        <div className="col-span-2 space-y-4">

          {/* Próxima visita em destaque */}
          {proximaVisita && (
            <div className="bg-white rounded-2xl border border-blue-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Navigation className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">Próxima parada</span>
                <span className="ml-auto text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">{proximaVisita.hora}</span>
              </div>
              <h3 className="font-bold text-slate-800 text-lg">{proximaVisita.cliente_nome}</h3>
              <p className="text-sm text-slate-500">{proximaVisita.cliente_cidade}/{proximaVisita.cliente_uf} · {proximaVisita.objetivo}</p>
              <div className="flex gap-2 mt-3">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(proximaVisita.cliente_nome + ' ' + proximaVisita.cliente_cidade)}`}
                  target="_blank"
                  className="flex items-center gap-1.5 bg-blue-600 text-white text-sm rounded-lg px-3 py-2 hover:bg-blue-700"
                >
                  <Navigation className="w-3.5 h-3.5" /> Navegar
                </a>
                <button onClick={() => concluirVisita(proximaVisita.id)} className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-sm rounded-lg px-3 py-2 hover:bg-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Check-in / Concluir
                </button>
                <a href="/agenda" className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm rounded-lg px-3 py-2 hover:bg-slate-50">
                  <CalendarDays className="w-3.5 h-3.5" /> Ver agenda
                </a>
              </div>
            </div>
          )}

          {/* Visitas de hoje */}
          {visitasHoje.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-500" /> Roteiro de hoje
              </h2>
              <div className="space-y-2">
                {visitasHoje.sort((a, b) => a.hora.localeCompare(b.hora)).map((v, i) => {
                  const cli = CLIENTES_SEED.find(c => c.id === v.cliente_id)
                  const hs = cli ? calcularHealthScore(cli) : null
                  return (
                    <div key={v.id} className={cn('flex items-center gap-3 p-2.5 rounded-lg', v.status === 'concluida' ? 'bg-emerald-50' : 'bg-slate-50')}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: v.status === 'concluida' ? '#d1fae5' : '#dbeafe', color: v.status === 'concluida' ? '#059669' : '#2563eb' }}>
                        {v.status === 'concluida' ? '✓' : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-medium', v.status === 'concluida' && 'line-through text-slate-400')}>{v.cliente_nome}</p>
                        <p className="text-xs text-slate-400">{v.hora} · {v.objetivo}</p>
                      </div>
                      {hs && <span className="text-xs rounded-full px-2 py-0.5 font-medium" style={{ background: hs.cor + '22', color: hs.cor }}>{hs.label}</span>}
                      {v.status === 'agendada' && (
                        <button onClick={() => concluirVisita(v.id)} className="text-xs bg-emerald-100 text-emerald-700 rounded-lg px-2 py-1 hover:bg-emerald-200 whitespace-nowrap">Cheguei</button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Tarefas urgentes */}
          {tarefasUrgentes.length > 0 && (
            <div className="bg-white rounded-2xl border border-red-200 p-4">
              <h2 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Follow-ups vencidos ({tarefasUrgentes.length})
              </h2>
              <div className="space-y-2">
                {tarefasUrgentes.slice(0, 5).map(t => {
                  const neg = negocios.find(n => n.id === t.negocio_id)
                  return (
                    <div key={t.id} className="flex items-center gap-3 bg-red-50 rounded-lg p-2.5">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700">{t.descricao}</p>
                        <p className="text-xs text-slate-400">{neg?.titulo} · venceu {t.data_venc}</p>
                      </div>
                      <button onClick={() => concluirTarefa(t.id)} className="text-xs bg-white border border-red-200 text-red-600 rounded-lg px-2 py-1 hover:bg-red-50 whitespace-nowrap">
                        Concluir
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Radar recompra urgente */}
          {radarUrgente.length > 0 && (
            <div className="bg-white rounded-2xl border border-amber-200 p-4">
              <h2 className="font-semibold text-amber-700 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Radar de Recompra — próximos 7 dias
              </h2>
              <div className="space-y-2">
                {radarUrgente.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 bg-amber-50 rounded-lg p-2.5">
                    <div className={cn('text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0', h.dias <= 2 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600')}>
                      {h.dias}d
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{h.cliente?.nome}</p>
                      <p className="text-xs text-slate-400">{h.produto?.nome} · ~{h.volume_medio_kg} kg/mês · {fmt(h.valor_mensal)}</p>
                    </div>
                    <a
                      href={`/mapa?cliente=${h.cliente_id}`}
                      className="text-xs bg-amber-100 text-amber-700 rounded-lg px-2 py-1 hover:bg-amber-200 whitespace-nowrap"
                    >
                      Ver no mapa
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Coluna lateral */}
        <div className="space-y-4">

          {/* Negócios expirando */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-blue-500" /> Pipeline urgente
            </h2>
            {negociosExpirando.length === 0
              ? <p className="text-xs text-slate-400">Nenhum negócio vencendo em 7 dias</p>
              : (
                <div className="space-y-2">
                  {negociosExpirando.slice(0, 5).map(n => (
                    <div key={n.id} className="bg-slate-50 rounded-lg p-2.5">
                      <p className="text-xs font-medium text-slate-700 truncate">{n.titulo}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold text-slate-800">{fmt(n.valor)}</span>
                        <span className={cn('text-xs font-medium', n.dias <= 2 ? 'text-red-500' : 'text-amber-500')}>
                          {n.dias}d restantes
                        </span>
                      </div>
                      {n.contato_wa && (
                        <a href={`https://wa.me/${n.contato_wa}?text=Olá! Entrando em contato sobre nossa proposta de ${n.produto}.`} target="_blank" className="flex items-center gap-1 text-xs text-emerald-600 mt-1.5 hover:underline">
                          <MessageCircle className="w-3 h-3" /> WhatsApp
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )
            }
            <a href="/negocios" className="block mt-3 text-xs text-blue-600 hover:underline text-center">Ver pipeline completo →</a>
          </div>

          {/* Clientes esquecidos */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-slate-400" /> Clientes esquecidos
            </h2>
            {esquecidos.length === 0
              ? <p className="text-xs text-slate-400">Todos os clientes ativos visitados recentemente.</p>
              : (
                <div className="space-y-2">
                  {esquecidos.map(c => (
                    <div key={c.id} className="bg-slate-50 rounded-lg p-2.5">
                      <p className="text-xs font-medium text-slate-700">{c.nome}</p>
                      <p className="text-xs text-slate-400">{c.cidade}/{c.uf}</p>
                      <p className="text-xs text-red-500 mt-0.5">{c.diasSemCompra}d sem compra</p>
                    </div>
                  ))}
                </div>
              )
            }
            <a href="/mapa" className="block mt-3 text-xs text-blue-600 hover:underline text-center">Ver no mapa →</a>
          </div>

          {/* Links rápidos */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-700 mb-3 text-sm">Ações rápidas</h2>
            <div className="space-y-2">
              {[
                { label: 'Traçar rota de hoje', href: '/mapa', icon: '🗺️' },
                { label: 'Agenda de visitas', href: '/agenda', icon: '📅' },
                { label: 'Pipeline de negócios', href: '/negocios', icon: '📊' },
                { label: 'Radar de Recompra', href: '/prospeccao', icon: '⚡' },
              ].map(a => (
                <a key={a.href} href={a.href} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 text-sm text-slate-600">
                  <span>{a.icon}</span> {a.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
