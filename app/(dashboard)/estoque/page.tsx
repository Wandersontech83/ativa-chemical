'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Plus, Search, ArrowUp, ArrowDown, Package, AlertTriangle } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { loadData, saveData, genId } from '@/lib/storage'

interface MovimentoEstoque {
  id: string; data: string; produto: string; tipo: 'entrada' | 'saida'
  quantidade: number; unidade: string; documento: string; observacao: string
}

interface ProdutoEstoque {
  id: string; codigo: string; nome: string; unidade: string
  estoque_atual: number; estoque_minimo: number; localizacao: string
}

const SEED_PRODUTOS: ProdutoEstoque[] = [
  { id: 'prd-001', codigo: 'AC-SOL-001', nome: 'Acetona Industrial 99,5%', unidade: 'kg', estoque_atual: 1250, estoque_minimo: 500, localizacao: 'Galpão A - Prateleira 1' },
  { id: 'prd-002', codigo: 'AC-SOL-002', nome: 'Tolueno Industrial', unidade: 'kg', estoque_atual: 890, estoque_minimo: 300, localizacao: 'Galpão A - Prateleira 2' },
  { id: 'prd-003', codigo: 'AC-RES-001', nome: 'Resina Epóxi Bisfenol A', unidade: 'kg', estoque_atual: 340, estoque_minimo: 100, localizacao: 'Galpão B - Prateleira 1' },
  { id: 'prd-004', codigo: 'AC-PIG-001', nome: 'Dióxido de Titânio R-902', unidade: 'kg', estoque_atual: 480, estoque_minimo: 200, localizacao: 'Galpão B - Prateleira 3' },
  { id: 'prd-005', codigo: 'AC-ADI-001', nome: 'Ftalato de Dioctila (DOP)', unidade: 'kg', estoque_atual: 1100, estoque_minimo: 500, localizacao: 'Galpão A - Prateleira 5' },
  { id: 'prd-006', codigo: 'AC-SOL-006', nome: 'Acetato de Etila', unidade: 'kg', estoque_atual: 95, estoque_minimo: 200, localizacao: 'Galpão A - Prateleira 3' },
]

const SEED_MOV: MovimentoEstoque[] = [
  { id: 'mov-001', data: '2024-11-01', produto: 'Acetona Industrial 99,5%', tipo: 'entrada', quantidade: 500, unidade: 'kg', documento: 'OC-2024-003', observacao: 'Recebimento Quimibras' },
  { id: 'mov-002', data: '2024-11-05', produto: 'Tolueno Industrial', tipo: 'saida', quantidade: 300, unidade: 'kg', documento: 'PV-2024-001', observacao: 'Entrega Nordeste Química' },
  { id: 'mov-003', data: '2024-11-10', produto: 'Dióxido de Titânio R-902', tipo: 'entrada', quantidade: 2000, unidade: 'kg', documento: 'OC-2024-001', observacao: 'Recebimento Hunan Chemical' },
  { id: 'mov-004', data: '2024-11-15', produto: 'Ftalato de Dioctila (DOP)', tipo: 'saida', quantidade: 1000, unidade: 'kg', documento: 'PV-2024-002', observacao: 'Entrega IndTex' },
]

