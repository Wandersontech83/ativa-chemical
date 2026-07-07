'use client'

import { useState, useEffect, useRef } from 'react'
import { formatCurrency, cn } from '@/lib/utils'
import {
  Plus, Search, Pencil, Trash2, ShoppingCart, Truck, CheckCircle,
  Clock, XCircle, Download, X, Send, Loader2, Users, Calendar, Package
} from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { loadData, saveData, genId } from '@/lib/storage'
import { CONDICOES_PAGAMENTO } from '@/lib/payment-conditions'
import { SEED_PRODUTOS } from '@/lib/seeds'
import { toast } from 'sonner'

interface Cliente { id: string; razao_social: string; cnpj: string; email: string; contato: string }
interface ProdutoCat { id: string; codigo: string; nome: string; unidade: string; ncm: string; categoria: string; preco_venda_sugerido: number }

interface ItemPV {
  id: string; produto: string; produto_id: string; ncm: string; unidade: string
  quantidade: number; preco_unitario: number
}

interface Pedido {
  id: string; numero: string
  cliente_id: string; cliente: string
  data: string; prazo_entrega: string
  status: 'pendente' | 'aguardando_aprovacao' | 'confirmado' | 'producao' | 'expedido' | 'entregue' | 'cancelado'
  itens: ItemPV[]; valor_total: number
  forma_pagamento: string; observacoes: string
  proposta_vinculada?: string
  aprovacao?: { aprovador: string; data: string; comentario: string }
}

const SEED: Pedido[] = [
  { id:'ped-001', numero:'PV-2026-001', cliente_id:'cli-001', cliente:'Nordeste Química Ltda', data:'2026-06-01', prazo_entrega:'2026-06-15', status:'entregue', itens:[{id:'i1',produto:'Acetona Industrial 99,5%',produto_id:'prd-001',ncm:'2914.11.00',unidade:'kg',quantidade:500,preco_unitario:6.80}], valor_total:3400, forma_pagamento:'30/60/90', observacoes:'' },
  { id:'ped-002', numero:'PV-2026-002', cliente_id:'cli-002', cliente:'IndTex Plásticos SA', data:'2026-06-10', prazo_entrega:'2026-06-25', status:'expedido', itens:[{id:'i2',produto:'Ftalato de Dioctila (DOP)',produto_id:'prd-005',ncm:'2917.34.00',unidade:'kg',quantidade:1000,preco_unitario:14.90}], valor_total:14900, forma_pagamento:'60 DDL', observacoes:'Entrega parcial autorizada' },
  { id:'ped-003', numero:'PV-2026-003', cliente_id:'cli-003', cliente:'PetroSul Derivados', data:'2026-06-18', prazo_entrega:'2026-07-03', status:'confirmado', itens:[{id:'i3',produto:'Resina Epóxi Bisfenol A',produto_id:'prd-003',ncm:'3907.30.11',unidade:'kg',quantidade:200,preco_unitario:28.00}], valor_total:5600, forma_pagamento:'À vista', observacoes:'' },
  { id:'ped-004', numero:'PV-2026-004', cliente_id:'cli-004', cliente:'Fab Têxtil Nordeste', data:'2026-07-01', prazo_entrega:'2026-07-20', status:'pendente', itens:[{id:'i4',produto:'Dióxido de Titânio R-902',produto_id:'prd-004',ncm:'3206.11.10',unidade:'kg',quantidade:100,preco_unitario:43.00}], valor_total:4300, forma_pagamento:'30 DDL', observacoes:'' },
]

const STATUS_CONFIG = {
  pendente:            { label:'Pendente',       color:'bg-amber-100 text-amber-700',    icon:<Clock size={11}/> },
  aguardando_aprovacao:{ label:'Ag. Aprovação',  color:'bg-orange-100 text-orange-700',  icon:<Clock size={11}/> },
  confirmado:          { label:'Confirmado',     color:'bg-blue-100 text-blue-700',      icon:<CheckCircle size={11}/> },
  producao:            { label:'Em Produção',    color:'bg-purple-100 text-purple-700',  icon:<ShoppingCart size={11}/> },
  expedido:            { label:'Expedido',       color:'bg-cyan-100 text-cyan-700',      icon:<Truck size={11}/> },
  entregue:            { label:'Entregue',       color:'bg-emerald-100 text-emerald-700',icon:<CheckCircle size={11}/> },
  cancelado:           { label:'Cancelado',      color:'bg-red-100 text-red-700',        icon:<XCircle size={11}/> },
}

