'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, cn } from '@/lib/utils'
import { Plus, Search, Pencil, Trash2, ShoppingCart, Truck, CheckCircle, Clock, XCircle } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { loadData, saveData, genId } from '@/lib/storage'

interface ItemPedido { produto: string; quantidade: number; preco_unitario: number }

interface Pedido {
  id: string; numero: string; cliente: string; data: string; prazo_entrega: string
  status: 'pendente' | 'confirmado' | 'producao' | 'expedido' | 'entregue' | 'cancelado'
  itens: ItemPedido[]; forma_pagamento: string; observacoes: string
}

const SEED: Pedido[] = [
  { id: 'ped-001', numero: 'PV-2024-001', cliente: 'Nordeste Química Ltda', data: '2024-11-01', prazo_entrega: '2024-11-15', status: 'entregue', itens: [{produto: 'Acetona Industrial 99,5%', quantidade: 500, preco_unitario: 6.80}], forma_pagamento: '30/60/90 dias', observacoes: '' },
  { id: 'ped-002', numero: 'PV-2024-002', cliente: 'IndTex Plásticos SA', data: '2024-11-10', prazo_entrega: '2024-11-25', status: 'expedido', itens: [{produto: 'Ftalato de Dioctila (DOP)', quantidade: 1000, preco_unitario: 14.90}], forma_pagamento: '60 dias', observacoes: 'Entrega parcial autorizada' },
  { id: 'ped-003', numero: 'PV-2024-003', cliente: 'PetroSul Derivados', data: '2024-11-18', prazo_entrega: '2024-12-03', status: 'confirmado', itens: [{produto: 'Resina Epóxi Bisfenol A', quantidade: 200, preco_unitario: 28.00}], forma_pagamento: 'À vista com desconto', observacoes: '' },
  { id: 'ped-004', numero: 'PV-2024-004', cliente: 'Fab Têxtil Nordeste', data: '2024-11-20', prazo_entrega: '2024-12-10', status: 'pendente', itens: [{produto: 'Dióxido de Titânio R-902', quantidade: 100, preco_unitario: 43.00}], forma_pagamento: '30 dias', observacoes: '' },
]

const EMPTY: Omit<Pedido,'id'> = {
  numero: '', cliente: '', data: new Date().toISOString().split('T')[0],
  prazo_entrega: new Date(Date.now() + 15*86400000).toISOString().split('T')[0],
  status: 'pendente', itens: [{produto:'', quantidade:1, preco_unitario:0}],
  forma_pagamento: '30 dias', observacoes: ''
}

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: <Clock size={12}/> },
  confirmado: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700', icon: <CheckCircle size={12}/> },
  producao: { label: 'Em Produção', color: 'bg-purple-100 text-purple-700', icon: <ShoppingCart size={12}/> },
  expedido: { label: 'Expedido', color: 'bg-cyan-100 text-cyan-700', icon: <Truck size={12}/> },
  entregue: { label: 'Entregue', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle size={12}/> },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: <XCircle size={12}/> },
}

const total = (itens: ItemPedido[]) => itens.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0)

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Pedido | null>(null)
  const [form, setForm] = useState<Omit<Pedido,'id'>>(EMPTY)
  const [deleteId, setDeleteId] = useState<string|null>(null)

  useEffect(() => { setPedidos(loadData('pedidos', SEED)) }, [])
  const save = (list: Pedido[]) => { setPedidos(list); saveData('pedidos', list) }

  const openCreate = () => {
    const n = `PV-${new Date().getFullYear()}-${String(pedidos.length + 1).padStart(3,'0')}`
    setEditing(null); setForm({...EMPTY, numero: n}); setModal(true)
  }
  const openEdit = (p: Pedido) => { setEditing(p); setForm({...p, itens: [...p.itens]}); setModal(true) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) save(pedidos.map(p => p.id === editing.id ? {...form, id: editing.id} : p))
    else save([...pedidos, { ...form, id: genId('ped') }])
    setModal(false)
  }

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const addItem = () => setForm(prev => ({ ...prev, itens: [...prev.itens, {produto:'', quantidade:1, preco_unitario:0}] }))
  const removeItem = (i: number) => setForm(prev => ({ ...prev, itens: prev.itens.filter((_,idx) => idx !== i) }))
  const updateItem = (i: number, field: keyof ItemPedido, val: string) =>
    setForm(prev => ({ ...prev, itens: prev.itens.map((it, idx) => idx === i ? {...it, [field]: field === 'produto' ? val : Number(val)} : it) }))

  const filtered = pedidos.filter(p => !search ||
    p.numero.toLowerCase().includes(search.toLowerCase()) || p.cliente.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pedidos de Venda</h1>
          <p className="text-slate-500 text-sm mt-0.5">{pedidos.filter(p=>p.status==='expedido'||p.status==='confirmado').length} em andamento</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16}/>Novo Pedido</button>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Número ou cliente..." className="form-input pl-9 py-1.5"/>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="data-table">
          <thead><tr>
            <th>Nº Pedido</th><th>Cliente</th><th>Data</th><th>Entrega</th><th className="text-right">Total</th><th>Pagamento</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center text-slate-400 py-8">Nenhum pedido encontrado</td></tr>}
            {filtered.map(p => {
              const cfg = STATUS_CONFIG[p.status]
              return (
                <tr key={p.id}>
                  <td className="font-mono text-xs font-semibold text-cyan-700">{p.numero}</td>
                  <td className="font-medium text-slate-800">{p.cliente}</td>
                  <td className="text-slate-500 text-sm">{new Date(p.data).toLocaleDateString('pt-BR')}</td>
                  <td className="text-slate-500 text-sm">{new Date(p.prazo_entrega).toLocaleDateString('pt-BR')}</td>
                  <td className="text-right font-semibold text-slate-800">{formatCurrency(total(p.itens))}</td>
                  <td className="text-slate-500 text-sm">{p.forma_pagamento}</td>
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

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? `Editar ${form.numero}` : 'Novo Pedido de Venda'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Nº do Pedido</label><input value={form.numero} onChange={f('numero')} className="form-input" required/></div>
            <div><label className="form-label">Status</label>
              <select value={form.status} onChange={f('status')} className="form-input">
                {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div><label className="form-label">Cliente</label><input value={form.cliente} onChange={f('cliente')} className="form-input" required placeholder="Nome do cliente"/></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="form-label">Data do Pedido</label><input type="date" value={form.data} onChange={f('data')} className="form-input"/></div>
            <div><label className="form-label">Prazo de Entrega</label><input type="date" value={form.prazo_entrega} onChange={f('prazo_entrega')} className="form-input"/></div>
            <div><label className="form-label">Forma de Pagamento</label><input value={form.forma_pagamento} onChange={f('forma_pagamento')} className="form-input" placeholder="Ex: 30/60 dias"/></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="form-label mb-0">Itens do Pedido</label>
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
            <textarea value={form.observacoes} onChange={f('observacoes')} className="form-input" rows={2} placeholder="Instruções de entrega, embalagem, etc."/>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary"><ShoppingCart size={16}/>{editing ? 'Salvar' : 'Emitir Pedido'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar exclusão" size="sm">
        <p className="text-slate-600 mb-5">Excluir este pedido permanentemente?</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancelar</button>
          <button onClick={() => { save(pedidos.filter(p => p.id !== deleteId)); setDeleteId(null) }} className="btn-danger">Excluir</button>
        </div>
      </Modal>
    </div>
  )
}
