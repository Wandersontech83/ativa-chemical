'use client'

import { useState, useEffect, useRef } from 'react'
import { formatCurrency, cn } from '@/lib/utils'
import {
  Plus, Search, Pencil, Trash2, DollarSign, Download, X,
  ChevronDown, AlertCircle, CheckCircle, Clock, Send, Loader2,
  Package, Truck, XCircle, FileText, Building2, Calendar
} from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { loadData, saveData, genId } from '@/lib/storage'
import { CONDICOES_PAGAMENTO } from '@/lib/payment-conditions'
import { SEED_FORNECEDORES, SEED_PRODUTOS } from '@/lib/seeds'
import { toast } from 'sonner'

interface Fornecedor { id: string; nome: string; categoria: string; moeda: string; prazo_entrega: number; email: string; contato: string }
interface ProdutoCat  { id: string; codigo: string; nome: string; unidade: string; ncm: string; categoria: string; preco_custo: number }

interface ItemOC {
  id: string; produto: string; produto_id: string; ncm: string; unidade: string
  quantidade: number; preco_unitario: number; tem_ipi: boolean; aliquota_ipi: number
}

interface Compra {
  id: string; numero: string
  fornecedor_id: string; fornecedor: string; fornecedor_email: string
  data: string; previsao_entrega: string; categoria: string
  itens: ItemOC[]; valor_itens: number; valor_ipi: number; valor_total: number
  status: 'solicitado' | 'aguardando_aprovacao' | 'aprovado' | 'reprovado' | 'em_transito' | 'recebido' | 'cancelado'
  moeda: 'BRL' | 'USD' | 'CNY' | 'EUR'; cambio: number; forma_pagamento: string
  observacoes: string; aprovacao?: { aprovador: string; data: string; comentario: string }
}

const SEED_COMPRAS: Compra[] = [
  { id:'cmp-001', numero:'OC-2026-001', fornecedor_id:'for-001', fornecedor:'Hunan Chemical Co. Ltd', fornecedor_email:'sales@hunanchemical.cn', data:'2026-06-01', previsao_entrega:'2026-07-15', categoria:'Resinas e Pigmentos', itens:[{id:'i1',produto:'Dióxido de Titânio R-902',produto_id:'prd-004',ncm:'3206.11.10',unidade:'kg',quantidade:2000,preco_unitario:28,tem_ipi:false,aliquota_ipi:0}], valor_itens:56000, valor_ipi:0, valor_total:56000, status:'recebido', moeda:'CNY', cambio:0.77, forma_pagamento:'Wire Transfer 30d', observacoes:'' },
  { id:'cmp-002', numero:'OC-2026-002', fornecedor_id:'for-002', fornecedor:'GZ Poly Materials', fornecedor_email:'export@gzpoly.com', data:'2026-06-15', previsao_entrega:'2026-07-25', categoria:'Polímeros e Aditivos', itens:[{id:'i2',produto:'Ftalato de Dioctila (DOP)',produto_id:'prd-005',ncm:'2917.34.00',unidade:'kg',quantidade:5000,preco_unitario:9.8,tem_ipi:true,aliquota_ipi:5}], valor_itens:49000, valor_ipi:2450, valor_total:51450, status:'aguardando_aprovacao', moeda:'CNY', cambio:0.77, forma_pagamento:'LC 60 dias', observacoes:'' },
  { id:'cmp-003', numero:'OC-2026-003', fornecedor_id:'for-003', fornecedor:'Quimibras Ind. Ltda', fornecedor_email:'vendas@quimibras.com.br', data:'2026-07-01', previsao_entrega:'2026-07-10', categoria:'Solventes Industriais', itens:[{id:'i3',produto:'Acetona Industrial 99,5%',produto_id:'prd-001',ncm:'2914.11.00',unidade:'kg',quantidade:3000,preco_unitario:4.5,tem_ipi:false,aliquota_ipi:0}], valor_itens:13500, valor_ipi:0, valor_total:13500, status:'aprovado', moeda:'BRL', cambio:1, forma_pagamento:'30 DDL', observacoes:'' },
]

