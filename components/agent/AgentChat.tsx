'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Minimize2, Maximize2, Loader2, Sparkles, ChevronDown, CheckCircle2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { saveData, loadData, genId } from '@/lib/storage'
import { CLIENTES_SEED, VENDEDORES_SEED } from '@/lib/clientes-seed'
import { HISTORICO_CONSUMO, PRODUTOS_CATALOGO } from '@/lib/consultas-seed'
import { NEGOCIOS_SEED, TAREFAS_SEED } from '@/lib/negocios-seed'

// ─── tipos ───────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant'
  content: string
  acao?: AcaoExecutada
}

interface AcaoExecutada {
  tipo: string
  label: string
  numero?: string
  href?: string
}

interface PendingFlow {
  tipo: 'agendar_visita' | 'criar_negocio' | 'criar_lembrete' | 'criar_proposta'
  step: number
  data: Record<string, any>
}

type AgentMode = 'comercial' | 'financeiro' | 'compras' | 'estoque' | 'trade' | 'executivo'

// ─── configuração dos modos ───────────────────────────────────────────────────

const MODOS: { key: AgentMode; label: string; emoji: string; cor: string; desc: string }[] = [
  { key: 'comercial',  label: 'Comercial',   emoji: '🤝', cor: 'text-cyan-600',    desc: 'Propostas, pedidos e clientes' },
  { key: 'financeiro', label: 'Financeiro',  emoji: '💰', cor: 'text-emerald-600', desc: 'CR, CP e fluxo de caixa' },
  { key: 'compras',    label: 'Compras',     emoji: '📦', cor: 'text-blue-600',    desc: 'OC e fornecedores' },
  { key: 'estoque',    label: 'Estoque',     emoji: '🏭', cor: 'text-amber-600',   desc: 'Movimentações e saldo' },
  { key: 'trade',      label: 'Trade',       emoji: '🚢', cor: 'text-violet-600',  desc: 'Importações e câmbio' },
  { key: 'executivo',  label: 'Executivo',   emoji: '📊', cor: 'text-slate-700',   desc: 'KPIs e análise estratégica' },
]

const SUGESTOES_ACAO: Record<AgentMode, { label: string; msg: string }[]> = {
  comercial: [
    { label: '📅 Agendar visita',         msg: 'agendar visita' },
    { label: '📋 Criar proposta',          msg: 'criar proposta' },
    { label: '🛒 Criar pedido de venda',   msg: 'criar pedido de venda' },
    { label: '👥 Ver carteira de clientes',msg: 'quais clientes tenho?' },
    { label: '⚡ Recompras desta semana',  msg: 'recompras previstas essa semana' },
    { label: '🗺️ Abrir mapa de clientes',  msg: 'abrir mapa' },
  ],
  financeiro: [
    { label: '📊 Saldo a receber',         msg: 'qual o saldo de contas a receber?' },
    { label: '⚠️ Ver inadimplentes',       msg: 'quem está inadimplente?' },
    { label: '💵 Fluxo de caixa',          msg: 'projeção de caixa' },
  ],
  compras: [
    { label: '📦 Criar ordem de compra',   msg: 'criar ordem de compra' },
    { label: '📋 OC pendentes',            msg: 'ordens de compra pendentes' },
    { label: '🏭 Ver fornecedores',        msg: 'abrir fornecedores' },
  ],
  estoque: [
    { label: '📥 Registrar entrada',       msg: 'registrar entrada de estoque' },
    { label: '⚠️ Produtos em ruptura',     msg: 'quais produtos estão no mínimo?' },
    { label: '📦 Saldo atual',             msg: 'saldo atual do estoque' },
  ],
  trade: [
    { label: '🚢 Status importações',      msg: 'status das importações em trânsito' },
    { label: '💱 Câmbio CNY hoje',         msg: 'análise do câmbio CNY hoje' },
    { label: '📄 Nova importação',         msg: 'criar nova importação' },
  ],
  executivo: [
    { label: '📊 Resumo executivo',        msg: 'resumo executivo do mês' },
    { label: '⚠️ Principais riscos',       msg: 'quais os principais riscos?' },
    { label: '🎯 Faturamento vs meta',     msg: 'faturamento vs meta 2026' },
  ],
}

// ─── system prompts da API ───────────────────────────────────────────────────

