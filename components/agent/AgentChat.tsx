'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Minimize2, Maximize2, Loader2, Sparkles, Plus, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { saveData, loadData, genId } from '@/lib/storage'

interface Message { role: 'user' | 'assistant'; content: string }

type AgentMode = 'comercial' | 'financeiro' | 'compras' | 'estoque' | 'trade' | 'executivo'

const MODOS: { key: AgentMode; label: string; emoji: string; cor: string; desc: string }[] = [
  { key: 'comercial',  label: 'Comercial',   emoji: '🤝', cor: 'text-cyan-600',    desc: 'Propostas, pedidos e clientes' },
  { key: 'financeiro', label: 'Financeiro',  emoji: '💰', cor: 'text-emerald-600', desc: 'CR, CP e fluxo de caixa' },
  { key: 'compras',    label: 'Compras',     emoji: '📦', cor: 'text-blue-600',    desc: 'OC e fornecedores' },
  { key: 'estoque',    label: 'Estoque',     emoji: '🏭', cor: 'text-amber-600',   desc: 'Movimentações e saldo' },
  { key: 'trade',      label: 'Trade',       emoji: '🚢', cor: 'text-violet-600',  desc: 'Importações e câmbio' },
  { key: 'executivo',  label: 'Executivo',   emoji: '📊', cor: 'text-slate-700',   desc: 'KPIs e análise estratégica' },
]

const SUGESTOES: Record<AgentMode, string[]> = {
  comercial:  ['Criar proposta para Nordeste Química — 500kg de Acetona', 'Emitir pedido para IndTex Plásticos', 'Quais clientes têm propostas pendentes?'],
  financeiro: ['Qual o saldo de contas a receber?', 'Quem está inadimplente?', 'Projeção de caixa para dezembro'],
  compras:    ['Criar OC para Hunan Chemical — 2000kg TiO2', 'Qual fornecedor tem menor prazo?', 'OC pendentes de aprovação'],
  estoque:    ['Registrar entrada de 500kg de Acetona', 'Quais produtos estão no mínimo?', 'Saldo atual do estoque'],
  trade:      ['Análise do câmbio CNY hoje', 'Status das importações em trânsito', 'Quando chega o IMP-2024-002?'],
  executivo:  ['Resumo executivo do mês', 'Quais os principais riscos?', 'Faturamento vs meta 2024'],
}

const SYSTEM_PROMPTS: Record<AgentMode, string> = {
  comercial: `Você é o Assistente Comercial da Ativa Chemical. Ajuda a criar propostas, pedidos de venda, analisar clientes e oportunidades.

Quando criar documentos, retorne JSON em tag <action>:
- Proposta: <action>{"type":"criar_proposta","data":{"cliente":"","itens":[{"produto":"","quantidade":0,"preco_unitario":0}],"observacoes":"","validade_dias":14}}</action>
- Pedido: <action>{"type":"criar_pedido","data":{"cliente":"","itens":[{"produto":"","quantidade":0,"preco_unitario":0}],"forma_pagamento":"30 dias","prazo_dias":15}}</action>

Produtos: Acetona Industrial 99,5% (R$6,80/kg), Tolueno Industrial (R$7,90/kg), Resina Epóxi (R$28,00/kg), Dióxido de Titânio R-902 (R$43,00/kg), DOP (R$14,90/kg), Acetato de Etila (R$9,20/kg).
Clientes: Nordeste Química Ltda, IndTex Plásticos SA, PetroSul Derivados, Fab Têxtil Nordeste, Agroquim Nordeste.`,

  financeiro: `Você é o Assistente Financeiro da Ativa Chemical. Analisa contas a receber, contas a pagar, fluxo de caixa e indicadores.

Dados atuais:
- Contas a Receber: R$ 328.000 (1 vencido: Fab Têxtil R$43k)
- Contas a Pagar: R$ 120.850 (1 vencido: GZ Poly R$37,7k)
- Saldo em caixa: R$ 394.530
- Inadimplência: 4,5%
- Margem bruta: 40,0%
- EBITDA acumulado 2024: R$ 580.000

Forneça análises, alertas e recomendações financeiras objetivas.`,

  compras: `Você é o Assistente de Compras da Ativa Chemical. Gerencia ordens de compra e relacionamento com fornecedores.

Quando criar OC, retorne: <action>{"type":"criar_oc","data":{"fornecedor":"","categoria":"","descricao":"","valor_total":0,"moeda":"CNY","cambio":0.77,"prazo_dias":45}}</action>

Fornecedores: Hunan Chemical (CNY, prazo 45d, Resinas/Pigmentos), GZ Poly (CNY, prazo 40d, Polímeros), Quimibras (BRL, prazo 7d, Solventes), SinoResin (USD, prazo 50d, Resinas). Câmbio atual: CNY=R$0,770, USD=R$5,050.`,

  estoque: `Você é o Assistente de Estoque da Ativa Chemical. Monitora saldos, movimentações e alertas de ruptura.

Saldos atuais:
- Acetona Industrial: 1.250 kg (mín: 500) ✅
- Tolueno Industrial: 890 kg (mín: 300) ✅
- Resina Epóxi: 340 kg (mín: 100) ✅
- Dióxido de Titânio: 480 kg (mín: 200) ✅
- DOP: 1.100 kg (mín: 500) ✅
- Acetato de Etila: 95 kg (mín: 200) ⚠️ CRÍTICO

Para registrar movimentação, retorne: <action>{"type":"movimentacao","data":{"produto":"","tipo":"entrada","quantidade":0,"documento":"","observacao":""}}</action>`,

  trade: `Você é o Assistente Trade da Ativa Chemical, especializado em importação internacional.

Processos ativos:
- IMP-2024-001: Hunan Chemical, desembaraço canal verde, ETA atrasada 3 dias
- IMP-2024-002: GZ Poly, em trânsito, ETA 18/12
- IMP-2024-003: SinoResin, pedido realizado, ETA 25/01

Câmbio: CNY/BRL = 0,770 (+5,5% vs jan). USD/BRL = 5,050. Lead time médio China: 45 dias. Despachante: Despacho Alfa Ltda.

Quando criar processo: <action>{"type":"criar_importacao","data":{"fornecedor":"","pais":"China","valor_fob":0,"moeda":"CNY","prazo_dias":45}}</action>`,

  executivo: `Você é o Assistente Executivo da Ativa Chemical. Fornece análises estratégicas, KPIs e recomendações de alto nível.

KPIs 2024: Faturamento R$3,2M (+12,4%), Lucro R$1,1M, Margem Bruta 40%, EBITDA R$580k, Inadimplência 4,5%.
Riscos: contrato Hunan vencendo 31/12, estoque crítico Acetato, inadimplência Fab Têxtil.
Oportunidades: câmbio favorável para antecipar compras, 3 importações garantindo estoque Q1.

Forneça análises executivas, identifique riscos e recomende ações estratégicas.`,
}