const EMPTY_MOV: Omit<MovimentoEstoque,'id'> = {
  data: new Date().toISOString().split('T')[0], produto: '', tipo: 'entrada',
  quantidade: 0, unidade: 'kg', documento: '', observacao: ''
}

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<ProdutoEstoque[]>([])
  const [movimentos, setMovimentos] = useState<MovimentoEstoque[]>([])
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'saldo' | 'movimentos'>('saldo')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Omit<MovimentoEstoque,'id'>>(EMPTY_MOV)

  useEffect(() => {
    setProdutos(loadData('estoque_produtos', SEED_PRODUTOS))
    setMovimentos(loadData('estoque_movimentos', SEED_MOV))
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const novoMov = { ...form, id: genId('mov') }
    const novosMovimentos = [novoMov, ...movimentos]
    const novosProdutos = produtos.map(p => {
      if (p.nome !== form.produto) return p
      const delta = form.tipo === 'entrada' ? form.quantidade : -form.quantidade
      return { ...p, estoque_atual: Math.max(0, p.estoque_atual + delta) }
    })
    setMovimentos(novosMovimentos); saveData('estoque_movimentos', novosMovimentos)
    setProdutos(novosProdutos); saveData('estoque_produtos', novosProdutos)
    setModal(false)
  }

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))

  const filteredProdutos = produtos.filter(p => !search || p.nome.toLowerCase().includes(search.toLowerCase()) || p.codigo.toLowerCase().includes(search.toLowerCase()))
  const filteredMov = movimentos.filter(m => !search || m.produto.toLowerCase().includes(search.toLowerCase()) || m.documento.toLowerCase().includes(search.toLowerCase()))

  const criticos = produtos.filter(p => p.estoque_atual <= p.estoque_minimo)

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Controle de Estoque</h1>
          <p className="text-slate-500 text-sm mt-0.5">{criticos.length > 0 ? <span className="text-amber-600 font-medium">{criticos.length} produtos abaixo do mínimo</span> : `${produtos.length} produtos em estoque`}</p>
        </div>
        <button onClick={() => { setForm(EMPTY_MOV); setModal(true) }} className="btn-primary"><Plus size={16}/>Registrar Movimentação</button>
      </div>

      {criticos.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5"/>
          <div>
            <p className="text-sm font-semibold text-amber-800">Produtos em nível crítico:</p>
            <p className="text-sm text-amber-700 mt-0.5">{criticos.map(p => p.nome).join(', ')}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => setTab('saldo')} className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-colors', tab === 'saldo' ? 'bg-cyan-600 text-white' : 'bg-white text-slate-600 border border-slate-200')}>Saldo Atual</button>
        <button onClick={() => setTab('movimentos')} className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-colors', tab === 'movimentos' ? 'bg-cyan-600 text-white' : 'bg-white text-slate-600 border border-slate-200')}>Movimentações</button>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." className="form-input pl-9 py-1.5"/>
      </div>

      {tab === 'saldo' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="data-table">
            <thead><tr>
              <th>Código</th><th>Produto</th><th>Localização</th>
              <th className="text-right">Estoque Atual</th><th className="text-right">Mínimo</th><th>Situação</th>
            </tr></thead>
            <tbody>
              {filteredProdutos.map(p => {
                const critico = p.estoque_atual <= p.estoque_minimo
                const pct = Math.min(100, (p.estoque_atual / (p.estoque_minimo * 2)) * 100)
                return (
                  <tr key={p.id}>
                    <td className="font-mono text-xs text-slate-500">{p.codigo}</td>
                    <td className="font-medium text-slate-800">{p.nome}</td>
                    <td className="text-slate-500 text-sm">{p.localizacao}</td>
                    <td className="text-right font-semibold">{p.estoque_atual} {p.unidade}</td>
                    <td className="text-right text-slate-500">{p.estoque_minimo} {p.unidade}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full', critico ? 'bg-red-500' : 'bg-emerald-500')} style={{width: `${pct}%`}}/>
                        </div>
                        <span className={cn('text-xs font-medium', critico ? 'text-red-600' : 'text-emerald-600')}>{critico ? 'Crítico' : 'OK'}</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'movimentos' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="data-table">
            <thead><tr>
              <th>Data</th><th>Tipo</th><th>Produto</th><th className="text-right">Qtd</th><th>Documento</th><th>Observação</th>
            </tr></thead>
            <tbody>
              {filteredMov.map(m => (
                <tr key={m.id}>
                  <td className="text-slate-500 text-sm">{new Date(m.data).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full', m.tipo === 'entrada' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>
                      {m.tipo === 'entrada' ? <ArrowDown size={11}/> : <ArrowUp size={11}/>}
                      {m.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                    </span>
                  </td>
                  <td className="font-medium text-slate-800">{m.produto}</td>
                  <td className="text-right font-semibold">{m.quantidade} {m.unidade}</td>
                  <td className="font-mono text-xs text-cyan-700">{m.documento}</td>
                  <td className="text-slate-500 text-sm">{m.observacao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Registrar Movimentação de Estoque" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Data</label><input type="date" value={form.data} onChange={f('data')} className="form-input" required/></div>
            <div><label className="form-label">Tipo</label>
              <select value={form.tipo} onChange={f('tipo')} className="form-input">
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </div>
          </div>
          <div><label className="form-label">Produto</label>
            <select value={form.produto} onChange={f('produto')} className="form-input" required>
              <option value="">Selecione um produto...</option>
              {produtos.map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Quantidade</label><input type="number" value={form.quantidade} onChange={f('quantidade')} className="form-input" min="1" required/></div>
            <div><label className="form-label">Unidade</label>
              <select value={form.unidade} onChange={f('unidade')} className="form-input">
                <option>kg</option><option>L</option><option>un</option><option>t</option>
              </select>
            </div>
          </div>
          <div><label className="form-label">Documento de Referência</label><input value={form.documento} onChange={f('documento')} className="form-input" placeholder="Ex: PV-2024-001 ou OC-2024-003"/></div>
          <div><label className="form-label">Observação</label><input value={form.observacao} onChange={f('observacao')} className="form-input" placeholder="Ex: Recebimento Hunan Chemical"/></div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary"><Package size={16}/>Registrar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
