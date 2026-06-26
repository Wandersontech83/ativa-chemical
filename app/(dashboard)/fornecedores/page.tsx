'use client'

import { Plus, Globe, Building2, Phone, Mail, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const DEMO_FORNECEDORES = [
  { id: 'sup-001', razao_social: 'Hunan Chemical Co., Ltd', nome_fantasia: 'Hunan Chem', pais_origem: 'China', internacional: true, contato_nome: 'Li Wei', email: 'liwei@hunanchem.com', telefone: '+86-731-8800-0001', prazo_entrega_dias: 45, certificacoes: ['ISO 9001', 'REACH'], produtos: 5 },
  { id: 'sup-002', razao_social: 'Guangzhou Poly Chemical', nome_fantasia: 'GZ Poly', pais_origem: 'China', internacional: true, contato_nome: 'Zhang Ming', email: 'zhangming@gzpoly.com', telefone: '+86-20-3300-0002', prazo_entrega_dias: 60, certificacoes: ['ISO 9001'], produtos: 6 },
  { id: 'sup-003', razao_social: 'Shandong United Chem', nome_fantasia: 'SD United', pais_origem: 'China', internacional: true, contato_nome: 'Wang Fang', email: 'wangfang@sdunited.com', telefone: '+86-531-8500-0003', prazo_entrega_dias: 55, certificacoes: ['ISO 14001'], produtos: 4 },
  { id: 'sup-004', razao_social: 'Quimibras Distribuidora Ltda', nome_fantasia: 'Quimibras', pais_origem: 'Brasil', internacional: false, contato_nome: 'Roberto Silva', email: 'roberto@quimibras.com.br', telefone: '(11) 2345-6789', prazo_entrega_dias: 7, certificacoes: [], produtos: 8 },
  { id: 'sup-005', razao_social: 'TradeChem Importações S.A.', nome_fantasia: 'TradeChem', pais_origem: 'Brasil', internacional: false, contato_nome: 'Mariana Costa', email: 'mariana@tradechem.com.br', telefone: '(21) 3456-7890', prazo_entrega_dias: 10, certificacoes: ['ISO 9001'], produtos: 5 },
]

export default function FornecedoresPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fornecedores</h1>
          <p className="text-slate-500 text-sm mt-0.5">3 internacionais · 2 nacionais</p>
        </div>
        <button className="btn-primary"><Plus size={16} /> Novo Fornecedor</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {DEMO_FORNECEDORES.map(f => (
          <div key={f.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-800">{f.nome_fantasia}</h3>
                  {f.internacional
                    ? <span className="badge-blue flex items-center gap-0.5 text-[10px]"><Globe size={9} /> {f.pais_origem}</span>
                    : <span className="badge-green text-[10px]">Nacional</span>
                  }
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{f.razao_social}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm mb-3">
              <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 rounded-lg px-2.5 py-1.5">
                <Clock size={12} className="text-primary-500" />
                <span className="text-xs">{f.prazo_entrega_dias} dias de entrega</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 rounded-lg px-2.5 py-1.5">
                <Building2 size={12} className="text-primary-500" />
                <span className="text-xs">{f.produtos} produtos</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-500">
              <div className="flex items-center gap-2"><Phone size={11} />{f.telefone}</div>
              <div className="flex items-center gap-2"><Mail size={11} />{f.email}</div>
              <div className="flex items-center gap-2 text-slate-400">Contato: {f.contato_nome}</div>
            </div>

            {f.certificacoes.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-3 pt-3 border-t border-slate-100">
                {f.certificacoes.map(c => (
                  <span key={c} className="badge-gray text-[10px]">{c}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