const SYSTEM_PROMPTS: Record<AgentMode, string> = {
  comercial: `Você é o Agente Comercial da Ativa Chemical. Execute ações reais e responda de forma direta e objetiva.

Quando criar documentos, retorne JSON em tag <action>:
- Proposta: <action>{"type":"criar_proposta","data":{"cliente":"","itens":[{"produto":"","quantidade":0,"preco_unitario":0}],"validade_dias":14}}</action>
- Pedido: <action>{"type":"criar_pedido","data":{"cliente":"","itens":[{"produto":"","quantidade":0,"preco_unitario":0}],"forma_pagamento":"30 dias","prazo_dias":15}}</action>

Produtos: Acetona 99,5% (R$6,80/kg), Tolueno (R$7,90/kg), Resina Epóxi (R$28,00/kg), Dióxido de Titânio (R$43,00/kg), DOP (R$14,90/kg), Acetato de Etila (R$9,20/kg).
NUNCA responda com "Como posso ajudar?" — execute a ação solicitada diretamente.`,

  financeiro: `Você é o Agente Financeiro da Ativa Chemical. Dados: CR R$328k (1 vencido: Fab Têxtil R$43k), CP R$120.850, Caixa R$394.530, Inadimplência 4,5%, Margem 40%, EBITDA R$580k. Responda diretamente.`,

  compras: `Você é o Agente de Compras da Ativa Chemical. OC: <action>{"type":"criar_oc","data":{"fornecedor":"","categoria":"","descricao":"","valor_total":0,"moeda":"CNY","prazo_dias":45}}</action>. Fornecedores: Hunan Chemical (CNY/45d), GZ Poly (CNY/40d), Quimibras (BRL/7d), SinoResin (USD/50d). Câmbio: CNY=R$0,720, USD=R$5,167.`,

  estoque: `Você é o Agente de Estoque da Ativa Chemical. Saldos: Acetona 1250kg ✅, Tolueno 890kg ✅, Resina Epóxi 340kg ✅, TiO2 480kg ✅, DOP 1100kg ✅, Acetato de Etila 95kg ⚠️ CRÍTICO. Movimentação: <action>{"type":"movimentacao","data":{"produto":"","tipo":"entrada","quantidade":0,"documento":""}}</action>`,

  trade: `Você é o Agente Trade da Ativa Chemical. Processos: IMP-2024-001 (Hunan, canal verde, atrasado 3d), IMP-2024-002 (GZ Poly, trânsito, ETA 18/07), IMP-2024-003 (SinoResin, pedido, ETA 25/08). Câmbio: CNY=R$0,720, USD=R$5,167.`,

  executivo: `Você é o Agente Executivo da Ativa Chemical. KPIs 2026: Fat. R$3,2M (+12,4%), Lucro R$1,1M, Margem 40%, EBITDA R$580k, Inadimplência 4,5%. Riscos: contrato Hunan vencendo, Acetato crítico, Fab Têxtil inadimplente. Forneça análises estratégicas.`,
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmt = (v: number) => 'R$ ' + v.toLocaleString('pt-BR')
const hoje = () => new Date().toISOString().slice(0, 10)
const daqui = (dias: number) => new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10)

function parseAction(text: string): { clean: string; action: any | null } {
  const match = text.match(/<action>([\s\S]*?)<\/action>/)
  if (!match) return { clean: text, action: null }
  try { return { clean: text.replace(/<action>[\s\S]*?<\/action>/, '').trim(), action: JSON.parse(match[1]) } }
  catch { return { clean: text, action: null } }
}

