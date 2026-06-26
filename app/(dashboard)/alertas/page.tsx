'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import { AlertTriangle, Bell, CheckCircle, Clock, Zap, TrendingDown, Package, FileText, Ship, DollarSign, Users, ChevronRight } from 'lucide-react'

type Criticidade = 'critica' | 'alta' | 'media' | 'info'

interface Alerta {
  id: string; modulo: string; titulo: string; descricao: string
  criticidade: Criticidade; recomendacao: string; acao?: string; resolvido: boolean; ts: string
}

const ALERTAS_INICIAIS: Alerta[] = [
  { id: 'alt-001', modulo: 'Financeiro', titulo: 'Títulos vencidos — Inadimplência', descricao: 'Fab Têxtil Nordeste possui 1 título vencido há 10 dias no valor de R$ 43.000,00.', criticidade: 'critica', recomendacao: 'Acionar cobrança imediata. Considerar suspensão de novos pedidos até regularização.', acao: '/financeiro/receber', resolvido: false, ts: '2024-12-01 08:30' },
  { id: 'alt-002', modulo: 'Estoque', titulo: 'Estoque crítico — Acetato de Etila', descricao: 'Estoque atual (95 kg) abaixo do mínimo definido (200 kg). Risco de ruptura em 3 dias.', criticidade: 'critica', recomendacao: 'Emitir ordem de compra urgente para Quimibras ou GZ Poly. Lead time mínimo: 7 dias.', acao: '/estoque', resolvido: false, ts: '2024-12-01 09:00' },
  { id: 'alt-003', modulo: 'Contrato', titulo: 'Contrato vencendo — Hunan Chemical', descricao: 'Contrato CT-2024-003 vence em 28 dias (31/12/2024). Valor mensal: R$ 78.000.', criticidade: 'alta', recomendacao: 'Iniciar negociação de renovação. Avaliar ajuste de preço cambial (CNY/BRL).', acao: '/contratos', resolvido: false, ts: '2024-12-01 09:15' },
  { id: 'alt-004', modulo: 'Financeiro', titulo: 'Pagamento vencido — GZ Poly Materials', descricao: 'OC-2024-002 com vencimento em 29/11 não foi quitada. Valor: R$ 37.730,00.', criticidade: 'alta', recomendacao: 'Verificar saldo em conta. Risco de bloqueio de crédito com o fornecedor.', acao: '/financeiro/pagar', resolvido: false, ts: '2024-12-01 09:30' },
  { id: 'alt-005', modulo: 'Importação', titulo: 'Processo em desembaraço — IMP-2024-001', descricao: 'Processo IMP-2024-001 aguarda liberação aduaneira há 3 dias. Canal verde.', criticidade: 'media', recomendacao: 'Contatar Despacho Alfa para atualização. Verificar se há pendência documental.', acao: '/importacao', resolvido: false, ts: '2024-12-01 10:00' },
  { id: 'alt-006', modulo: 'Vendas', titulo: 'Proposta expirada — Agroquim Nordeste', descricao: 'PROP-2024-004 expirou há 27 dias sem resposta do cliente.', criticidade: 'media', recomendacao: 'Reativar proposta com novo prazo de validade. Considerar desconto de 5% para fechar negócio.', acao: '/crm/propostas', resolvido: false, ts: '2024-12-01 10:30' },
  { id: 'alt-007', modulo: 'Financeiro', titulo: 'Fluxo de caixa — Saída prevista em 08/12', descricao: 'Saída de R$ 43.120 prevista para 08/12. Saldo atual: R$ 354.500. Cobertura garantida.', criticidade: 'info', recomendacao: 'Monitorar recebimento da IndTex (R$ 74.500) previsto para 03/12 para ampliar margem.', acao: '/financeiro/fluxo', resolvido: false, ts: '2024-12-01 11:00' },
  { id: 'alt-008', modulo: 'Estoque', titulo: 'Tolueno Industrial — Estoque moderado', descricao: 'Estoque atual (890 kg) próximo do mínimo (300 kg). Consumo médio mensal: 600 kg.', criticidade: 'info', recomendacao: 'Avaliar reposição na próxima ordem de compra para Quimibras.', acao: '/estoque', resolvido: false, ts: '2024-12-01 11:30' },
]