function parseAction(text: string): { clean: string; action: any | null } {
  const match = text.match(/<action>([\s\S]*?)<\/action>/)
  if (!match) return { clean: text, action: null }
  try { return { clean: text.replace(/<action>[\s\S]*?<\/action>/, '').trim(), action: JSON.parse(match[1]) } }
  catch { return { clean: text, action: null } }
}

function executeAction(action: any): string {
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0]
  const d = (days: number) => new Date(Date.now() + days * 86400000).toISOString().split('T')[0]

  if (action.type === 'criar_proposta') {
    const list = loadData<any>('propostas', [])
    const numero = `PROP-${now.getFullYear()}-${String(list.length + 1).padStart(3, '0')}`
    saveData('propostas', [{ id: genId('prop'), numero, cliente: action.data.cliente, data: dateStr, validade: d(action.data.validade_dias || 14), status: 'rascunho', itens: action.data.itens, observacoes: action.data.observacoes || '', responsavel: 'Wanderson Lima' }, ...list])
    return numero
  }
  if (action.type === 'criar_pedido') {
    const list = loadData<any>('pedidos', [])
    const numero = `PV-${now.getFullYear()}-${String(list.length + 1).padStart(3, '0')}`
    saveData('pedidos', [{ id: genId('ped'), numero, cliente: action.data.cliente, data: dateStr, prazo_entrega: d(action.data.prazo_dias || 15), status: 'pendente', itens: action.data.itens, forma_pagamento: action.data.forma_pagamento || '30 dias', observacoes: '' }, ...list])
    return numero
  }
  if (action.type === 'criar_oc') {
    const list = loadData<any>('compras', [])
    const numero = `OC-${now.getFullYear()}-${String(list.length + 1).padStart(3, '0')}`
    saveData('compras', [{ id: genId('cmp'), numero, fornecedor: action.data.fornecedor, data: dateStr, previsao_entrega: d(action.data.prazo_dias || 45), categoria: action.data.categoria, descricao: action.data.descricao, valor_total: action.data.valor_total, status: 'solicitado', moeda: action.data.moeda || 'CNY', cambio: action.data.cambio || 0.77, forma_pagamento: 'Wire Transfer 30d' }, ...list])
    return numero
  }
  if (action.type === 'movimentacao') {
    const movs = loadData<any>('estoque_movimentos', [])
    const produtos = loadData<any>('estoque_produtos', [])
    const novoMov = { id: genId('mov'), data: dateStr, produto: action.data.produto, tipo: action.data.tipo, quantidade: action.data.quantidade, unidade: 'kg', documento: action.data.documento || '', observacao: action.data.observacao || '' }
    saveData('estoque_movimentos', [novoMov, ...movs])
    const delta = action.data.tipo === 'entrada' ? action.data.quantidade : -action.data.quantidade
    saveData('estoque_produtos', produtos.map((p: any) => p.nome === action.data.produto ? { ...p, estoque_atual: Math.max(0, p.estoque_atual + delta) } : p))
    return `MOV-${Date.now()}`
  }
  return ''
}

