'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, cn } from '@/lib/utils'
import { Plus, Search, Pencil, Trash2, FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { loadData, saveData, genId } from '@/lib/storage'

interface ItemProposta { produto: string; quantidade: number; preco_unitario: number }

interface Proposta {
  id: string; numero: string; cliente: string; data: string; validade: string
  status: 'rascunho' | 'enviada' | 'aprovada' | 'recusada' | 'expirada'
  itens: ItemProposta[]; observacoes: string; responsavel: string
}

const SEED: Proposta[] = [
  { id: 'prop-001', numero: 'PROP-2024-001', cliente: 'Nordeste Química Ltda', data: '2024-11-01', validade: '2024-11-15', status: 'aprovada', itens: [{produto: 'Acetona Industrial 99,5%', quantidade: 500, preco_unitario: 6.80},{produto: 'Tolueno Industrial', quantidade: 300, preco_unitario: 7.90}], observacoes: 'Entrega em 10 dias úteis', responsavel: 'Wanderson Lima' },
  { id: 'prop-002', numero: 'PROP-2024-002', cliente: 'IndTex Plásticos SA', data: '2024-11-10', validade: '2024-11-24', status: 'enviada', itens: [{produto: 'Ftalato de Dioctila (DOP)', quantidade: 1000, preco_unitario: 14.90}], observacoes: 'Frete CIF incluso', responsavel: 'Wanderson Lima' },
  { id: 'prop-003', numero: 'PROP-2024-003', cliente: 'PetroSul Derivados', data: '2024-11-15', validade: '2024-11-29', status: 'rascunho', itens: [{produto: 'Resina Epóxi Bisfenol A', quantidade: 200, preco_unitario: 28.00}], observacoes: '', responsavel: 'Wanderson Lima' },
  { id: 'prop-004', numero: 'PROP-2024-004', cliente: 'Agroquim Nordeste', data: '2024-10-20', validade: '2024-11-03', status: 'expirada', itens: [{produto: 'Dióxido de Titânio R-902', quantidade: 100, preco_unitario: 43.00}], observacoes: 'Aguardando retorno', responsavel: 'Wanderson Lima' },
]

const EMPTY: Omit<Proposta,'id'> = {
  numero: '', cliente: '', data: new Date().toISOString().split('T')[0],
  validade: new Date(Date.now() + 14*86400000).toISOString().split('T')[0],
  status: 'rascunho', itens: [{produto:'', quantidade:1, preco_unitario:0}], observacoes: '', responsavel: 'Wanderson Lima'
}

const STATUS_CONFIG = {
  rascunho: { label: 'Rascunho', color: 'bg-slate-100 text-slate-600', icon: <Clock size={12}/> },
  enviada: { label: 'Enviada', color: 'bg-blue-100 text-blue-700', icon: <FileText size={12}/> },
  aprovada: { label: 'Aprovada', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle size={12}/> },
  recusada: { label: 'Recusada', color: 'bg-red-100 text-red-700', icon: <XCircle size={12}/> },
  expirada: { label: 'Expirada', color: 'bg-amber-100 text-amber-700', icon: <Clock size={12}/> },
}

const total = (itens: ItemProposta[]) => itens.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0)

