'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, cn } from '@/lib/utils'
import { Plus, Search, Pencil, Trash2, DollarSign, TrendingDown, CheckCircle, Clock } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { loadData, saveData, genId } from '@/lib/storage'

interface Compra {
  id: string; numero: string; fornecedor: string; data: string; previsao_entrega: string
  categoria: string; descricao: string; valor_total: number
  status: 'solicitado' | 'aprovado' | 'em_transito' | 'recebido' | 'cancelado'
  moeda: 'BRL' | 'USD' | 'CNY' | 'EUR'; cambio: number; forma_pagamento: string
}

const SEED: Compra[] = [
  { id: 'cmp-001', numero: 'OC-2024-001', fornecedor: 'Hunan Chemical Co. Ltd', data: '2024-10-01', previsao_entrega: '2024-11-15', categoria: 'Resinas e Pigmentos', descricao: 'Dióxido de Titânio R-902 – 2.000 kg', valor_total: 56000, status: 'recebido', moeda: 'CNY', cambio: 0.77, forma_pagamento: 'Wire Transfer 30d' },
  { id: 'cmp-002', numero: 'OC-2024-002', fornecedor: 'GZ Poly Materials', data: '2024-10-15', previsao_entrega: '2024-11-25', categoria: 'Polímeros e Aditivos', descricao: 'Ftalato de Dioctila (DOP) – 5.000 kg', valor_total: 49000, status: 'em_transito', moeda: 'CNY', cambio: 0.77, forma_pagamento: 'LC 60 dias' },
  { id: 'cmp-003', numero: 'OC-2024-003', fornecedor: 'Quimibras Ind. Ltda', data: '2024-11-01', previsao_entrega: '2024-11-10', categoria: 'Solventes', descricao: 'Acetona Industrial – 3.000 kg + Tolueno – 2.000 kg', valor_total: 27200, status: 'recebido', moeda: 'BRL', cambio: 1, forma_pagamento: '30 dias' },
  { id: 'cmp-004', numero: 'OC-2024-004', fornecedor: 'SinoResin Chemical', data: '2024-11-10', previsao_entrega: '2024-12-25', categoria: 'Resinas Especiais', descricao: 'Resina Epóxi Bisfenol A – 1.000 kg', valor_total: 18500, status: 'aprovado', moeda: 'USD', cambio: 5.05, forma_pagamento: 'Wire Transfer 30d' },
]

const EMPTY: Omit<Compra,'id'> = {
  numero: '', fornecedor: '', data: new Date().toISOString().split('T')[0],
  previsao_entrega: new Date(Date.now() + 45*86400000).toISOString().split('T')[0],
  categoria: 'Resinas e Pigmentos', descricao: '', valor_total: 0,
  status: 'solicitado', moeda: 'CNY', cambio: 0.77, forma_pagamento: 'Wire Transfer 30d'
}

