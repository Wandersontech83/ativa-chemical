'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Minimize2, Maximize2, Loader2, Sparkles, FileText, ShoppingCart, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { saveData, loadData, genId } from '@/lib/storage'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGESTOES = [
  'Criar proposta para Nordeste Química — 500kg de Acetona',
  'Qual o estoque atual de Dióxido de Titânio?',
  'Emitir pedido de venda para IndTex Plásticos',
  'Criar ordem de compra para Hunan Chemical',
]

function parseAction(text: string): { clean: string; action: any | null } {
  const match = text.match(/<action>([\s\S]*?)<\/action>/)
  if (!match) return { clean: text, action: null }
  try {
    const action = JSON.parse(match[1])
    const clean = text.replace(/<action>[\s\S]*?<\/action>/, '').trim()
    return { clean, action }
  } catch {
    return { clean: text, action: null }
  }
}

function executeAction(action: any): string {
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0]

  if (action.type === 'criar_proposta') {
    const propostas = loadData<any>('propostas', [])
    const numero = `PROP-${now.getFullYear()}-${String(propostas.length + 1).padStart(3, '0')}`
    const validade = new Date(now.getTime() + (action.data.validade_dias || 14) * 86400000).toISOString().split('T')[0]
    const nova = {
      id: genId('prop'), numero, cliente: action.data.cliente, data: dateStr, validade,
      status: 'rascunho', itens: action.data.itens, observacoes: action.data.observacoes || '',
      responsavel: 'Wanderson Lima'
    }
    saveData('propostas', [nova, ...propostas])
    return numero
  }

  if (action.type === 'criar_pedido') {
    const pedidos = loadData<any>('pedidos', [])
    const numero = `PV-${now.getFullYear()}-${String(pedidos.length + 1).padStart(3, '0')}`
    const prazo = new Date(now.getTime() + (action.data.prazo_dias || 15) * 86400000).toISOString().split('T')[0]
    const novo = {
      id: genId('ped'), numero, cliente: action.data.cliente, data: dateStr,
      prazo_entrega: prazo, status: 'pendente', itens: action.data.itens,
      forma_pagamento: action.data.forma_pagamento || '30 dias', observacoes: ''
    }
    saveData('pedidos', [novo, ...pedidos])
    return numero
  }

  if (action.type === 'criar_oc') {
    const compras = loadData<any>('compras', [])
    const numero = `OC-${now.getFullYear()}-${String(compras.length + 1).padStart(3, '0')}`
    const prazo = new Date(now.getTime() + (action.data.prazo_dias || 45) * 86400000).toISOString().split('T')[0]
    const nova = {
      id: genId('cmp'), numero, fornecedor: action.data.fornecedor, data: dateStr,
      previsao_entrega: prazo, categoria: action.data.categoria,
      descricao: action.data.descricao, valor_total: action.data.valor_total,
      status: 'solicitado', moeda: action.data.moeda || 'BRL',
      cambio: action.data.cambio || 1, forma_pagamento: action.data.forma_pagamento || 'Wire Transfer'
    }
    saveData('compras', [nova, ...compras])
    return numero
  }

  return ''
}

function MessageBubble({ msg }: { msg: Message }) {
  const { clean, action } = parseAction(msg.content)
  const docNum = action ? executeAction(action) : null

  const isUser = msg.role === 'user'
  return (
    <div className={cn('flex gap-2 items-start', isUser && 'flex-row-reverse')}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot size={14} className="text-white"/>
        </div>
      )}
      <div className={cn('max-w-[80%] space-y-1.5', isUser && 'items-end flex flex-col')}>
        <div className={cn(
          'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-tr-sm'
            : 'bg-slate-100 text-slate-800 rounded-tl-sm'
        )}>
          {clean || msg.content}
        </div>
        {action && docNum && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
            <span className="text-emerald-600">✅</span>
            <span className="text-emerald-800 font-semibold">
              {action.type === 'criar_proposta' ? 'Proposta' : action.type === 'criar_pedido' ? 'Pedido' : 'OC'} criado{action.type !== 'criar_proposta' ? '' : 'a'}: {docNum}
            </span>
            <span className="text-emerald-600 text-xs">— salvo no sistema</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AgentChat() {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Olá, Wanderson! 👋 Sou o assistente comercial da Ativa Chemical. Posso criar propostas, pedidos, ordens de compra e muito mais — é só pedir!' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }, [messages, open, minimized])

  useEffect(() => {
    if (open && !minimized) inputRef.current?.focus()
  }, [open, minimized])

  const send = async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    const userMsg: Message = { role: 'user', content: msg }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const { reply } = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro de conexão. Tente novamente.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Botão flutuante */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #06b6d4, #2563eb)' }}
        >
          <Bot size={24} className="text-white"/>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse"/>
        </button>
      )}

      {/* Janela do chat */}
      {open && (
        <div className={cn(
          'fixed right-6 z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col transition-all duration-200',
          minimized ? 'bottom-6 w-72 h-14' : 'bottom-6 w-[380px] h-[560px]'
        )}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-t-2xl flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0c1829, #162035)' }}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-white"/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold">Assistente Ativa Chemical</p>
              {!minimized && <p className="text-cyan-400 text-xs flex items-center gap-1"><Sparkles size={10}/>Powered by Claude AI</p>}
            </div>
            <button onClick={() => setMinimized(!minimized)} className="text-slate-400 hover:text-white transition-colors">
              {minimized ? <Maximize2 size={14}/> : <Minimize2 size={14}/>}
            </button>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X size={14}/></button>
          </div>

          {!minimized && (
            <>
              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {messages.map((m, i) => <MessageBubble key={i} msg={m}/>)}
                {loading && (
                  <div className="flex gap-2 items-center">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <Bot size={14} className="text-white"/>
                    </div>
                    <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-cyan-500"/>
                      <span className="text-xs text-slate-500">Processando...</span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef}/>
              </div>

              {/* Sugestões rápidas */}
              {messages.length <= 1 && (
                <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                  {SUGESTOES.map(s => (
                    <button key={s} onClick={() => send(s)}
                      className="text-xs bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-300 text-slate-600 hover:text-cyan-700 px-2.5 py-1 rounded-lg transition-colors text-left">
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t border-slate-100 flex gap-2 flex-shrink-0">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                  placeholder="Ex: Criar proposta para Nordeste Química..."
                  className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100 placeholder:text-slate-400"
                  disabled={loading}
                />
                <button
                  onClick={() => send()}
                  disabled={loading || !input.trim()}
                  className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #06b6d4, #2563eb)' }}
                >
                  <Send size={15} className="text-white"/>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