export default function PropostasPage() {
  const [propostas, setPropostas] = useState<Proposta[]>([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Proposta | null>(null)
  const [form, setForm] = useState<Omit<Proposta,'id'>>(EMPTY)
  const [deleteId, setDeleteId] = useState<string|null>(null)

  useEffect(() => { setPropostas(loadData('propostas', SEED)) }, [])
  const save = (list: Proposta[]) => { setPropostas(list); saveData('propostas', list) }

  const openCreate = () => {
    const n = `PROP-${new Date().getFullYear()}-${String(propostas.length + 1).padStart(3,'0')}`
    setEditing(null); setForm({...EMPTY, numero: n}); setModal(true)
  }
  const openEdit = (p: Proposta) => { setEditing(p); setForm({...p, itens: [...p.itens]}); setModal(true) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) save(propostas.map(p => p.id === editing.id ? {...form, id: editing.id} : p))
    else save([...propostas, { ...form, id: genId('prop') }])
    setModal(false)
  }

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const addItem = () => setForm(prev => ({ ...prev, itens: [...prev.itens, {produto:'', quantidade:1, preco_unitario:0}] }))
  const removeItem = (i: number) => setForm(prev => ({ ...prev, itens: prev.itens.filter((_,idx) => idx !== i) }))
  const updateItem = (i: number, field: keyof ItemProposta, val: string) =>
    setForm(prev => ({ ...prev, itens: prev.itens.map((it, idx) => idx === i ? {...it, [field]: field === 'produto' ? val : Number(val)} : it) }))

  const filtered = propostas.filter(p => !search ||
    p.numero.toLowerCase().includes(search.toLowerCase()) || p.cliente.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Propostas Comerciais</h1>
          <p className="text-slate-500 text-sm mt-0.5">{propostas.filter(p=>p.status==='enviada').length} aguardando resposta</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16}/>Nova Proposta</button>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Número ou cliente..." className="form-input pl-9 py-1.5"/>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="data-table">
          <thead><tr>
            <th>Nº Proposta</th><th>Cliente</th><th>Data</th><th>Validade</th><th className="text-right">Total</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={7} className="text-center text-slate-400 py-8">Nenhuma proposta encontrada</td></tr>}
            {filtered.map(p => {
              const cfg = STATUS_CONFIG[p.status]
              return (
                <tr key={p.id}>
                  <td className="font-mono text-xs font-semibold text-cyan-700">{p.numero}</td>
                  <td className="font-medium text-slate-800">{p.cliente}</td>
                  <td className="text-slate-500 text-sm">{new Date(p.data).toLocaleDateString('pt-BR')}</td>
                  <td className="text-slate-500 text-sm">{new Date(p.validade).toLocaleDateString('pt-BR')}</td>
                  <td className="text-right font-semibold text-slate-800">{formatCurrency(total(p.itens))}</td>
                  <td><span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full', cfg.color)}>{cfg.icon}{cfg.label}</span></td>
                  <td>
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors"><Pencil size={14}/></button>
                      <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? `Editar ${form.numero}` : 'Nova Proposta'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Nº da Proposta</label><input value={form.numero} onChange={f('numero')} className="form-input" required/></div>
            <div><label className="form-label">Status</label>
              <select value={form.status} onChange={f('status')} className="form-input">
                {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div><label className="form-label">Cliente</label><input value={form.cliente} onChange={f('cliente')} className="form-input" required placeholder="Nome do cliente"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Data da Proposta</label><input type="date" value={form.data} onChange={f('data')} className="form-input"/></div>
            <div><label className="form-label">Validade</label><input type="date" value={form.validade} onChange={f('validade')} className="form-input"/></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="form-label mb-0">Itens da Proposta</label>
              <button type="button" onClick={addItem} className="text-xs text-cyan-600 hover:underline flex items-center gap-1"><Plus size={12}/>Adicionar item</button>
            </div>
            <div className="space-y-2">
              {form.itens.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6"><input value={item.produto} onChange={e=>updateItem(i,'produto',e.target.value)} className="form-input" placeholder="Produto"/></div>
                  <div className="col-span-2"><input type="number" value={item.quantidade} onChange={e=>updateItem(i,'quantidade',e.target.value)} className="form-input" placeholder="Qtd" min="1"/></div>
                  <div className="col-span-3"><input type="number" step="0.01" value={item.preco_unitario} onChange={e=>updateItem(i,'preco_unitario',e.target.value)} className="form-input" placeholder="R$/un" min="0"/></div>
                  <div className="col-span-1 flex justify-center">
                    {form.itens.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><XCircle size={16}/></button>}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-right text-sm font-semibold text-slate-700">
              Total: {formatCurrency(total(form.itens))}
            </div>
          </div>

          <div><label className="form-label">Observações</label>
            <textarea value={form.observacoes} onChange={f('observacoes')} className="form-input" rows={2} placeholder="Condições de entrega, frete, pagamento..."/>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary"><FileText size={16}/>{editing ? 'Salvar' : 'Criar Proposta'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar exclusão" size="sm">
        <p className="text-slate-600 mb-5">Excluir esta proposta permanentemente?</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancelar</button>
          <button onClick={() => { save(propostas.filter(p => p.id !== deleteId)); setDeleteId(null) }} className="btn-danger">Excluir</button>
        </div>
      </Modal>
    </div>
  )
}
