'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { formatCurrency, cn } from '@/lib/utils'
import {
  Plus, Search, Pencil, Trash2, ScrollText, AlertTriangle,
  CheckCircle, Clock, X, Paperclip, Upload, Download, FileText,
  Building2, Calendar, DollarSign, User, Copy,
  Package, PackagePlus, ChevronDown
} from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { loadData, saveData, genId } from '@/lib/storage'
import { SEED_FORNECEDORES, SEED_PRODUTOS } from '@/lib/seeds'

// ── Interfaces ───────────────────────────────────────────────────────────────

interface ItemContrato {
  id: string
  produto_id: string
  produto: string
  unidade: string
  quantidade: number
  preco_unitario: number
}

interface Contrato {
  id: string; numero: string; titulo: string; parte: string; parte_id?: string
  tipo: 'cliente' | 'fornecedor'
  tipo_servico: 'compra_ativa' | 'prestacao_servico' | 'contrato_fornecimento'
  inicio: string; fim: string; meses: number; valor_mensal: number
  status: 'aguardando_aprovacao' | 'ativo' | 'vencendo' | 'vencido' | 'suspenso'
  objeto: string
  itens?: ItemContrato[]
  responsavel: string
  vinculo?: string
}

interface Anexo {
  id: string; contrato_id: string; nome: string; tipo: string
  tamanho: number; data_upload: string; base64: string
  categoria: 'proposta' | 'minuta' | 'contrato_assinado' | 'aditivo' | 'outro'
}

interface Fornecedor { id: string; nome: string; cnpj?: string; cidade?: string; pais?: string }
interface Cliente    { id: string; nome: string; cnpj?: string; cpf?: string;  cidade?: string }
interface Produto    { id: string; codigo: string; nome: string; unidade: string; ncm?: string; preco_custo: number; preco_venda_sugerido: number }

// ── Seeds & constantes ───────────────────────────────────────────────────────

const SEED: Contrato[] = [
  { id: 'con-001', numero: 'CT-2026-001', titulo: 'Fornecimento Contínuo de Solventes', parte: 'Quimibras Ind. Ltda', parte_id: 'for-003', tipo: 'fornecedor', tipo_servico: 'compra_ativa', inicio: '2026-01-01', fim: '2027-01-01', meses: 12, valor_mensal: 45000, status: 'ativo', objeto: 'Fornecimento mensal de acetona e tolueno industrial', responsavel: 'Wanderson Lima' },
  { id: 'con-002', numero: 'CT-2026-002', titulo: 'Distribuição Exclusiva Nordeste', parte: 'Nordeste Química Ltda', tipo: 'cliente', tipo_servico: 'contrato_fornecimento', inicio: '2026-03-01', fim: '2027-03-01', meses: 12, valor_mensal: 120000, status: 'ativo', objeto: 'Distribuição exclusiva de produtos Ativa Chemical na região nordeste', responsavel: 'Wanderson Lima' },
  { id: 'con-003', numero: 'CT-2026-003', titulo: 'Importação Pigmentos China', parte: 'Hunan Chemical Co. Ltd', parte_id: 'for-001', tipo: 'fornecedor', tipo_servico: 'compra_ativa', inicio: '2026-06-01', fim: '2026-12-31', meses: 7, valor_mensal: 78000, status: 'vencendo', objeto: 'Importação de dióxido de titânio e pigmentos especiais', responsavel: 'Wanderson Lima' },
  { id: 'con-004', numero: 'CT-2025-008', titulo: 'Fornecimento Polímeros', parte: 'GZ Poly Materials', parte_id: 'for-002', tipo: 'fornecedor', tipo_servico: 'compra_ativa', inicio: '2025-09-01', fim: '2026-03-01', meses: 6, valor_mensal: 32000, status: 'vencido', objeto: 'Fornecimento de DOP e plastificantes', responsavel: 'Wanderson Lima' },
]

const EMPTY_ITEM = (): ItemContrato => ({ id: genId('ci'), produto_id: '', produto: '', unidade: 'kg', quantidade: 1, preco_unitario: 0 })

