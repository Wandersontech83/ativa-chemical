'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, cn } from '@/lib/utils'
import { Plus, Search, Pencil, Trash2, CheckCircle, Clock, AlertTriangle, Download, TrendingUp, Wallet } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { loadData, saveData, genId } from '@/lib/storage'

interface Titulo {
  id: string; numero: string; cliente: string; descricao: string
  valor: number; valor_pago: number; vencimento: string
  status: 'aberto' | 'parcial' | 'pago' | 'vencido' | 'renegociado'
  categoria: string; nota_fiscal: string; observacao: string
}

const hoje = new Date().toISOString().split('T')[0]
const d = (days: number) => new Date(Date.now() + days * 86400000).toISOString().split('T')[0]

const SEED: Titulo[] = [
  { id: 'rec-001', numero: 'REC-2024-001', cliente: 'Nordeste Química Ltda', descricao: 'PV-2024-001 – Acetona Industrial', valor: 34000, valor_pago: 34000, vencimento: d(-5), status: 'pago', categoria: 'Venda', nota_fiscal: 'NF-001234', observacao: '' },
  { id: 'rec-002', numero: 'REC-2024-002', cliente: 'IndTex Plásticos SA', descricao: 'PV-2024-002 – DOP', valor: 149000, valor_pago: 74500, vencimento: d(3), status: 'parcial', categoria: 'Venda', nota_fiscal: 'NF-001235', observacao: 'Parcela 1/2 recebida' },
  { id: 'rec-003', numero: 'REC-2024-003', cliente: 'PetroSul Derivados', descricao: 'PV-2024-003 – Resina Epóxi', valor: 56000, valor_pago: 0, vencimento: d(15), status: 'aberto', categoria: 'Venda', nota_fiscal: 'NF-001236', observacao: '' },
  { id: 'rec-004', numero: 'REC-2024-004', cliente: 'Fab Têxtil Nordeste', descricao: 'PV-2024-004 – Dióxido de Titânio', valor: 43000, valor_pago: 0, vencimento: d(-10), status: 'vencido', categoria: 'Venda', nota_fiscal: 'NF-001237', observacao: 'Contato realizado em 20/11' },
  { id: 'rec-005', numero: 'REC-2024-005', cliente: 'Agroquim Nordeste', descricao: 'Contrato CT-2024-002 – Parcela 11/12', valor: 120000, valor_pago: 0, vencimento: d(30), status: 'aberto', categoria: 'Contrato', nota_fiscal: 'NF-001238', observacao: '' },
]

const EMPTY: Omit<Titulo, 'id'> = {
  numero: '', cliente: '', descricao: '', valor: 0, valor_pago: 0,
  vencimento: d(30), status: 'aberto', categoria: 'Venda', nota_fiscal: '', observacao: ''
}

const STATUS_CFG = {
  aberto:      { label: 'Em Aberto',   color: 'bg-blue-100 text-blue-700',    icon: <Clock size={11}/> },
  parcial:     { label: 'Parcial',     color: 'bg-amber-100 text-amber-700',  icon: <TrendingUp size={11}/> },
  pago:        { label: 'Pago',        color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle size={11}/> },
  vencido:     { label: 'Vencido',     color: 'bg-red-100 text-red-700',      icon: <AlertTriangle size={11}/> },
  renegociado: { label: 'Renegociado', color: 'bg-purple-100 text-purple-700',icon: <Clock size={11}/> },
}

