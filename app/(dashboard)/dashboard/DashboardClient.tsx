'use client'

import Link from 'next/link'
import {
  TrendingUp, TrendingDown, Package, ShoppingCart,
  FileText, Truck, Bot, ArrowRight, CheckCircle,
  DollarSign, Percent, AlertTriangle, Zap,
  MapPin, Target, UserCheck, AlertCircle,
} from 'lucide-react'
import { CLIENTES_SEED, PROSPECTS_SEED, VENDEDORES_SEED } from '@/lib/clientes-seed'
import { formatCurrency, formatNumber, timeAgo, STATUS_COLORS, cn } from '@/lib/utils'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Area, AreaChart,
} from 'recharts'
import { toast } from 'sonner'

const DEMO_KPIS = {
  faturamento_mes: 114688,
  pedidos_aberto: 2,
  estoque_critico: 3,
  propostas_pendentes: 2,
  faturamento_mes_anterior: 98200,
  alertas_novos: 5,
  margem_media: 34.8,
  lucro_liquido: 18888,
}

const DEMO_CHART = [
  { mes: 'Jan', faturamento: 72000,  lucro: 24800 },
  { mes: 'Fev', faturamento: 85000,  lucro: 29500 },
  { mes: 'Mar', faturamento: 91500,  lucro: 33200 },
  { mes: 'Abr', faturamento: 78000,  lucro: 27100 },
  { mes: 'Mai', faturamento: 98200,  lucro: 36400 },
  { mes: 'Jun', faturamento: 114688, lucro: 42300 },
]

const DEMO_TOP = [
  { nome: 'Dióxido de Titânio R-902', valor_total: 21500 },
  { nome: 'Resina Epóxi Bisfenol A',  valor_total: 14000 },
  { nome: 'DOP Plastificante',         valor_total: 10780 },
  { nome: 'Acetona Industrial 99,5%',  valor_total:  8500 },
  { nome: 'Negro de Fumo N330',        valor_total:  8450 },
]

const DEMO_ALERTS = [
  { id: '1', tipo: 'proposta_sem_resposta', titulo: 'Proposta PROP-2024-002 sem resposta há 8 dias', prioridade: 'alta', status: 'novo', sugestao_agente: 'Contato direto com Juliana Santos. Margem de 32% — ajuste no prazo pode fechar o negócio.', created_at: new Date(Date.now() - 8*86400000).toISOString(), acao_url: '/crm/propostas' },
  { id: '2', tipo: 'estoque_critico',       titulo: 'Estoque crítico: Acetato de Etila (TC-SOL-006)', prioridade: 'alta', status: 'novo', sugestao_agente: 'Solicitar reposição urgente ao fornecedor GZ Poly. Quantidade sugerida: 500 kg.', created_at: new Date(Date.now() - 2*3600000).toISOString(), acao_url: '/estoque' },
  { id: '3', tipo: 'proposta_sem_resposta', titulo: 'Proposta PROP-2024-005 sem resposta há 3 dias', prioridade: 'alta', status: 'novo', sugestao_agente: 'Maior proposta do mês (R$ 75.600). Desconto de 3-5% pode fechar.', created_at: new Date(Date.now() - 3*86400000).toISOString(), acao_url: '/crm/propostas' },
  { id: '4', tipo: 'pedido_sem_nfe',        titulo: 'Pedido PV-2024-003 aguardando aprovação',       prioridade: 'media', status: 'novo', sugestao_agente: 'Margem 30,1% — acima do mínimo. Estoque ok. Aprovação imediata recomendada.', created_at: new Date(Date.now() - 7200000).toISOString(), acao_url: '/crm/pedidos' },
  { id: '5', tipo: 'contrato_vencendo',     titulo: 'Contrato CT-2024-002 vence em 65 dias',        prioridade: 'media', status: 'lido', sugestao_agente: 'Iniciar renovação agora. Propor +15% volume e +8% preço (IGP-M acumulado).', created_at: new Date(Date.now() - 86400000).toISOString(), acao_url: '/contratos' },
]