const STATUS_CONFIG = {
  solicitado: { label: 'Solicitado', color: 'bg-slate-100 text-slate-600' },
  aprovado: { label: 'Aprovado', color: 'bg-blue-100 text-blue-700' },
  em_transito: { label: 'Em Trânsito', color: 'bg-amber-100 text-amber-700' },
  recebido: { label: 'Recebido', color: 'bg-emerald-100 text-emerald-700' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
}

const CATEGORIAS = ['Solventes','Resinas e Pigmentos','Polímeros e Aditivos','Resinas Especiais','Catalisadores','Ácidos e Bases','Embalagens','Outros']

export default function ComprasPage() {
  const [compras, setCompras] = useState<Compra[]>([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Compra | null>(null)
  const [form, setForm] = useState<Omit<Compra,'id'>>(EMPTY)
  const [deleteId, setDeleteId] = useState<string|null>(null)

  useEffect(() => { setCompras(loadData('compras', SEED)) }, [])
  const save = (list: Compra[]) => { setCompras(list); saveData('compras', list) }

  const openCreate = () => {
    const n = `OC-${new Date().getFullYear()}-${String(compras.length + 1).padStart(3,'0')}`
    setEditing(null); setForm({...EMPTY, numero: n}); setModal(true)
  }
  const openEdit = (c: Compra) => { setEditing(c); setForm({...c}); setModal(true) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) save(compras.map(c => c.id === editing.id ? {...form, id: editing.id} : c))
    else save([...compras, { ...form, id: genId('cmp') }])
    setModal(false)
  }

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))

  const filtered = compras.filter(c => !search ||
    c.numero.toLowerCase().includes(search.toLowerCase()) || c.fornecedor.toLowerCase().includes(search.toLowerCase())
  )

  const totalGeral = compras.reduce((s,c) => s + c.valor_total, 0)

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ordens de Compra</h1>
          <p className="text-slate-500 text-sm mt-0.5">Total investido: {formatCurrency(totalGeral)}</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16}/>Nova Ordem de Compra</button>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Número ou fornecedor..." className="form-input pl-9 py-1.5"/>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="data-table">
          <thead><tr>
            <th>Nº OC</th><th>Fornecedor</th><th>Categoria</th><th>Descrição</th><th>Moeda</th><th className="text-right">Valor BRL</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center text-slate-400 py-8">Nenhuma compra encontrada</td></tr>}
            {filtered.map(c => {
              const cfg = STATUS_CONFIG[c.status]
              const valorBRL = c.moeda === 'BRL' ? c.valor_total : c.valor_total * c.cambio
              return (
                <tr key={c.id}>
                  <td className="font-mono text-xs font-semibold text-cyan-700">{c.numero}</td>
                  <td className="font-medium text-slate-800">{c.fornecedor}</td>
                  <td><span className="badge-blue">{c.categoria}</span></td>
                  <td className="text-slate-500 text-sm max-w-xs truncate">{c.descricao}</td>
                  <td><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{c.moeda}</span></td>
                  <td className="text-right font-semibold text-slate-800">{formatCurrency(valorBRL)}</td>
                  <td><span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', cfg.color)}>{cfg.label}</span></td>
                  <td>
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors"><Pencil size={14}/></button>
                      <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? `Editar ${form.numero}` : 'Nova Ordem de Compra'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Nº da OC</label><input value={form.numero} onChange={f('numero')} className="form-input" required/></div>
            <div><label className="form-label">Status</label>
              <select value={form.status} onChange={f('status')} className="form-input">
                {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div><label className="form-label">Fornecedor</label><input value={form.fornecedor} onChange={f('fornecedor')} className="form-input" required/></div>
          <div><label className="form-label">Categoria</label>
            <select value={form.categoria} onChange={f('categoria')} className="form-input">
              {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div><label className="form-label">Descrição dos Itens</label>
            <textarea value={form.descricao} onChange={f('descricao')} className="form-input" rows={2} placeholder="Ex: Acetona Industrial – 3.000 kg"/>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="form-label">Data da OC</label><input type="date" value={form.data} onChange={f('data')} className="form-input"/></div>
            <div><label className="form-label">Previsão de Entrega</label><input type="date" value={form.previsao_entrega} onChange={f('previsao_entrega')} className="form-input"/></div>
            <div><label className="form-label">Forma de Pagamento</label><input value={form.forma_pagamento} onChange={f('forma_pagamento')} className="form-input"/></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="form-label">Moeda</label>
              <select value={form.moeda} onChange={f('moeda')} className="form-input">
                <option value="CNY">CNY</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="BRL">BRL</option>
              </select>
            </div>
            <div><label className="form-label">Câmbio (R$)</label><input type="number" step="0.001" value={form.cambio} onChange={f('cambio')} className="form-input" min="1"/></div>
            <div><label className="form-label">Valor Total ({form.moeda})</label><input type="number" step="0.01" value={form.valor_total} onChange={f('valor_total')} className="form-input" min="0"/></div>
          </div>
          {form.moeda !== 'BRL' && (
            <div className="bg-cyan-50 rounded-xl p-3 text-sm text-cyan-700">
              Equivalente em BRL: <strong>{formatCurrency(form.valor_total * form.cambio)}</strong>
            </div>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary"><DollarSign size={16}/>{editing ? 'Salvar' : 'Criar OC'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar exclusão" size="sm">
        <p className="text-slate-600 mb-5">Excluir esta ordem de compra permanentemente?</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancelar</button>
          <button onClick={() => { save(compras.filter(c => c.id !== deleteId)); setDeleteId(null) }} className="btn-danger">Excluir</button>
        </div>
      </Modal>
    </div>
  )
}
