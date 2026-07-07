'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, cn } from '@/lib/utils'
import { Plus, Search, Pencil, Trash2, Ship, Package, CheckCircle, Clock, AlertTriangle, Copy } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { loadData, saveData, genId } from '@/lib/storage'

interface EtapaTimeline {
  label: string; data: string; status: 'concluido' | 'atual' | 'pendente'; obs?: string
}

interface Importacao {
  id: string; numero: string; fornecedor: string; pais: string; incoterm: string
  moeda: string; valor_fob: number; frete: number; seguro: number
  despachante: string; ncm: string; container: string; navio: string
  porto_origem: string; porto_destino: string; etd: string; eta: string
  status: 'pedido' | 'producao' | 'embarque' | 'transito' | 'chegada' | 'desembaraco' | 'transporte' | 'recebido' | 'cancelado'
  canal: 'verde' | 'amarelo' | 'vermelho' | 'pendente'
  observacoes: string; timeline: EtapaTimeline[]
}

const d = (days: number) => new Date(Date.now() + days * 86400000).toISOString().split('T')[0]

const makeTimeline = (status: Importacao['status']): EtapaTimeline[] => {
  const etapas = ['pedido','producao','embarque','transito','chegada','desembaraco','transporte','recebido']
  const idx = etapas.indexOf(status)
  return [
    { label: 'Pedido Internacional', data: d(-60), status: idx > 0 ? 'concluido' : idx === 0 ? 'atual' : 'pendente' },
    { label: 'Produção / Separação', data: d(-50), status: idx > 1 ? 'concluido' : idx === 1 ? 'atual' : 'pendente' },
    { label: 'Embarque', data: d(-40), status: idx > 2 ? 'concluido' : idx === 2 ? 'atual' : 'pendente' },
    { label: 'Em Trânsito (Navio)', data: d(-30), status: idx > 3 ? 'concluido' : idx === 3 ? 'atual' : 'pendente' },
    { label: 'Chegada ao Porto', data: d(-5), status: idx > 4 ? 'concluido' : idx === 4 ? 'atual' : 'pendente' },
    { label: 'Desembaraço Aduaneiro', data: d(0), status: idx > 5 ? 'concluido' : idx === 5 ? 'atual' : 'pendente' },
    { label: 'Transporte Nacional', data: d(5), status: idx > 6 ? 'concluido' : idx === 6 ? 'atual' : 'pendente' },
    { label: 'Recebido no Estoque', data: d(8), status: idx > 7 ? 'concluido' : idx === 7 ? 'atual' : 'pendente' },
  ]
}

const SEED: Importacao[] = [
  { id: 'imp-001', numero: 'IMP-2024-001', fornecedor: 'Hunan Chemical Co. Ltd', pais: 'China', incoterm: 'FOB', moeda: 'CNY', valor_fob: 72600, frete: 3200, seguro: 450, despachante: 'Despacho Alfa Ltda', ncm: '3206.11.10', container: 'MSCU7654321', navio: 'MSC AURORA', porto_origem: 'Guangzhou', porto_destino: 'Santos/SP', etd: d(-35), eta: d(-3), status: 'desembaraco', canal: 'verde', observacoes: 'Aguardando liberação canal verde', timeline: makeTimeline('desembaraco') },
  { id: 'imp-002', numero: 'IMP-2024-002', fornecedor: 'GZ Poly Materials', pais: 'China', incoterm: 'CIF', moeda: 'CNY', valor_fob: 37730, frete: 0, seguro: 0, despachante: 'Despacho Alfa Ltda', ncm: '2917.34.00', container: 'CMAU4123456', navio: 'CMA CGM MARCO POLO', porto_origem: 'Shanghai', porto_destino: 'Santos/SP', etd: d(-20), eta: d(18), status: 'transito', canal: 'pendente', observacoes: '', timeline: makeTimeline('transito') },
  { id: 'imp-003', numero: 'IMP-2024-003', fornecedor: 'SinoResin Chemical', pais: 'China', incoterm: 'FOB', moeda: 'USD', valor_fob: 18500, frete: 2800, seguro: 380, despachante: 'Trans Global Despacho', ncm: '3907.30.11', container: '', navio: '', porto_origem: 'Shanghai', porto_destino: 'Paranaguá/PR', etd: d(10), eta: d(55), status: 'pedido', canal: 'pendente', observacoes: 'Aguardando confirmação de produção', timeline: makeTimeline('pedido') },
]

