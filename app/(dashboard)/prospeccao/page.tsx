'use client'

import { useState } from 'react'
import { Search, Plus, X, ChevronRight, Target, Users, TrendingUp, AlertTriangle, Building2, Loader2 } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { PROSPECTS_SEED, CLIENTES_SEED } from '@/lib/clientes-seed'
import { loadData, saveData, genId } from '@/lib/storage'

type StatusProspect = 'novo' | 'contatado' | 'qualificado' | 'proposta' | 'convertido' | 'perdido'

const FUNIL: { key: StatusProspect; label: string; cor: string; bg: string }[] = [
  { key:'novo',       label:'Novos',       cor:'text-blue-700',   bg:'bg-blue-50 border-blue-200' },
  { key:'contatado',  label:'Contatado',   cor:'text-cyan-700',   bg:'bg-cyan-50 border-cyan-200' },
  { key:'qualificado',label:'Qualificado', cor:'text-violet-700', bg:'bg-violet-50 border-violet-200' },
  { key:'proposta',   label:'Proposta',    cor:'text-amber-700',  bg:'bg-amber-50 border-amber-200' },
  { key:'convertido', label:'Convertido',  cor:'text-emerald-700',bg:'bg-emerald-50 border-emerald-200' },
  { key:'perdido',    label:'Perdido',     cor:'text-red-700',    bg:'bg-red-50 border-red-200' },
]

