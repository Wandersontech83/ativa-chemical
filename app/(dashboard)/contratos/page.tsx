'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, cn } from '@/lib/utils'
import { Plus, Search, Pencil, Trash2, ScrollText, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { loadData, saveData, genId } from '@/lib/storage'

interface Contrato {
  id: string; numero: string; titulo: string; parte: string; tipo: 'cliente' | 'fornecedor'
  inicio: string; fim: string; valor_mensal: number
  status: 'ativo' | 'vencendo' | 'vencido' | 'suspenso'
  objeto: string; responsavel: string
}

const SEED: Contrato[] = [
  { id: 'con-001', numero: 'CT-2024-001', titulo: 'Fornecimento Contínuo de Solventes', parte: 'Quimibras Ind. Ltda', tipo: 'fornecedor', inicio: '2024-01-01', fim: '2025-01-01', valor_mensal: 45000, status: 'ativo', objeto: 'Fornecimento mensal de acetona e tolueno industrial', responsavel: 'Wanderson Lima' },
  { id: 'con-002', numero: 'CT-2024-002', titulo: 'Distribuição Exclusiva Nordeste', parte: 'Nordeste Química Ltda', tipo: 'cliente', inicio: '2024-03-01', fim: '2025-03-01', valor_mensal: 120000, status: 'ativo', objeto: 'Distribuição exclusiva de produtos Ativa Chemical na região nordeste', responsavel: 'Wanderson Lima' },
  { id: 'con-003', numero: 'CT-2024-003', titulo: 'Importação Pigmentos China', parte: 'Hunan Chemical Co. Ltd', tipo: 'fornecedor', inicio: '2024-06-01', fim: '2024-12-31', valor_mensal: 78000, status: 'vencendo', objeto: 'Importação de dióxido de titânio e pigmentos especiais', responsavel: 'Wanderson Lima' },
  { id: 'con-004', numero: 'CT-2023-008', titulo: 'Fornecimento Polímeros', parte: 'GZ Poly Materials', tipo: 'fornecedor', inicio: '2023-09-01', fim: '2024-09-01', valor_mensal: 32000, status: 'vencido', objeto: 'Fornecimento de DOP e plastificantes', responsavel: 'Wanderson Lima' },
]

const EMPTY: Omit<Contrato,'id'> = {
  numero: '', titulo: '', parte: '', tipo: 'fornecedor',
  inicio: new Date().toISOString().split('T')[0],
  fim: new Date(Date.now() + 365*86400000).toISOString().split('T')[0],
  valor_mensal: 0, status: 'ativo', objeto: '', responsavel: 'Wanderson Lima'
}

const STATUS_CONFIG = {
  ativo: { label: 'Ativo', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle size={12}/> },
  vencendo: { label: 'Vencendo', color: 'bg-amber-100 text-amber-700', icon: <AlertTriangle size={12}/> },
  vencido: { label: 'Vencido', color: 'bg-red-100 text-red-700', icon: <Clock size={12}/> },
  suspenso: { label: 'Suspenso', color: 'bg-slate-100 text-slate-600', icon: <Clock size={12}/> },
}

export default function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Contrato | null>(null)
  const [form, setForm] = useState<Omit<Contrato,'id'>>(EMPTY)
  const [deleteId, setDeleteId] = useState<string|null>(null)

  useEffect(() => { setContratos(loadData('contratos', SEED)) }, [])
  const save = (list: Contrato[]) => { setContratos(list); saveData('contratos', list) }

  const openCreate = () => {
    const n = `CT-${new Date().getFullYear()}-${String(contratos.length + 1).padStart(3,'0')}`
    setEditing(null); setForm({...EMPTY, numero: n}); setModal(true)
  }
  const openEdit = (c: Contrato) => { setEditing(c); setForm({...c}); setModal(true) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) save(contratos.map(c => c.id === editing.id ? {...form, id: editing.id} : c))
    else save([...contratos, { ...form, id: genId('con') }])
    setModal(false)
  }

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))

  const filtered = contratos.filter(c => !search ||
    c.numero.toLowerCase().includes(search.toLowerCase()) ||
    c.titulo.toLowerCase().includes(search.toLowerCase()) ||
    c.parte.toLowerCase().includes(search.toLowerCase())
  )

  const diasRestantes = (fim: string) => {
    const d = Math.ceil((new Date(fim).getTime() - Date.now()) / 86400000)
    return d
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Contratos</h1>
          <p className="text-slate-500 text-sm mt-0.5">{contratos.filter(c=>c.status==='ativo').length} ativos • {contratos.filter(c=>c.status==='vencendo').length} vencendo em breve</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16}/>Novo Contrato</button>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Número, título ou parte..." className="form-input pl-9 py-1.5"/>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="data-table">
          <thead><tr>
            <th>Nº Contrato</th><th>Título</th><th>Parte</th><th>Tipo</th><th className="text-right">Valor/mês</th><th>Vencimento</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center text-slate-400 py-8">Nenhum contrato encontrado</td></tr>}
            {filtered.map(c => {
              const cfg = STATUS_CONFIG[c.status]
              const dias = diasRestantes(c.fim)
              return (
                <tr key={c.id}>
                  <td className="font-mono text-xs font-semibold text-cyan-700">{c.numero}</td>
                  <td className="font-medium text-slate-800 max-w-xs">{c.titulo}</td>
                  <td className="text-slate-600 text-sm">{c.parte}</td>
                  <td><span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', c.tipo === 'cliente' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700')}>{c.tipo}</span></td>
                  <td className="text-right font-semibold text-slate-800">{formatCurrency(c.valor_mensal)}</td>
                  <td>
                    <div>
                      <p className="text-sm text-slate-600">{new Date(c.fim).toLocaleDateString('pt-BR')}</p>
                      {dias > 0 && dias <= 60 && <p className="text-xs text-amber-600">{dias} dias restantes</p>}
                      {dias <= 0 && <p className="text-xs text-red-600">Vencido há {Math.abs(dias)} dias</p>}
                    </div>
                  </td>
                  <td><span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full', cfg.color)}>{cfg.icon}{cfg.label}</span></td>
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

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? `Editar ${form.numero}` : 'Novo Contrato'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Nº do Contrato</label><input value={form.numero} onChange={f('numero')} className="form-input" required/></div>
            <div><label className="form-label">Tipo</label>
              <select value={form.tipo} onChange={f('tipo')} className="form-input">
                <option value="cliente">Cliente</option>
                <option value="fornecedor">Fornecedor</option>
              </select>
            </div>
          </div>
          <div><label className="form-label">Título do Contrato</label><input value={form.titulo} onChange={f('titulo')} className="form-input" required placeholder="Ex: Fornecimento Contínuo de Solventes"/></div>
          <div><label className="form-label">Parte Contratante</label><input value={form.parte} onChange={f('parte')} className="form-input" required placeholder="Nome da empresa"/></div>
          <div><label className="form-label">Objeto do Contrato</label>
            <textarea value={form.objeto} onChange={f('objeto')} className="form-input" rows={2} placeholder="Descrição do objeto contratual"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Início da Vigência</label><input type="date" value={form.inicio} onChange={f('inicio')} className="form-input"/></div>
            <div><label className="form-label">Fim da Vigência</label><input type="date" value={form.fim} onChange={f('fim')} className="form-input"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Valor Mensal (R$)</label><input type="number" step="0.01" value={form.valor_mensal} onChange={f('valor_mensal')} className="form-input" min="0"/></div>
            <div><label className="form-label">Status</label>
              <select value={form.status} onChange={f('status')} className="form-input">
                {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div><label className="form-label">Responsável</label><input value={form.responsavel} onChange={f('responsavel')} className="form-input"/></div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary"><ScrollText size={16}/>{editing ? 'Salvar' : 'Criar Contrato'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar exclusão" size="sm">
        <p className="text-slate-600 mb-5">Excluir este contrato permanentemente?</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancelar</button>
          <button onClick={() => { save(contratos.filter(c => c.id !== deleteId)); setDeleteId(null) }} className="btn-danger">Excluir</button>
        </div>
      </Modal>
    </div>
  )
}