const EMPTY: Omit<Importacao, 'id' | 'timeline'> = {
  numero: '', fornecedor: '', pais: 'China', incoterm: 'FOB', moeda: 'CNY',
  valor_fob: 0, frete: 0, seguro: 0, despachante: '', ncm: '', container: '',
  navio: '', porto_origem: '', porto_destino: 'Santos/SP', etd: d(15), eta: d(60),
  status: 'pedido', canal: 'pendente', observacoes: ''
}

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  pedido:      { label: 'Pedido Realizado',   color: 'bg-slate-100 text-slate-600' },
  producao:    { label: 'Em Produção',        color: 'bg-purple-100 text-purple-700' },
  embarque:    { label: 'Embarque',           color: 'bg-blue-100 text-blue-700' },
  transito:    { label: 'Em Trânsito',        color: 'bg-cyan-100 text-cyan-700' },
  chegada:     { label: 'Chegada ao Porto',   color: 'bg-amber-100 text-amber-700' },
  desembaraco: { label: 'Desembaraço',        color: 'bg-orange-100 text-orange-700' },
  transporte:  { label: 'Transporte',         color: 'bg-indigo-100 text-indigo-700' },
  recebido:    { label: 'Recebido',           color: 'bg-emerald-100 text-emerald-700' },
  cancelado:   { label: 'Cancelado',          color: 'bg-red-100 text-red-700' },
}

const CANAL_CFG: Record<string, { label: string; color: string }> = {
  pendente:  { label: 'Pendente',  color: 'bg-slate-100 text-slate-600' },
  verde:     { label: 'Verde',     color: 'bg-emerald-100 text-emerald-700' },
  amarelo:   { label: 'Amarelo',   color: 'bg-amber-100 text-amber-700' },
  vermelho:  { label: 'Vermelho',  color: 'bg-red-100 text-red-700' },
}