const ALERT_EMOJI: Record<string, string> = {
  proposta_sem_resposta: '📋',
  estoque_critico:       '📦',
  pedido_sem_nfe:        '🛒',
  logistica_parada:      '🚛',
  contrato_vencendo:     '📜',
  margem_baixa:          '📉',
  erro_sefaz:            '⚠️',
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-100 rounded-xl shadow-xl p-3 text-xs">
      <p className="font-semibold text-slate-600 mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-semibold text-slate-800">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardClient({ data }: { data: any }) {
  const kpis    = data.kpis        ?? DEMO_KPIS
  const chart   = data.chartData?.length  ? data.chartData  : DEMO_CHART
  const top     = data.topProducts?.length ? data.topProducts : DEMO_TOP
  const alerts  = data.alerts?.length     ? data.alerts     : DEMO_ALERTS

  const fat     = Number(kpis.faturamento_mes || 0)
  const fatAnt  = Number(kpis.faturamento_mes_anterior || 1)
  const variacao = ((fat - fatAnt) / fatAnt) * 100

  const kpiCards = [
    {
      title: 'Faturamento do Mês',
      value: formatCurrency(fat),
      sub: `${variacao >= 0 ? '+' : ''}${variacao.toFixed(1)}% vs mês anterior`,
      positive: variacao >= 0,
      icon: DollarSign,
      gradient: 'from-sky-400 to-cyan-400',
      bg: 'bg-sky-50',
      iconColor: 'text-sky-600',
      href: '/faturamento',
      delay: 'animate-fade-up-1',
    },
    {
      title: 'Lucro Líquido',
      value: formatCurrency(kpis.lucro_liquido || 18888),
      sub: `Margem líq. ${((kpis.lucro_liquido/fat)*100).toFixed(1)}%`,
      positive: true,
      icon: TrendingUp,
      gradient: 'from-emerald-400 to-teal-400',
      bg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      href: '/compras',
      delay: 'animate-fade-up-2',
    },
    {
      title: 'Margem Média',
      value: `${formatNumber(kpis.margem_media || 34.8, 1)}%`,
      sub: `${(kpis.pedidos_aberto || 2)} pedidos em aberto`,
      positive: true,
      icon: Percent,
      gradient: 'from-violet-400 to-indigo-400',
      bg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      href: '/crm/pedidos',
      delay: 'animate-fade-up-3',
    },
    {
      title: 'Alertas Ativos',
      value: String(kpis.alertas_novos || 5),
      sub: `${kpis.estoque_critico || 3} estoque crítico · ${kpis.propostas_pendentes || 2} propostas`,
      positive: false,
      icon: AlertTriangle,
      gradient: 'from-amber-400 to-orange-400',
      bg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      href: '/dashboard',
      delay: 'animate-fade-up-4',
    },
  ]

  return (
    <div className="space-y-6 grid-bg min-h-full pb-6">
      {/* Page header */}
      <div className="flex items-center justify-between pt-1 animate-fade-up">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Painel de <span className="gradient-text">Controle</span>
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Visão geral das operações — Junho 2024</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-3 py-1.5 rounded-xl font-medium">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Sistema operacional
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.title} href={card.href} className={cn('kpi-card group', card.delay)}>
              <div className="flex items-start justify-between mb-4">
                <div className={cn('p-2.5 rounded-xl', card.bg)}>
                  <Icon size={20} className={card.iconColor} />
                </div>
                <div className={cn('flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg',
                  card.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                )}>
                  {card.positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {card.positive ? 'Alta' : 'Atenção'}
                </div>
              </div>
              <div className="font-display text-[26px] font-bold text-slate-900 leading-none mb-1">
                {card.value}
              </div>
              <div className="text-sm font-medium text-slate-500">{card.title}</div>
              <div className="text-xs text-slate-400 mt-1 leading-relaxed">{card.sub}</div>
              {/* Bottom gradient bar */}
              <div className={cn('h-0.5 mt-4 rounded-full bg-gradient-to-r opacity-40 group-hover:opacity-70 transition-opacity', card.gradient)} />
            </Link>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Área chart faturamento */}
        <div className="xl:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-semibold text-slate-800 text-base">Faturamento × Lucro Bruto</h2>
              <p className="text-xs text-slate-400 mt-0.5">Últimos 6 meses</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chart}>
              <defs>
                <linearGradient id="gradFat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradLucro" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="faturamento" name="Faturamento" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#gradFat)" dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              <Area type="monotone" dataKey="lucro"       name="Lucro Bruto" stroke="#6366f1" strokeWidth={2}   fill="url(#gradLucro)" dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top produtos */}
        <div className="glass-card p-5">
          <h2 className="font-display font-semibold text-slate-800 text-base mb-1">Top Produtos</h2>
          <p className="text-xs text-slate-400 mb-4">Por faturamento — últimos 3 meses</p>
          <div className="space-y-3">
            {top.map((p: any, i: number) => {
              const max = top[0]?.valor_total || 1
              const pct = (p.valor_total / max) * 100
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium truncate max-w-[160px]">{p.nome}</span>
                    <span className="text-slate-800 font-semibold ml-2 flex-shrink-0">{formatCurrency(p.valor_total)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Alertas do Agente IA */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-sky-50 to-indigo-50 rounded-xl border border-sky-100">
              <Bot size={16} className="text-sky-600" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-slate-800 text-sm">Alertas do Agente IA</h2>
              <p className="text-[10px] text-slate-400">Análise automática a cada 15 minutos</p>
            </div>
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/60 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full ml-1">
              <Zap size={9} />
              {DEMO_KPIS.alertas_novos} novos
            </div>
          </div>
          <Link href="/dashboard" className="text-xs text-sky-600 hover:text-sky-700 flex items-center gap-1 font-medium">
            Ver todos <ArrowRight size={12} />
          </Link>
        </div>

        <div className="divide-y divide-slate-50">
          {DEMO_ALERTS.map((alert, i) => (
            <div key={alert.id}
              className={cn('px-5 py-4 hover:bg-slate-50/60 transition-colors', i === 0 && 'bg-red-50/20')}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5 flex-shrink-0">{ALERT_EMOJI[alert.tipo] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full',
                      alert.prioridade === 'alta'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    )}>
                      {alert.prioridade === 'alta' ? '● URGENTE' : '● MÉDIO'}
                    </span>
                    {alert.status === 'novo' && (
                      <span className="w-1.5 h-1.5 bg-sky-500 rounded-full" />
                    )}
                    <span className="text-[11px] text-slate-400">{timeAgo(alert.created_at)}</span>
                  </div>
                  <p className="text-[13px] font-semibold text-slate-800 mb-1 leading-tight">{alert.titulo}</p>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-1">
                    <span className="text-sky-500 font-semibold">IA: </span>
                    {alert.sugestao_agente}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {alert.acao_url && (
                    <Link href={alert.acao_url}
                      className="px-3 py-1 text-xs bg-gradient-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                      style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}
                    >
                      Ver
                    </Link>
                  )}
                  <button
                    onClick={() => toast.success('Alerta resolvido')}
                    className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-300 hover:text-emerald-500 transition-colors"
                  >
                    <CheckCircle size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CRM — Módulos Comerciais */}
      {(() => {
        const prospects = PROSPECTS_SEED
        const clientes = CLIENTES_SEED
        const vendedores = VENDEDORES_SEED
        const emFunil = prospects.filter(p => !['convertido','perdido'].includes(p.status)).length
        const semCompra = clientes.filter(c => c.status === 'sem_compra').length
        const inadimplentes = clientes.filter(c => c.status === 'inadimplente').length
        const metaTotal = vendedores.reduce((s, v) => s + v.meta_mensal_brl, 0)
        return (
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-semibold text-slate-800 text-base">CRM Comercial</h2>
                <p className="text-xs text-slate-400">Visão rápida dos módulos de campo</p>
              </div>
              <Link href="/mapa" className="text-xs text-sky-600 hover:text-sky-700 flex items-center gap-1 font-medium">
                Ver mapa <ArrowRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: 'Prospects no funil',
                  value: String(emFunil),
                  sub: 'de ' + prospects.length + ' abertos',
                  icon: Target,
                  href: '/prospeccao',
                  from: '#7c3aed', to: '#6366f1',
                  bg: 'bg-violet-50', ic: 'text-violet-600',
                },
                {
                  label: 'Clientes sem compra',
                  value: String(semCompra + inadimplentes),
                  sub: `${semCompra} inativos · ${inadimplentes} inadimp.`,
                  icon: AlertCircle,
                  href: '/mapa',
                  from: '#f59e0b', to: '#ef4444',
                  bg: 'bg-amber-50', ic: 'text-amber-600',
                },
                {
                  label: 'Clientes no mapa',
                  value: String(clientes.length),
                  sub: Array.from(new Set(clientes.map(c => c.uf))).length + ' estados cobertos',
                  icon: MapPin,
                  href: '/mapa',
                  from: '#0ea5e9', to: '#06b6d4',
                  bg: 'bg-sky-50', ic: 'text-sky-600',
                },
                {
                  label: 'Meta mensal equipe',
                  value: `R$ ${(metaTotal/1000).toFixed(0)}k`,
                  sub: vendedores.length + ' vendedores ativos',
                  icon: UserCheck,
                  href: '/vendedores',
                  from: '#10b981', to: '#0ea5e9',
                  bg: 'bg-emerald-50', ic: 'text-emerald-600',
                },
              ].map(card => {
                const Icon = card.icon
                return (
                  <Link key={card.label} href={card.href}
                    className="group bg-white border border-slate-100 rounded-2xl p-4 flex flex-col gap-2 hover:shadow-md transition-all hover:border-slate-200">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.bg}`}>
                      <Icon size={17} className={card.ic} />
                    </div>
                    <div className="font-display text-2xl font-bold text-slate-900">{card.value}</div>
                    <div>
                      <div className="text-xs font-semibold text-slate-700">{card.label}</div>
                      <div className="text-[11px] text-slate-400">{card.sub}</div>
                    </div>
                    <div className="h-0.5 rounded-full mt-1 opacity-30 group-hover:opacity-60 transition-opacity"
                      style={{ background: `linear-gradient(90deg, ${card.from}, ${card.to})` }} />
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Atalhos rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Nova Proposta',   icon: FileText,     href: '/crm/propostas', from: '#0ea5e9', to: '#6366f1' },
          { label: 'Entrada NF-e',    icon: Package,      href: '/estoque',       from: '#10b981', to: '#0ea5e9' },
          { label: 'Emitir NF-e',     icon: FileText,     href: '/faturamento',   from: '#6366f1', to: '#8b5cf6' },
          { label: 'Rastrear Pedido', icon: Truck,        href: '/logistica',     from: '#f59e0b', to: '#ef4444' },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.label} href={item.href}
              className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-white text-sm font-semibold transition-all hover:scale-[1.02] hover:shadow-lg"
              style={{ background: `linear-gradient(135deg, ${item.from}, ${item.to})` }}
            >
              <Icon size={16} />{item.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