function executeAction(action: any): string {
  const now = new Date()
  const ds = hoje()
  if (action.type === 'criar_proposta') {
    const list = loadData<any>('propostas', [])
    const numero = `PROP-${now.getFullYear()}-${String(list.length + 1).padStart(3, '0')}`
    saveData('propostas', [{ id: genId('prop'), numero, cliente: action.data.cliente, data: ds, validade: daqui(action.data.validade_dias || 14), status: 'rascunho', itens: action.data.itens, observacoes: action.data.observacoes || '', responsavel: 'Wanderson Lima' }, ...list])
    return numero
  }
  if (action.type === 'criar_pedido') {
    const list = loadData<any>('pedidos', [])
    const numero = `PV-${now.getFullYear()}-${String(list.length + 1).padStart(3, '0')}`
    saveData('pedidos', [{ id: genId('ped'), numero, cliente: action.data.cliente, data: ds, prazo_entrega: daqui(action.data.prazo_dias || 15), status: 'pendente', itens: action.data.itens, forma_pagamento: action.data.forma_pagamento || '30 dias', observacoes: '' }, ...list])
    return numero
  }
  if (action.type === 'criar_oc') {
    const list = loadData<any>('compras', [])
    const numero = `OC-${now.getFullYear()}-${String(list.length + 1).padStart(3, '0')}`
    saveData('compras', [{ id: genId('cmp'), numero, fornecedor: action.data.fornecedor, data: ds, previsao_entrega: daqui(action.data.prazo_dias || 45), categoria: action.data.categoria, descricao: action.data.descricao, valor_total: action.data.valor_total, status: 'solicitado', moeda: action.data.moeda || 'CNY', cambio: action.data.cambio || 0.72, forma_pagamento: 'Wire Transfer 30d' }, ...list])
    return numero
  }
  if (action.type === 'movimentacao') {
    const movs = loadData<any>('estoque_movimentos', [])
    const produtos = loadData<any>('estoque_produtos', [])
    saveData('estoque_movimentos', [{ id: genId('mov'), data: ds, produto: action.data.produto, tipo: action.data.tipo, quantidade: action.data.quantidade, unidade: 'kg', documento: action.data.documento || '', observacao: action.data.observacao || '' }, ...movs])
    const delta = action.data.tipo === 'entrada' ? action.data.quantidade : -action.data.quantidade
    saveData('estoque_produtos', produtos.map((p: any) => p.nome === action.data.produto ? { ...p, estoque_atual: Math.max(0, p.estoque_atual + delta) } : p))
    return `MOV-${Date.now()}`
  }
  return ''
}

// ─── renderização de markdown ─────────────────────────────────────────────────

function renderMd(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('|')) {
      const cols = line.split('|').filter(c => c.trim() !== '')
      if (cols.every(c => /^[-: ]+$/.test(c))) return null
      return (
        <div key={i} className="flex gap-1 text-xs">
          {cols.map((c, j) => (
            <span key={j} className="flex-1 px-1 py-0.5 bg-white/20 rounded truncate" dangerouslySetInnerHTML={{ __html: c.trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          ))}
        </div>
      )
    }
    if (!line.trim()) return <div key={i} className="h-1" />
    if (line.startsWith('- ') || line.startsWith('• ')) {
      const content = line.replace(/^[-•] /, '')
      return <div key={i} className="flex gap-1.5 text-sm"><span className="opacity-60 flex-shrink-0">•</span><span dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} /></div>
    }
    if (/^\d+\. /.test(line)) {
      const [num, ...rest] = line.split('. ')
      return <div key={i} className="flex gap-1.5 text-sm"><span className="opacity-60 flex-shrink-0 font-bold">{num}.</span><span dangerouslySetInnerHTML={{ __html: rest.join('. ').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} /></div>
    }
    return <p key={i} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
  }).filter(Boolean)
}