const CRIT_CFG: Record<Criticidade, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  critica: { label: 'Crítico',  color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200',    icon: <AlertTriangle size={16} className="text-red-600" /> },
  alta:    { label: 'Alto',     color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200',  icon: <Bell size={16} className="text-amber-600" /> },
  media:   { label: 'Médio',    color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200',   icon: <Clock size={16} className="text-blue-600" /> },
  info:    { label: 'Info',     color: 'text-slate-600',  bg: 'bg-slate-50',  border: 'border-slate-200',  icon: <Zap size={16} className="text-slate-500" /> },
}

const MODULO_ICON: Record<string, React.ReactNode> = {
  Financeiro:  <DollarSign size={14} />,
  Estoque:     <Package size={14} />,
  Contrato:    <FileText size={14} />,
  Importação:  <Ship size={14} />,
  Vendas:      <TrendingDown size={14} />,
  Clientes:    <Users size={14} />,
}

export default function AlertasPage() {
  const [alertas, setAlertas] = useState<Alerta[]>(ALERTAS_INICIAIS)
  const [filtro, setFiltro] = useState<string>('todos')
  const [mostrarResolvidos, setMostrarResolvidos] = useState(false)

  const resolver = (id: string) => setAlertas(prev => prev.map(a => a.id === id ? { ...a, resolvido: true } : a))

  const filtered = alertas.filter(a => {
    if (!mostrarResolvidos && a.resolvido) return false
    if (filtro !== 'todos' && a.criticidade !== filtro) return false
    return true
  })

  const criticos = alertas.filter(a => !a.resolvido && a.criticidade === 'critica').length
  const altos = alertas.filter(a => !a.resolvido && a.criticidade === 'alta').length
  const total = alertas.filter(a => !a.resolvido).length

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Central de Alertas Inteligentes</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} alertas ativos • {criticos} críticos</p>
        </div>
        <div className="flex items-center gap-2 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-xl px-4 py-2">
          <Zap size={15} className="text-cyan-500" />
          <span className="text-sm font-semibold text-cyan-700">NEXUS Agent monitorando</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Críticos', value: criticos, color: 'text-red-600', bg: 'bg-red-50', icon: <AlertTriangle size={18} className="text-red-500" /> },
          { label: 'Altos', value: altos, color: 'text-amber-600', bg: 'bg-amber-50', icon: <Bell size={18} className="text-amber-500" /> },
          { label: 'Médios', value: alertas.filter(a => !a.resolvido && a.criticidade === 'media').length, color: 'text-blue-600', bg: 'bg-blue-50', icon: <Clock size={18} className="text-blue-500" /> },
          { label: 'Resolvidos', value: alertas.filter(a => a.resolvido).length, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle size={18} className="text-emerald-500" /> },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', k.bg)}>{k.icon}</div>
            <div><p className="text-xs text-slate-500">{k.label}</p><p className={cn('text-2xl font-bold', k.color)}>{k.value}</p></div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3">
        <div className="flex gap-2">
          {['todos','critica','alta','media','info'].map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={cn('px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors',
                filtro === f ? 'bg-cyan-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              )}>
              {f === 'todos' ? 'Todos' : f === 'critica' ? 'Crítico' : f === 'alta' ? 'Alto' : f === 'media' ? 'Médio' : 'Info'}
            </button>
          ))}
        </div>
        <button onClick={() => setMostrarResolvidos(!mostrarResolvidos)}
          className={cn('ml-auto px-3 py-1 rounded-lg text-xs font-medium transition-colors border', mostrarResolvidos ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-500 border-slate-200')}>
          {mostrarResolvidos ? '✓ Mostrando resolvidos' : 'Mostrar resolvidos'}
        </button>
      </div>

      {/* Lista de alertas */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-100 p-8 text-center text-slate-400">
            <CheckCircle size={32} className="mx-auto mb-2 opacity-30" />
            <p>Nenhum alerta encontrado</p>
          </div>
        )}
        {filtered.map(alerta => {
          const cfg = CRIT_CFG[alerta.criticidade]
          return (
            <div key={alerta.id} className={cn('bg-white rounded-xl border shadow-sm p-5 transition-all', alerta.resolvido ? 'opacity-60' : '', cfg.border)}>
              <div className="flex items-start gap-4">
                {/* Ícone criticidade */}
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', cfg.bg)}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', cfg.bg, cfg.color)}>{cfg.label}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      {MODULO_ICON[alerta.modulo]}{alerta.modulo}
                    </span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-xs text-slate-400">{alerta.ts}</span>
                    {alerta.resolvido && <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">✓ Resolvido</span>}
                  </div>

                  <h3 className="font-semibold text-slate-800 mb-1">{alerta.titulo}</h3>
                  <p className="text-sm text-slate-600 mb-3">{alerta.descricao}</p>

                  {/* Recomendação IA */}
                  <div className={cn('rounded-lg p-3 border flex items-start gap-2', cfg.bg, cfg.border)}>
                    <Zap size={13} className={cn('flex-shrink-0 mt-0.5', cfg.color)} />
                    <p className={cn('text-xs', cfg.color)}><strong>NEXUS Agent:</strong> {alerta.recomendacao}</p>
                  </div>
                </div>

                {/* Ações */}
                {!alerta.resolvido && (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {alerta.acao && (
                      <a href={alerta.acao} className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity">
                        Executar <ChevronRight size={12} />
                      </a>
                    )}
                    <button onClick={() => resolver(alerta.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors">
                      <CheckCircle size={12} /> Resolver
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
