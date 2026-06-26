'use client'

import { useState } from 'react'
import { formatDate, formatCurrency, STATUS_LABELS, STATUS_COLORS, cn } from '@/lib/utils'
import { Truck, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

const DEMO_LOGISTICA = [
  {
    id: 'log-001', pedido: 'PV-2024-001', cliente: 'Plastinova Indústria de Plásticos Ltda',
    transportadora: 'Transportadora Rápida Ltda', modalidade: 'Rodoviário',
    codigo_rastreamento: 'TR123456789BR', status: 'canhoto_recebido',
    previsao_entrega: '2024-06-19', data_coleta: '2024-06-10', data_entrega: '2024-06-18',
    nfe: '000001', valor: 50400,
    historico: [
      { data: '2024-06-10', status: 'Coleta realizada', local: 'São Paulo/SP' },
      { data: '2024-06-12', status: 'Em trânsito', local: 'Campinas/SP' },
      { data: '2024-06-18', status: 'Entregue', local: 'Diadema/SP' },
      { data: '2024-06-21', status: 'Canhoto recebido', local: '' },
    ],
  },
  {
    id: 'log-002', pedido: 'PV-2024-002', cliente: 'Nordeste Química Distribuidora',
    transportadora: 'Transportadora Nacional S.A.', modalidade: 'Rodoviário',
    codigo_rastreamento: 'TN987654321BR', status: 'em_transito',
    previsao_entrega: '2024-06-29', data_coleta: '2024-06-18', data_entrega: null,
    nfe: null, valor: 20720,
    historico: [
      { data: '2024-06-18', status: 'Coleta realizada', local: 'São Paulo/SP' },
      { data: '2024-06-20', status: 'Em trânsito', local: 'Belo Horizonte/MG' },
      { data: '2024-06-22', status: 'Em trânsito', local: 'Vitória da Conquista/BA' },
    ],
  },
]

const STATUS_STEPS = ['aguardando_coleta', 'em_transito', 'saiu_entrega', 'entregue', 'canhoto_recebido']

export default function LogisticaPage() {
  const [selected, setSelected] = useState<typeof DEMO_LOGISTICA[0] | null>(null)

  function getStepIndex(status: string) {
    return STATUS_STEPS.indexOf(status)
  }

  async function handleCanhoto(id: string) {
    toast.success('Canhoto registrado! Pedido encerrado e financeiro notificado.')
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Logística</h1>
        <p className="text-slate-500 text-sm mt-0.5">{DEMO_LOGISTICA.length} entregas em andamento</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lista */}
        <div className="space-y-3">
          {DEMO_LOGISTICA.map((lg) => (
            <div
              key={lg.id}
              onClick={() => setSelected(lg)}
              className={cn(
                'bg-white rounded-xl border p-4 cursor-pointer hover:shadow-md transition-all',
                selected?.id === lg.id ? 'border-primary-400 shadow-md' : 'border-slate-100 shadow-sm'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-mono text-xs text-primary-600 font-semibold">{lg.pedido}</div>
                  <div className="font-medium text-slate-800 mt-0.5">{lg.cliente}</div>
                  <div className="text-xs text-slate-500">{lg.transportadora}</div>
                </div>
                <span className={cn('badge', STATUS_COLORS[lg.status])}>
                  {STATUS_LABELS[lg.status]}
                </span>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-1 mt-3">
                {STATUS_STEPS.map((step, i) => {
                  const current = getStepIndex(lg.status)
                  return (
                    <div key={step} className="flex-1 flex flex-col items-center gap-1">
                      <div className={cn(
                        'w-full h-1.5 rounded-full',
                        i <= current ? 'bg-primary-500' : 'bg-slate-200'
                      )} />
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                <span>Código: <span className="font-mono font-medium">{lg.codigo_rastreamento}</span></span>
                <span>{lg.previsao_entrega ? `Previsão: ${formatDate(lg.previsao_entrega)}` : ''}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Detalhe */}
        {selected ? (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Truck size={18} className="text-primary-600" />
              Rastreamento — {selected.pedido}
            </h3>

            <div className="space-y-2 mb-5">
              {[
                ['Cliente', selected.cliente],
                ['Transportadora', selected.transportadora],
                ['Modalidade', selected.modalidade],
                ['Rastreamento', selected.codigo_rastreamento],
                ['Valor NF', formatCurrency(selected.valor)],
                ['Coleta', selected.data_coleta ? formatDate(selected.data_coleta) : '—'],
                ['Previsão entrega', selected.previsao_entrega ? formatDate(selected.previsao_entrega) : '—'],
                ['Entregue em', selected.data_entrega ? formatDate(selected.data_entrega) : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-medium text-slate-800 text-right max-w-[180px]">{v}</span>
                </div>
              ))}
            </div>

            {/* Timeline */}
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Histórico</h4>
            <div className="space-y-2">
              {selected.historico.map((h, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={cn(
                    'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                    i === selected.historico.length - 1 ? 'bg-primary-500' : 'bg-slate-300'
                  )} />
                  <div>
                    <div className="text-sm font-medium text-slate-700">{h.status}</div>
                    <div className="text-xs text-slate-400">{h.data}{h.local && ` · ${h.local}`}</div>
                  </div>
                </div>
              ))}
            </div>

            {selected.status === 'entregue' && (
              <button
                onClick={() => handleCanhoto(selected.id)}
                className="btn-primary w-full justify-center mt-5"
              >
                <CheckCircle size={16} />
                Confirmar Recebimento do Canhoto
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <Truck size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Selecione uma entrega para ver os detalhes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