function Bubble({ msg }: { msg: Message }) {
  const { clean, action } = parseAction(msg.content)
  const docNum = action ? executeAction(action) : null
  const isUser = msg.role === 'user'
  return (
    <div className={cn('flex gap-2 items-start', isUser && 'flex-row-reverse')}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot size={13} className="text-white" />
        </div>
      )}
      <div className={cn('max-w-[85%] min-w-0 space-y-1.5', isUser && 'items-end flex flex-col')}>
        <div className={cn('rounded-2xl px-3.5 py-2.5 space-y-0.5 break-words', isUser ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-tr-sm' : 'bg-slate-100 text-slate-800 rounded-tl-sm')}>
          {isUser ? <p className="text-sm leading-relaxed">{clean || msg.content}</p> : renderMd(clean || msg.content)}
        </div>
        {/* Ação executada pela API */}
        {action && docNum && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs">
            <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />
            <span className="text-emerald-800 font-semibold">
              {action.type === 'criar_proposta' ? 'Proposta' : action.type === 'criar_pedido' ? 'Pedido' : action.type === 'criar_oc' ? 'OC' : 'Movimentação'} criado: <strong>{docNum}</strong>
            </span>
          </div>
        )}
        {/* Ação executada localmente */}
        {msg.acao && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs">
            <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />
            <span className="text-emerald-800 font-semibold">{msg.acao.label}</span>
            {msg.acao.numero && <span className="font-bold text-emerald-700">· {msg.acao.numero}</span>}
            {msg.acao.href && (
              <a href={msg.acao.href} className="ml-auto flex items-center gap-0.5 text-blue-600 hover:underline">
                Abrir <ExternalLink size={10} />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── componente principal ─────────────────────────────────────────────────────

export default function AgentChat() {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [modo, setModo] = useState<AgentMode>('comercial')
  const [showModos, setShowModos] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Olá, Wanderson! 👋 Sou o **NEXUS Agent**. Posso executar ações diretamente — agendar visitas, criar pedidos, propostas, lembretes e muito mais. O que fazemos agora?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingFlow, setPendingFlow] = useState<PendingFlow | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && !minimized) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [messages, open, minimized])

  const modoAtual = MODOS.find(m => m.key === modo)!

  // ── detecção de intenção ────────────────────────────────────────────────────

  function detectarIntencao(q: string): string {
    const t = q.toLowerCase()
    if (/agendar\s*(visita|reunião|encontro)/.test(t) || t.includes('marcar visita')) return 'agendar_visita'
    if (/criar\s*proposta|nova\s*proposta|proposta\s*para/.test(t)) return 'criar_proposta'
    if (/criar\s*pedido|novo\s*pedido|pedido\s*de\s*venda|emitir\s*pedido/.test(t)) return 'criar_pedido'
    if (/criar?\s*lembrete|lembrar\s*de|criar\s*tarefa|follow.?up/.test(t)) return 'criar_lembrete'
    if (/criar?\s*negócio|novo\s*negócio|abrir\s*negócio/.test(t)) return 'criar_negocio'
    if (/abrir\s*mapa|ver\s*mapa|mapa\s*de\s*clientes/.test(t)) return 'nav_mapa'
    if (/abrir\s*agenda|ver\s*agenda/.test(t)) return 'nav_agenda'
    if (/pipeline|negócios|kanban/.test(t)) return 'nav_negocios'
    if (/meu\s*dia|hub|roteiro\s*de\s*hoje/.test(t)) return 'nav_meudia'
    if (/cadastrar?\s*cliente|novo\s*cliente|criar?\s*cliente/.test(t)) return 'nav_clientes'
    if (/abrir\s*fornecedores?|ver\s*fornecedores?/.test(t)) return 'nav_fornecedores'
    if (/ordem\s*de\s*compra|criar\s*oc|nova\s*oc/.test(t)) return 'criar_oc'
    return ''
  }

  // ── processador de fluxo multi-passo ───────────────────────────────────────

  function continuarFluxo(flow: PendingFlow, resposta: string): { msg: string; acao?: AcaoExecutada; proximoFlow?: PendingFlow | null } {
    const t = resposta.toLowerCase().trim()

    if (flow.tipo === 'agendar_visita') {
      if (flow.step === 1) {
        // step 1: user informou o cliente
        const clientes = loadData('clientes_geo', CLIENTES_SEED)
        const match = clientes.find((c: any) => c.nome.toLowerCase().includes(t) || t.includes(c.nome.toLowerCase().split(' ')[0].toLowerCase()))
        if (!match) return { msg: `Não encontrei esse cliente. Temos: ${clientes.slice(0, 5).map((c: any) => c.nome).join(', ')}. Qual deles?`, proximoFlow: flow }
        return {
          msg: `✅ **${match.nome}** selecionado. Para qual **data** é a visita? (ex: "amanhã", "10/07", "sexta")`,
          proximoFlow: { ...flow, step: 2, data: { ...flow.data, cliente: match } }
        }
      }
      if (flow.step === 2) {
        // step 2: user informou a data
        let data = hoje()
        if (t.includes('amanhã') || t.includes('amanha')) data = daqui(1)
        else if (t.includes('segunda')) { const d = new Date(); d.setDate(d.getDate() + (1 + 7 - d.getDay()) % 7); data = d.toISOString().slice(0, 10) }
        else if (t.includes('terça') || t.includes('terca')) { const d = new Date(); d.setDate(d.getDate() + (2 + 7 - d.getDay()) % 7); data = d.toISOString().slice(0, 10) }
        else if (t.includes('quarta')) { const d = new Date(); d.setDate(d.getDate() + (3 + 7 - d.getDay()) % 7); data = d.toISOString().slice(0, 10) }
        else if (t.includes('quinta')) { const d = new Date(); d.setDate(d.getDate() + (4 + 7 - d.getDay()) % 7); data = d.toISOString().slice(0, 10) }
        else if (t.includes('sexta')) { const d = new Date(); d.setDate(d.getDate() + (5 + 7 - d.getDay()) % 7); data = d.toISOString().slice(0, 10) }
        else { const m = t.match(/(\d{1,2})[\/\-](\d{1,2})/); if (m) data = `2026-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}` }
        return {
          msg: `Ótimo! Qual **horário** para a visita? (ex: "09:00", "14h30") — ou diga "padrão" para 09:00`,
          proximoFlow: { ...flow, step: 3, data: { ...flow.data, data } }
        }
      }
      if (flow.step === 3) {
        // step 3: user informou horário → criar visita
        let hora = '09:00'
        const m = t.match(/(\d{1,2})[h:](\d{0,2})/)
        if (m) hora = `${m[1].padStart(2,'0')}:${(m[2] || '00').padStart(2,'0')}`
        const cli = flow.data.cliente
        const visita = {
          id: genId('vis'), cliente_id: cli.id, cliente_nome: cli.nome,
          cliente_cidade: cli.cidade, cliente_uf: cli.uf,
          data: flow.data.data, hora, vendedor: 'Wanderson Lima',
          objetivo: 'Visita comercial', observacoes: '', status: 'agendada', lembrete: true,
        }
        const lista = loadData('agenda_visitas', [])
        saveData('agenda_visitas', [visita, ...lista])
        return {
          msg: `✅ **Visita agendada!**\n\n• **Cliente:** ${cli.nome}\n• **Data:** ${new Date(flow.data.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}\n• **Hora:** ${hora}\n• **Local:** ${cli.cidade}/${cli.uf}\n\nA visita aparece na sua Agenda de Visitas.`,
          acao: { tipo: 'visita', label: 'Visita agendada', numero: visita.id, href: '/agenda' },
          proximoFlow: null,
        }
      }
    }

    if (flow.tipo === 'criar_lembrete') {
      if (flow.step === 1) {
        // step 1: user informou o que lembrar
        return {
          msg: `Para **quando** é o lembrete? (ex: "amanhã", "segunda", "10/07")`,
          proximoFlow: { ...flow, step: 2, data: { ...flow.data, descricao: resposta } }
        }
      }
      if (flow.step === 2) {
        // step 2: criar tarefa
        let data = daqui(1)
        if (t.includes('amanhã') || t.includes('amanha')) data = daqui(1)
        else if (t.includes('hoje')) data = hoje()
        else { const m = t.match(/(\d{1,2})[\/\-](\d{1,2})/); if (m) data = `2026-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}` }
        const tarefa = {
          id: genId('trf'), negocio_id: '', descricao: flow.data.descricao,
          data_venc: data, responsavel: 'Wanderson Lima', concluida: false,
        }
        const lista = loadData('tarefas_followup', TAREFAS_SEED)
        saveData('tarefas_followup', [tarefa, ...lista])
        return {
          msg: `✅ **Lembrete criado!**\n\n• **O quê:** ${flow.data.descricao}\n• **Quando:** ${new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}\n\nAparece no seu **Meu Dia** como follow-up.`,
          acao: { tipo: 'lembrete', label: 'Lembrete criado', href: '/meu-dia' },
          proximoFlow: null,
        }
      }
    }

    if (flow.tipo === 'criar_negocio') {
      if (flow.step === 1) {
        const clientes = loadData('clientes_geo', CLIENTES_SEED)
        const match = clientes.find((c: any) => c.nome.toLowerCase().includes(t) || t.includes(c.nome.toLowerCase().split(' ')[0].toLowerCase()))
        if (!match) return { msg: `Cliente não encontrado. Qual o nome do cliente?`, proximoFlow: flow }
        return {
          msg: `**${match.nome}** selecionado. Qual **produto** e **valor estimado** deste negócio? (ex: "Resina Epóxi, R$ 80.000")`,
          proximoFlow: { ...flow, step: 2, data: { ...flow.data, cliente: match } }
        }
      }
      if (flow.step === 2) {
        const prod = PRODUTOS_CATALOGO.find(p => t.includes(p.nome.toLowerCase().split(' ')[0].toLowerCase())) || { nome: resposta }
        const valMatch = t.match(/r?\$?\s*(\d[\d.,]*)/)
        const valor = valMatch ? parseFloat(valMatch[1].replace('.', '').replace(',', '.')) : 50000
        const neg = {
          id: genId('neg'), titulo: `${prod.nome} — ${flow.data.cliente.nome}`,
          cliente_id: flow.data.cliente.id, cliente_nome: flow.data.cliente.nome,
          valor, produto: prod.nome, etapa: 'prospeccao', probabilidade: 10,
          responsavel: 'Wanderson Lima', data_criacao: hoje(), data_atualizacao: hoje(),
        }
        const lista = loadData('negocios', NEGOCIOS_SEED)
        saveData('negocios', [neg, ...lista])
        return {
          msg: `✅ **Negócio criado no Pipeline!**\n\n• **${neg.titulo}**\n• Valor: ${fmt(valor)}\n• Etapa: Prospecção (10%)\n\nAbra o Pipeline para avançar as etapas.`,
          acao: { tipo: 'negocio', label: 'Negócio criado no pipeline', href: '/negocios' },
          proximoFlow: null,
        }
      }
    }

    return { msg: 'Não entendi. Pode reformular?', proximoFlow: flow }
  }

  // ── handler de ação de intenção nova ────────────────────────────────────────

  function iniciarAcao(intencao: string): { resposta: string; acao?: AcaoExecutada; novoFlow?: PendingFlow | null } | null {
    // Navegações simples
    const navs: Record<string, [string, string, string]> = {
      nav_mapa:        ['🗺️', 'Abrindo Mapa de Clientes...', '/mapa'],
      nav_agenda:      ['📅', 'Abrindo Agenda de Visitas...', '/agenda'],
      nav_negocios:    ['📊', 'Abrindo Pipeline de Negócios...', '/negocios'],
      nav_meudia:      ['🌅', 'Abrindo Meu Dia...', '/meu-dia'],
      nav_clientes:    ['👥', 'Abrindo Clientes para cadastro...', '/clientes'],
      nav_fornecedores:['🏭', 'Abrindo Fornecedores...', '/fornecedores'],
    }
    if (navs[intencao]) {
      const [emoji, msg, href] = navs[intencao]
      setTimeout(() => { window.location.href = href }, 800)
      return { resposta: `${emoji} **${msg}** Você será redirecionado em instantes.`, acao: { tipo: 'nav', label: msg, href } }
    }
    if (intencao === 'agendar_visita') {
      return { resposta: '📅 Vou agendar a visita. **Para qual cliente?**', novoFlow: { tipo: 'agendar_visita', step: 1, data: {} } }
    }
    if (intencao === 'criar_lembrete') {
      return { resposta: '🔔 Claro! **O que devo registrar como lembrete?**', novoFlow: { tipo: 'criar_lembrete', step: 1, data: {} } }
    }
    if (intencao === 'criar_negocio') {
      return { resposta: '📊 Vou criar um negócio no pipeline. **Para qual cliente?**', novoFlow: { tipo: 'criar_negocio', step: 1, data: {} } }
    }
    return null
  }

  // ── resposta local CRM (consultas) ──────────────────────────────────────────

  function respostaLocalCRM(q: string): string | null {
    const t = q.toLowerCase()
    const clientes = loadData('clientes_geo', CLIENTES_SEED)

    if (t.includes('sem compra') || t.includes('clientes inativos') || t.includes('reativar')) {
      const lista = clientes.filter((c: any) => ['sem_compra', 'inadimplente', 'inativo'].includes(c.status))
      if (!lista.length) return '✅ Nenhum cliente sem compra recente.'
      return `🔴 **${lista.length} clientes sem compra recente:**\n\n${lista.slice(0, 8).map((c: any) => `• **${c.nome}** (${c.cidade}/${c.uf}) — ${c.status}`).join('\n')}\n\n💡 Acesse o Mapa de Clientes para ver visualmente.`
    }

    const vendMatch = t.match(/clientes? (?:do|da|de) (.+?)(?:\s|$)/)
    if (vendMatch || (t.includes('carteira') && !t.includes('criar') && !t.includes('abrir'))) {
      const vendorName = vendMatch?.[1]
      const filtrados = vendorName ? clientes.filter((c: any) => c.vendedor.toLowerCase().includes(vendorName.trim())) : clientes
      const ativos = filtrados.filter((c: any) => c.status === 'ativo').length
      const fat = filtrados.reduce((s: number, c: any) => s + c.faturamento12m, 0)
      return `📋 **Carteira:** ${filtrados.length} clientes · ${ativos} ativos · Fat. 12M: ${fmt(fat)}\n\n${filtrados.slice(0, 6).map((c: any) => `• ${c.nome} (${c.uf}) — ${c.status}`).join('\n')}`
    }

    if (t.includes('recompra') || t.includes('reposi') || t.includes('próxima compra')) {
      const hoje_d = new Date()
      const urgentes = HISTORICO_CONSUMO.filter(h => h.ultima_compra && h.freq_meses > 0).map(h => {
        const p = new Date(h.ultima_compra); p.setMonth(p.getMonth() + h.freq_meses)
        const dias = Math.round((p.getTime() - hoje_d.getTime()) / 86400000)
        return { dias, cliente: clientes.find((c: any) => c.id === h.cliente_id), produto: PRODUTOS_CATALOGO.find(pr => pr.id === h.produto_id) }
      }).filter(x => x.dias <= 7 && x.cliente && x.produto).slice(0, 6)
      if (!urgentes.length) return '✅ Nenhuma recompra prevista nos próximos 7 dias.'
      return `⏰ **Recompras em até 7 dias:**\n\n${urgentes.map(u => `• **${u.cliente!.nome}** — ${u.produto!.nome} em ${Math.max(0, u.dias)} dias`).join('\n')}\n\n💡 Acesse Prospecção → Radar de Recompra para a visão completa.`
    }

    if (t.includes('saúde') || t.includes('health') || t.includes('risco da carteira')) {
      const emRisco = clientes.filter((c: any) => ['inadimplente', 'sem_compra'].includes(c.status))
      const fat = emRisco.reduce((s: number, c: any) => s + c.faturamento12m, 0)
      return `🏥 **Saúde da carteira:**\n\n• Em risco: **${emRisco.length} clientes** (Fat. 12M: ${fmt(fat)})\n• Inadimplentes: ${clientes.filter((c: any) => c.status === 'inadimplente').length}\n• Sem compra: ${clientes.filter((c: any) => c.status === 'sem_compra').length}\n• Inativos: ${clientes.filter((c: any) => c.status === 'inativo').length}`
    }

    return null
  }

  // ── envio de mensagem ───────────────────────────────────────────────────────

  const send = async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    const userMsg: Message = { role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      // 1. Continuar fluxo multi-passo se existir
      if (pendingFlow) {
        const { msg: resp, acao, proximoFlow } = continuarFluxo(pendingFlow, msg)
        setPendingFlow(proximoFlow ?? null)
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'assistant', content: resp, acao }])
          setLoading(false)
        }, 400)
        return
      }

      // 2. Detectar intenção de ação
      const intencao = detectarIntencao(msg)
      if (intencao) {
        const resultado = iniciarAcao(intencao)
        if (resultado) {
          if (resultado.novoFlow !== undefined) setPendingFlow(resultado.novoFlow)
          setTimeout(() => {
            setMessages(prev => [...prev, { role: 'assistant', content: resultado.resposta, acao: resultado.acao }])
            setLoading(false)
          }, 300)
          return
        }
      }

      // 3. Resposta local CRM (consultas)
      const localReply = respostaLocalCRM(msg)
      if (localReply) {
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'assistant', content: localReply }])
          setLoading(false)
        }, 500)
        return
      }

      // 4. API (fallback)
      const apiMsgs = [...messages, userMsg]
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMsgs, mode: modo, systemPrompt: SYSTEM_PROMPTS[modo] }),
      })
      const { reply } = await res.json()
      const { clean, action } = parseAction(reply)
      const docNum = action ? executeAction(action) : null
      setMessages(prev => [...prev, { role: 'assistant', content: clean, acao: docNum ? { tipo: action.type, label: `${action.type === 'criar_proposta' ? 'Proposta' : action.type === 'criar_pedido' ? 'Pedido' : 'OC'} criado`, numero: docNum, href: action.type === 'criar_proposta' ? '/crm/propostas' : '/crm/pedidos' } : undefined }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Erro de conexão. As ações locais (agendar visita, lembretes, etc.) funcionam sem internet.' }])
    } finally {
      setLoading(false)
    }
  }

  const switchModo = (m: AgentMode) => {
    setModo(m); setShowModos(false); setPendingFlow(null)
    const info = MODOS.find(x => x.key === m)!
    setMessages([{ role: 'assistant', content: `${info.emoji} Modo **${info.label}** ativado. O que fazemos?` }])
  }

  const sugestoesAtivas = SUGESTOES_ACAO[modo]

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #06b6d4, #2563eb)' }}>
          <Bot size={24} className="text-white" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {open && (
        <div className={cn('fixed right-4 z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col transition-all duration-200', minimized ? 'bottom-4 w-72 h-14' : 'bottom-4 w-[380px]')} style={minimized ? {} : { height: 'min(620px, calc(100vh - 24px))', maxHeight: 'calc(100vh - 24px)' }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-t-2xl flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0c1829, #162035)' }}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold">NEXUS Agent</p>
              {!minimized && (
                <p className="text-cyan-400 text-xs flex items-center gap-1">
                  <Sparkles size={9} /> NEXUS AI · {modoAtual.emoji} {modoAtual.label}
                  {pendingFlow && <span className="ml-1 bg-amber-500 text-white rounded px-1 text-[9px]">aguardando...</span>}
                </p>
              )}
            </div>
            <button onClick={() => setMinimized(!minimized)} className="text-slate-400 hover:text-white transition-colors">{minimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}</button>
            <button onClick={() => { setOpen(false); setPendingFlow(null) }} className="text-slate-400 hover:text-white transition-colors"><X size={14} /></button>
          </div>

          {!minimized && (
            <>
              {/* Seletor de modo */}
              <div className="px-3 pt-2 pb-1 border-b border-slate-100 relative">
                <button onClick={() => setShowModos(!showModos)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm transition-colors">
                  <span>{modoAtual.emoji}</span>
                  <span className={cn('font-semibold', modoAtual.cor)}>{modoAtual.label}</span>
                  <span className="text-slate-400 text-xs flex-1 text-left">{modoAtual.desc}</span>
                  <ChevronDown size={12} className={cn('text-slate-400 transition-transform', showModos && 'rotate-180')} />
                </button>
                {showModos && (
                  <div className="absolute left-3 right-3 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-10 p-1">
                    {MODOS.map(m => (
                      <button key={m.key} onClick={() => switchModo(m.key)}
                        className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors text-left', m.key === modo && 'bg-cyan-50')}>
                        <span>{m.emoji}</span>
                        <div>
                          <p className={cn('font-semibold', m.cor)}>{m.label}</p>
                          <p className="text-xs text-slate-400">{m.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0" onClick={() => setShowModos(false)}>
                {messages.map((m, i) => <Bubble key={i} msg={m} />)}
                {loading && (
                  <div className="flex gap-2 items-center">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <Bot size={13} className="text-white" />
                    </div>
                    <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-3.5 py-2.5 flex items-center gap-2">
                      <Loader2 size={13} className="animate-spin text-cyan-500" />
                      <span className="text-xs text-slate-500">{pendingFlow ? 'Processando...' : 'Analisando...'}</span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Sugestões de ação rápida */}
              {messages.length <= 1 && !pendingFlow && (
                <div className="px-3 pb-1.5 flex flex-col gap-1 max-h-40 overflow-y-auto">
                  {sugestoesAtivas.map(s => (
                    <button key={s.msg} onClick={() => send(s.msg)}
                      className="text-xs bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-300 text-slate-600 hover:text-cyan-700 px-3 py-1.5 rounded-lg transition-colors text-left">
                      {s.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Hint do fluxo ativo */}
              {pendingFlow && (
                <div className="mx-3 mb-1 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-xs text-amber-700 flex items-center justify-between">
                  <span>🔄 Fluxo em andamento: <strong>{pendingFlow.tipo.replace('_', ' ')}</strong></span>
                  <button onClick={() => { setPendingFlow(null); setMessages(prev => [...prev, { role: 'assistant', content: '↩️ Fluxo cancelado. Como posso ajudar?' }]) }} className="text-red-400 hover:text-red-600 ml-2">Cancelar</button>
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t border-slate-100 flex gap-2 flex-shrink-0">
                <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                  placeholder={pendingFlow ? 'Responda para continuar...' : `Pergunte ou peça uma ação...`}
                  className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100 placeholder:text-slate-400"
                  disabled={loading} />
                <button onClick={() => send()} disabled={loading || !input.trim()}
                  className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #06b6d4, #2563eb)' }}>
                  <Send size={14} className="text-white" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