export default function ContasReceberPage() {
  const [titulos, setTitulos] = useState<Titulo[]>([])
  const [search, setSearch] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Titulo | null>(null)
  const [form, setForm] = useState<Omit<Titulo, 'id'>>(EMPTY)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [baixaId, setBaixaId] = useState<string | null>(null)
  const [valorBaixa, setValorBaixa] = useState('')

  useEffect(() => { setTitulos(loadData('cr', SEED)) }, [])
  const save = (list: Titulo[]) => { setTitulos(list); saveData('cr', list) }

  const openCreate = () => {
    const n = `REC-${new Date().getFullYear()}-${String(titulos.length + 1).padStart(3, '0')}`
    setEditing(null); setForm({ ...EMPTY, numero: n }); setModal(true)
  }
  const openEdit = (t: Titulo) => { setEditing(t); setForm({ ...t }); setModal(true) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) save(titulos.map(t => t.id === editing.id ? { ...form, id: editing.id } : t))
    else save([...titulos, { ...form, id: genId('rec') }])
    setModal(false)
  }

  const handleBaixa = () => {
    const v = parseFloat(valorBaixa)
    if (!baixaId || isNaN(v)) return
    save(titulos.map(t => {
      if (t.id !== baixaId) return t
      const pago = Math.min(t.valor, t.valor_pago + v)
      const status: Titulo['status'] = pago >= t.valor ? 'pago' : pago > 0 ? 'parcial' : t.status
      return { ...t, valor_pago: pago, status }
    }))
    setBaixaId(null); setValorBaixa('')
  }

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))

  const filtered = titulos.filter(t => {
    const matchSearch = !search || t.cliente.toLowerCase().includes(search.toLowerCase()) || t.numero.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filtroStatus === 'todos' || t.status === filtroStatus
    return matchSearch && matchStatus
  })

  const totalAberto = titulos.filter(t => t.status !== 'pago').reduce((s, t) => s + (t.valor - t.valor_pago), 0)
  const totalVencido = titulos.filter(t => t.status === 'vencido').reduce((s, t) => s + (t.valor - t.valor_pago), 0)
  const totalRecebido = titulos.reduce((s, t) => s + t.valor_pago, 0)
  const venceHoje = titulos.filter(t => t.vencimento === hoje && t.status !== 'pago').length

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Contas a Receber</h1>
          <p className="text-slate-500 text-sm mt-0.5">{titulos.filter(t => t.status !== 'pago').length} títulos em aberto</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} />Novo Título</button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total a Receber', value: formatCurrency(totalAberto), color: 'text-blue-600', bg: 'bg-blue-50', icon: <Wallet size={18} className="text-blue-500" /> },
          { label: 'Recebido (mês)', value: formatCurrency(totalRecebido), color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle size={18} className="text-emerald-500" /> },
          { label: 'Vencido', value: formatCurrency(totalVencido), color: 'text-red-600', bg: 'bg-red-50', icon: <AlertTriangle size={18} className="text-red-500" /> },
          { label: 'Vence Hoje', value: `${venceHoje} título${venceHoje !== 1 ? 's' : ''}`, color: 'text-amber-600', bg: 'bg-amber-50', icon: <Clock size={18} className="text-amber-500" /> },
        ].map(k => (
          <div key={k.label} className={cn('rounded-xl p-4 border border-slate-100 bg-white shadow-sm flex items-center gap-3')}>
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', k.bg)}>{k.icon}</div>
            <div>
              <p className="text-xs text-slate-500">{k.label}</p>
              <p className={cn('text-lg font-bold', k.color)}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* IA Alert */}
      {totalVencido > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-amber-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={16} className="text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">⚡ NEXUS Agent — Alerta de Inadimplência</p>
            <p className="text-sm text-red-700 mt-0.5">{titulos.filter(t => t.status === 'vencido').length} título(s) vencido(s) totalizando <strong>{formatCurrency(totalVencido)}</strong>. Recomendo acionar cobrança para {titulos.filter(t => t.status === 'vencido').map(t => t.cliente).join(', ')}.</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cliente ou número..." className="form-input pl-9 py-1.5" />
        </div>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="form-input py-1.5 w-40">
          <option value="todos">Todos</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="data-table">
          <thead><tr>
            <th>Nº</th><th>Cliente</th><th>Descrição</th><th className="text-right">Valor</th>
            <th className="text-right">Pago</th><th className="text-right">Saldo</th><th>Vencimento</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={9} className="text-center text-slate-400 py-8">Nenhum título encontrado</td></tr>}
            {filtered.map(t => {
              const saldo = t.valor - t.valor_pago
              const vencido = t.status === 'vencido'
              const cfg = STATUS_CFG[t.status]
              return (
                <tr key={t.id}>
                  <td className="font-mono text-xs text-cyan-700">{t.numero}</td>
                  <td className="font-medium text-slate-800">{t.cliente}</td>
                  <td className="text-slate-500 text-sm max-w-[160px] truncate">{t.descricao}</td>
                  <td className="text-right font-semibold text-slate-700">{formatCurrency(t.valor)}</td>
                  <td className="text-right text-emerald-600 font-medium">{formatCurrency(t.valor_pago)}</td>
                  <td className={cn('text-right font-bold', vencido ? 'text-red-600' : 'text-slate-800')}>{formatCurrency(saldo)}</td>
                  <td className={cn('text-sm', vencido ? 'text-red-600 font-semibold' : 'text-slate-500')}>
                    {new Date(t.vencimento).toLocaleDateString('pt-BR')}
                  </td>
                  <td><span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full', cfg.color)}>{cfg.icon}{cfg.label}</span></td>
                  <td>
                    <div className="flex gap-1 justify-end">
                      {t.status !== 'pago' && (
                        <button onClick={() => { setBaixaId(t.id); setValorBaixa(String(t.valor - t.valor_pago)) }}
                          title="Registrar baixa" className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                          <CheckCircle size={14} />
                        </button>
                      )}
                      <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteId(t.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Novo/Editar */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Título' : 'Novo Título a Receber'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Número</label><input value={form.numero} onChange={f('numero')} className="form-input" required /></div>
            <div><label className="form-label">Status</label>
              <select value={form.status} onChange={f('status')} className="form-input">
                {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div><label className="form-label">Cliente</label><input value={form.cliente} onChange={f('cliente')} className="form-input" required /></div>
          <div><label className="form-label">Descrição</label><input value={form.descricao} onChange={f('descricao')} className="form-input" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="form-label">Valor (R$)</label><input type="number" step="0.01" value={form.valor} onChange={f('valor')} className="form-input" min="0" /></div>
            <div><label className="form-label">Valor Pago (R$)</label><input type="number" step="0.01" value={form.valor_pago} onChange={f('valor_pago')} className="form-input" min="0" /></div>
            <div><label className="form-label">Vencimento</label><input type="date" value={form.vencimento} onChange={f('vencimento')} className="form-input" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Categoria</label>
              <select value={form.categoria} onChange={f('categoria')} className="form-input">
                {['Venda','Contrato','Serviço','Outros'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="form-label">Nota Fiscal</label><input value={form.nota_fiscal} onChange={f('nota_fiscal')} className="form-input" placeholder="NF-000000" /></div>
          </div>
          <div><label className="form-label">Observação</label><textarea value={form.observacao} onChange={f('observacao')} className="form-input" rows={2} /></div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary"><Wallet size={16} />{editing ? 'Salvar' : 'Cadastrar'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal Baixa */}
      <Modal open={!!baixaId} onClose={() => setBaixaId(null)} title="Registrar Recebimento" size="sm">
        <div className="space-y-4">
          <p className="text-slate-600 text-sm">Informe o valor recebido:</p>
          <div><label className="form-label">Valor Recebido (R$)</label>
            <input type="number" step="0.01" value={valorBaixa} onChange={e => setValorBaixa(e.target.value)} className="form-input" min="0" autoFocus />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setBaixaId(null)} className="btn-secondary">Cancelar</button>
            <button onClick={handleBaixa} className="btn-primary"><CheckCircle size={16} />Confirmar Baixa</button>
          </div>
        </div>
      </Modal>

      {/* Modal Delete */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar exclusão" size="sm">
        <p className="text-slate-600 mb-5">Excluir este título permanentemente?</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancelar</button>
          <button onClick={() => { save(titulos.filter(t => t.id !== deleteId)); setDeleteId(null) }} className="btn-danger">Excluir</button>
        </div>
      </Modal>
    </div>
  )
}
