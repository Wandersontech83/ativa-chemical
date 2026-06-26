'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, cn } from '@/lib/utils'
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { loadData, saveData, genId } from '@/lib/storage'

interface Produto {
  id: string; codigo: string; nome: string; unidade: string; ncm: string
  categoria: string; fornecedor: string; preco_custo: number
  preco_venda_sugerido: number; estoque_atual: number; estoque_minimo: number
}

const SEED: Produto[] = [
  { id: 'prd-001', codigo: 'AC-SOL-001', nome: 'Acetona Industrial 99,5%', unidade: 'kg', ncm: '2914.11.00', categoria: 'Solventes Industriais', fornecedor: 'Quimibras', preco_custo: 4.50, preco_venda_sugerido: 6.80, estoque_atual: 1250, estoque_minimo: 500 },
  { id: 'prd-002', codigo: 'AC-SOL-002', nome: 'Tolueno Industrial', unidade: 'kg', ncm: '2902.30.00', categoria: 'Solventes Industriais', fornecedor: 'Quimibras', preco_custo: 5.20, preco_venda_sugerido: 7.90, estoque_atual: 890, estoque_minimo: 300 },
  { id: 'prd-003', codigo: 'AC-RES-001', nome: 'Resina Epóxi Bisfenol A', unidade: 'kg', ncm: '3907.30.11', categoria: 'Resinas e Polímeros', fornecedor: 'Hunan Chemical', preco_custo: 18.50, preco_venda_sugerido: 28.00, estoque_atual: 340, estoque_minimo: 100 },
  { id: 'prd-004', codigo: 'AC-PIG-001', nome: 'Dióxido de Titânio R-902', unidade: 'kg', ncm: '3206.11.10', categoria: 'Pigmentos e Corantes', fornecedor: 'Hunan Chemical', preco_custo: 28.00, preco_venda_sugerido: 43.00, estoque_atual: 480, estoque_minimo: 200 },
  { id: 'prd-005', codigo: 'AC-ADI-001', nome: 'Ftalato de Dioctila (DOP)', unidade: 'kg', ncm: '2917.34.00', categoria: 'Aditivos Industriais', fornecedor: 'GZ Poly', preco_custo: 9.80, preco_venda_sugerido: 14.90, estoque_atual: 1100, estoque_minimo: 500 },
  { id: 'prd-006', codigo: 'AC-SOL-006', nome: 'Acetato de Etila', unidade: 'kg', ncm: '2915.31.10', categoria: 'Solventes Industriais', fornecedor: 'GZ Poly', preco_custo: 6.10, preco_venda_sugerido: 9.20, estoque_atual: 95, estoque_minimo: 200 },
]

