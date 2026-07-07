'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Plus, X, MessageCircle, TrendingUp, Target, AlertTriangle, Clock, Filter, ChevronDown } from 'lucide-react'
import { loadData, saveData, genId } from '@/lib/storage'
import {
  ETAPAS, MOTIVOS_PERDA, NEGOCIOS_SEED, TAREFAS_SEED,
  type Negocio, type EtapaNegocio, type TarefaFollowUp
} from '@/lib/negocios-seed'
import { VENDEDORES_SEED } from '@/lib/clientes-seed'

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

const EMPTY_NEGOCIO: Omit<Negocio, 'id' | 'data_criacao' | 'data_atualizacao'> = {
  titulo: '', cliente_id: '', cliente_nome: '', valor: 0, produto: '',
  etapa: 'prospeccao', probabilidade: 10, responsavel: '', data_fechamento_prev: '', observacoes: '',
}

export default function NegociosPage() {
  const [negocios, setNegocios] = useState<Negocio[]>([])
  const [tarefas, setTarefas] = useState<TarefaFollowUp[]>([])
  const [filtroVendedor, setFiltroVendedor] = useState('')
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<Negocio | null>(null)
  const [form, setForm] = useState<Omit<Negocio, 'id' | 'data_criacao' | 'data_atualizacao'>>(EMPTY_NEGOCIO)
  const [modalPerda, setModalPerda] = useState<{ id: string; etapaDest: EtapaNegocio } | null>(null)
  const [motivoPerda, setMotivoPerda] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<EtapaNegocio | null>(null)

  useEffect(() => {
    setNegocios(loadData('negocios', NEGOCIOS_SEED))
    setTarefas(loadData('tarefas_followup', TAREFAS_SEED))
  }, [])

  const saveNegocios = (list: Negocio[]) => { setNegocios(list); saveData('negocios', list) }
  const saveTarefas = (list: TarefaFollowUp[]) => { setTarefas(list); saveData('tarefas_followup', list) }

  const filtrados = negocios.filter(n => !filtroVendedor || n.responsavel === filtroVendedor)
  const etapasVisiveis = ETAPAS.filter(e => e.id !== 'perdido' && e.id !== 'ganho')
  const ganhos = filtrados.filter(n => n.etapa === 'ganho')
  const perdidos = filtrados.filter(n => n.etapa === 'perdido')

  // Forecast (valor ponderado)
  const forecast = filtrados
    .filter(n => n.etapa !== 'perdido')
    .reduce((acc, n) => acc + n.valor * (n.probabilidade / 100), 0)
  const pipeline_total = filtrados
    .filter(n => n.etapa !== 'perdido' && n.etapa !== 'ganho')
    .reduce((acc, n) => acc + n.valor, 0)

  // Tarefas vencidas/vencendo hoje
  const hoje = new Date().toISOString().slice(0, 10)
  const tarefasUrgentes = tarefas.filter(t => !t.concluida && t.data_venc <= hoje)

  function moverEtapa(id: string, novaEtapa: EtapaNegocio) {
    if (novaEtapa === 'perdido') {
      setModalPerda({ id, etapaDest: novaEtapa })
      setMotivoPerda('')
      return
    }
    const etapa = ETAPAS.find(e => e.id === novaEtapa)!
    saveNegocios(negocios.map(n => n.id === id
      ? { ...n, etapa: novaEtapa, probabilidade: etapa.prob, data_atualizacao: new Date().toISOString().slice(0, 10) }
      : n
    ))
  }

  function confirmarPerda() {
    if (!modalPerda || !motivoPerda) return
    saveNegocios(negocios.map(n => n.id === modalPerda.id
      ? { ...n, etapa: 'perdido', probabilidade: 0, motivo_perda: motivoPerda, data_atualizacao: new Date().toISOString().slice(0, 10) }
      : n
    ))
    setModalPerda(null)
  }

  function salvarNegocio(e: React.FormEvent) {
    e.preventDefault()
    const now = new Date().toISOString().slice(0, 10)
    if (editando) {
      saveNegocios(negocios.map(n => n.id === editando.id ? { ...form, id: editando.id, data_criacao: editando.data_criacao, data_atualizacao: now } : n))
    } else {
      saveNegocios([...negocios, { ...form, id: genId('neg'), data_criacao: now, data_atualizacao: now }])
    }
    setModal(false)
  }

  function abrirEditar(n: Negocio) {
    setEditando(n)
    setForm({ titulo: n.titulo, cliente_id: n.cliente_id, cliente_nome: n.cliente_nome, valor: n.valor, produto: n.produto, etapa: n.etapa, probabilidade: n.probabilidade, responsavel: n.responsavel, data_fechamento_prev: n.data_fechamento_prev || '', observacoes: n.observacoes || '', motivo_perda: n.motivo_perda, contato_nome: n.contato_nome, contato_wa: n.contato_wa })
    setModal(true)
  }

  function abrirCriar(etapa: EtapaNegocio = 'prospeccao') {
    const prob = ETAPAS.find(e => e.id === etapa)?.prob ?? 10
    setEditando(null)
    setForm({ ...EMPTY_NEGOCIO, etapa, probabilidade: prob })
    setModal(true)
  }

  function excluir(id: string) {
    if (confirm('Excluir este negócio?')) saveNegocios(negocios.filter(n => n.id !== id))
  }

  // Drag & Drop
  function onDragStart(id: string) { setDragId(id) }
  function onDragOver(e: React.DragEvent, etapa: EtapaNegocio) { e.preventDefault(); setDragOver(etapa) }
  function onDrop(etapa: EtapaNegocio) {
    if (dragId) moverEtapa(dragId, etapa)
    setDragId(null); setDragOver(null)
  }

  const diasParaVencer = (data?: string) => {
    if (!data) return null
    return Math.ceil((new Date(data).getTime() - Date.now()) / 86400000)
  }

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))

  return (
    <div className="h-full flex flex-col animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pipeline de Negócios</h1>
          <p className="text-sm text-slate-500">Forecast ponderado do mês</p>
        </div>
        <div className="flex items-center gap-3">
          {tarefasUrgentes.length > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 text-xs text-red-700">
              <AlertTriangle className="w-3.5 h-3.5" />
              {tarefasUrgentes.length} follow-up{tarefasUrgentes.length > 1 ? 's' : ''} vencido{tarefasUrgentes.length > 1 ? 's' : ''}
            </div>
          )}
          <select
            value={filtroVendedor}
            onChange={e => setFiltroVendedor(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
          >
            <option value="">Todos os vendedores</option>
            {VENDEDORES_SEED.map(v => <option key={v.id} value={v.nome}>{v.nome}</option>)}
          </select>
          <button onClick={() => abrirCriar()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Novo negócio
          </button>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-4 gap-3 mb-4 flex-shrink-0">
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <p className="text-xs text-slate-500">Pipeline ativo</p>
          <p className="text-lg font-bold text-slate-800">{fmt(pipeline_total)}</p>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-3">
          <p className="text-xs text-blue-600">Forecast ponderado</p>
          <p className="text-lg font-bold text-blue-700">{fmt(forecast)}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-3">
          <p className="text-xs text-emerald-600">Ganhos no período</p>
          <p className="text-lg font-bold text-emerald-700">{fmt(ganhos.reduce((a, n) => a + n.valor, 0))}</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-3">
          <p className="text-xs text-red-600">Perdidos</p>
          <p className="text-lg font-bold text-red-700">{fmt(perdidos.reduce((a, n) => a + n.valor, 0))}</p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-3 flex-1 overflow-x-auto pb-2 min-h-0">
        {etapasVisiveis.map(etapa => {
          const cards = filtrados.filter(n => n.etapa === etapa.id)
          const totalEtapa = cards.reduce((a, n) => a + n.valor, 0)
          return (
            <div
              key={etapa.id}
              className={cn('flex flex-col rounded-xl border-2 min-w-[260px] w-[260px] transition-colors', dragOver === etapa.id ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-slate-50')}
              onDragOver={e => onDragOver(e, etapa.id)}
              onDrop={() => onDrop(etapa.id)}
              onDragLeave={() => setDragOver(null)}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-slate-200 flex-shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: etapa.cor }} />
                    <span className="text-sm font-semibold text-slate-700">{etapa.label}</span>
                    <span className="text-xs bg-white border border-slate-200 rounded-full px-1.5 py-0.5 text-slate-500">{cards.length}</span>
                  </div>
                  <button onClick={() => abrirCriar(etapa.id)} className="text-slate-400 hover:text-blue-600">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-400">{fmt(totalEtapa)} · prob. {etapa.prob}%</p>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {cards.map(neg => {
                  const dias = diasParaVencer(neg.data_fechamento_prev)
                  const tarefasNeg = tarefas.filter(t => t.negocio_id === neg.id && !t.concluida)
                  const urgente = tarefasNeg.some(t => t.data_venc <= hoje)
                  return (
                    <div
                      key={neg.id}
                      draggable
                      onDragStart={() => onDragStart(neg.id)}
                      className={cn('bg-white rounded-lg border p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow', urgente ? 'border-red-300' : 'border-slate-200')}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <p className="text-sm font-medium text-slate-800 leading-tight">{neg.titulo}</p>
                        <button onClick={() => excluir(neg.id)} className="text-slate-300 hover:text-red-400 flex-shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{neg.cliente_nome}</p>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-slate-800">{fmt(neg.valor)}</span>
                        <span className="text-xs text-slate-400">{neg.probabilidade}%</span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1 bg-slate-100 rounded-full mb-2">
                        <div className="h-1 rounded-full" style={{ width: `${neg.probabilidade}%`, background: etapa.cor }} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{neg.responsavel.split(' ')[0]}</span>
                        {dias !== null && (
                          <span className={cn(dias < 0 ? 'text-red-500 font-medium' : dias <= 7 ? 'text-amber-500' : 'text-slate-400')}>
                            {dias < 0 ? `${Math.abs(dias)}d vencido` : `${dias}d restantes`}
                          </span>
                        )}
                      </div>
                      {urgente && (
                        <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Follow-up vencido
                        </div>
                      )}
                      <div className="flex gap-1.5 mt-2 pt-2 border-t border-slate-100">
                        <button onClick={() => abrirEditar(neg)} className="flex-1 text-xs text-blue-600 hover:underline">Editar</button>
                        {neg.contato_wa && (
                          <a href={`https://wa.me/${neg.contato_wa}?text=Olá! Entrando em contato sobre ${neg.titulo}.`} target="_blank" className="text-emerald-600" title="WhatsApp">
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <select
                          onChange={e => { if (e.target.value) moverEtapa(neg.id, e.target.value as EtapaNegocio) }}
                          className="text-xs border-0 text-slate-400 bg-transparent cursor-pointer"
                          value=""
                        >
                          <option value="">Mover →</option>
                          {ETAPAS.filter(e => e.id !== neg.etapa).map(e => (
                            <option key={e.id} value={e.id}>{e.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )
                })}
                {cards.length === 0 && (
                  <div className="text-center text-xs text-slate-400 py-6">Arraste negócios aqui</div>
                )}
              </div>
            </div>
          )
        })}

        {/* Ganho */}
        <div className="flex flex-col rounded-xl border-2 border-emerald-200 bg-emerald-50 min-w-[220px] w-[220px]"
          onDragOver={e => onDragOver(e, 'ganho')}
          onDrop={() => onDrop('ganho')}
          onDragLeave={() => setDragOver(null)}
        >
          <div className="p-3 border-b border-emerald-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-sm font-semibold text-emerald-700">Ganho ✓</span>
              <span className="text-xs bg-white border border-emerald-200 rounded-full px-1.5 py-0.5 text-emerald-600">{ganhos.length}</span>
            </div>
            <p className="text-xs text-emerald-600 font-medium">{fmt(ganhos.reduce((a, n) => a + n.valor, 0))}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {ganhos.map(neg => (
              <div key={neg.id} className="bg-white rounded-lg border border-emerald-200 p-2.5">
                <p className="text-xs font-medium text-slate-700">{neg.titulo}</p>
                <p className="text-sm font-bold text-emerald-600 mt-0.5">{fmt(neg.valor)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Perdido */}
        <div className="flex flex-col rounded-xl border-2 border-red-200 bg-red-50 min-w-[220px] w-[220px]"
          onDragOver={e => onDragOver(e, 'perdido')}
          onDrop={() => onDrop('perdido')}
          onDragLeave={() => setDragOver(null)}
        >
          <div className="p-3 border-b border-red-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-sm font-semibold text-red-700">Perdido ✗</span>
              <span className="text-xs bg-white border border-red-200 rounded-full px-1.5 py-0.5 text-red-500">{perdidos.length}</span>
            </div>
            <p className="text-xs text-red-500">{fmt(perdidos.reduce((a, n) => a + n.valor, 0))}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {perdidos.map(neg => (
              <div key={neg.id} className="bg-white rounded-lg border border-red-200 p-2.5">
                <p className="text-xs font-medium text-slate-700">{neg.titulo}</p>
                <p className="text-xs text-red-500 mt-0.5">{neg.motivo_perda}</p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">{fmt(neg.valor)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Criar/Editar */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-bold text-slate-800">{editando ? 'Editar Negócio' : 'Novo Negócio'}</h2>
              <button onClick={() => setModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={salvarNegocio} className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-xs font-medium text-slate-600">Título *</label>
                <input required value={form.titulo} onChange={f('titulo')} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Ex: Acetona — Cliente XYZ" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Cliente</label>
                  <input value={form.cliente_nome} onChange={f('cliente_nome')} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Nome do cliente" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Produto</label>
                  <input value={form.produto} onChange={f('produto')} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Produto químico" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Valor (R$) *</label>
                  <input required type="number" value={form.valor} onChange={f('valor')} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" min={0} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Etapa</label>
                  <select value={form.etapa} onChange={f('etapa')} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm">
                    {ETAPAS.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Responsável</label>
                  <select value={form.responsavel} onChange={f('responsavel')} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm">
                    <option value="">Selecionar</option>
                    {VENDEDORES_SEED.map(v => <option key={v.id} value={v.nome}>{v.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Fechamento previsto</label>
                  <input type="date" value={form.data_fechamento_prev} onChange={f('data_fechamento_prev')} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">WhatsApp do contato (somente dígitos)</label>
                <input value={form.contato_wa || ''} onChange={f('contato_wa')} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="5511999990000" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Observações</label>
                <textarea value={form.observacoes} onChange={f('observacoes')} rows={2} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="flex-1 border border-slate-200 rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Motivo de Perda */}
      {modalPerda && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <h2 className="font-bold text-slate-800 mb-1">Por que perdemos este negócio?</h2>
            <p className="text-xs text-slate-500 mb-4">Selecionar o motivo ajuda a melhorar futuras propostas.</p>
            <div className="space-y-2 mb-4">
              {MOTIVOS_PERDA.map(m => (
                <label key={m} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="motivo" value={m} checked={motivoPerda === m} onChange={() => setMotivoPerda(m)} className="accent-red-500" />
                  <span className="text-sm text-slate-700">{m}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModalPerda(null)} className="flex-1 border border-slate-200 rounded-lg py-2 text-sm">Cancelar</button>
              <button onClick={confirmarPerda} disabled={!motivoPerda} className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-40">Confirmar perda</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