export default function ProspeccaoPage() {
  const [prospects, setProspects] = useState(() => loadData('prospects', PROSPECTS_SEED))
  const [busca, setBusca] = useState('')
  const [cnpjBusca, setCnpjBusca] = useState('')
  const [loadingCnpj, setLoadingCnpj] = useState(false)
  const [cnpjResult, setCnpjResult] = useState<any>(null)
  const [cnpjError, setCnpjError] = useState('')
  const [aba, setAba] = useState<'kanban' | 'radar'>('kanban')
  const [dragging, setDragging] = useState<string | null>(null)

  const clientes = CLIENTES_SEED

  // Radar de oportunidades
  const semCompraRecente = clientes.filter(c => c.status === 'sem_compra')
  const inadimplentes = clientes.filter(c => c.status === 'inadimplente')
  const inativos = clientes.filter(c => c.status === 'inativo')

  async function buscarCNPJ() {
    const cnpj = cnpjBusca.replace(/\D/g, '')
    if (cnpj.length !== 14) return
    setLoadingCnpj(true); setCnpjError(''); setCnpjResult(null)
    try {
      const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`)
      if (!r.ok) throw new Error('CNPJ não encontrado')
      const data = await r.json()
      setCnpjResult(data)
    } catch (e: any) {
      setCnpjError(e.message || 'Erro ao buscar CNPJ')
    } finally { setLoadingCnpj(false) }
  }

  function importarComoProspect() {
    if (!cnpjResult) return
    const novo = {
      id: genId('pros'),
      nome: cnpjResult.razao_social || cnpjResult.nome_fantasia || 'Sem nome',
      cnpj: cnpjBusca,
      cidade: cnpjResult.municipio || '',
      uf: cnpjResult.uf || '',
      lat: -15.77 + (Math.random() - 0.5) * 20,
      lng: -47.93 + (Math.random() - 0.5) * 30,
      vendedor: 'Wanderson Lima',
      status: 'novo' as StatusProspect,
      segmento: cnpjResult.cnae_fiscal_descricao || 'A definir',
      produto_alvo: '',
      observacoes: `CNPJ importado via BrasilAPI · Porte: ${cnpjResult.porte || 'N/D'}`,
    }
    const atualizado = [novo, ...prospects]
    saveData('prospects', atualizado)
    setProspects(atualizado)
    setCnpjResult(null); setCnpjBusca('')
  }

  function moverProspect(id: string, novoStatus: StatusProspect) {
    const atualizado = prospects.map(p => p.id === id ? { ...p, status: novoStatus } : p)
    saveData('prospects', atualizado)
    setProspects(atualizado)
  }

  function removerProspect(id: string) {
    const atualizado = prospects.filter(p => p.id !== id)
    saveData('prospects', atualizado)
    setProspects(atualizado)
  }

  const prospectsFiltrados = prospects.filter(p =>
    !busca || p.nome.toLowerCase().includes(busca.toLowerCase()) || p.cidade.toLowerCase().includes(busca.toLowerCase())
  )

  const totalFunil = FUNIL.reduce((acc, f) => {
    acc[f.key] = prospectsFiltrados.filter(p => p.status === f.key).length
    return acc
  }, {} as Record<StatusProspect, number>)

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Prospecção de Mercado</h1>
          <p className="text-slate-500 text-sm mt-0.5">{prospects.length} prospects · Funil Kanban</p>
        </div>
        <div className="flex gap-2">
          {[{ k:'kanban', l:'Funil Kanban' }, { k:'radar', l:'Radar de Oportunidades' }].map(a => (
            <button key={a.k} onClick={() => setAba(a.k as any)}
              className={cn('px-4 py-2 rounded-xl text-sm font-semibold transition-colors', aba === a.k ? 'bg-cyan-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50')}>
              {a.l}
            </button>
          ))}
        </div>
      </div>

      {/* Busca CNPJ */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2"><Building2 size={16} className="text-cyan-500" /> Buscar empresa por CNPJ (BrasilAPI)</h3>
        <div className="flex gap-3">
          <input value={cnpjBusca} onChange={e => setCnpjBusca(e.target.value)} placeholder="00.000.000/0000-00"
            onKeyDown={e => e.key === 'Enter' && buscarCNPJ()}
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm" />
          <button onClick={buscarCNPJ} disabled={loadingCnpj}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#06b6d4,#2563eb)' }}>
            {loadingCnpj ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Buscar
          </button>
        </div>
        {cnpjError && <p className="text-xs text-red-600 mt-2">{cnpjError}</p>}
        {cnpjResult && (
          <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-slate-800">{cnpjResult.razao_social}</p>
                <p className="text-sm text-slate-600">{cnpjResult.nome_fantasia && `"${cnpjResult.nome_fantasia}" · `}{cnpjResult.municipio}/{cnpjResult.uf}</p>
                <p className="text-xs text-slate-500 mt-1">{cnpjResult.cnae_fiscal_descricao} · Porte: {cnpjResult.porte}</p>
                <p className="text-xs text-slate-400">Situação: {cnpjResult.descricao_situacao_cadastral}</p>
              </div>
              <button onClick={importarComoProspect} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1">
                <Plus size={12} /> Importar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ABA KANBAN */}
      {aba === 'kanban' && (
        <>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar prospect..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-white" />
          </div>

          <div className="grid grid-cols-6 gap-3" style={{ minHeight: 400 }}>
            {FUNIL.map(col => {
              const cards = prospectsFiltrados.filter(p => p.status === col.key)
              return (
                <div key={col.key} className={cn('rounded-2xl border p-3 flex flex-col gap-2', col.bg)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); if (dragging) moverProspect(dragging, col.key) }}>
                  <div className={cn('flex items-center justify-between mb-1')}>
                    <span className={cn('text-xs font-bold', col.cor)}>{col.label}</span>
                    <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded-full', col.cor, col.bg)}>{totalFunil[col.key]}</span>
                  </div>
                  {cards.map(p => (
                    <div key={p.id} draggable onDragStart={() => setDragging(p.id)} onDragEnd={() => setDragging(null)}
                      className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-xs font-semibold text-slate-800 leading-tight">{p.nome}</p>
                        <button onClick={() => removerProspect(p.id)} className="text-slate-300 hover:text-red-400 flex-shrink-0"><X size={10} /></button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{p.cidade}/{p.uf}</p>
                      {p.produto_alvo && <p className="text-[10px] text-cyan-600 mt-1 font-medium">{p.produto_alvo}</p>}
                      {p.observacoes && <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{p.observacoes}</p>}
                      <div className="mt-2 flex gap-1 flex-wrap">
                        {FUNIL.filter(f => f.key !== col.key && f.key !== 'perdido').slice(0, 2).map(f => (
                          <button key={f.key} onClick={() => moverProspect(p.id, f.key)}
                            className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-semibold border', f.bg, f.cor)}>
                            → {f.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {cards.length === 0 && <div className="text-[10px] text-slate-300 text-center py-4">Vazio</div>}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ABA RADAR */}
      {aba === 'radar' && (
        <div className="grid grid-cols-3 gap-5">
          {[
            { titulo:'Sem compra há +90 dias', lista: semCompraRecente, cor:'text-amber-700', bg:'bg-amber-50', icon:<AlertTriangle size={16} className="text-amber-500" />, acao:'Reativar' },
            { titulo:'Inadimplentes', lista: inadimplentes, cor:'text-red-700', bg:'bg-red-50', icon:<AlertTriangle size={16} className="text-red-500" />, acao:'Cobrar' },
            { titulo:'Clientes inativos', lista: inativos, cor:'text-slate-600', bg:'bg-slate-50', icon:<Users size={16} className="text-slate-400" />, acao:'Reativar' },
          ].map(grupo => (
            <div key={grupo.titulo} className={cn('rounded-2xl border p-5', grupo.bg, 'border-slate-200')}>
              <div className="flex items-center gap-2 mb-3">
                {grupo.icon}
                <h3 className={cn('text-sm font-semibold', grupo.cor)}>{grupo.titulo}</h3>
                <span className={cn('ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-white', grupo.cor)}>{grupo.lista.length}</span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {grupo.lista.map(c => (
                  <div key={c.id} className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                    <p className="text-xs font-semibold text-slate-800">{c.nome}</p>
                    <p className="text-[10px] text-slate-400">{c.cidade}/{c.uf} · {c.vendedor}</p>
                    {c.faturamento12m > 0 && <p className="text-[10px] font-medium text-slate-600 mt-0.5">Fat. 12M: {formatCurrency(c.faturamento12m)}</p>}
                    <button className={cn('mt-2 text-[10px] font-semibold px-2 py-1 rounded-lg text-white', grupo.cor === 'text-red-700' ? 'bg-red-500' : grupo.cor === 'text-amber-700' ? 'bg-amber-500' : 'bg-slate-500')}>
                      {grupo.acao} →
                    </button>
                  </div>
                ))}
                {grupo.lista.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Nenhum encontrado</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
