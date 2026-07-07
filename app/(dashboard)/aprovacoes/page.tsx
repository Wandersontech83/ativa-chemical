'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, cn } from '@/lib/utils'
import { CheckCircle, XCircle, Clock, ShoppingCart, Truck, MessageSquare, Loader2 } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { loadData, saveData } from '@/lib/storage'
import { SEED_FORNECEDORES } from '@/lib/seeds'
import { toast } from 'sonner'

interface ItemAprov {
  id: string
  tipo: 'OC' | 'PV'
  numero: string
  descricao: string // fornecedor ou cliente
  valor: number
  data: string
  solicitante: string
  observacoes?: string
}

export default function AprovacoesPage() {
  const [itens, setItens] = useState<ItemAprov[]>([])
  const [decision, setDecision] = useState<{item: ItemAprov; acao: 'aprovar'|'reprovar'}|null>(null)
  const [comentario, setComentario] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    // Seeds como fallback para garantir que dados apareçam mesmo sem visitar outras páginas
    const SEED_COMPRAS_DEFAULT = [
      { id:'cmp-001', numero:'OC-2026-001', fornecedor:'Hunan Chemical Co. Ltd', data:'2026-06-01', valor_total:56000, status:'recebido', observacoes:'' },
      { id:'cmp-002', numero:'OC-2026-002', fornecedor:'GZ Poly Materials', data:'2026-06-15', valor_total:51450, status:'aguardando_aprovacao', observacoes:'' },
      { id:'cmp-003', numero:'OC-2026-003', fornecedor:'Quimibras Ind. Ltda', data:'2026-07-01', valor_total:13500, status:'aprovado', observacoes:'' },
    ]
    const SEED_PEDIDOS_DEFAULT = [
      { id:'ped-001', numero:'PV-2026-001', cliente:'Nordeste Química Ltda', data:'2026-06-01', valor_total:3400, status:'entregue', observacoes:'' },
      { id:'ped-002', numero:'PV-2026-002', cliente:'IndTex Plásticos SA', data:'2026-06-10', valor_total:14900, status:'expedido', observacoes:'' },
      { id:'ped-003', numero:'PV-2026-003', cliente:'PetroSul Derivados', data:'2026-06-18', valor_total:5600, status:'confirmado', observacoes:'' },
      { id:'ped-004', numero:'PV-2026-004', cliente:'Fab Têxtil Nordeste', data:'2026-07-01', valor_total:4300, status:'pendente', observacoes:'' },
    ]
    const compras = loadData('compras', SEED_COMPRAS_DEFAULT) as any[]
    const pedidos = loadData('pedidos', SEED_PEDIDOS_DEFAULT) as any[]

    const ocs: ItemAprov[] = compras
      .filter((c:any) => c.status === 'aguardando_aprovacao')
      .map((c:any) => ({
        id: c.id, tipo: 'OC' as const, numero: c.numero,
        descricao: c.fornecedor, valor: c.valor_total,
        data: c.data, solicitante: c.solicitante || 'Comprador',
        observacoes: c.observacoes,
      }))

    const pvs: ItemAprov[] = pedidos
      .filter((p:any) => p.status === 'aguardando_aprovacao')
      .map((p:any) => ({
        id: p.id, tipo: 'PV' as const, numero: p.numero,
        descricao: p.cliente, valor: p.valor_total,
        data: p.data, solicitante: 'Vendedor',
        observacoes: p.observacoes,
      }))

    setItens([...ocs, ...pvs])
  }, [])

  const aprovar = async () => {
    if (!decision) return
    setSalvando(true)
    const { item, acao } = decision
    const novoStatus = acao === 'aprovar' ? 'confirmado' : 'reprovado'
    const aprovacao = { aprovador: 'Ana Rodrigues (Gestor)', data: new Date().toLocaleDateString('pt-BR'), comentario }

    if (item.tipo === 'OC') {
      const compras = loadData('compras', []) as any[]
      saveData('compras', compras.map((c:any) => c.id===item.id ? {...c, status: novoStatus, aprovacao} : c))
    } else {
      const pedidos = loadData('pedidos', []) as any[]
      saveData('pedidos', pedidos.map((p:any) => p.id===item.id ? {...p, status: novoStatus, aprovacao} : p))
    }

    // notificar solicitante (best-effort)
    try {
      await fetch('/api/aprovacao/notificar', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ tipo: item.tipo+'_resultado', numero: item.numero, acao, comentario }),
      })
    } catch {}

    setItens(prev => prev.filter(i => i.id !== item.id))
    setDecision(null)
    setComentario('')
    setSalvando(false)
    toast.success(acao==='aprovar' ? `${item.numero} aprovado!` : `${item.numero} reprovado.`)
  }

  const ocs = itens.filter(i => i.tipo === 'OC')
  const pvs = itens.filter(i => i.tipo === 'PV')

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Painel de Aprovações</h1>
        <p className="text-slate-500 text-sm mt-0.5">{itens.length} item{itens.length!==1?'s':''} aguardando sua decisão</p>
      </div>

      {itens.length === 0 && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-12 text-center">
          <CheckCircle className="text-emerald-400 mx-auto mb-3" size={40}/>
          <p className="text-emerald-700 font-medium">Tudo em dia!</p>
          <p className="text-emerald-500 text-sm">Nenhum documento aguardando aprovação.</p>
        </div>
      )}

      {ocs.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart size={16} className="text-blue-500"/>
            <h2 className="font-semibold text-slate-700">Ordens de Compra ({ocs.length})</h2>
          </div>
          <div className="grid gap-3">
            {ocs.map(item => <AprovCard key={item.id} item={item} onDecide={setDecision}/>)}
          </div>
        </section>
      )}

      {pvs.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Truck size={16} className="text-cyan-500"/>
            <h2 className="font-semibold text-slate-700">Pedidos de Venda ({pvs.length})</h2>
          </div>
          <div className="grid gap-3">
            {pvs.map(item => <AprovCard key={item.id} item={item} onDecide={setDecision}/>)}
          </div>
        </section>
      )}

      <Modal open={!!decision} onClose={()=>setDecision(null)} title={decision?.acao==='aprovar'?'Confirmar Aprovação':'Confirmar Reprovação'} size="sm">
        {decision && (
          <div className="space-y-4">
            <div className={cn('rounded-xl p-4 border', decision.acao==='aprovar'?'bg-emerald-50 border-emerald-100':'bg-red-50 border-red-100')}>
              <p className="text-sm font-semibold text-slate-800">{decision.item.numero}</p>
              <p className="text-xs text-slate-500">{decision.item.descricao} · {formatCurrency(decision.item.valor)}</p>
            </div>
            <div>
              <label className="form-label flex items-center gap-1"><MessageSquare size={12}/>Comentário (opcional)</label>
              <textarea value={comentario} onChange={e=>setComentario(e.target.value)} rows={3}
                className="form-input" placeholder="Motivo, condições, observações..."/>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={()=>setDecision(null)} className="btn-secondary">Cancelar</button>
              <button onClick={aprovar} disabled={salvando}
                className={cn('flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50', decision.acao==='aprovar'?'bg-emerald-500 hover:bg-emerald-600':'bg-red-500 hover:bg-red-600')}>
                {salvando?<Loader2 size={13} className="animate-spin"/>:decision.acao==='aprovar'?<CheckCircle size={13}/>:<XCircle size={13}/>}
                {salvando?'Salvando...':(decision.acao==='aprovar'?'Aprovar':'Reprovar')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function AprovCard({ item, onDecide }: { item: ItemAprov; onDecide: (d:{item:ItemAprov;acao:'aprovar'|'reprovar'})=>void }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
              <Clock size={10}/>Ag. Aprovação
            </span>
            <span className="font-mono text-xs text-slate-400">{item.numero}</span>
          </div>
          <p className="font-semibold text-slate-800 text-sm truncate">{item.descricao}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {item.tipo==='OC'?'Fornecedor':'Cliente'} · {new Date(item.data+'T12:00').toLocaleDateString('pt-BR')}
          </p>
          {item.observacoes && <p className="text-xs text-slate-500 mt-1 italic">"{item.observacoes}"</p>}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xl font-bold text-slate-800">{formatCurrency(item.valor)}</p>
          <div className="flex gap-2 mt-2">
            <button onClick={()=>onDecide({item,acao:'reprovar'})}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50">
              <XCircle size={12}/>Reprovar
            </button>
            <button onClick={()=>onDecide({item,acao:'aprovar'})}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600">
              <CheckCircle size={12}/>Aprovar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