const EMPTY: Omit<Contrato,'id'> = {
  numero: '', titulo: '', parte: '', parte_id: '', tipo: 'fornecedor', tipo_servico: 'compra_ativa',
  inicio: new Date().toISOString().split('T')[0],
  fim: new Date(Date.now() + 365*86400000).toISOString().split('T')[0],
  meses: 12, valor_mensal: 0, status: 'aguardando_aprovacao', objeto: '', itens: [], responsavel: 'Wanderson Lima', vinculo: '',
}

const TIPO_SERVICO_CONFIG = {
  compra_ativa:         { label: 'Compra para Ativa',        color: 'bg-blue-100 text-blue-700' },
  prestacao_servico:    { label: 'Prestação de Serviço',     color: 'bg-purple-100 text-purple-700' },
  contrato_fornecimento:{ label: 'Contrato de Fornecimento', color: 'bg-teal-100 text-teal-700' },
}

const STATUS_CONFIG = {
  aguardando_aprovacao: { label: 'Ag. Aprovação', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: <Clock size={12}/> },
  ativo:    { label: 'Ativo',    color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle size={12}/> },
  vencendo: { label: 'Vencendo', color: 'bg-amber-100 text-amber-700 border-amber-200',       icon: <AlertTriangle size={12}/> },
  vencido:  { label: 'Vencido',  color: 'bg-red-100 text-red-700 border-red-200',             icon: <Clock size={12}/> },
  suspenso: { label: 'Suspenso', color: 'bg-slate-100 text-slate-600 border-slate-200',       icon: <Clock size={12}/> },
}

const CATEGORIAS_ANEXO: { value: Anexo['categoria']; label: string; cor: string }[] = [
  { value: 'proposta',          label: 'Proposta',          cor: 'bg-blue-100 text-blue-700' },
  { value: 'minuta',            label: 'Minuta',            cor: 'bg-purple-100 text-purple-700' },
  { value: 'contrato_assinado', label: 'Contrato Assinado', cor: 'bg-emerald-100 text-emerald-700' },
  { value: 'aditivo',           label: 'Aditivo',           cor: 'bg-amber-100 text-amber-700' },
  { value: 'outro',             label: 'Outro',             cor: 'bg-slate-100 text-slate-600' },
]

const fmtBytes = (b: number) => b > 1048576 ? `${(b/1048576).toFixed(1)} MB` : `${(b/1024).toFixed(0)} KB`
const fmtDate  = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')