const totalItens = (itens: ItemPV[]) => itens.reduce((s,i) => s + i.quantidade * i.preco_unitario, 0)
const EMPTY_ITEM = (): ItemPV => ({ id: genId('itm'), produto:'', produto_id:'', ncm:'', unidade:'kg', quantidade:1, preco_unitario:0 })

export default function PedidosPage() {
  const [pedidos, setPedidos]   = useState<Pedido[]>([])
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState<Pedido | null>(null)
  const [deleteId, setDeleteId] = useState<string|null>(null)
  const [detalhe, setDetalhe]   = useState<Pedido | null>(null)
  const [enviando, setEnviando] = useState(false)

  // Form
  const [fNumero, setFNumero]   = useState('')
  const [fCliId, setFCliId]     = useState('')
  const [fCliNome, setFCliNome] = useState('')
  const [fData, setFData]       = useState(new Date().toISOString().slice(0,10))
  const [fEntrega, setFEntrega] = useState(new Date(Date.now()+15*86400000).toISOString().slice(0,10))
  const [fPagto, setFPagto]     = useState('30 DDL')
  const [fObs, setFObs]         = useState('')
  const [fProposta, setFProposta] = useState('')
  const [fItens, setFItens]     = useState<ItemPV[]>([EMPTY_ITEM()])
  const [cliQ, setCliQ]         = useState('')
  const [showCliList, setShowCliList] = useState(false)
  const [prodQ, setProdQ]       = useState<Record<string,string>>({})
  const [showProdList, setShowProdList] = useState<Record<string,boolean>>({})
  const cliRef = useRef<HTMLDivElement>(null)

  const clientes: Cliente[] = loadData('clientes', [])
  const produtos: ProdutoCat[] = loadData('produtos', SEED_PRODUTOS)

  useEffect(() => { setPedidos(loadData('pedidos', SEED)) }, [])
  useEffect(() => {
    const h = (e: MouseEvent) => { if (cliRef.current && !cliRef.current.contains(e.target as Node)) setShowCliList(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const savePedidos = (list: Pedido[]) => { setPedidos(list); saveData('pedidos', list) }

  const openCreate = () => {
    const n = `PV-${new Date().getFullYear()}-${String(pedidos.length+1).padStart(3,'0')}`
    setEditing(null); setFNumero(n); setFCliId(''); setFCliNome('')
    setFData(new Date().toISOString().slice(0,10)); setFEntrega(new Date(Date.now()+15*86400000).toISOString().slice(0,10))
    setFPagto('30 DDL'); setFObs(''); setFProposta(''); setFItens([EMPTY_ITEM()]); setCliQ(''); setModal(true)
  }

  const openEdit = (p: Pedido) => {
    setEditing(p); setFNumero(p.numero); setFCliId(p.cliente_id); setFCliNome(p.cliente)
    setFData(p.data); setFEntrega(p.prazo_entrega); setFPagto(p.forma_pagamento)
    setFObs(p.observacoes); setFProposta(p.proposta_vinculada||''); setFItens(p.itens.map(i=>({...i})))
    setCliQ(p.cliente); setModal(true)
  }

  const selectCli = (c: Cliente) => {
    setFCliId(c.id); setFCliNome(c.razao_social); setCliQ(c.razao_social); setShowCliList(false)
  }

  const selectProd = (itemId: string, p: ProdutoCat) => {
    setFItens(prev => prev.map(i => i.id===itemId ? {...i,produto:p.nome,produto_id:p.id,ncm:p.ncm,unidade:p.unidade,preco_unitario:p.preco_venda_sugerido} : i))
    setProdQ(prev => ({...prev,[itemId]:p.nome}))
    setShowProdList(prev => ({...prev,[itemId]:false}))
  }

  const updateItem = (id: string, field: keyof ItemPV, val: any) =>
    setFItens(prev => prev.map(i => i.id===id ? {...i,[field]:val} : i))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fCliNome.trim()) { toast.error('Selecione um cliente'); return }
    if (fItens.some(i => !i.produto.trim())) { toast.error('Preencha todos os itens'); return }
    const vt = totalItens(fItens)
    const novo: Pedido = {
      id: editing?.id || genId('ped'), numero: fNumero,
      cliente_id: fCliId, cliente: fCliNome, data: fData, prazo_entrega: fEntrega,
      status: editing?.status || 'pendente', itens: fItens, valor_total: vt,
      forma_pagamento: fPagto, observacoes: fObs,
      ...(fProposta ? { proposta_vinculada: fProposta } : {}),
    }
    if (editing) savePedidos(pedidos.map(p => p.id===editing.id ? novo : p))
    else savePedidos([...pedidos, novo])
    setModal(false)
    toast.success(editing ? 'PV atualizado!' : 'Pedido emitido com status Pendente')
  }

  const submeterAprovacao = async (p: Pedido) => {
    setEnviando(true)
    const atualizado = {...p, status: 'aguardando_aprovacao' as const}
    savePedidos(pedidos.map(x => x.id===p.id ? atualizado : x))
    if (detalhe?.id===p.id) setDetalhe(atualizado)
    try {
      await fetch('/api/aprovacao/notificar', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ tipo:'PV', numero:p.numero, valor:formatCurrency(p.valor_total), cliente:p.cliente }),
      })
    } catch {}
    toast.success('PV enviado para aprovação do Gestor!')
    setEnviando(false)
  }

  const filtered = pedidos.filter(p => !search ||
    p.numero.toLowerCase().includes(search.toLowerCase()) || p.cliente.toLowerCase().includes(search.toLowerCase())
  )
  const cliFiltrados = clientes.filter((c:any) => !cliQ || c.razao_social.toLowerCase().includes(cliQ.toLowerCase()))
  const totalGeral = pedidos.filter(p=>p.status!=='cancelado').reduce((s,p)=>s+p.valor_total,0)

  return (
    <div className="flex gap-5 h-full animate-fade-up">
      {/* Lista */}
      <div className={cn('flex flex-col space-y-4 transition-all', detalhe ? 'w-[55%]' : 'flex-1')}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Pedidos de Venda</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {pedidos.filter(p=>p.status==='aguardando_aprovacao').length} ag. aprovação ·{' '}
              {formatCurrency(totalGeral)} em aberto
            </p>
          </div>
          <button onClick={openCreate} className="btn-primary"><Plus size={16}/>Novo PV</button>
        </div>

        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Número ou cliente..." className="form-input pl-9 py-1.5"/>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex-1">
          <table className="data-table">
            <thead><tr>
              <th>Nº Pedido</th><th>Cliente</th><th>Entrega</th><th>Pagamento</th><th className="text-right">Total</th><th>Status</th><th></th>
            </tr></thead>
            <tbody>
              {filtered.length===0 && <tr><td colSpan={7} className="text-center text-slate-400 py-8">Nenhum pedido encontrado</td></tr>}
              {filtered.map(p => {
                const cfg = STATUS_CONFIG[p.status]
                const sel = detalhe?.id===p.id
                return (
                  <tr key={p.id}
                    className={cn('cursor-pointer transition-colors', sel?'bg-blue-50 border-l-2 border-l-blue-500':'hover:bg-slate-50/60')}
                    onClick={()=>setDetalhe(p)}
                  >
                    <td className="font-mono text-xs font-semibold text-cyan-700">{p.numero}</td>
                    <td className="font-medium text-slate-800 max-w-[140px] truncate">{p.cliente}</td>
                    <td className="text-slate-500 text-sm">{new Date(p.prazo_entrega+'T12:00').toLocaleDateString('pt-BR')}</td>
                    <td className="text-slate-500 text-xs">{p.forma_pagamento}</td>
                    <td className="text-right font-semibold text-slate-800">{formatCurrency(p.valor_total)}</td>
                    <td><span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',cfg.color)}>{cfg.icon}{cfg.label}</span></td>
                    <td onClick={e=>e.stopPropagation()}>
                      <div className="flex gap-1 justify-end">
                        <button onClick={()=>openEdit(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50"><Pencil size={14}/></button>
                        <button onClick={()=>setDeleteId(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Painel Detalhe */}
      {detalhe && (
        <div className="w-[45%] flex-shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b flex items-start justify-between bg-gradient-to-r from-slate-800 to-slate-700">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs text-cyan-400">{detalhe.numero}</span>
                <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border border-white/20',STATUS_CONFIG[detalhe.status].color)}>
                  {STATUS_CONFIG[detalhe.status].icon}{STATUS_CONFIG[detalhe.status].label}
                </span>
              </div>
              <h2 className="font-bold text-white text-sm">{detalhe.cliente}</h2>
              <p className="text-slate-400 text-xs">{detalhe.forma_pagamento}</p>
            </div>
            <button onClick={()=>setDetalhe(null)} className="text-slate-400 hover:text-white ml-3 flex-shrink-0"><X size={16}/></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Total */}
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-xs text-blue-500 mb-1">Valor total do pedido</p>
              <p className="text-3xl font-bold text-blue-700">{formatCurrency(detalhe.valor_total)}</p>
            </div>

            {/* Datas */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 flex items-center gap-1"><Calendar size={11}/>Data PV</p>
                <p className="text-sm font-medium text-slate-700 mt-0.5">{new Date(detalhe.data+'T12:00').toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 flex items-center gap-1"><Truck size={11}/>Entrega</p>
                <p className="text-sm font-medium text-slate-700 mt-0.5">{new Date(detalhe.prazo_entrega+'T12:00').toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            {/* Itens */}
            <div className="bg-slate-50 rounded-xl overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-200">
                <p className="text-xs font-semibold text-slate-500">ITENS DO PEDIDO</p>
              </div>
              {detalhe.itens.map((item,i) => (
                <div key={item.id} className={cn('px-3 py-2.5',i<detalhe.itens.length-1?'border-b border-slate-200':'')}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{item.produto}</p>
                      <p className="text-xs text-slate-400">{item.quantidade} {item.unidade} × {formatCurrency(item.preco_unitario)}</p>
                    </div>
                    <p className="font-semibold text-slate-800 text-sm ml-3">{formatCurrency(item.quantidade*item.preco_unitario)}</p>
                  </div>
                </div>
              ))}
            </div>

            {detalhe.proposta_vinculada && (
              <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-3 flex items-center gap-2 text-sm">
                <Package size={13} className="text-cyan-500"/>
                <span className="text-slate-600">Proposta vinculada: <strong className="text-cyan-700">{detalhe.proposta_vinculada}</strong></span>
              </div>
            )}
            {detalhe.observacoes && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-xs text-amber-600 font-medium mb-1">Observações</p>
                <p className="text-sm text-slate-700">{detalhe.observacoes}</p>
              </div>
            )}
            {detalhe.aprovacao && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-xs text-blue-600 font-medium mb-1">Aprovação</p>
                <p className="text-sm text-slate-700">{detalhe.aprovacao.aprovador} · {detalhe.aprovacao.data}</p>
                {detalhe.aprovacao.comentario && <p className="text-xs text-slate-500 mt-0.5">{detalhe.aprovacao.comentario}</p>}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button onClick={()=>openEdit(detalhe)} className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-sm text-slate-600 hover:bg-slate-50">
                <Pencil size={13}/>Editar
              </button>
              {detalhe.status==='pendente' && (
                <button onClick={()=>submeterAprovacao(detalhe)} disabled={enviando}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-amber-500 text-white rounded-xl py-2 text-sm font-medium hover:bg-amber-600 disabled:opacity-50">
                  {enviando?<Loader2 size={13} className="animate-spin"/>:<Send size={13}/>}Submeter aprovação
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal open={modal} onClose={()=>setModal(false)} title={editing?`Editar ${fNumero}`:'Novo Pedido de Venda'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Nº do Pedido</label><input value={fNumero} onChange={e=>setFNumero(e.target.value)} className="form-input" required/></div>
            <div><label className="form-label">Proposta vinculada</label><input value={fProposta} onChange={e=>setFProposta(e.target.value)} className="form-input" placeholder="Ex: PROP-2026-001"/></div>
          </div>

          {/* Cliente autocomplete */}
          <div ref={cliRef}>
            <label className="form-label">Cliente *</label>
            <div className="relative">
              <Users size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
              <input value={cliQ} onChange={e=>{setFCliNome(e.target.value);setCliQ(e.target.value);setShowCliList(true)}} onFocus={()=>setShowCliList(true)}
                placeholder="Digite para buscar cliente..." className="form-input pl-8" required/>
              {showCliList && cliFiltrados.length>0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-100 z-50 max-h-48 overflow-y-auto">
                  {cliFiltrados.map((c:any)=>(
                    <button key={c.id} type="button" onClick={()=>selectCli(c)}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                      <p className="text-xs font-semibold text-slate-800">{c.razao_social}</p>
                      <p className="text-[10px] text-slate-400">{c.cnpj} · {c.cidade}/{c.estado}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div><label className="form-label">Data do PV</label><input type="date" value={fData} onChange={e=>setFData(e.target.value)} className="form-input"/></div>
            <div><label className="form-label">Prazo de Entrega</label><input type="date" value={fEntrega} onChange={e=>setFEntrega(e.target.value)} className="form-input"/></div>
            <div><label className="form-label">Condição de Pagamento</label>
              <select value={fPagto} onChange={e=>setFPagto(e.target.value)} className="form-input">
                {CONDICOES_PAGAMENTO.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Itens */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="form-label mb-0">Itens do Pedido</label>
              <button type="button" onClick={()=>setFItens(p=>[...p,EMPTY_ITEM()])} className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-medium"><Plus size={12}/>Adicionar item</button>
            </div>
            <div className="space-y-2">
              {fItens.map((item,idx)=>{
                const prodsFilt = produtos.filter((p:any) => !prodQ[item.id] || p.nome.toLowerCase().includes(prodQ[item.id].toLowerCase()))
                return (
                  <div key={item.id} className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono w-4">{idx+1}.</span>
                      <div className="flex-1 relative">
                        <input
                          value={prodQ[item.id]??item.produto}
                          onChange={e=>{setProdQ(p=>({...p,[item.id]:e.target.value}));updateItem(item.id,'produto',e.target.value);setShowProdList(p=>({...p,[item.id]:true}))}}
                          onFocus={()=>setShowProdList(p=>({...p,[item.id]:true}))}
                          placeholder="Buscar produto cadastrado..."
                          className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-cyan-300 outline-none bg-white"
                        />
                        {showProdList[item.id] && prodsFilt.length>0 && (
                          <div className="absolute top-full left-0 right-0 mt-0.5 bg-white rounded-lg shadow-xl border border-slate-100 z-50 max-h-36 overflow-y-auto">
                            {prodsFilt.slice(0,8).map((p:any)=>(
                              <button key={p.id} type="button" onClick={()=>selectProd(item.id,p)}
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                                <p className="text-xs font-semibold text-slate-800">{p.nome}</p>
                                <p className="text-[10px] text-slate-400">{p.codigo} · {p.unidade} · R$ {p.preco_venda_sugerido}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {fItens.length>1 && <button type="button" onClick={()=>setFItens(p=>p.filter(i=>i.id!==item.id))} className="text-red-400 hover:text-red-600 flex-shrink-0"><X size={14}/></button>}
                    </div>
                    <div className="grid grid-cols-4 gap-2 ml-6">
                      <div><label className="text-[10px] text-slate-400">Quantidade</label>
                        <input type="number" value={item.quantidade} min="0.001" step="0.001" onChange={e=>updateItem(item.id,'quantidade',Number(e.target.value))}
                          className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-cyan-300 outline-none"/>
                      </div>
                      <div><label className="text-[10px] text-slate-400">Unidade</label>
                        <input value={item.unidade} onChange={e=>updateItem(item.id,'unidade',e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-cyan-300 outline-none"/>
                      </div>
                      <div><label className="text-[10px] text-slate-400">Preço unitário (R$)</label>
                        <input type="number" value={item.preco_unitario} min="0" step="0.01" onChange={e=>updateItem(item.id,'preco_unitario',Number(e.target.value))}
                          className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-cyan-300 outline-none"/>
                      </div>
                      <div><label className="text-[10px] text-slate-400">Subtotal</label>
                        <p className="text-xs font-semibold text-slate-700 py-1">{formatCurrency(item.quantidade*item.preco_unitario)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Total */}
          <div className="bg-slate-900 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-400 mb-1">Total do Pedido</p>
            <p className="text-2xl font-bold text-cyan-400">{formatCurrency(totalItens(fItens))}</p>
          </div>

          <div><label className="form-label">Observações</label>
            <textarea value={fObs} onChange={e=>setFObs(e.target.value)} className="form-input" rows={2} placeholder="Instruções de entrega, embalagem..."/>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={()=>setModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary"><ShoppingCart size={16}/>{editing?'Salvar':'Emitir Pedido'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={()=>setDeleteId(null)} title="Confirmar exclusão" size="sm">
        <p className="text-slate-600 mb-5">Excluir este pedido permanentemente?</p>
        <div className="flex gap-2 justify-end">
          <button onClick={()=>setDeleteId(null)} className="btn-secondary">Cancelar</button>
          <button onClick={()=>{savePedidos(pedidos.filter(p=>p.id!==deleteId));setDeleteId(null);if(detalhe?.id===deleteId)setDetalhe(null)}} className="btn-danger">Excluir</button>
        </div>
      </Modal>
    </div>
  )
}