const STATUS_CONFIG = {
  solicitado:          { label:'Solicitado',         color:'bg-slate-100 text-slate-600',    icon:<Clock size={11}/> },
  aguardando_aprovacao:{ label:'Ag. Aprovação',      color:'bg-amber-100 text-amber-700',    icon:<AlertCircle size={11}/> },
  aprovado:            { label:'Aprovado',           color:'bg-blue-100 text-blue-700',      icon:<CheckCircle size={11}/> },
  reprovado:           { label:'Reprovado',          color:'bg-red-100 text-red-700',        icon:<XCircle size={11}/> },
  em_transito:         { label:'Em Trânsito',        color:'bg-purple-100 text-purple-700',  icon:<Truck size={11}/> },
  recebido:            { label:'Recebido',           color:'bg-emerald-100 text-emerald-700',icon:<CheckCircle size={11}/> },
  cancelado:           { label:'Cancelado',          color:'bg-red-100 text-red-600',        icon:<XCircle size={11}/> },
}

const EMPTY_ITEM = (): ItemOC => ({ id: genId('itm'), produto:'', produto_id:'', ncm:'', unidade:'kg', quantidade:1, preco_unitario:0, tem_ipi:false, aliquota_ipi:0 })

function calcTotais(itens: ItemOC[]) {
  const valor_itens = itens.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0)
  const valor_ipi   = itens.reduce((s, i) => s + (i.tem_ipi ? i.quantidade * i.preco_unitario * (i.aliquota_ipi / 100) : 0), 0)
  return { valor_itens, valor_ipi, valor_total: valor_itens + valor_ipi }
}

