'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, cn } from '@/lib/utils'
import { Plus, Search, Pencil, Trash2, CheckCircle, Clock, AlertTriangle, CreditCard, TrendingDown } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { loadData, saveData, genId } from '@/lib/storage'

interface Despesa {
  id: string; numero: string; fornecedor: string; descricao: string; centro_custo: string
  valor: number; valor_pago: number; vencimento: string
  status: 'pendente' | 'pago' | 'vencido' | 'agendado'
  categoria: string; nota_fiscal: string; parcela: string
}

const d = (days: number) => new Date(Date.now() + days * 86400000).toISOString().split('T')[0]

const SEED: Despesa[] = [
  { id: 'cp-001', numero: 'PAG-2024-001', fornecedor: 'Quimibras Ind. Ltda', descricao: 'OC-2024-003 – Solventes', centro_custo: 'Estoque/Compras', valor: 27200, valor_pago: 27200, vencimento: d(-15), status: 'pago', categoria: 'Fornecedor', nota_fiscal: 'NF-F001', parcela: '1/1' },
  { id: 'cp-002', numero: 'PAG-2024-002', fornecedor: 'Hunan Chemical Co.', descricao: 'OC-2024-001 – Pigmentos', centro_custo: 'Estoque/Compras', valor: 43120, valor_pago: 0, vencimento: d(5), status: 'pendente', categoria: 'Fornecedor', nota_fiscal: 'INV-HC001', parcela: '1/2' },
  { id: 'cp-003', numero: 'PAG-2024-003', fornecedor: 'Hunan Chemical Co.', descricao: 'OC-2024-001 – Pigmentos (2ª parcela)', centro_custo: 'Estoque/Compras', valor: 43120, valor_pago: 0, vencimento: d(35), status: 'agendado', categoria: 'Fornecedor', nota_fiscal: 'INV-HC001', parcela: '2/2' },
  { id: 'cp-004', numero: 'PAG-2024-004', fornecedor: 'GZ Poly Materials', descricao: 'OC-2024-002 – DOP', centro_custo: 'Estoque/Compras', valor: 37730, valor_pago: 0, vencimento: d(-3), status: 'vencido', categoria: 'Fornecedor', nota_fiscal: 'INV-GZP002', parcela: '1/1' },
  { id: 'cp-005', numero: 'PAG-2024-005', fornecedor: 'Despacho Alfa Ltda', descricao: 'Honorários despachante – OC-2024-001', centro_custo: 'Importação', valor: 4800, valor_pago: 0, vencimento: d(10), status: 'pendente', categoria: 'Serviço', nota_fiscal: 'RPS-0045', parcela: '1/1' },
  { id: 'cp-006', numero: 'PAG-2024-006', fornecedor: 'Aluguel Galpão Industrial', descricao: 'Aluguel dezembro/2024', centro_custo: 'Administrativo', valor: 12000, valor_pago: 0, vencimento: d(8), status: 'pendente', categoria: 'Administrativo', nota_fiscal: '', parcela: '1/1' },
]

const EMPTY: Omit<Despesa, 'id'> = {
  numero: '', fornecedor: '', descricao: '', centro_custo: 'Estoque/Compras',
  valor: 0, valor_pago: 0, vencimento: d(30), status: 'pendente',
  categoria: 'Fornecedor', nota_fiscal: '', parcela: '1/1'
}

const STATUS_CFG = {
  pendente:  { label: 'Pendente',  color: 'bg-amber-100 text-amber-700' },
  pago:      { label: 'Pago',      color: 'bg-emerald-100 text-emerald-700' },
  vencido:   { label: 'Vencido',   color: 'bg-red-100 text-red-700' },
  agendado:  { label: 'Agendado',  color: 'bg-blue-100 text-blue-700' },
}

const CENTROS = ['Estoque/Compras','Importação','Administrativo','Comercial','Logística','TI','Outros']
const CATEGORIAS = ['Fornecedor','Serviço','Administrativo','Impostos','Frete','Outros']

