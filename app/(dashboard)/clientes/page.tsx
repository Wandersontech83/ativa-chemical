'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Plus, Search, Pencil, Trash2, Users, Phone, Mail } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { loadData, saveData, genId } from '@/lib/storage'

interface Cliente {
  id: string; razao_social: string; cnpj: string; email: string; telefone: string
  cidade: string; estado: string; segmento: string; contato: string
  limite_credito: number; status: 'ativo' | 'inativo'
}

const SEED: Cliente[] = [
  { id: 'cli-001', razao_social: 'Nordeste Química Ltda', cnpj: '12.345.678/0001-90', email: 'compras@nequimica.com.br', telefone: '(85) 3333-4444', cidade: 'Fortaleza', estado: 'CE', segmento: 'Tintas e Vernizes', contato: 'Carlos Melo', limite_credito: 150000, status: 'ativo' },
  { id: 'cli-002', razao_social: 'IndTex Plásticos SA', cnpj: '23.456.789/0001-01', email: 'suprimentos@indtex.com.br', telefone: '(11) 4444-5555', cidade: 'Guarulhos', estado: 'SP', segmento: 'Plásticos e Borrachas', contato: 'Ana Santos', limite_credito: 280000, status: 'ativo' },
  { id: 'cli-003', razao_social: 'PetroSul Derivados', cnpj: '34.567.890/0001-12', email: 'comercial@petrosul.com.br', telefone: '(51) 5555-6666', cidade: 'Porto Alegre', estado: 'RS', segmento: 'Petroquímica', contato: 'José Silva', limite_credito: 500000, status: 'ativo' },
  { id: 'cli-004', razao_social: 'Fab Têxtil Nordeste', cnpj: '45.678.901/0001-23', email: 'compras@fabtextil.com.br', telefone: '(83) 6666-7777', cidade: 'Campina Grande', estado: 'PB', segmento: 'Têxtil', contato: 'Maria Costa', limite_credito: 80000, status: 'ativo' },
  { id: 'cli-005', razao_social: 'Agroquim Nordeste', cnpj: '56.789.012/0001-34', email: 'diretoria@agroquim.com.br', telefone: '(75) 7777-8888', cidade: 'Feira de Santana', estado: 'BA', segmento: 'Agroquímica', contato: 'Pedro Alves', limite_credito: 320000, status: 'inativo' },
]

const EMPTY: Omit<Cliente,'id'> = { razao_social:'', cnpj:'', email:'', telefone:'', cidade:'', estado:'SP', segmento:'Tintas e Vernizes', contato:'', limite_credito:50000, status:'ativo' }
const SEGMENTOS = ['Tintas e Vernizes','Plásticos e Borrachas','Petroquímica','Têxtil','Agroquímica','Farmacêutica','Cosméticos','Construção Civil','Mineração','Outros']
const ESTADOS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Cliente | null>(null)
  const [form, setForm] = useState<Omit<Cliente,'id'>>(EMPTY)
  const [deleteId, setDeleteId] = useState<string|null>(null)

  useEffect(() => { setClientes(loadData('clientes', SEED)) }, [])
  const save = (list: Cliente[]) => { setClientes(list); saveData('clientes', list) }

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (c: Cliente) => { setEditing(c); setForm({...c}); setModal(true) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) save(clientes.map(c => c.id === editing.id ? {...form, id: editing.id} : c))
    else save([...clientes, { ...form, id: genId('cli') }])
    setModal(false)
  }

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))

  const filtered = clientes.filter(c => !search ||
    c.razao_social.toLowerCase().includes(search.toLowerCase()) ||
    c.cnpj.includes(search) || c.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
          <p className="text-slate-500 text-sm mt-0.5">{clientes.filter(c=>c.status==='ativo').length} ativos de {clientes.length}</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16}/>Novo Cliente</button>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Razão social, CNPJ ou e-mail..." className="form-input pl-9 py-1.5"/>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="data-table">
          <thead><tr>
            <th>Razão Social</th><th>CNPJ</th><th>Segmento</th><th>Contato</th><th>Localização</th><th className="text-right">Limite</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center text-slate-400 py-8">Nenhum cliente encontrado</td></tr>}
            {filtered.map(c => (
              <tr key={c.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {c.razao_social.charAt(0)}
                    </div>
                    <span className="font-medium text-slate-800">{c.razao_social}</span>
                  </div>
                </td>
                <td className="font-mono text-xs text-slate-500">{c.cnpj}</td>
                <td><span className="badge-blue">{c.segmento}</span></td>
                <td className="text-slate-600">{c.contato}</td>
                <td className="text-slate-500 text-sm">{c.cidade}/{c.estado}</td>
                <td className="text-right font-semibold text-slate-700">R$ {(c.limite_credito/1000).toFixed(0)}k</td>
                <td><span className={cn('badge', c.status === 'ativo' ? 'badge-green' : 'badge-red')}>{c.status}</span></td>
                <td>
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors"><Pencil size={14}/></button>
                    <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Cliente' : 'Novo Cliente'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="form-label">Razão Social</label><input value={form.razao_social} onChange={f('razao_social')} className="form-input" required placeholder="Nome da empresa"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">CNPJ</label><input value={form.cnpj} onChange={f('cnpj')} className="form-input" placeholder="00.000.000/0000-00"/></div>
            <div><label className="form-label">Segmento</label>
              <select value={form.segmento} onChange={f('segmento')} className="form-input">
                {SEGMENTOS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">E-mail</label><input type="email" value={form.email} onChange={f('email')} className="form-input" placeholder="compras@empresa.com.br"/></div>
            <div><label className="form-label">Telefone</label><input value={form.telefone} onChange={f('telefone')} className="form-input" placeholder="(00) 0000-0000"/></div>
          </div>
          <div><label className="form-label">Nome do Contato</label><input value={form.contato} onChange={f('contato')} className="form-input" placeholder="Nome do responsável"/></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><label className="form-label">Cidade</label><input value={form.cidade} onChange={f('cidade')} className="form-input"/></div>
            <div><label className="form-label">Estado</label>
              <select value={form.estado} onChange={f('estado')} className="form-input">
                {ESTADOS.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Limite de Crédito (R$)</label><input type="number" value={form.limite_credito} onChange={f('limite_credito')} className="form-input" min="0" step="1000"/></div>
            <div><label className="form-label">Status</label>
              <select value={form.status} onChange={f('status')} className="form-input">
                <option value="ativo">Ativo</option><option value="inativo">Inativo</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary"><Users size={16}/>{editing ? 'Salvar' : 'Cadastrar'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar exclusão" size="sm">
        <p className="text-slate-600 mb-5">Excluir este cliente permanentemente?</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancelar</button>
          <button onClick={() => { save(clientes.filter(c => c.id !== deleteId)); setDeleteId(null) }} className="btn-danger">Excluir</button>
        </div>
      </Modal>
    </div>
  )
}
