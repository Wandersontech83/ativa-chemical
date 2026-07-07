'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { User } from '@/lib/auth'
import {
  LayoutDashboard, Package, Users, Building2, TrendingUp,
  FileText, Truck, ShoppingCart, ScrollText, Settings,
  ChevronRight, Bot, LogOut, Zap, DollarSign, BarChart3,
  Globe, Bell, Ship, Wallet, CreditCard, LineChart, AlertTriangle,
  MapPin, UserCheck, Calculator, Target, ShieldCheck, SearchCheck, CalendarDays,
  Sunrise, Kanban, ClipboardCheck,
} from 'lucide-react'
import { toast } from 'sonner'

const navSections = [
  {
    items: [
      { href: '/meu-dia',                 icon: Sunrise,         label: 'Meu Dia',             roles: ['admin','gestor','analista','vendedor'] },
      { href: '/dashboard',              icon: LayoutDashboard, label: 'Dashboard',           roles: ['admin','gestor','analista','vendedor'] },
      { href: '/executivo',              icon: BarChart3,       label: 'Painel Executivo',    roles: ['admin','gestor'] },
      { href: '/alertas',                icon: Bell,            label: 'Alertas Inteligentes',roles: ['admin','gestor','analista'], badge: true },
    ],
  },
  {
    label: 'Operações',
    items: [
      { href: '/estoque',                icon: Package,         label: 'Estoque',             roles: ['admin','gestor','analista','vendedor'] },
      { href: '/produtos',               icon: Package,         label: 'Produtos',            roles: ['admin','gestor','analista','vendedor'] },
      { href: '/clientes',               icon: Users,           label: 'Clientes',            roles: ['admin','gestor','analista','vendedor'] },
      { href: '/fornecedores',           icon: Building2,       label: 'Fornecedores',        roles: ['admin','gestor','vendedor'] },
      { href: '/consultas',              icon: SearchCheck,     label: 'Consulta Cruzada',    roles: ['admin','gestor','analista','vendedor'] },
    ],
  },
  {
    label: 'CRM & Vendas',
    items: [
      { href: '/mapa',                   icon: MapPin,          label: 'Mapa de Clientes',    roles: ['admin','gestor','analista','vendedor'] },
      { href: '/agenda',                 icon: CalendarDays,    label: 'Agenda de Visitas',   roles: ['admin','gestor','analista','vendedor'] },
      { href: '/negocios',               icon: Kanban,          label: 'Pipeline de Negócios',roles: ['admin','gestor','analista','vendedor'] },
      { href: '/vendedores',             icon: UserCheck,       label: 'Vendedores',          roles: ['admin','gestor'] },
      { href: '/prospeccao',             icon: Target,          label: 'Prospecção',          roles: ['admin','gestor','analista','vendedor'] },
      { href: '/crm/propostas',          icon: TrendingUp,      label: 'Propostas',           roles: ['admin','gestor','analista','vendedor'] },
      { href: '/crm/pedidos',            icon: ShoppingCart,    label: 'Pedidos de Venda',    roles: ['admin','gestor','analista','vendedor'] },
      { href: '/faturamento',            icon: FileText,        label: 'Faturamento (NF-e)',   roles: ['admin','gestor','vendedor'] },
      { href: '/logistica',              icon: Truck,           label: 'Logística',           roles: ['admin','gestor','analista','vendedor'] },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { href: '/financeiro/receber',     icon: Wallet,          label: 'Contas a Receber',    roles: ['admin','gestor'] },
      { href: '/financeiro/pagar',       icon: CreditCard,      label: 'Contas a Pagar',      roles: ['admin','gestor'] },
      { href: '/financeiro/fluxo',       icon: LineChart,       label: 'Fluxo de Caixa',      roles: ['admin','gestor'] },
      { href: '/financeiro/indicadores', icon: DollarSign,      label: 'Indicadores',         roles: ['admin','gestor'] },
      { href: '/compras',                icon: ShoppingCart,    label: 'Ordens de Compra',    roles: ['admin','gestor'] },
      { href: '/aprovacoes',             icon: ClipboardCheck,  label: 'Aprovações',          roles: ['admin','gestor'] },
      { href: '/contratos',              icon: ScrollText,      label: 'Contratos',           roles: ['admin','gestor'] },
    ],
  },
  {
    label: 'Trade & Importação',
    items: [
      { href: '/importacao',             icon: Ship,            label: 'Importações',         roles: ['admin','gestor'] },
      { href: '/importacao/trade',       icon: Globe,           label: 'Trade Dashboard',     roles: ['admin','gestor'] },
      { href: '/importacao/calculadora', icon: Calculator,      label: 'Calculadora Import.', roles: ['admin','gestor'] },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/admin',                  icon: ShieldCheck,     label: 'Área ADM',            roles: ['admin'] },
      { href: '/configuracoes',          icon: Settings,        label: 'Configurações',       roles: ['admin'] },
    ],
  },
]

export default function Sidebar({ user }: { user: User }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    toast.success('Sessão encerrada')
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col h-full bg-[#0c1829] relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(6,182,212,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.07) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(6,182,212,0.14) 0%, transparent 70%)' }} />

      {/* Logo */}
      <div className="relative px-4 pt-4 pb-3.5 border-b border-white/[0.06]">
        <Link href="/dashboard" className="flex items-center group">
          <div className="w-full rounded-xl bg-white/95 px-3 py-2 flex items-center justify-center group-hover:bg-white transition-colors shadow-sm">
            <Image src="/logo.svg" alt="Ativa Chemical" width={160} height={44} className="h-9 w-auto object-contain" priority />
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="relative flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {navSections.map((section, si) => (
          <div key={si}>
            {section.label && (
              <div className="px-3 pb-1.5">
                <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">{section.label}</span>
              </div>
            )}
            <div className="space-y-0.5">
              {section.items
                .filter(item => item.roles.includes(user.role))
                .map(item => {
                  const Icon = item.icon
                  const active = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/executivo' && pathname.startsWith(item.href))
                  return (
                    <Link key={item.href} href={item.href} className={cn('nav-item', active && 'active')}>
                      <Icon size={15} className="flex-shrink-0" />
                      <span className="flex-1 text-[13px]">{item.label}</span>
                      {(item as any).badge && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                      )}
                      {active && <ChevronRight size={12} className="opacity-50" />}
                    </Link>
                  )
                })}
            </div>
          </div>
        ))}
      </nav>

      {/* NEXUS Agent */}
      <div className="relative px-3 pb-2">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20">
          <div className="relative flex-shrink-0">
            <Bot size={15} className="text-cyan-400" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-cyan-300">NEXUS Agent</div>
            <div className="text-[10px] text-slate-500">IA operacional ativa</div>
          </div>
          <Zap size={11} className="text-cyan-500 flex-shrink-0" />
        </div>
      </div>

      {/* User */}
      <div className="relative px-3 pb-4 border-t border-white/[0.06] pt-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-200 truncate leading-tight">{user.name}</div>
            <div className="text-[10px] text-slate-500 capitalize">{user.role}</div>
          </div>
          <button onClick={handleLogout} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Sair">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