const EMPTY: Omit<Produto,'id'> = { codigo:'', nome:'', unidade:'kg', ncm:'', categoria:'Solventes Industriais', fornecedor:'', preco_custo:0, preco_venda_sugerido:0, estoque_atual:0, estoque_minimo:0 }
const CATEGORIAS = ['Solventes Industriais','Resinas e Polímeros','Pigmentos e Corantes','Aditivos Industriais','Ácidos e Bases','Polímeros','Lubrificantes']
const UNIDADES = ['kg','L','un','t','m³','galão']

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Produto | null>(null)
  const [form, setForm] = useState<Omit<Produto,'id'>>(EMPTY)
  const [deleteId, setDeleteId] = useState<string|null>(null)

  useEffect(() => { setProdutos(loadData('produtos', SEED)) }, [])
  const save = (list: Produto[]) => { setProdutos(list); saveData('produtos', list) }

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (p: Produto) => { setEditing(p); setForm({...p}); setModal(true) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      save(produtos.map(p => p.id === editing.id ? {...form, id: editing.id} : p))
    } else {
      save([...produtos, { ...form, id: genId('prd') }])
    }
    setModal(false)
  }

  const handleDelete = () => {
    if (deleteId) { save(produtos.filter(p => p.id !== deleteId)); setDeleteId(null) }
  }

  const filtered = produtos.filter(p =>
    !search || p.nome.toLowerCase().includes(search.toLowerCase()) || p.codigo.toLowerCase().includes(search.toLowerCase())
  )

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Produtos</h1>
          <p className="text-slate-500 text-sm mt-0.5">{produtos.length} produtos cadastrados</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16}/>Novo Produto</button>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar produto..." className="form-input pl-9 py-1.5"/>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="data-table">
          <thead><tr>
            <th>Código</th><th>Nome</th><th>Categoria</th>
            <th className="text-right">Custo</th><th className="text-right">Venda</th>
            <th className="text-right">Margem</th><th className="text-right">Estoque</th><th></th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center text-slate-400 py-8">Nenhum produto encontrado</td></tr>}
            {filtered.map(p => {
              const margem = ((p.preco_venda_sugerido - p.preco_custo) / p.preco_venda_sugerido * 100)
              const critico = p.estoque_atual <= p.estoque_minimo
              return (
                <tr key={p.id}>
                  <td className="font-mono text-xs text-slate-500">{p.codigo}</td>
                  <td className="font-medium text-slate-800">{p.nome}</td>
                  <td><span className="badge-blue">{p.categoria}</span></td>
                  <td className="text-right text-slate-600">{formatCurrency(p.preco_custo)}</td>
                  <td className="text-right font-semibold text-slate-800">{formatCurrency(p.preco_venda_sugerido)}</td>
                  <td className="text-right"><span className={cn('font-semibold', margem >= 30 ? 'text-emerald-600' : 'text-amber-600')}>{margem.toFixed(1)}%</span></td>
                  <td className="text-right">
                    <span className={cn('font-semibold', critico ? 'text-red-600' : 'text-slate-700')}>
                      {p.estoque_atual} {p.unidade}{critico && ' ⚠'}
                    </span>
                  </td>
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

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Produto' : 'Novo Produto'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Código</label><input value={form.codigo} onChange={f('codigo')} className="form-input" placeholder="AC-SOL-001" required/></div>
            <div><label className="form-label">Unidade</label>
              <select value={form.unidade} onChange={f('unidade')} className="form-input">
                {UNIDADES.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div><label className="form-label">Nome do Produto</label><input value={form.nome} onChange={f('nome')} className="form-input" placeholder="Ex: Acetona Industrial 99,5%" required/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">NCM</label><input value={form.ncm} onChange={f('ncm')} className="form-input" placeholder="0000.00.00"/></div>
            <div><label className="form-label">Categoria</label>
              <select value={form.categoria} onChange={f('categoria')} className="form-input">
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div><label className="form-label">Fornecedor</label><input value={form.fornecedor} onChange={f('fornecedor')} className="form-input" placeholder="Nome do fornecedor"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Preço de Custo (R$)</label><input type="number" step="0.01" value={form.preco_custo} onChange={f('preco_custo')} className="form-input" min="0"/></div>
            <div><label className="form-label">Preço de Venda (R$)</label><input type="number" step="0.01" value={form.preco_venda_sugerido} onChange={f('preco_venda_sugerido')} className="form-input" min="0"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Estoque Atual</label><input type="number" value={form.estoque_atual} onChange={f('estoque_atual')} className="form-input" min="0"/></div>
            <div><label className="form-label">Estoque Mínimo</label><input type="number" value={form.estoque_minimo} onChange={f('estoque_minimo')} className="form-input" min="0"/></div>
          </div>
          {form.preco_venda_sugerido > 0 && (
            <div className="bg-cyan-50 rounded-xl p-3 text-sm text-cyan-700">
              Margem: <strong>{(((form.preco_venda_sugerido - form.preco_custo) / form.preco_venda_sugerido) * 100).toFixed(1)}%</strong>
            </div>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary"><Package size={16}/>{editing ? 'Salvar' : 'Cadastrar'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar exclusão" size="sm">
        <p className="text-slate-600 mb-5">Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancelar</button>
          <button onClick={handleDelete} className="btn-danger">Excluir</button>
        </div>
      </Modal>
    </div>
  )
}
