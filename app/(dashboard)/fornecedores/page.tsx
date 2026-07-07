'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Plus, Search, Pencil, Trash2, Building2, Mail, Phone, Globe, Clock, X, Package } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { loadData, saveData, genId } from '@/lib/storage'
import { CATEGORIAS_PRODUTO } from '@/lib/payment-conditions'

interface Fornecedor {
  id: string; nome: string; pais: string; cidade: string; contato: string
  email: string; telefone: string; categoria: string; prazo_entrega: number
  moeda: 'USD' | 'CNY' | 'EUR' | 'BRL'; status: 'ativo' | 'inativo'
  observacoes?: string; site?: string
}

const SEED: Fornecedor[] = [
  { id: 'for-001', nome: 'Hunan Chemical Co. Ltd', pais: 'China', cidade: 'Changsha', contato: 'Li Wei', email: 'sales@hunanchemical.cn', telefone: '+86 731 8888-9999', categoria: 'Resinas e Pigmentos', prazo_entrega: 45, moeda: 'CNY', status: 'ativo', site: 'hunanchemical.cn' },
  { id: 'for-002', nome: 'GZ Poly Materials', pais: 'China', cidade: 'Guangzhou', contato: 'Zhang Min', email: 'export@gzpoly.com', telefone: '+86 20 8777-6666', categoria: 'Polímeros e Aditivos', prazo_entrega: 40, moeda: 'CNY', status: 'ativo' },
  { id: 'for-003', nome: 'Quimibras Ind. Ltda', pais: 'Brasil', cidade: 'São Paulo', contato: 'Roberto Alves', email: 'vendas@quimibras.com.br', telefone: '(11) 3333-4444', categoria: 'Solventes Industriais', prazo_entrega: 7, moeda: 'BRL', status: 'ativo' },
  { id: 'for-004', nome: 'SinoResin Chemical', pais: 'China', cidade: 'Shanghai', contato: 'Wang Fang', email: 'intl@sinoresin.com', telefone: '+86 21 5555-7777', categoria: 'Resinas Especiais', prazo_entrega: 50, moeda: 'USD', status: 'ativo' },
  { id: 'for-005', nome: 'Euro Chem AG', pais: 'Alemanha', cidade: 'Frankfurt', contato: 'Hans Müller', email: 'export@eurochem.de', telefone: '+49 69 4444-3333', categoria: 'Catalisadores', prazo_entrega: 30, moeda: 'EUR', status: 'inativo' },
]