function renderMd(text: string) {
  // Converte markdown simples para JSX
  return text.split('\n').map((line, i) => {
    // Linha de tabela
    if (line.startsWith('|')) {
      const cols = line.split('|').filter(c => c.trim() !== '')
      const isSep = cols.every(c => /^[-: ]+$/.test(c))
      if (isSep) return null
      return (
        <div key={i} className="flex gap-1 text-xs">
          {cols.map((c, j) => (
            <span key={j} className="flex-1 px-1 py-0.5 bg-white/20 rounded truncate" dangerouslySetInnerHTML={{ __html: c.trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          ))}
        </div>
      )
    }
    // Linha vazia
    if (!line.trim()) return <div key={i} className="h-1" />
    // Bullet
    if (line.startsWith('- ') || line.startsWith('• ')) {
      const content = line.replace(/^[-•] /, '')
      return <div key={i} className="flex gap-1.5 text-sm"><span className="opacity-60 flex-shrink-0">•</span><span dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} /></div>
    }
    // Numerado
    if (/^\d+\. /.test(line)) {
      const [num, ...rest] = line.split('. ')
      return <div key={i} className="flex gap-1.5 text-sm"><span className="opacity-60 flex-shrink-0 font-bold">{num}.</span><span dangerouslySetInnerHTML={{ __html: rest.join('. ').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} /></div>
    }
    // Normal com bold
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
      <div className={cn('max-w-[82%] min-w-0 space-y-1.5', isUser && 'items-end flex flex-col')}>
        <div className={cn('rounded-2xl px-3.5 py-2.5 space-y-0.5 break-words', isUser ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-tr-sm' : 'bg-slate-100 text-slate-800 rounded-tl-sm')}>
          {isUser ? <p className="text-sm leading-relaxed">{clean || msg.content}</p> : renderMd(clean || msg.content)}
        </div>
        {action && docNum && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs">
            <span>✅</span>
            <span className="text-emerald-800 font-semibold">
              {action.type === 'criar_proposta' ? 'Proposta' : action.type === 'criar_pedido' ? 'Pedido' : action.type === 'criar_oc' ? 'OC' : 'Movimentação'} criado: <strong>{docNum}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AgentChat() {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [modo, setModo] = useState<AgentMode>('comercial')
  const [showModos, setShowModos] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Olá, Wanderson! 👋 Sou o **NEXUS Agent** da Ativa Chemical. Selecione um modo de assistência abaixo e pode começar!' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && !minimized) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [messages, open, minimized])

  const modoAtual = MODOS.find(m => m.key === modo)!

  const send = async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    const userMsg: Message = { role: 'user', content: msg }
    const apiMessages = [...messages, userMsg]
    setMessages(apiMessages)
    setLoading(true)
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, mode: modo, systemPrompt: SYSTEM_PROMPTS[modo] }),
      })
      const { reply } = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro de conexão. Tente novamente.' }])
    } finally {
      setLoading(false)
    }
  }

  const switchModo = (m: AgentMode) => {
    setModo(m)
    setShowModos(false)
    const info = MODOS.find(x => x.key === m)!
    setMessages([{ role: 'assistant', content: `${info.emoji} Modo **${info.label}** ativado. ${info.desc}. Como posso ajudar?` }])
  }

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
        <div className={cn('fixed right-4 z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col transition-all duration-200', minimized ? 'bottom-4 w-72 h-14' : 'bottom-4 w-[380px]')} style={minimized ? {} : { height: 'min(600px, calc(100vh - 24px))', maxHeight: 'calc(100vh - 24px)' }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-t-2xl flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0c1829, #162035)' }}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold">NEXUS Agent</p>
              {!minimized && <p className="text-cyan-400 text-xs flex items-center gap-1"><Sparkles size={9} />NEXUS AI · {modoAtual.emoji} {modoAtual.label}</p>}
            </div>
            <button onClick={() => setMinimized(!minimized)} className="text-slate-400 hover:text-white transition-colors">{minimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}</button>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X size={14} /></button>
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
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center"><Bot size={13} className="text-white" /></div>
                    <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-3.5 py-2.5 flex items-center gap-2">
                      <Loader2 size={13} className="animate-spin text-cyan-500" />
                      <span className="text-xs text-slate-500">Analisando...</span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Sugestões */}
              {messages.length <= 1 && (
                <div className="px-3 pb-1.5 flex flex-col gap-1">
                  {SUGESTOES[modo].map(s => (
                    <button key={s} onClick={() => send(s)}
                      className="text-xs bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-300 text-slate-600 hover:text-cyan-700 px-3 py-1.5 rounded-lg transition-colors text-left">
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t border-slate-100 flex gap-2 flex-shrink-0">
                <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                  placeholder={`Pergunte ao ${modoAtual.label}...`}
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