export default function ContasPagarPage() {
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [search, setSearch] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Despesa | null>(null)
  const [form, setForm] = useState<Omit<Despesa, 'id'>>(EMPTY)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [baixaId, setBaixaId] = useState<string | null>(null)

  useEffect(() => { setDespesas(loadData('cp', SEED)) }, [])
  const save = (list: Despesa[]) => { setDespesas(list); saveData('cp', list) }

  const openCreate = () => {
    const n = `PAG-${new Date().getFullYear()}-${String(despesas.length + 1).padStart(3, '0')}`
    setEditing(null); setForm({ ...EMPTY, numero: n }); setModal(true)
  }
  const openEdit = (d: Despesa) => { setEditing(d); setForm({ ...d }); setModal(true) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) save(despesas.map(d => d.id === editing.id ? { ...form, id: editing.id } : d))
    else save([...despesas, { ...form, id: genId('cp') }])
    setModal(false)
  }

  const handleBaixa = (id: string) => {
    save(despesas.map(d => d.id === id ? { ...d, valor_pago: d.valor, status: 'pago' as const } : d))
    setBaixaId(null)
  }

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))

  const filtered = despesas.filter(d => {
    const matchSearch = !search || d.fornecedor.toLowerCase().includes(search.toLowerCase()) || d.numero.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filtroStatus === 'todos' || d.status === filtroStatus
    return matchSearch && matchStatus
  })

  const totalPendente = despesas.filter(d => d.status !== 'pago').reduce((s, d) => s + (d.valor - d.valor_pago), 0)
  const totalVencido = despesas.filter(d => d.status === 'vencido').reduce((s, d) => s + d.valor, 0)
  const totalPago = despesas.reduce((s, d) => s + d.valor_pago, 0)

  // IA — prioridade de pagamento
  const prioritarios = despesas.filter(d => d.status === 'vencido' || (d.status === 'pendente' && new Date(d.vencimento) <= new Date(Date.now() + 7 * 86400000)))

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Contas a Pagar</h1>
          <p className="text-slate-500 text-sm mt-0.5">{despesas.filter(d => d.status !== 'pago').length} pagamentos pendentes</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} />Nova Despesa</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total a Pagar', value: formatCurrency(totalPendente), color: 'text-amber-600', bg: 'bg-amber-50', icon: <CreditCard size={18} className="text-amber-500" /> },
          { label: 'Pago (mês)', value: formatCurrency(totalPago), color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle size={18} className="text-emerald-500" /> },
          { label: 'Vencido', value: formatCurrency(totalVencido), color: 'text-red-600', bg: 'bg-red-50', icon: <AlertTriangle size={18} className="text-red-500" /> },
          { label: 'Próx. 7 dias', value: formatCurrency(prioritarios.reduce((s, d) => s + d.valor, 0)), color: 'text-blue-600', bg: 'bg-blue-50', icon: <Clock size={18} className="text-blue-500" /> },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-4 border border-slate-100 bg-white shadow-sm flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', k.bg)}>{k.icon}</div>
            <div><p className="text-xs text-slate-500">{k.label}</p><p className={cn('text-lg font-bold', k.color)}>{k.value}</p></div>
          </div>
        ))}
      </div>

      {/* IA Sugestão */}
      {prioritarios.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <TrendingDown size={16} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">⚡ NEXUS Agent — Sugestão de Pagamento</p>
            <p className="text-sm text-amber-700 mt-0.5">
              {prioritarios.length} pagamento(s) prioritário(s) somando <strong>{formatCurrency(prioritarios.reduce((s, d) => s + d.valor, 0))}</strong>.
              Prioridade: <strong>{prioritarios.map(d => d.fornecedor).slice(0, 2).join(', ')}</strong>.
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Fornecedor ou número..." className="form-input pl-9 py-1.5" />
        </div>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="form-input py-1.5 w-40">
          <option value="todos">Todos</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="data-table">
          <thead><tr>
            <th>Nº</th><th>Fornecedor</th><th>Centro de Custo</th><th className="text-right">Valor</th>
            <th>Parcela</th><th>Vencimento</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center text-slate-400 py-8">Nenhum registro encontrado</td></tr>}
            {filtered.map(d => {
              const cfg = STATUS_CFG[d.status]
              const vencido = d.status === 'vencido'
              return (
                <tr key={d.id}>
                  <td className="font-mono text-xs text-cyan-700">{d.numero}</td>
                  <td>
                    <div>
                      <p className="font-medium text-slate-800">{d.fornecedor}</p>
                      <p className="text-xs text-slate-400">{d.descricao}</p>
                    </div>
                  </td>
                  <td><span className="badge-blue text-xs">{d.centro_custo}</span></td>
                  <td className={cn('text-right font-bold', vencido ? 'text-red-600' : 'text-slate-800')}>{formatCurrency(d.valor)}</td>
                  <td className="text-slate-500 text-sm">{d.parcela}</td>
                  <td className={cn('text-sm', vencido ? 'text-red-600 font-semibold' : 'text-slate-500')}>
                    {new Date(d.vencimento).toLocaleDateString('pt-BR')}
                  </td>
                  <td><span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', cfg.color)}>{cfg.label}</span></td>
                  <td>
                    <div className="flex gap-1 justify-end">
                      {d.status !== 'pago' && (
                        <button onClick={() => setBaixaId(d.id)} title="Marcar como pago"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                          <CheckCircle size={14} />
                        </button>
                      )}
                      <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteId(d.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Despesa' : 'Nova Despesa'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Número</label><input value={form.numero} onChange={f('numero')} className="form-input" required /></div>
            <div><label className="form-label">Status</label>
              <select value={form.status} onChange={f('status')} className="form-input">
                {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div><label className="form-label">Fornecedor / Credor</label><input value={form.fornecedor} onChange={f('fornecedor')} className="form-input" required /></div>
          <div><label className="form-label">Descrição</label><input value={form.descricao} onChange={f('descricao')} className="form-input" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Categoria</label>
              <select value={form.categoria} onChange={f('categoria')} className="form-input">
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="form-label">Centro de Custo</label>
              <select value={form.centro_custo} onChange={f('centro_custo')} className="form-input">
                {CENTROS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="form-label">Valor (R$)</label><input type="number" step="0.01" value={form.valor} onChange={f('valor')} className="form-input" min="0" /></div>
            <div><label className="form-label">Vencimento</label><input type="date" value={form.vencimento} onChange={f('vencimento')} className="form-input" /></div>
            <div><label className="form-label">Parcela</label><input value={form.parcela} onChange={f('parcela')} className="form-input" placeholder="1/3" /></div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary"><CreditCard size={16} />{editing ? 'Salvar' : 'Cadastrar'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!baixaId} onClose={() => setBaixaId(null)} title="Confirmar Pagamento" size="sm">
        <p className="text-slate-600 mb-5">Confirmar pagamento integral desta despesa?</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setBaixaId(null)} className="btn-secondary">Cancelar</button>
          <button onClick={() => baixaId && handleBaixa(baixaId)} className="btn-primary"><CheckCircle size={16} />Confirmar</button>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar exclusão" size="sm">
        <p className="text-slate-600 mb-5">Excluir esta despesa permanentemente?</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancelar</button>
          <button onClick={() => { save(despesas.filter(d => d.id !== deleteId)); setDeleteId(null) }} className="btn-danger">Excluir</button>
        </div>
      </Modal>
    </div>
  )
}