const EMPTY: Omit<Fornecedor,'id'> = { nome:'', pais:'China', cidade:'', contato:'', email:'', telefone:'', categoria:'Resinas e Pigmentos', prazo_entrega:45, moeda:'CNY', status:'ativo', observacoes:'', site:'' }
const PAISES = ['China','Brasil','Alemanha','EUA','Japão','Coreia do Sul','Índia','Taiwan','Outros']
const flag = (p: string) => p==='China'?'🇨🇳':p==='Brasil'?'🇧🇷':p==='Alemanha'?'🇩🇪':p==='EUA'?'🇺🇸':p==='Japão'?'🇯🇵':p==='Coreia do Sul'?'🇰🇷':p==='Índia'?'🇮🇳':'🌐'

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Fornecedor | null>(null)
  const [form, setForm] = useState<Omit<Fornecedor,'id'>>(EMPTY)
  const [deleteId, setDeleteId] = useState<string|null>(null)
  const [detalhe, setDetalhe] = useState<Fornecedor | null>(null)

  useEffect(() => { setFornecedores(loadData('fornecedores', SEED)) }, [])
  const save = (list: Fornecedor[]) => { setFornecedores(list); saveData('fornecedores', list) }

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (f: Fornecedor) => { setEditing(f); setForm({...f}); setModal(true) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      const updated = {...form, id: editing.id}
      save(fornecedores.map(f => f.id === editing.id ? updated : f))
      if (detalhe?.id === editing.id) setDetalhe(updated)
    } else {
      save([...fornecedores, { ...form, id: genId('for') }])
    }
    setModal(false)
  }

  const fld = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))

  const filtered = fornecedores.filter(f => !search ||
    f.nome.toLowerCase().includes(search.toLowerCase()) || f.pais.toLowerCase().includes(search.toLowerCase()) || f.categoria.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex gap-5 h-full animate-fade-up">
      {/* Lista */}
      <div className={cn('flex flex-col space-y-4 transition-all', detalhe ? 'w-[55%]' : 'flex-1')}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Fornecedores</h1>
            <p className="text-slate-500 text-sm mt-0.5">{fornecedores.filter(f=>f.status==='ativo').length} ativos de {fornecedores.length}</p>
          </div>
          <button onClick={openCreate} className="btn-primary"><Plus size={16}/>Novo Fornecedor</button>
        </div>

        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nome, país ou categoria..." className="form-input pl-9 py-1.5"/>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex-1">
          <table className="data-table">
            <thead><tr>
              <th>Fornecedor</th><th>País</th><th>Categoria</th><th>Contato</th><th className="text-right">Prazo</th><th>Moeda</th><th>Status</th><th></th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center text-slate-400 py-8">Nenhum fornecedor encontrado</td></tr>}
              {filtered.map(f => {
                const sel = detalhe?.id === f.id
                return (
                  <tr key={f.id}
                    className={cn('cursor-pointer transition-colors', sel ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-slate-50/60')}
                    onClick={() => setDetalhe(f)}
                  >
                    <td className="font-medium text-slate-800">{f.nome}</td>
                    <td><span className="text-lg mr-1">{flag(f.pais)}</span><span className="text-slate-600 text-sm">{f.cidade}, {f.pais}</span></td>
                    <td><span className="badge-blue">{f.categoria}</span></td>
                    <td>
                      <div className="text-sm">
                        <p className="text-slate-700">{f.contato}</p>
                        <p className="text-slate-400 text-xs">{f.email}</p>
                      </div>
                    </td>
                    <td className="text-right font-semibold text-slate-700">{f.prazo_entrega}d</td>
                    <td><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{f.moeda}</span></td>
                    <td><span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', f.status==='ativo'?'bg-emerald-100 text-emerald-700':'bg-red-100 text-red-700')}>{f.status}</span></td>
                    <td onClick={e=>e.stopPropagation()}>
                      <div className="flex gap-1 justify-end">
                        <button onClick={()=>openEdit(f)} className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors"><Pencil size={14}/></button>
                        <button onClick={()=>setDeleteId(f.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Painel de Detalhe */}
      {detalhe && (
        <div className="w-[45%] flex-shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-slate-800 to-slate-700">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{flag(detalhe.pais)}</span>
                <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border', detalhe.status==='ativo'?'bg-emerald-100 text-emerald-700 border-emerald-200':'bg-red-100 text-red-700 border-red-200')}>{detalhe.status}</span>
              </div>
              <h2 className="font-bold text-white text-base leading-tight">{detalhe.nome}</h2>
              <p className="text-slate-400 text-xs mt-0.5">{detalhe.cidade}, {detalhe.pais}</p>
            </div>
            <button onClick={()=>setDetalhe(null)} className="text-slate-400 hover:text-white ml-3 flex-shrink-0"><X size={16}/></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 flex items-center gap-1 mb-1"><Clock size={11}/>Prazo de entrega</p>
                <p className="text-2xl font-bold text-slate-800">{detalhe.prazo_entrega}<span className="text-sm font-normal text-slate-400 ml-1">dias</span></p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">Moeda</p>
                <p className="text-2xl font-bold text-cyan-700">{detalhe.moeda}</p>
              </div>
            </div>

            {/* Categoria */}
            <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-2">
              <Package size={14} className="text-blue-500 flex-shrink-0"/>
              <div>
                <p className="text-xs text-slate-400">Categoria de produtos</p>
                <p className="text-sm font-semibold text-slate-700">{detalhe.categoria}</p>
              </div>
            </div>

            {/* Contato */}
            <div className="bg-slate-50 rounded-xl p-3 space-y-2">
              <p className="text-xs text-slate-400 font-medium mb-2">Contato</p>
              <div className="flex items-center gap-2 text-sm">
                <Building2 size={13} className="text-slate-400 flex-shrink-0"/>
                <span className="font-medium text-slate-700">{detalhe.contato}</span>
              </div>
              {detalhe.email && (
                <a href={`mailto:${detalhe.email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <Mail size={13} className="flex-shrink-0"/>
                  {detalhe.email}
                </a>
              )}
              {detalhe.telefone && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone size={13} className="flex-shrink-0"/>
                  {detalhe.telefone}
                </div>
              )}
              {detalhe.site && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Globe size={13} className="flex-shrink-0"/>
                  {detalhe.site}
                </div>
              )}
            </div>

            {detalhe.observacoes && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-xs text-amber-600 font-medium mb-1">Observações</p>
                <p className="text-sm text-slate-700">{detalhe.observacoes}</p>
              </div>
            )}

            <button onClick={()=>openEdit(detalhe)} className="w-full flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-2 text-sm text-slate-600 hover:bg-slate-50">
              <Pencil size={14}/> Editar fornecedor
            </button>
          </div>
        </div>
      )}

      {/* Modal Criar/Editar */}
      <Modal open={modal} onClose={()=>setModal(false)} title={editing?'Editar Fornecedor':'Novo Fornecedor'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="form-label">Nome do Fornecedor</label><input value={form.nome} onChange={fld('nome')} className="form-input" required placeholder="Ex: Hunan Chemical Co. Ltd"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">País</label>
              <select value={form.pais} onChange={fld('pais')} className="form-input">{PAISES.map(p=><option key={p}>{p}</option>)}</select>
            </div>
            <div><label className="form-label">Cidade</label><input value={form.cidade} onChange={fld('cidade')} className="form-input" placeholder="Ex: Guangzhou"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Categoria</label>
              <select value={form.categoria} onChange={fld('categoria')} className="form-input">
                {CATEGORIAS_PRODUTO.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="form-label">Moeda</label>
              <select value={form.moeda} onChange={fld('moeda')} className="form-input">
                <option value="CNY">CNY (Yuan)</option><option value="USD">USD (Dólar)</option>
                <option value="EUR">EUR (Euro)</option><option value="BRL">BRL (Real)</option>
              </select>
            </div>
          </div>
          <div><label className="form-label">Nome do Contato</label><input value={form.contato} onChange={fld('contato')} className="form-input"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">E-mail</label><input type="email" value={form.email} onChange={fld('email')} className="form-input"/></div>
            <div><label className="form-label">Telefone/WhatsApp</label><input value={form.telefone} onChange={fld('telefone')} className="form-input" placeholder="+86 ..."/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Site</label><input value={form.site||''} onChange={fld('site')} className="form-input" placeholder="site.com"/></div>
            <div><label className="form-label">Prazo de Entrega (dias)</label><input type="number" value={form.prazo_entrega} onChange={fld('prazo_entrega')} className="form-input" min="1"/></div>
          </div>
          <div><label className="form-label">Observações</label>
            <textarea value={form.observacoes||''} onChange={fld('observacoes')} className="form-input" rows={2} placeholder="Condições especiais, certificações..."/>
          </div>
          <div><label className="form-label">Status</label>
            <select value={form.status} onChange={fld('status')} className="form-input"><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={()=>setModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary"><Building2 size={16}/>{editing?'Salvar':'Cadastrar'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={()=>setDeleteId(null)} title="Confirmar exclusão" size="sm">
        <p className="text-slate-600 mb-5">Excluir este fornecedor permanentemente?</p>
        <div className="flex gap-2 justify-end">
          <button onClick={()=>setDeleteId(null)} className="btn-secondary">Cancelar</button>
          <button onClick={()=>{save(fornecedores.filter(f=>f.id!==deleteId));setDeleteId(null)}} className="btn-danger">Excluir</button>
        </div>
      </Modal>
    </div>
  )
}
