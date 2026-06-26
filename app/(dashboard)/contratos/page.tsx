'use client'

import { formatCurrency, formatDate, STATUS_LABELS, STATUS_COLORS, cn } from '@/lib/utils'
import { ScrollText, AlertTriangle, Calendar, User } from 'lucide-react'
import { differenceInDays, parseISO } from 'date-fns'

const DEMO_CONTRATOS = [
  {
    id: 'cont-001', numero: 'CT-2024-001', cliente: 'Plastinova Indústria de Plásticos Ltda',
    responsavel: 'Ana Rodrigues', status: 'ativo',
    vigencia_inicio: '2024-01-01', vigencia_fim: '2024-12-31',
    volume_mensal_estimado: 5000, valor_mensal_estimado: 35000,
    condicoes: 'Fornecimento mensal de solventes. Preços reajustados trimestralmente pelo IGP-M.',
    produtos: [
      { nome: 'Acetona Industrial', volume_mensal: 2000, unidade: 'kg' },
      { nome: 'Tolueno Industrial', volume_mensal: 1500, unidade: 'kg' },
    ],
  },
  {
    id: 'cont-002', numero: 'CT-2024-002', cliente: 'ColorMax Tintas e Vernizes S.A.',
    responsavel: 'Ana Rodrigues', status: 'ativo',
    vigencia_inicio: '2024-03-01', vigencia_fim: '2024-08-31',
    volume_mensal_estimado: 3000, valor_mensal_estimado: 52000,
    condicoes: 'Contrato de fornecimento semestral de resinas e pigmentos.',
    produtos: [
      { nome: 'Resina Epóxi Bisfenol A', volume_mensal: 800, unidade: 'kg' },
      { nome: 'Dióxido de Titânio R-902', volume_mensal: 1200, unidade: 'kg' },
    ],
  },
]

export default function ContratosPage() {
  const today = new Date()

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Contratos</h1>
          <p className="text-slate-500 text-sm mt-0.5">{DEMO_CONTRATOS.length} contratos ativos</p>
        </div>
        <button className="btn-primary">
          <ScrollText size={16} /> Novo Contrato
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {DEMO_CONTRATOS.map((c) => {
          const diasRestantes = differenceInDays(parseISO(c.vigencia_fim), today)
          const alerta = diasRestantes <= 30

          return (
            <div key={c.id} className={cn(
              'bg-white rounded-xl border shadow-sm p-5',
              alerta ? 'border-orange-200' : 'border-slate-100'
            )}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-primary-600">{c.numero}</span>
                    <span className={cn('badge', STATUS_COLORS[c.status])}>{STATUS_LABELS[c.status]}</span>
                    {alerta && (
                      <span className="badge-orange flex items-center gap-1">
                        <AlertTriangle size={10} /> {diasRestantes}d
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-800 mt-1">{c.cliente}</h3>
                </div>
                <button className="btn-ghost py-1 px-2 text-xs">Ver contrato</button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-0.5">Valor Mensal</div>
                  <div className="font-semibold text-slate-800">{formatCurrency(c.valor_mensal_estimado)}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-0.5">Volume/mês</div>
                  <div className="font-semibold text-slate-800">{c.volume_mensal_estimado.toLocaleString('pt-BR')} kg</div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {formatDate(c.vigencia_inicio)} → {formatDate(c.vigencia_fim)}
                </span>
                <span className="flex items-center gap-1">
                  <User size={12} /> {c.responsavel}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="text-xs font-medium text-slate-600 mb-2">Produtos contratados:</div>
                <div className="space-y-1">
                  {c.produtos.map((p) => (
                    <div key={p.nome} className="flex justify-between text-xs">
                      <span className="text-slate-700">{p.nome}</span>
                      <span className="text-slate-500">{p.volume_mensal.toLocaleString('pt-BR')} {p.unidade}/mês</span>
                    </div>
                  ))}
                </div>
              </div>

              {alerta && (
                <div className="mt-3 p-2.5 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2 text-xs text-orange-700">
                  <AlertTriangle size={12} />
                  <span>Vence em <strong>{diasRestantes} dias</strong> — iniciar processo de renovação</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
