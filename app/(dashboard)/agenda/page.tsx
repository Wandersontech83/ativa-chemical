'use client'

import { useState } from 'react'
import { Calendar, Plus, Check, X, Clock, MapPin, Phone, MessageCircle, ChevronLeft, ChevronRight, Bell, Mail, Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { loadData, saveData, genId } from '@/lib/storage'
import { CLIENTES_SEED } from '@/lib/clientes-seed'
import { toast } from 'sonner'

type StatusVisita = 'agendada' | 'concluida' | 'cancelada'

interface Visita {
  id: string
  cliente_id: string
  cliente_nome: string
  cliente_cidade: string
  cliente_uf: string
  data: string // YYYY-MM-DD
  hora: string // HH:MM
  vendedor: string
  objetivo: string
  observacoes: string
  status: StatusVisita
  lembrete: boolean
  check_in?: string // ISO timestamp
}

const VISITA_SEED: Visita[] = [
  { id: 'v1', cliente_id: 'c1', cliente_nome: 'Petroquímica Bahia S.A.', cliente_cidade: 'Salvador', cliente_uf: 'BA', data: '2026-07-08', hora: '09:00', vendedor: 'Reginaldo Alves', objetivo: 'Apresentar linha de solventes industriais', observacoes: '', status: 'agendada', lembrete: true },
  { id: 'v2', cliente_id: 'c3', cliente_nome: 'Têxtil Norte Ltda', cliente_cidade: 'Manaus', cliente_uf: 'AM', data: '2026-07-09', hora: '14:00', vendedor: 'Ana Rodrigues', objetivo: 'Renovação de contrato trimestral', observacoes: 'Levar proposta atualizada', status: 'agendada', lembrete: true },
  { id: 'v3', cliente_id: 'c5', cliente_nome: 'Galvânica Paulista S.A.', cliente_cidade: 'São Paulo', cliente_uf: 'SP', data: '2026-07-07', hora: '10:30', vendedor: 'Reginaldo Alves', objetivo: 'Follow-up pós proposta', observacoes: '', status: 'concluida', lembrete: false, check_in: '2026-07-07T10:35:00.000Z' },
  { id: 'v4', cliente_id: 'c2', cliente_nome: 'Metalúrgica Sudeste S.A.', cliente_cidade: 'Belo Horizonte', cliente_uf: 'MG', data: '2026-07-15', hora: '08:00', vendedor: 'Ana Rodrigues', objetivo: 'Prospecção — nova linha de tratamento de superfície', observacoes: '', status: 'agendada', lembrete: false },
  { id: 'v5', cliente_id: 'c4', cliente_nome: 'Indústria de Alimentos RS', cliente_cidade: 'Porto Alegre', cliente_uf: 'RS', data: '2026-07-03', hora: '15:00', vendedor: 'Reginaldo Alves', objetivo: 'Apresentação catálogo', observacoes: '', status: 'cancelada', lembrete: false },
]

const STATUS_CONFIG: Record<StatusVisita, { label: string; cor: string; bg: string; icon: any }> = {
  agendada:  { label: 'Agendada',  cor: '#2563eb', bg: '#eff6ff', icon: Clock },
  concluida: { label: 'Concluída', cor: '#059669', bg: '#f0fdf4', icon: Check },
  cancelada: { label: 'Cancelada', cor: '#dc2626', bg: '#fef2f2', icon: X },
}

function formatData(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function hoje() {
  return new Date().toISOString().slice(0, 10)
}

export default function AgendaPage() {
  const [visitas, setVisitas] = useState<Visita[]>(() => loadData('visitas_crm', VISITA_SEED))
  const [tab, setTab] = useState<'lista' | 'criar'>('lista')
  const [filtroStatus, setFiltroStatus] = useState('todas')
  const [filtroVendedor, setFiltroVendedor] = useState('todos')
  const [semanaOffset, setSemanaOffset] = useState(0)
  const [editando, setEditando] = useState<Visita | null>(null)
  const [enviandoEmail, setEnviandoEmail] = useState(false)

  const clientes = loadData('clientes_geo', CLIENTES_SEED)

  const [form, setForm] = useState<Partial<Visita>>({
    data: hoje(),
    hora: '09:00',
    status: 'agendada',
    lembrete: true,
    objetivo: '',
    observacoes: '',
  })

  async function enviarLembrete(visitasList: Visita[], tipo: 'confirmacao' | 'resumo_dia') {
    setEnviandoEmail(true)
    try {
      const res = await fetch('/api/agenda/lembrete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitas: visitasList, tipo }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.tip) toast.error(`E-mail não configurado: ${data.tip}`)
        else toast.error(`Erro ao enviar: ${data.error}`)
      } else {
        toast.success('📧 Lembrete enviado para seu e-mail!')
      }
    } catch {
      toast.error('Falha de conexão ao enviar e-mail')
    } finally {
      setEnviandoEmail(false)
    }
  }

  async function salvarVisita() {
    if (!form.cliente_id || !form.data || !form.hora || !form.objetivo?.trim()) {
      toast.error('Preencha cliente, data, hora e objetivo')
      return
    }
    const cliente = clientes.find((c: any) => c.id === form.cliente_id)
    const novaVisita: Visita = {
      id: editando?.id || genId('v'),
      cliente_id: form.cliente_id!,
      cliente_nome: cliente?.nome || '',
      cliente_cidade: cliente?.cidade || '',
      cliente_uf: cliente?.uf || '',
      data: form.data!,
      hora: form.hora!,
      vendedor: form.vendedor || 'Reginaldo Alves',
      objetivo: form.objetivo!,
      observacoes: form.observacoes || '',
      status: (form.status as StatusVisita) || 'agendada',
      lembrete: form.lembrete ?? true,
    }
    const nova = editando
      ? visitas.map(v => v.id === editando.id ? novaVisita : v)
      : [...visitas, novaVisita]
    setVisitas(nova)
    saveData('visitas_crm', nova)
    setEditando(null)
    setForm({ data: hoje(), hora: '09:00', status: 'agendada', lembrete: true, objetivo: '', observacoes: '' })
    setTab('lista')
    toast.success(editando ? 'Visita atualizada!' : 'Visita agendada!')
    // Envia lembrete se marcado
    if (novaVisita.lembrete && novaVisita.status === 'agendada') {
      await enviarLembrete([novaVisita], 'confirmacao')
    }
  }

  function alterarStatus(id: string, status: StatusVisita) {
    const nova = visitas.map(v => v.id === id
      ? { ...v, status, check_in: status === 'concluida' ? new Date().toISOString() : v.check_in }
      : v)
    setVisitas(nova)
    saveData('visitas_crm', nova)
    toast.success(status === 'concluida' ? 'Check-in registrado!' : 'Status atualizado')
  }

  function excluir(id: string) {
    const nova = visitas.filter(v => v.id !== id)
    setVisitas(nova)
    saveData('visitas_crm', nova)
    toast.success('Visita removida')
  }

  function editarVisita(v: Visita) {
    setForm({ ...v })
    setEditando(v)
    setTab('criar')
  }

  const vendedores = Array.from(new Set(visitas.map(v => v.vendedor)))

  // Semana atual
  const hoje_d = new Date()
  const inicioSemana = new Date(hoje_d)
  inicioSemana.setDate(hoje_d.getDate() - hoje_d.getDay() + 1 + semanaOffset * 7)

  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicioSemana)
    d.setDate(inicioSemana.getDate() + i)
    return d.toISOString().slice(0, 10)
  })

  const visitasFiltradas = visitas.filter(v => {
    if (filtroStatus !== 'todas' && v.status !== filtroStatus) return false
    if (filtroVendedor !== 'todos' && v.vendedor !== filtroVendedor) return false
    return true
  }).sort((a, b) => `${a.data}${a.hora}`.localeCompare(`${b.data}${b.hora}`))

  const proximas = visitasFiltradas.filter(v => v.data >= hoje() && v.status === 'agendada')
  const atrasadas = visitas.filter(v => v.data < hoje() && v.status === 'agendada')

  return (
    <div className="animate-fade-up space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar size={22} className="text-cyan-600" /> Agenda de Visitas
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{proximas.length} visita{proximas.length !== 1 ? 's' : ''} agendada{proximas.length !== 1 ? 's' : ''}{atrasadas.length > 0 && <span className="ml-2 text-amber-600 font-semibold">· {atrasadas.length} atrasada{atrasadas.length !== 1 ? 's' : ''}</span>}</p>
        </div>
        <div className="flex gap-2">
          {(() => {
            const visitasHoje = visitas.filter(v => v.data === hoje() && v.status === 'agendada')
            return visitasHoje.length > 0 ? (
              <button
                onClick={() => enviarLembrete(visitasHoje, 'resumo_dia')}
                disabled={enviandoEmail}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                title="Enviar resumo das visitas de hoje para seu e-mail"
              >
                {enviandoEmail ? <Loader2 size={14} className="animate-spin"/> : <Mail size={14}/>}
                Resumo hoje
              </button>
            ) : null
          })()}
          <button onClick={() => { setTab('lista') }}
            className={cn('px-4 py-2 rounded-xl text-sm font-semibold transition-all', tab === 'lista' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50')}>
            Lista
          </button>
          <button onClick={() => { setEditando(null); setForm({ data: hoje(), hora: '09:00', status: 'agendada', lembrete: true, objetivo: '', observacoes: '' }); setTab('criar') }}
            className={cn('flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all', tab === 'criar' ? 'bg-cyan-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50')}>
            <Plus size={14} /> Agendar visita
          </button>
        </div>
      </div>

      {/* Alertas atrasados */}
      {atrasadas.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <Bell size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Visitas em aberto passadas da data</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {atrasadas.map(v => (
                <span key={v.id} className="text-xs bg-white border border-amber-200 rounded-lg px-2.5 py-1 text-amber-700 font-medium">
                  {v.cliente_nome} · {formatData(v.data)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'criar' ? (
        /* FORMULÁRIO */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl">
          <h2 className="text-lg font-bold text-slate-800 mb-5">{editando ? 'Editar visita' : 'Agendar nova visita'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Cliente *</label>
              <select value={form.cliente_id || ''} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 focus:border-transparent outline-none">
                <option value="">Selecionar cliente...</option>
                {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.nome} — {c.cidade}/{c.uf}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Data *</label>
              <input type="date" value={form.data || ''} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Hora *</label>
              <input type="time" value={form.hora || ''} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Vendedor</label>
              <select value={form.vendedor || ''} onChange={e => setForm(f => ({ ...f, vendedor: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none">
                <option value="">Selecionar...</option>
                <option>Reginaldo Alves</option>
                <option>Ana Rodrigues</option>
                <option>Wanderson Lima</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
              <select value={form.status || 'agendada'} onChange={e => setForm(f => ({ ...f, status: e.target.value as StatusVisita }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none">
                <option value="agendada">Agendada</option>
                <option value="concluida">Concluída</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Objetivo da visita *</label>
              <input value={form.objetivo || ''} onChange={e => setForm(f => ({ ...f, objetivo: e.target.value }))}
                placeholder="Ex.: Apresentar linha de solventes, renovar contrato..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Observações</label>
              <textarea value={form.observacoes || ''} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                rows={2} placeholder="Notas internas, materiais a levar..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none resize-none" />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.lembrete ?? true} onChange={e => setForm(f => ({ ...f, lembrete: e.target.checked }))}
                  className="w-4 h-4 rounded" />
                <span className="text-sm text-slate-600">Ativar lembrete <span className="text-slate-400">(envia e-mail de confirmação ao agendar)</span></span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={salvarVisita} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#06b6d4,#2563eb)' }}>
              {editando ? 'Salvar alterações' : 'Agendar visita'}
            </button>
            <button onClick={() => { setTab('lista'); setEditando(null) }}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mini calendário semanal */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setSemanaOffset(s => s - 1)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"><ChevronLeft size={16} /></button>
              <p className="text-sm font-semibold text-slate-700">
                {formatData(diasSemana[0])} — {formatData(diasSemana[6])}
              </p>
              <button onClick={() => setSemanaOffset(s => s + 1)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"><ChevronRight size={16} /></button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
                <div key={d} className="text-[10px] text-slate-400 text-center font-medium pb-1">{d}</div>
              ))}
              {diasSemana.map(dia => {
                const count = visitas.filter(v => v.data === dia && v.status === 'agendada').length
                const isHoje = dia === hoje()
                return (
                  <div key={dia} className={cn('rounded-xl p-1.5 text-center min-h-[52px] border transition-colors',
                    isHoje ? 'bg-cyan-50 border-cyan-200' : 'bg-slate-50 border-slate-100')}>
                    <p className={cn('text-xs font-bold mb-0.5', isHoje ? 'text-cyan-700' : 'text-slate-600')}>
                      {dia.slice(8)}
                    </p>
                    {count > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500 text-white text-[9px] font-bold">{count}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 flex-wrap">
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700">
              <option value="todas">Todos os status</option>
              <option value="agendada">Agendadas</option>
              <option value="concluida">Concluídas</option>
              <option value="cancelada">Canceladas</option>
            </select>
            <select value={filtroVendedor} onChange={e => setFiltroVendedor(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700">
              <option value="todos">Todos vendedores</option>
              {vendedores.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <p className="ml-auto text-xs text-slate-400 self-center">{visitasFiltradas.length} registro{visitasFiltradas.length !== 1 ? 's' : ''}</p>
          </div>

          {/* Lista */}
          <div className="space-y-2">
            {visitasFiltradas.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                <Calendar size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Nenhuma visita encontrada</p>
              </div>
            ) : visitasFiltradas.map(v => {
              const cfg = STATUS_CONFIG[v.status]
              const Icon = cfg.icon
              return (
                <div key={v.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-start gap-4 hover:border-slate-300 transition-colors">
                  {/* Status pill */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: cfg.bg }}>
                      <Icon size={16} style={{ color: cfg.cor }} />
                    </div>
                    {v.lembrete && <Bell size={11} className="text-amber-400" />}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 leading-tight">{v.cliente_nome}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={10} /> {v.cliente_cidade}/{v.cliente_uf} · <Clock size={10} /> {formatData(v.data)} às {v.hora} · {v.vendedor}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: cfg.bg, color: cfg.cor }}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1.5 font-medium">{v.objetivo}</p>
                    {v.observacoes && <p className="text-xs text-slate-400 mt-0.5 italic">{v.observacoes}</p>}
                    {v.check_in && (
                      <p className="text-[10px] text-emerald-600 mt-1">Check-in: {new Date(v.check_in).toLocaleString('pt-BR')}</p>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {v.status === 'agendada' && (
                      <>
                        <button onClick={() => alterarStatus(v.id, 'concluida')}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center gap-1">
                          <Check size={11} /> Check-in
                        </button>
                        <button onClick={() => alterarStatus(v.id, 'cancelada')}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center gap-1">
                          <X size={11} /> Cancelar
                        </button>
                      </>
                    )}
                    <a href={`https://wa.me/55?text=${encodeURIComponent(`Olá! Confirmo visita em ${formatData(v.data)} às ${v.hora}.`)}`} target="_blank"
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center gap-1">
                      <MessageCircle size={11} /> WA
                    </a>
                    <button onClick={() => editarVisita(v)} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors">
                      Editar
                    </button>
                    <button onClick={() => excluir(v.id)} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                      Excluir
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