const fixedBelow = (el: HTMLElement | null) => {
  if (!el) return { display: 'none' as const }
  const r = el.getBoundingClientRect()
  return { position: 'fixed' as const, top: r.bottom + 4, left: r.left, width: r.width, zIndex: 9999 }
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function ContratosPage() {
  const [contratos, setContratos]       = useState<Contrato[]>([])
  const [anexos, setAnexos]             = useState<Anexo[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [clientes, setClientes]         = useState<Cliente[]>([])
  const [produtos, setProdutos]         = useState<Produto[]>([])

  const [search, setSearch]             = useState('')
  const [modal, setModal]               = useState(false)
  const [editing, setEditing]           = useState<Contrato | null>(null)
  const [form, setForm]                 = useState<Omit<Contrato,'id'>>(EMPTY)
  const [formItens, setFormItens]       = useState<ItemContrato[]>([])
  const [deleteId, setDeleteId]         = useState<string|null>(null)
  const [detalhe, setDetalhe]           = useState<Contrato | null>(null)
  const [abaDetalhe, setAbaDetalhe]     = useState<'info' | 'itens' | 'anexos'>('info')
  const [categoriaAnexo, setCategoriaAnexo] = useState<Anexo['categoria']>('contrato_assinado')
  const [uploadando, setUploadando]     = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // autocomplete parte contratante
  const [parteQuery, setParteQuery]     = useState('')
  const [parteSugg, setParteSugg]       = useState<(Fornecedor | Cliente)[]>([])
  const [parteOpen, setParteOpen]       = useState(false)
  const parteInputRef = useRef<HTMLInputElement>(null)

  // autocomplete produto por item
  const [prodQueries, setProdQueries]   = useState<Record<string, string>>({})
  const [prodSuggOpen, setProdSuggOpen] = useState<string | null>(null)
  const prodInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    setContratos(loadData('contratos', SEED))
    setAnexos(loadData('contratos_anexos', []))
    setFornecedores(loadData('fornecedores', SEED_FORNECEDORES))
    setClientes(loadData('clientes', []))
    setProdutos(loadData('produtos', SEED_PRODUTOS))
  }, [])

  const saveContratos = (list: Contrato[]) => { setContratos(list); saveData('contratos', list) }
  const saveAnexos    = (list: Anexo[])    => { setAnexos(list);    saveData('contratos_anexos', list) }

  // ── Autocomplete de Parte ─────────────────────────────────────────────────
  const buscarPartes = (q: string, tipo: string) => {
    setParteQuery(q)
    setForm(prev => ({ ...prev, parte: q, parte_id: '' }))
    if (q.length < 1) { setParteSugg([]); setParteOpen(false); return }
    const lista: (Fornecedor | Cliente)[] = tipo === 'fornecedor' ? fornecedores : clientes
    const r = lista.filter(p => p.nome.toLowerCase().includes(q.toLowerCase())).slice(0, 8)
    setParteSugg(r)
    setParteOpen(r.length > 0)
  }

  const selecionarParte = (p: Fornecedor | Cliente) => {
    setForm(prev => ({ ...prev, parte: p.nome, parte_id: p.id }))
    setParteQuery(p.nome)
    setParteSugg([])
    setParteOpen(false)
  }

  // ── Itens do contrato ─────────────────────────────────────────────────────
  const addItem    = () => setFormItens(prev => [...prev, EMPTY_ITEM()])
  const removeItem = (id: string) => setFormItens(prev => prev.filter(i => i.id !== id))
  const updateItem = (id: string, field: keyof ItemContrato, value: string | number) =>
    setFormItens(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))

  const buscarProduto = (itemId: string, q: string) => {
    setProdQueries(prev => ({ ...prev, [itemId]: q }))
    updateItem(itemId, 'produto', q)
    updateItem(itemId, 'produto_id', '')
    setProdSuggOpen(q.length >= 1 ? itemId : null)
  }

  const selecionarProduto = (itemId: string, p: Produto) => {
    setFormItens(prev => prev.map(i => i.id === itemId
      ? { ...i, produto_id: p.id, produto: p.nome, unidade: p.unidade, preco_unitario: p.preco_custo }
      : i))
    setProdQueries(prev => ({ ...prev, [itemId]: p.nome }))
    setProdSuggOpen(null)
  }

  const prodSuggFor = (itemId: string) => {
    const q = prodQueries[itemId] ?? ''
    if (q.length < 1) return []
    return produtos.filter(p =>
      p.nome.toLowerCase().includes(q.toLowerCase()) ||
      p.codigo.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 8)
  }

  const valorTotalItens = formItens.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0)

  // ── CRUD contratos ────────────────────────────────────────────────────────
  const openCreate = () => {
    const nums = contratos.map(c => { const m = c.numero.match(/(\d+)$/); return m ? parseInt(m[1]) : 0 })
    const n = `CT-${new Date().getFullYear()}-${String(Math.max(0, ...nums) + 1).padStart(3,'0')}`
    setEditing(null); setForm({ ...EMPTY, numero: n }); setFormItens([]); setParteQuery(''); setModal(true)
  }

  const openEdit = (c: Contrato) => {
    setEditing(c); setForm({ ...c }); setFormItens(c.itens ? [...c.itens] : [])
    setParteQuery(c.parte); setModal(true)
  }

  const duplicar = (c: Contrato) => {
    const nums = contratos.map(x => { const m = x.numero.match(/(\d+)$/); return m ? parseInt(m[1]) : 0 })
    const n = `CT-${new Date().getFullYear()}-${String(Math.max(0, ...nums) + 1).padStart(3,'0')}`
    setEditing(null); setForm({ ...c, numero: n, status: 'ativo' })
    setFormItens(c.itens ? c.itens.map(i => ({ ...i, id: genId('ci') })) : [])
    setParteQuery(c.parte); setModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const contrato = { ...form, itens: formItens, status: 'aguardando_aprovacao' as const }
    if (editing) {
      const atualizado = { ...contrato, id: editing.id }
      saveContratos(contratos.map(c => c.id === editing.id ? atualizado : c))
      if (detalhe?.id === editing.id) setDetalhe(atualizado)
    } else {
      saveContratos([...contratos, { ...contrato, id: genId('con') }])
    }
    setModal(false)
  }

  const excluir = (id: string) => {
    saveContratos(contratos.filter(c => c.id !== id))
    saveAnexos(anexos.filter(a => a.contrato_id !== id))
    setDeleteId(null)
    if (detalhe?.id === id) setDetalhe(null)
  }

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))

  const diasRestantes = (fim: string) => Math.ceil((new Date(fim).getTime() - Date.now()) / 86400000)

  // ── Upload de Anexo ───────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !detalhe) return
    if (file.size > 5 * 1024 * 1024) { alert('Arquivo muito grande. Máximo: 5 MB.'); return }
    setUploadando(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string
      const novoAnexo: Anexo = {
        id: genId('anx'), contrato_id: detalhe.id,
        nome: file.name, tipo: file.type, tamanho: file.size,
        data_upload: new Date().toISOString().slice(0, 10),
        base64, categoria: categoriaAnexo,
      }
      saveAnexos([novoAnexo, ...anexos])
      setUploadando(false)
      if (fileRef.current) fileRef.current.value = ''
    }
    reader.readAsDataURL(file)
  }

  const downloadAnexo = (a: Anexo) => {
    const link = document.createElement('a')
    link.href = a.base64; link.download = a.nome; link.click()
  }

  const excluirAnexo = (id: string) => {
    if (!confirm('Remover este anexo?')) return
    saveAnexos(anexos.filter(a => a.id !== id))
  }

  const filtered = contratos.filter(c => !search ||
    c.numero.toLowerCase().includes(search.toLowerCase()) ||
    c.titulo.toLowerCase().includes(search.toLowerCase()) ||
    c.parte.toLowerCase().includes(search.toLowerCase())
  )

  const anexosContrato = detalhe ? anexos.filter(a => a.contrato_id === detalhe.id) : []
  const valorTotal = contratos.filter(c => c.status === 'ativo').reduce((s, c) => s + c.valor_mensal, 0)

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-5 h-full animate-fade-up">

      {/* Coluna principal */}
      <div className={cn('flex flex-col space-y-4 transition-all', detalhe ? 'w-[55%]' : 'flex-1')}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Contratos</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {contratos.filter(c=>c.status==='ativo').length} ativos · {contratos.filter(c=>c.status==='vencendo').length} vencendo · {formatCurrency(valorTotal)}/mês
            </p>
          </div>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16}/> Novo Contrato
          </button>
        </div>

        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Número, título ou parte..." className="form-input pl-9 py-1.5"/>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex-1">
          <table className="data-table">
            <thead><tr>
              <th>Nº Contrato</th><th>Título</th><th>Parte</th><th className="text-right">Valor/mês</th><th>Vencimento</th><th>Status</th><th></th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center text-slate-400 py-8">Nenhum contrato encontrado</td></tr>}
              {filtered.map(c => {
                const cfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.ativo
                const dias = diasRestantes(c.fim)
                const isSelected = detalhe?.id === c.id
                return (
                  <tr key={c.id}
                    className={cn('cursor-pointer transition-colors', isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-slate-50/60')}
                    onClick={() => { setDetalhe(c); setAbaDetalhe('info') }}
                  >
                    <td className="font-mono text-xs font-semibold text-cyan-700">{c.numero}</td>
                    <td className="font-medium text-slate-800 max-w-[180px] truncate">{c.titulo}</td>
                    <td className="text-slate-500 text-sm max-w-[120px] truncate">{c.parte}</td>
                    <td className="text-right font-semibold text-slate-800">{formatCurrency(c.valor_mensal)}</td>
                    <td>
                      <div>
                        <p className="text-sm text-slate-600">{fmtDate(c.fim)}</p>
                        {dias > 0 && dias <= 90 && <p className="text-xs text-amber-600">{dias}d restantes</p>}
                        {dias <= 0 && <p className="text-xs text-red-600">Vencido há {Math.abs(dias)}d</p>}
                      </div>
                    </td>
                    <td><span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border', cfg.color)}>{cfg.icon}{cfg.label}</span></td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => duplicar(c)} title="Duplicar" className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"><Copy size={14}/></button>
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
      </div>

      {/* Painel de Detalhe */}
      {detalhe && (
        <div className="w-[45%] flex-shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-slate-800 to-slate-700">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs text-cyan-400">{detalhe.numero}</span>
                <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border', (STATUS_CONFIG[detalhe.status] ?? STATUS_CONFIG.ativo).color)}>
                  {(STATUS_CONFIG[detalhe.status] ?? STATUS_CONFIG.ativo).icon}
                  {(STATUS_CONFIG[detalhe.status] ?? STATUS_CONFIG.ativo).label}
                </span>
              </div>
              <h2 className="font-bold text-white text-sm leading-tight">{detalhe.titulo}</h2>
              <p className="text-slate-400 text-xs mt-0.5">{detalhe.parte}</p>
            </div>
            <button onClick={() => setDetalhe(null)} className="text-slate-400 hover:text-white ml-3 flex-shrink-0"><X size={16}/></button>
          </div>

          {/* Abas */}
          <div className="flex border-b border-slate-100">
            {(['info', 'itens', 'anexos'] as const).map(aba => (
              <button key={aba} onClick={() => setAbaDetalhe(aba)}
                className={cn('flex-1 py-2.5 text-xs font-medium transition-colors flex items-center justify-center gap-1', abaDetalhe === aba ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-500 hover:text-slate-700')}
              >
                {aba === 'info'   && <><FileText size={12}/>Informações</>}
                {aba === 'itens'  && <><Package size={12}/>Itens {detalhe.itens && detalhe.itens.length > 0 && <span className="bg-blue-600 text-white rounded-full text-[10px] px-1 ml-0.5">{detalhe.itens.length}</span>}</>}
                {aba === 'anexos' && <><Paperclip size={12}/>Anexos {anexosContrato.length > 0 && <span className="bg-blue-600 text-white rounded-full text-[10px] px-1 ml-0.5">{anexosContrato.length}</span>}</>}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">

            {/* ABA: INFORMAÇÕES */}
            {abaDetalhe === 'info' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-1"><DollarSign size={11}/>Valor mensal</p>
                    <p className="font-bold text-slate-800 text-lg">{formatCurrency(detalhe.valor_mensal)}</p>
                    <p className="text-xs text-slate-400">Total: {formatCurrency(detalhe.valor_mensal * (detalhe.meses||12))} ({detalhe.meses||12}m)</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-1"><Calendar size={11}/>Vigência</p>
                    <p className="text-sm font-medium text-slate-700">{fmtDate(detalhe.inicio)}</p>
                    <p className="text-sm font-medium text-slate-700">até {fmtDate(detalhe.fim)}</p>
                    {(() => {
                      const d = diasRestantes(detalhe.fim)
                      return d > 0
                        ? <p className="text-xs text-amber-500 mt-0.5">{d} dias restantes</p>
                        : <p className="text-xs text-red-500 mt-0.5">Vencido há {Math.abs(d)} dias</p>
                    })()}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1"><Building2 size={12}/>Parte</span>
                    <span className="font-medium text-slate-700">{detalhe.parte}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Tipo</span>
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', detalhe.tipo === 'cliente' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700')}>
                      {detalhe.tipo}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Tipo Serviço</span>
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', TIPO_SERVICO_CONFIG[detalhe.tipo_servico]?.color || 'bg-slate-100 text-slate-600')}>
                      {TIPO_SERVICO_CONFIG[detalhe.tipo_servico]?.label || detalhe.tipo_servico}
                    </span>
                  </div>
                  {detalhe.vinculo && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Vínculo</span>
                      <span className="font-mono text-xs text-cyan-700 font-semibold">{detalhe.vinculo}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1"><User size={12}/>Responsável</span>
                    <span className="font-medium text-slate-700">{detalhe.responsavel}</span>
                  </div>
                </div>
                {detalhe.objeto && (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1">Objeto</p>
                    <p className="text-sm text-slate-700">{detalhe.objeto}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button onClick={() => openEdit(detalhe)} className="flex-1 flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-2 text-sm text-slate-600 hover:bg-slate-50">
                    <Pencil size={14}/> Editar
                  </button>
                  <button onClick={() => setAbaDetalhe('anexos')} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-blue-700">
                    <Paperclip size={14}/> Gerenciar Anexos
                  </button>
                </div>
              </div>
            )}

            {/* ABA: ITENS */}
            {abaDetalhe === 'itens' && (
              <div className="space-y-3">
                {(!detalhe.itens || detalhe.itens.length === 0)
                  ? <div className="text-center py-8 text-slate-400 text-sm">Nenhum item cadastrado.<br/>Edite o contrato para adicionar itens.</div>
                  : (
                    <div className="space-y-2">
                      {detalhe.itens.map((it, idx) => (
                        <div key={it.id} className="bg-slate-50 rounded-xl p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-400 mb-0.5">#{idx+1}</p>
                              <p className="font-medium text-slate-800 text-sm">{it.produto}</p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {it.quantidade} {it.unidade} × {formatCurrency(it.preco_unitario)}
                              </p>
                            </div>
                            <p className="font-bold text-slate-800 text-sm ml-3">{formatCurrency(it.quantidade * it.preco_unitario)}</p>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                        <span className="text-sm text-slate-500">Total dos itens</span>
                        <span className="font-bold text-slate-800">
                          {formatCurrency(detalhe.itens.reduce((s,i) => s + i.quantidade * i.preco_unitario, 0))}
                        </span>
                      </div>
                    </div>
                  )
                }
                <button onClick={() => openEdit(detalhe)} className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-300 rounded-xl py-2.5 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                  <PackagePlus size={14}/> Adicionar / Editar Itens
                </button>
              </div>
            )}

            {/* ABA: ANEXOS */}
            {abaDetalhe === 'anexos' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-blue-200 rounded-xl p-4 bg-blue-50/40">
                  <div className="text-center mb-3">
                    <Upload size={24} className="text-blue-400 mx-auto mb-1"/>
                    <p className="text-sm font-medium text-slate-700">Adicionar anexo</p>
                    <p className="text-xs text-slate-400">PDF, DOCX, XLSX — máx. 5 MB</p>
                  </div>
                  <div className="flex gap-2">
                    <select value={categoriaAnexo} onChange={e => setCategoriaAnexo(e.target.value as Anexo['categoria'])}
                      className="flex-1 text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white">
                      {CATEGORIAS_ANEXO.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                    </select>
                    <button onClick={() => fileRef.current?.click()} disabled={uploadando}
                      className="flex items-center gap-1.5 bg-blue-600 text-white rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                      <Paperclip size={13}/> {uploadando ? 'Enviando...' : 'Escolher arquivo'}
                    </button>
                  </div>
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg" className="hidden" onChange={handleFileUpload}/>
                </div>

                {anexosContrato.length === 0
                  ? <div className="text-center py-8 text-slate-400 text-sm">Nenhum anexo ainda. Faça upload acima.</div>
                  : (
                    <div className="space-y-2">
                      {anexosContrato.map(a => {
                        const cat = CATEGORIAS_ANEXO.find(c => c.value === a.categoria)
                        return (
                          <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <FileText size={18} className="text-blue-600"/>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-700 truncate">{a.nome}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {cat && <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', cat.cor)}>{cat.label}</span>}
                                <span className="text-xs text-slate-400">{fmtBytes(a.tamanho)} · {fmtDate(a.data_upload)}</span>
                              </div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button onClick={() => downloadAnexo(a)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50" title="Baixar"><Download size={14}/></button>
                              <button onClick={() => excluirAnexo(a.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50" title="Remover"><Trash2 size={14}/></button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                }
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal Criar/Editar ──────────────────────────────────────────────── */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? `Editar ${form.numero}` : 'Novo Contrato'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Linha 1: número, tipo, tipo serviço */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="form-label">Nº do Contrato <span className="text-xs text-slate-400 font-normal">(auto)</span></label>
              <input value={form.numero} readOnly className="form-input bg-slate-50 text-slate-500 cursor-not-allowed" required/>
            </div>
            <div>
              <label className="form-label">Tipo</label>
              <select value={form.tipo}
                onChange={e => {
                  const tipo = e.target.value as 'cliente'|'fornecedor'
                  setForm(prev => ({ ...prev, tipo, parte: '', parte_id: '' }))
                  setParteQuery('')
                  setParteSugg([])
                  setParteOpen(false)
                }}
                className="form-input">
                <option value="fornecedor">Fornecedor</option>
                <option value="cliente">Cliente</option>
              </select>
            </div>
            <div>
              <label className="form-label">Tipo de Serviço</label>
              <select value={form.tipo_servico} onChange={f('tipo_servico')} className="form-input">
                <option value="compra_ativa">Compra para Ativa</option>
                <option value="prestacao_servico">Prestação de Serviço</option>
                <option value="contrato_fornecimento">Contrato de Fornecimento</option>
              </select>
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="form-label">Título do Contrato</label>
            <input value={form.titulo} onChange={f('titulo')} className="form-input" required placeholder="Ex: Fornecimento Contínuo de Solventes"/>
          </div>

          {/* Parte Contratante — autocomplete catálogo */}
          <div>
            <label className="form-label">
              Parte Contratante — {form.tipo === 'fornecedor' ? 'Fornecedor' : 'Cliente'}
            </label>
            <div className="relative">
              <input
                ref={parteInputRef}
                value={parteQuery}
                onChange={e => buscarPartes(e.target.value, form.tipo)}
                onFocus={() => { if (parteQuery.length >= 1 && parteSugg.length > 0) setParteOpen(true) }}
                onBlur={() => setTimeout(() => setParteOpen(false), 150)}
                className="form-input pr-8"
                required
                autoComplete="off"
                placeholder={form.tipo === 'fornecedor' ? 'Digite para buscar fornecedor...' : 'Digite para buscar cliente...'}
              />
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
            </div>
            {parteOpen && parteSugg.length > 0 && typeof window !== 'undefined' && createPortal(
              <div
                className="bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto"
                style={fixedBelow(parteInputRef.current)}
              >
                {parteSugg.map(p => (
                  <button key={p.id} type="button" onMouseDown={() => selecionarParte(p)}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800">{p.nome}</span>
                    {'pais' in p
                      ? <span className="text-xs text-slate-400">{(p as Fornecedor).pais}</span>
                      : <span className="text-xs text-slate-400">{(p as Cliente).cnpj || (p as Cliente).cpf || ''}</span>
                    }
                  </button>
                ))}
              </div>,
              document.body
            )}
            {form.parte_id && <p className="text-xs text-emerald-600 mt-0.5">✓ Vinculado ao cadastro</p>}
          </div>

          {/* Vigência */}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Início da Vigência</label><input type="date" value={form.inicio} onChange={f('inicio')} className="form-input"/></div>
            <div><label className="form-label">Fim da Vigência</label><input type="date" value={form.fim} onChange={f('fim')} className="form-input"/></div>
          </div>

          {/* Valores */}
          <div className="grid grid-cols-3 gap-3">
            <div><label className="form-label">Valor Mensal (R$)</label><input type="number" step="0.01" value={form.valor_mensal} onChange={f('valor_mensal')} className="form-input" min="0"/></div>
            <div><label className="form-label">Meses</label><input type="number" value={form.meses} onChange={f('meses')} className="form-input" min="1"/></div>
            <div>
              <label className="form-label">Valor Total</label>
              <div className="form-input bg-slate-50 font-semibold text-slate-700">{formatCurrency((form.valor_mensal||0)*(form.meses||1))}</div>
            </div>
          </div>

          {/* Objeto (texto livre / resumo) */}
          <div>
            <label className="form-label">Objeto do Contrato (descrição resumida)</label>
            <textarea value={form.objeto} onChange={f('objeto')} className="form-input" rows={2} placeholder="Resumo do objeto contratual"/>
          </div>

          {/* ── Catálogo de Itens ─────────────────────────────────────────── */}
          <div className="border border-slate-200 rounded-xl overflow-visible">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200 rounded-t-xl">
              <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <Package size={14}/> Itens / Produtos do Contrato
              </span>
              <button type="button" onClick={addItem}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors">
                <Plus size={12}/> Adicionar item
              </button>
            </div>

            {formItens.length === 0
              ? (
                <div className="px-3 py-5 text-center text-slate-400 text-sm">
                  Nenhum item. Clique em "Adicionar item" para incluir produtos do catálogo.
                </div>
              )
              : (
                <div className="divide-y divide-slate-100">
                  {formItens.map((item, idx) => {
                    const suggs = prodSuggFor(item.id)
                    const pq = prodQueries[item.id] !== undefined ? prodQueries[item.id] : item.produto
                    return (
                      <div key={item.id} className="p-3 space-y-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-400 font-medium w-5">#{idx+1}</span>
                          <div className="flex-1">
                            <input
                              ref={el => { prodInputRefs.current[item.id] = el }}
                              value={pq}
                              onChange={e => buscarProduto(item.id, e.target.value)}
                              onFocus={() => { if (pq.length >= 1) setProdSuggOpen(item.id) }}
                              onBlur={() => setTimeout(() => setProdSuggOpen(null), 150)}
                              placeholder="Buscar produto no catálogo..."
                              className="form-input text-sm w-full"
                            />
                            {prodSuggOpen === item.id && suggs.length > 0 && typeof window !== 'undefined' && createPortal(
                              <div
                                className="bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto"
                                style={fixedBelow(prodInputRefs.current[item.id])}
                              >
                                {suggs.map(p => (
                                  <button key={p.id} type="button" onMouseDown={() => selecionarProduto(item.id, p)}
                                    className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm">
                                    <span className="font-medium text-slate-800">{p.nome}</span>
                                    <span className="text-xs text-slate-400 ml-2">{p.codigo} · {p.unidade} · {formatCurrency(p.preco_custo)}</span>
                                  </button>
                                ))}
                              </div>,
                              document.body
                            )}
                          </div>
                          <button type="button" onClick={() => removeItem(item.id)} className="p-1.5 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 ml-1"><X size={13}/></button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 pl-5">
                          <div>
                            <label className="text-xs text-slate-400">Unidade</label>
                            <input value={item.unidade} onChange={e => updateItem(item.id, 'unidade', e.target.value)} className="form-input text-sm"/>
                          </div>
                          <div>
                            <label className="text-xs text-slate-400">Quantidade</label>
                            <input type="number" min="0" step="0.001" value={item.quantidade}
                              onChange={e => updateItem(item.id, 'quantidade', Number(e.target.value))} className="form-input text-sm"/>
                          </div>
                          <div>
                            <label className="text-xs text-slate-400">Preço Unitário</label>
                            <input type="number" min="0" step="0.01" value={item.preco_unitario}
                              onChange={e => updateItem(item.id, 'preco_unitario', Number(e.target.value))} className="form-input text-sm"/>
                          </div>
                        </div>
                        <div className="text-right pr-1 text-xs font-semibold text-slate-700">
                          Subtotal: {formatCurrency(item.quantidade * item.preco_unitario)}
                        </div>
                      </div>
                    )
                  })}
                  <div className="px-3 py-2.5 bg-slate-50 rounded-b-xl flex justify-between items-center text-sm font-semibold text-slate-700">
                    <span>Total dos Itens</span>
                    <span>{formatCurrency(valorTotalItens)}</span>
                  </div>
                </div>
              )
            }
          </div>

          {/* Vínculo + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Vínculo (PV/OC/Proposta)</label><input value={form.vinculo||''} onChange={f('vinculo')} className="form-input" placeholder="Ex: PV-2026-001"/></div>
            <div>
              <label className="form-label">Status</label>
              <select value={form.status} onChange={f('status')} className="form-input">
                {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div><label className="form-label">Responsável</label><input value={form.responsavel} onChange={f('responsavel')} className="form-input"/></div>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary flex items-center gap-2"><ScrollText size={16}/>{editing ? 'Salvar' : 'Criar Contrato'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmar Exclusão */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar exclusão" size="sm">
        <p className="text-slate-600 mb-5">Excluir este contrato e todos os seus anexos permanentemente?</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancelar</button>
          <button onClick={() => deleteId && excluir(deleteId)} className="btn-danger flex items-center gap-1"><Trash2 size={14}/>Excluir</button>
        </div>
      </Modal>
    </div>
  )
}