function Timeline({ timeline }: { timeline: EtapaTimeline[] }) {
  return (
    <div className="space-y-0">
      {timeline.map((etapa, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="flex flex-col items-center">
            <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10',
              etapa.status === 'concluido' ? 'bg-emerald-500' : etapa.status === 'atual' ? 'bg-cyan-500 ring-4 ring-cyan-100' : 'bg-slate-200'
            )}>
              {etapa.status === 'concluido' ? <CheckCircle size={14} className="text-white" /> :
               etapa.status === 'atual' ? <Clock size={14} className="text-white" /> :
               <div className="w-2 h-2 rounded-full bg-slate-400" />}
            </div>
            {i < timeline.length - 1 && (
              <div className={cn('w-0.5 h-8 mt-0.5', etapa.status === 'concluido' ? 'bg-emerald-300' : 'bg-slate-200')} />
            )}
          </div>
          <div className="pb-4 flex-1">
            <p className={cn('text-sm font-medium', etapa.status === 'atual' ? 'text-cyan-700' : etapa.status === 'concluido' ? 'text-slate-700' : 'text-slate-400')}>
              {etapa.label}
            </p>
            <p className="text-xs text-slate-400">{etapa.data ? new Date(etapa.data).toLocaleDateString('pt-BR') : '—'}</p>
            {etapa.obs && <p className="text-xs text-slate-500 mt-0.5 italic">{etapa.obs}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ImportacaoPage() {
  const [importacoes, setImportacoes] = useState<Importacao[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Importacao | null>(null)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Importacao | null>(null)
  const [form, setForm] = useState<Omit<Importacao, 'id' | 'timeline'>>(EMPTY)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => { setImportacoes(loadData('importacoes', SEED)) }, [])
  const save = (list: Importacao[]) => { setImportacoes(list); saveData('importacoes', list) }

  const openCreate = () => {
    const nums = importacoes.map(i => { const m = i.numero.match(/(\d+)$/); return m ? parseInt(m[1]) : 0 })
    const n = `IMP-${new Date().getFullYear()}-${String(Math.max(0, ...nums) + 1).padStart(3, '0')}`
    setEditing(null); setForm({ ...EMPTY, numero: n }); setModal(true)
  }
  const openEdit = (imp: Importacao) => { setEditing(imp); setForm({ ...imp }); setModal(true) }

  const duplicar = (imp: Importacao) => {
    const nums = importacoes.map(x => { const m = x.numero.match(/(\d+)$/); return m ? parseInt(m[1]) : 0 })
    const n = `IMP-${new Date().getFullYear()}-${String(Math.max(0, ...nums) + 1).padStart(3, '0')}`
    setEditing(null); setForm({ ...imp, numero: n, status: 'pedido' }); setModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const timeline = makeTimeline(form.status)
    if (editing) save(importacoes.map(i => i.id === editing.id ? { ...form, id: editing.id, timeline } : i))
    else save([...importacoes, { ...form, id: genId('imp'), timeline }])
    setModal(false)
  }

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))

  const filtered = importacoes.filter(i => !search || i.numero.toLowerCase().includes(search.toLowerCase()) || i.fornecedor.toLowerCase().includes(search.toLowerCase()))

  const emTransito = importacoes.filter(i => ['embarque', 'transito', 'chegada', 'desembaraco'].includes(i.status)).length
  const totalImportado = importacoes.reduce((s, i) => s + (i.valor_fob * (i.moeda === 'CNY' ? 0.77 : i.moeda === 'USD' ? 5.05 : 1) + i.frete + i.seguro), 0)

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Importações</h1>
          <p className="text-slate-500 text-sm mt-0.5">{emTransito} processo(s) em trânsito • {importacoes.length} total</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} />Novo Processo</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Em Trânsito', value: `${emTransito} processos`, icon: <Ship size={18} className="text-cyan-500" />, bg: 'bg-cyan-50' },
          { label: 'Total Importado (BRL)', value: formatCurrency(totalImportado), icon: <Package size={18} className="text-blue-500" />, bg: 'bg-blue-50' },
          { label: 'Em Desembaraço', value: `${importacoes.filter(i => i.status === 'desembaraco').length}`, icon: <AlertTriangle size={18} className="text-amber-500" />, bg: 'bg-amber-50' },
          { label: 'Recebidos', value: `${importacoes.filter(i => i.status === 'recebido').length}`, icon: <CheckCircle size={18} className="text-emerald-500" />, bg: 'bg-emerald-50' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', k.bg)}>{k.icon}</div>
            <div><p className="text-xs text-slate-500">{k.label}</p><p className="text-lg font-bold text-slate-800">{k.value}</p></div>
          </div>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Processo ou fornecedor..." className="form-input pl-9 py-1.5" />
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Lista */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="data-table">
            <thead><tr><th>Processo</th><th>Fornecedor</th><th>ETA</th><th>Status</th><th>Canal</th><th></th></tr></thead>
            <tbody>
              {filtered.map(imp => {
                const sc = STATUS_CFG[imp.status]
                const cc = CANAL_CFG[imp.canal]
                const atrasado = new Date(imp.eta) < new Date() && imp.status !== 'recebido'
                return (
                  <tr key={imp.id} className={cn(selected?.id === imp.id && 'bg-cyan-50/50', 'cursor-pointer')} onClick={() => setSelected(imp)}>
                    <td>
                      <p className="font-mono text-xs text-cyan-700">{imp.numero}</p>
                      <p className="text-xs text-slate-400">{imp.navio || '—'}</p>
                    </td>
                    <td className="font-medium text-slate-800 text-sm">{imp.fornecedor.split(' ').slice(0, 2).join(' ')}</td>
                    <td className={cn('text-sm', atrasado ? 'text-red-600 font-semibold' : 'text-slate-500')}>
                      {new Date(imp.eta).toLocaleDateString('pt-BR')}
                      {atrasado && <p className="text-xs">⚠ Atrasado</p>}
                    </td>
                    <td><span className={cn('text-xs font-semibold px-1.5 py-0.5 rounded-full', sc.color)}>{sc.label}</span></td>
                    <td><span className={cn('text-xs font-semibold px-1.5 py-0.5 rounded-full', cc.color)}>{cc.label}</span></td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={e => { e.stopPropagation(); duplicar(imp) }} title="Duplicar" className="p-1 rounded text-slate-400 hover:text-violet-600"><Copy size={13} /></button>
                        <button onClick={e => { e.stopPropagation(); openEdit(imp) }} className="p-1 rounded text-slate-400 hover:text-cyan-600"><Pencil size={13} /></button>
                        <button onClick={e => { e.stopPropagation(); setDeleteId(imp.id) }} className="p-1 rounded text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          {selected ? (
            <>
              <div className="mb-4">
                <h3 className="font-bold text-slate-800">{selected.numero}</h3>
                <p className="text-sm text-slate-500">{selected.fornecedor} — {selected.pais}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-slate-400">Container:</span> <span className="font-mono font-medium">{selected.container || '—'}</span></div>
                  <div><span className="text-slate-400">Navio:</span> <span className="font-medium">{selected.navio || '—'}</span></div>
                  <div><span className="text-slate-400">ETA:</span> <span className="font-medium">{new Date(selected.eta).toLocaleDateString('pt-BR')}</span></div>
                  <div><span className="text-slate-400">Valor FOB:</span> <span className="font-medium">{selected.moeda} {selected.valor_fob.toLocaleString()}</span></div>
                </div>
              </div>
              <hr className="border-slate-100 mb-4" />
              <Timeline timeline={selected.timeline} />
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              <div className="text-center">
                <Ship size={32} className="mx-auto mb-2 opacity-30" />
                <p>Selecione um processo para ver a timeline</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal form */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Processo' : 'Novo Processo de Importação'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div><label className="form-label">Nº do Processo <span className="text-xs text-slate-400 font-normal">(gerado automaticamente)</span></label><input value={form.numero} readOnly className="form-input bg-slate-50 text-slate-500 cursor-not-allowed" required /></div>
            <div><label className="form-label">Status</label>
              <select value={form.status} onChange={f('status')} className="form-input">
                {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div><label className="form-label">Canal</label>
              <select value={form.canal} onChange={f('canal')} className="form-input">
                {Object.entries(CANAL_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Fornecedor</label><input value={form.fornecedor} onChange={f('fornecedor')} className="form-input" required /></div>
            <div><label className="form-label">País</label><input value={form.pais} onChange={f('pais')} className="form-input" /></div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div><label className="form-label">Incoterm</label>
              <select value={form.incoterm} onChange={f('incoterm')} className="form-input">
                {['FOB','CIF','EXW','DDP','CFR'].map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div><label className="form-label">Moeda</label>
              <select value={form.moeda} onChange={f('moeda')} className="form-input">
                {['CNY','USD','EUR','BRL'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div><label className="form-label">Valor FOB</label><input type="number" value={form.valor_fob} onChange={f('valor_fob')} className="form-input" min="0" /></div>
            <div><label className="form-label">Frete (USD)</label><input type="number" value={form.frete} onChange={f('frete')} className="form-input" min="0" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="form-label">NCM</label><input value={form.ncm} onChange={f('ncm')} className="form-input" placeholder="0000.00.00" /></div>
            <div><label className="form-label">Container</label><input value={form.container} onChange={f('container')} className="form-input" /></div>
            <div><label className="form-label">Navio</label><input value={form.navio} onChange={f('navio')} className="form-input" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Porto Origem</label><input value={form.porto_origem} onChange={f('porto_origem')} className="form-input" /></div>
            <div><label className="form-label">Porto Destino</label><input value={form.porto_destino} onChange={f('porto_destino')} className="form-input" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">ETD (Embarque)</label><input type="date" value={form.etd} onChange={f('etd')} className="form-input" /></div>
            <div><label className="form-label">ETA (Chegada)</label><input type="date" value={form.eta} onChange={f('eta')} className="form-input" /></div>
          </div>
          <div><label className="form-label">Despachante</label><input value={form.despachante} onChange={f('despachante')} className="form-input" /></div>
          <div><label className="form-label">Observações</label><textarea value={form.observacoes} onChange={f('observacoes')} className="form-input" rows={2} /></div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary"><Ship size={16} />{editing ? 'Salvar' : 'Criar Processo'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar exclusão" size="sm">
        <p className="text-slate-600 mb-5">Excluir este processo de importação?</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancelar</button>
          <button onClick={() => { save(importacoes.filter(i => i.id !== deleteId)); setDeleteId(null) }} className="btn-danger">Excluir</button>
        </div>
      </Modal>
    </div>
  )
}