export default function ComprasPage() {
  const [compras, setCompras]   = useState<Compra[]>([])
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState<Compra | null>(null)
  const [deleteId, setDeleteId] = useState<string|null>(null)
  const [detalhe, setDetalhe]   = useState<Compra | null>(null)
  const [enviando, setEnviando] = useState(false)

  // Form state
  const [fNumero, setFNumero]     = useState('')
  const [fFornId, setFFornId]     = useState('')
  const [fFornNome, setFFornNome] = useState('')
  const [fFornEmail, setFFornEmail] = useState('')
  const [fData, setFData]         = useState(new Date().toISOString().slice(0,10))
  const [fEntrega, setFEntrega]   = useState(new Date(Date.now()+45*86400000).toISOString().slice(0,10))
  const [fMoeda, setFMoeda]       = useState<Compra['moeda']>('CNY')
  const [fCambio, setFCambio]     = useState(0.77)
  const [fPagto, setFPagto]       = useState('Wire Transfer 30d')
  const [fObs, setFObs]           = useState('')
  const [fItens, setFItens]       = useState<ItemOC[]>([EMPTY_ITEM()])
  const [fornQ, setFornQ]         = useState('')
  const [showFornList, setShowFornList] = useState(false)
  const [prodQ, setProdQ]         = useState<Record<string,string>>({})
  const [showProdList, setShowProdList] = useState<Record<string,boolean>>({})
  const fornRef = useRef<HTMLDivElement>(null)

  const fornecedores: Fornecedor[] = loadData('fornecedores', SEED_FORNECEDORES)
  const produtos: ProdutoCat[]     = loadData('produtos', SEED_PRODUTOS)

  useEffect(() => { setCompras(loadData('compras', SEED_COMPRAS)) }, [])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (fornRef.current && !fornRef.current.contains(e.target as Node)) setShowFornList(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const saveCompras = (list: Compra[]) => { setCompras(list); saveData('compras', list) }

  const openCreate = () => {
    const n = `OC-${new Date().getFullYear()}-${String(compras.length + 1).padStart(3,'0')}`
    setEditing(null); setFNumero(n); setFFornId(''); setFFornNome(''); setFFornEmail('')
    setFData(new Date().toISOString().slice(0,10)); setFEntrega(new Date(Date.now()+45*86400000).toISOString().slice(0,10))
    setFMoeda('CNY'); setFCambio(0.77); setFPagto('Wire Transfer 30d'); setFObs('')
    setFItens([EMPTY_ITEM()]); setFornQ(''); setModal(true)
  }

  const openEdit = (c: Compra) => {
    setEditing(c); setFNumero(c.numero); setFFornId(c.fornecedor_id); setFFornNome(c.fornecedor); setFFornEmail(c.fornecedor_email)
    setFData(c.data); setFEntrega(c.previsao_entrega); setFMoeda(c.moeda); setFCambio(c.cambio)
    setFPagto(c.forma_pagamento); setFObs(c.observacoes); setFItens(c.itens.map(i=>({...i})))
    setFornQ(c.fornecedor); setModal(true)
  }

  const selectForn = (f: Fornecedor) => {
    setFFornId(f.id); setFFornNome(f.nome); setFFornEmail(f.email)
    setFMoeda(f.moeda as Compra['moeda'])
    setFCambio(f.moeda==='CNY'?0.77:f.moeda==='USD'?5.05:f.moeda==='EUR'?5.55:1)
    setFornQ(f.nome); setShowFornList(false)
  }

  const selectProd = (itemId: string, p: ProdutoCat) => {
    setFItens(prev => prev.map(i => i.id===itemId ? {...i, produto:p.nome, produto_id:p.id, ncm:p.ncm, unidade:p.unidade, preco_unitario:p.preco_custo} : i))
    setProdQ(prev => ({...prev, [itemId]: p.nome}))
    setShowProdList(prev => ({...prev, [itemId]: false}))
  }

  const updateItem = (id: string, field: keyof ItemOC, val: any) =>
    setFItens(prev => prev.map(i => i.id===id ? {...i, [field]: val} : i))

  const addItem = () => setFItens(prev => [...prev, EMPTY_ITEM()])
  const removeItem = (id: string) => setFItens(prev => prev.filter(i => i.id!==id))

  const totais = calcTotais(fItens)
  const valorBRL = (c: Compra) => c.moeda==='BRL' ? c.valor_total : c.valor_total * c.cambio

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fFornNome.trim()) { toast.error('Selecione um fornecedor'); return }
    if (fItens.some(i => !i.produto.trim())) { toast.error('Preencha todos os itens'); return }
    const { valor_itens, valor_ipi, valor_total } = calcTotais(fItens)
    const cat = fItens[0] ? (produtos.find(p=>p.id===fItens[0].produto_id)?.categoria || 'Outros') : 'Outros'
    const nova: Compra = {
      id: editing?.id || genId('cmp'), numero: fNumero,
      fornecedor_id: fFornId, fornecedor: fFornNome, fornecedor_email: fFornEmail,
      data: fData, previsao_entrega: fEntrega, categoria: cat,
      itens: fItens, valor_itens, valor_ipi, valor_total,
      status: editing?.status || 'solicitado',
      moeda: fMoeda, cambio: fCambio, forma_pagamento: fPagto, observacoes: fObs,
    }
    if (editing) saveCompras(compras.map(c => c.id===editing.id ? nova : c))
    else saveCompras([...compras, nova])
    setModal(false)
    toast.success(editing ? 'OC atualizada!' : 'OC criada com status Solicitado')
  }

  const submeterAprovacao = async (c: Compra) => {
    setEnviando(true)
    const atualizada = {...c, status: 'aguardando_aprovacao' as const}
    saveCompras(compras.map(x => x.id===c.id ? atualizada : x))
    if (detalhe?.id===c.id) setDetalhe(atualizada)
    // Envia e-mail para gestor via API
    try {
      await fetch('/api/aprovacao/notificar', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ tipo:'OC', numero:c.numero, valor:formatCurrency(valorBRL(c)), fornecedor:c.fornecedor }),
      })
    } catch {}
    toast.success('OC enviada para aprovação do Gestor!')
    setEnviando(false)
  }

  async function exportarPDF(c: Compra) {
    try {
      const { gerarPDFCompra } = await import('@/lib/pdf')
      gerarPDFCompra(c as any)
    } catch { toast.error('Erro ao gerar PDF') }
  }

  const filtered = compras.filter(c => !search ||
    c.numero.toLowerCase().includes(search.toLowerCase()) ||
    c.fornecedor.toLowerCase().includes(search.toLowerCase())
  )

  const fornFiltrados = fornecedores.filter(f => !fornQ || f.nome.toLowerCase().includes(fornQ.toLowerCase()))

  return (
    <div className="flex gap-5 h-full animate-fade-up">
      {/* Lista */}
      <div className={cn('flex flex-col space-y-4 transition-all', detalhe ? 'w-[55%]' : 'flex-1')}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Ordens de Compra</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {compras.filter(c=>c.status==='aguardando_aprovacao').length} aguardando aprovação ·{' '}
              {formatCurrency(compras.filter(c=>c.status!=='cancelado').reduce((s,c)=>s+(c.moeda==='BRL'?c.valor_total:c.valor_total*c.cambio),0))} total
            </p>
          </div>
          <button onClick={openCreate} className="btn-primary"><Plus size={16}/>Nova OC</button>
        </div>

        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Número ou fornecedor..." className="form-input pl-9 py-1.5"/>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex-1">
          <table className="data-table">
            <thead><tr>
              <th>Nº OC</th><th>Fornecedor</th><th>Itens</th><th>Moeda</th><th className="text-right">Valor BRL</th><th>Status</th><th></th>
            </tr></thead>
            <tbody>
              {filtered.length===0 && <tr><td colSpan={7} className="text-center text-slate-400 py-8">Nenhuma OC encontrada</td></tr>}
              {filtered.map(c => {
                const cfg = STATUS_CONFIG[c.status]
                const sel = detalhe?.id===c.id
                return (
                  <tr key={c.id}
                    className={cn('cursor-pointer transition-colors', sel?'bg-blue-50 border-l-2 border-l-blue-500':'hover:bg-slate-50/60')}
                    onClick={()=>{ setDetalhe(c) }}
                  >
                    <td className="font-mono text-xs font-semibold text-cyan-700">{c.numero}</td>
                    <td className="font-medium text-slate-800 max-w-[140px] truncate">{c.fornecedor}</td>
                    <td className="text-slate-500 text-xs">{c.itens.length} item{c.itens.length!==1?'s':''}</td>
                    <td><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{c.moeda}</span></td>
                    <td className="text-right font-semibold text-slate-800">{formatCurrency(valorBRL(c))}</td>
                    <td><span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',cfg.color)}>{cfg.icon}{cfg.label}</span></td>
                    <td onClick={e=>e.stopPropagation()}>
                      <div className="flex gap-1 justify-end">
                        <button onClick={()=>exportarPDF(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50" title="PDF"><Download size={14}/></button>
                        <button onClick={()=>openEdit(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50"><Pencil size={14}/></button>
                        <button onClick={()=>setDeleteId(c.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={14}/></button>
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
              <h2 className="font-bold text-white text-sm">{detalhe.fornecedor}</h2>
              <p className="text-slate-400 text-xs">{detalhe.forma_pagamento} · {detalhe.moeda}</p>
            </div>
            <button onClick={()=>setDetalhe(null)} className="text-slate-400 hover:text-white ml-3 flex-shrink-0"><X size={16}/></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Totais */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-slate-400 mb-0.5">Itens</p>
                <p className="font-bold text-slate-800">{formatCurrency(detalhe.valor_itens)}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-slate-400 mb-0.5">IPI</p>
                <p className="font-bold text-slate-800">{formatCurrency(detalhe.valor_ipi)}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-blue-500 mb-0.5">Total {detalhe.moeda==='BRL'?'BRL':'BRL equiv.'}</p>
                <p className="font-bold text-blue-700">{formatCurrency(valorBRL(detalhe))}</p>
              </div>
            </div>

            {/* Datas */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 flex items-center gap-1"><Calendar size={11}/>Data OC</p>
                <p className="text-sm font-medium text-slate-700 mt-0.5">{new Date(detalhe.data+'T12:00').toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 flex items-center gap-1"><Truck size={11}/>Prev. Entrega</p>
                <p className="text-sm font-medium text-slate-700 mt-0.5">{new Date(detalhe.previsao_entrega+'T12:00').toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            {/* Itens */}
            <div className="bg-slate-50 rounded-xl overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-200">
                <p className="text-xs font-semibold text-slate-500">ITENS DO PEDIDO</p>
              </div>
              {detalhe.itens.map((item,i) => (
                <div key={item.id} className={cn('px-3 py-2.5', i<detalhe.itens.length-1?'border-b border-slate-200':'')}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{item.produto}</p>
                      <p className="text-xs text-slate-400">{item.quantidade} {item.unidade} × {formatCurrency(item.preco_unitario)}</p>
                      {item.tem_ipi && <p className="text-xs text-amber-600">IPI {item.aliquota_ipi}% = {formatCurrency(item.quantidade*item.preco_unitario*item.aliquota_ipi/100)}</p>}
                    </div>
                    <p className="font-semibold text-slate-800 text-sm ml-3 flex-shrink-0">
                      {formatCurrency(item.quantidade*item.preco_unitario*(1+(item.tem_ipi?item.aliquota_ipi/100:0)))}
                    </p>
                  </div>
                </div>
              ))}
            </div>

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

            {/* Ações */}
            <div className="flex gap-2 pt-2">
              <button onClick={()=>openEdit(detalhe)} className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-sm text-slate-600 hover:bg-slate-50">
                <Pencil size={13}/>Editar
              </button>
              {detalhe.status==='solicitado' && (
                <button
                  onClick={()=>submeterAprovacao(detalhe)}
                  disabled={enviando}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-amber-500 text-white rounded-xl py-2 text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
                >
                  {enviando?<Loader2 size={13} className="animate-spin"/>:<Send size={13}/>}
                  Submeter aprovação
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar/Editar */}
      <Modal open={modal} onClose={()=>setModal(false)} title={editing?`Editar ${fNumero}`:'Nova Ordem de Compra'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cabeçalho */}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Nº da OC</label><input value={fNumero} onChange={e=>setFNumero(e.target.value)} className="form-input" required/></div>
            <div><label className="form-label">Moeda</label>
              <select value={fMoeda} onChange={e=>{setFMoeda(e.target.value as any); setFCambio(e.target.value==='CNY'?0.77:e.target.value==='USD'?5.05:e.target.value==='EUR'?5.55:1)}} className="form-input">
                <option value="CNY">CNY (Yuan)</option><option value="USD">USD (Dólar)</option>
                <option value="EUR">EUR (Euro)</option><option value="BRL">BRL (Real)</option>
              </select>
            </div>
          </div>

          {/* Fornecedor autocomplete */}
          <div ref={fornRef}>
            <label className="form-label">Fornecedor *</label>
            <div className="relative">
              <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
              <input value={fornQ} onChange={e=>{setFFornNome(e.target.value);setFornQ(e.target.value);setShowFornList(true)}} onFocus={()=>setShowFornList(true)}
                placeholder="Digite para buscar fornecedor..." className="form-input pl-8" required/>
              {showFornList && fornFiltrados.length>0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-100 z-50 max-h-48 overflow-y-auto">
                  {fornFiltrados.map(f=>(
                    <button key={f.id} type="button" onClick={()=>selectForn(f)}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                      <p className="text-xs font-semibold text-slate-800">{f.nome}</p>
                      <p className="text-[10px] text-slate-400">{f.categoria} · {f.moeda} · {f.prazo_entrega}d</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-3 gap-3">
            <div><label className="form-label">Data da OC</label><input type="date" value={fData} onChange={e=>setFData(e.target.value)} className="form-input"/></div>
            <div><label className="form-label">Prev. Entrega</label><input type="date" value={fEntrega} onChange={e=>setFEntrega(e.target.value)} className="form-input"/></div>
            <div><label className="form-label">Câmbio (R$)</label><input type="number" step="0.001" value={fCambio} onChange={e=>setFCambio(Number(e.target.value))} className="form-input" min="0.001"/></div>
          </div>

          {/* Condição de pagamento */}
          <div><label className="form-label">Condição de Pagamento</label>
            <select value={fPagto} onChange={e=>setFPagto(e.target.value)} className="form-input">
              {CONDICOES_PAGAMENTO.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Itens */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="form-label mb-0">Itens do Pedido</label>
              <button type="button" onClick={addItem} className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-medium"><Plus size={12}/>Adicionar item</button>
            </div>
            <div className="space-y-2">
              {fItens.map((item, idx) => {
                const prodsFilt = produtos.filter(p => !prodQ[item.id] || p.nome.toLowerCase().includes(prodQ[item.id].toLowerCase()))
                return (
                  <div key={item.id} className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono w-4">{idx+1}.</span>
                      {/* Produto autocomplete */}
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
                            {prodsFilt.slice(0,8).map(p=>(
                              <button key={p.id} type="button" onClick={()=>selectProd(item.id,p)}
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                                <p className="text-xs font-semibold text-slate-800">{p.nome}</p>
                                <p className="text-[10px] text-slate-400">{p.codigo} · NCM {p.ncm} · R$ {p.preco_custo}/{p.unidade}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {fItens.length>1 && <button type="button" onClick={()=>removeItem(item.id)} className="text-red-400 hover:text-red-600 flex-shrink-0"><X size={14}/></button>}
                    </div>
                    <div className="grid grid-cols-5 gap-2 ml-6">
                      <div><label className="text-[10px] text-slate-400">Qtd</label>
                        <input type="number" value={item.quantidade} min="0.001" step="0.001"
                          onChange={e=>updateItem(item.id,'quantidade',Number(e.target.value))}
                          className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-cyan-300 outline-none"/>
                      </div>
                      <div><label className="text-[10px] text-slate-400">Unidade</label>
                        <input value={item.unidade} onChange={e=>updateItem(item.id,'unidade',e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-cyan-300 outline-none"/>
                      </div>
                      <div><label className="text-[10px] text-slate-400">V. unitário ({fMoeda})</label>
                        <input type="number" value={item.preco_unitario} min="0" step="0.01"
                          onChange={e=>updateItem(item.id,'preco_unitario',Number(e.target.value))}
                          className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-cyan-300 outline-none"/>
                      </div>
                      <div><label className="text-[10px] text-slate-400">IPI %</label>
                        <div className="flex gap-1 items-center">
                          <input type="checkbox" checked={item.tem_ipi} onChange={e=>updateItem(item.id,'tem_ipi',e.target.checked)} className="w-3 h-3"/>
                          <input type="number" value={item.aliquota_ipi} min="0" step="0.1" disabled={!item.tem_ipi}
                            onChange={e=>updateItem(item.id,'aliquota_ipi',Number(e.target.value))}
                            className="flex-1 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-cyan-300 outline-none disabled:opacity-40"/>
                        </div>
                      </div>
                      <div><label className="text-[10px] text-slate-400">Subtotal</label>
                        <p className="text-xs font-semibold text-slate-700 py-1">
                          {formatCurrency(item.quantidade*item.preco_unitario*(1+(item.tem_ipi?item.aliquota_ipi/100:0)))}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Totais */}
          <div className="bg-slate-900 rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
            <div><p className="text-xs text-slate-400">Itens ({fMoeda})</p><p className="font-bold text-white">{formatCurrency(totais.valor_itens)}</p></div>
            <div><p className="text-xs text-slate-400">IPI</p><p className="font-bold text-amber-400">{formatCurrency(totais.valor_ipi)}</p></div>
            <div><p className="text-xs text-slate-400">Total BRL{fMoeda!=='BRL'?` (×${fCambio})`:''}</p>
              <p className="font-bold text-cyan-400">{formatCurrency(fMoeda==='BRL'?totais.valor_total:totais.valor_total*fCambio)}</p>
            </div>
          </div>

          <div><label className="form-label">Observações</label>
            <textarea value={fObs} onChange={e=>setFObs(e.target.value)} className="form-input" rows={2} placeholder="Informações adicionais..."/>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={()=>setModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary"><DollarSign size={16}/>{editing?'Salvar':'Criar OC'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={()=>setDeleteId(null)} title="Confirmar exclusão" size="sm">
        <p className="text-slate-600 mb-5">Excluir esta ordem de compra permanentemente?</p>
        <div className="flex gap-2 justify-end">
          <button onClick={()=>setDeleteId(null)} className="btn-secondary">Cancelar</button>
          <button onClick={()=>{saveCompras(compras.filter(c=>c.id!==deleteId));setDeleteId(null);if(detalhe?.id===deleteId)setDetalhe(null)}} className="btn-danger">Excluir</button>
        </div>
      </Modal>
    </div>
  )
}
