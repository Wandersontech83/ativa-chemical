'use client'

import { formatCurrency, formatDate, STATUS_LABELS, STATUS_COLORS, cn } from '@/lib/utils'
import { FileText, Download, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const DEMO_NFES = [
  {
    id: 'nfe-001', pedido: 'PV-2024-001', cliente: 'Plastinova Indústria de Plásticos Ltda',
    numero: '000001', serie: '1', chave_acesso: '35240612345678000190550010000000011234567890',
    data_emissao: '2024-06-10', status: 'autorizada', protocolo: '135240601234567',
    valor_total: 50400,
  },
]

const DEMO_PEDIDOS_PARA_FATURAR = [
  {
    id: 'ord-002', numero: 'PV-2024-002', cliente: 'Nordeste Química Distribuidora',
    total: 20720, status: 'aprovado',
  },
]

export default function FaturamentoPage() {
  async function handleEmitirNfe(orderId: string, numero: string) {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2500)),
      {
        loading: `Emitindo NF-e para ${numero}... Conectando ao SEFAZ (homologação)...`,
        success: 'NF-e autorizada pelo SEFAZ! Protocolo gerado. DANFE disponível para download.',
        error: 'Erro na comunicação com o SEFAZ. Agente IA analisando o código de erro...',
      }
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Faturamento — NF-e</h1>
        <p className="text-slate-500 text-sm mt-0.5">Emissão e gerenciamento de Notas Fiscais Eletrônicas</p>
      </div>

      {/* Pedidos prontos para faturar */}
      {DEMO_PEDIDOS_PARA_FATURAR.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
          <h2 className="font-semibold text-primary-800 mb-3 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            Pedidos aprovados aguardando emissão de NF-e
          </h2>
          <div className="space-y-2">
            {DEMO_PEDIDOS_PARA_FATURAR.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-primary-100">
                <div>
                  <span className="font-mono text-sm font-semibold text-primary-700">{p.numero}</span>
                  <span className="text-slate-600 text-sm ml-3">{p.cliente}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-800">{formatCurrency(p.total)}</span>
                  <button
                    onClick={() => handleEmitirNfe(p.id, p.numero)}
                    className="btn-primary py-1.5 text-xs"
                  >
                    <FileText size={13} />
                    Emitir NF-e
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NF-es emitidas */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700 text-sm">NF-es Emitidas</h2>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Emissão</th>
              <th>Status</th>
              <th className="text-right">Valor</th>
              <th>Protocolo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_NFES.map((nfe) => (
              <tr key={nfe.id}>
                <td className="font-mono text-sm font-semibold">
                  {nfe.numero}/{nfe.serie}
                </td>
                <td className="font-mono text-xs text-primary-600">{nfe.pedido}</td>
                <td className="text-sm text-slate-700">{nfe.cliente}</td>
                <td className="text-sm text-slate-500">{formatDate(nfe.data_emissao)}</td>
                <td>
                  <span className={cn('badge flex items-center gap-1 w-fit', STATUS_COLORS[nfe.status])}>
                    <CheckCircle size={10} />
                    {STATUS_LABELS[nfe.status]}
                  </span>
                </td>
                <td className="text-right font-semibold">{formatCurrency(nfe.valor_total)}</td>
                <td className="font-mono text-xs text-slate-500">{nfe.protocolo}</td>
                <td>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toast.info('Download do DANFE em PDF — disponível em produção com certificado A1')}
                      className="btn-ghost py-1 px-2 text-xs flex items-center gap-1"
                    >
                      <Download size={11} /> DANFE
                    </button>
                    <button
                      onClick={() => toast.info('Download do XML autorizado')}
                      className="btn-ghost py-1 px-2 text-xs"
                    >
                      XML
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fluxo da NF-e */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-700 mb-4 text-sm">Como funciona a emissão</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            'Pedido Aprovado',
            'Monta XML da NF-e',
            'Assina com Certificado A1',
            'Envia ao SEFAZ',
            'Recebe Protocolo',
            'Gera DANFE PDF',
            'Aciona Logística',
          ].map((step, i, arr) => (
            <div key={step} className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-primary-50 rounded-lg px-3 py-1.5">
                <span className="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                <span className="text-xs text-primary-700 font-medium">{step}</span>
              </div>
              {i < arr.length - 1 && <span className="text-slate-300">→</span>}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Todo o fluxo é automatizado via N8N. Em produção, requer certificado digital A1 (.pfx) cadastrado em Configurações.
          O demo roda em ambiente de <strong>homologação</strong> SEFAZ.
        </p>
      </div>
    </div>
  )
}
