'use client'

import { useState } from 'react'
import { formatCurrency, cn } from '@/lib/utils'
import { Plus, Search, MapPin, Phone, Mail } from 'lucide-react'

const DEMO_CLIENTES = [
  { id: 'cli-0001', razao_social: 'Plastinova Indústria de Plásticos Ltda', cnpj_cpf: '11.222.333/0001-44', cidade: 'Diadema', estado: 'SP', segmento: 'Indústria Plástica', contato_nome: 'Fernando Alves', email: 'compras@plastinova.com.br', telefone: '(11) 4456-1234', limite_credito: 150000, compras_mes: 50400 },
  { id: 'cli-0002', razao_social: 'ColorMax Tintas e Vernizes S.A.', cnpj_cpf: '22.333.444/0001-55', cidade: 'São Paulo', estado: 'SP', segmento: 'Indústria de Tintas', contato_nome: 'Juliana Santos', email: 'juliana.compras@colormax.com.br', telefone: '(11) 3456-5678', limite_credito: 200000, compras_mes: 0 },
  { id: 'cli-0004', razao_social: 'Nordeste Química Distribuidora', cnpj_cpf: '44.555.666/0001-77', cidade: 'Salvador', estado: 'BA', segmento: 'Distribuidor Regional', contato_nome: 'Gustavo Lima', email: 'gustavo@nordestequimica.com.br', telefone: '(71) 3232-4444', limite_credito: 100000, compras_mes: 20720 },
  { id: 'cli-0006', razao_social: 'Construtech Impermeabilizações Ltda', cnpj_cpf: '66.777.888/0001-99', cidade: 'Belo Horizonte', estado: 'MG', segmento: 'Construção Civil', contato_nome: 'Paulo Drummond', email: 'compras@construtech.com.br', telefone: '(31) 3456-6666', limite_credito: 90000, compras_mes: 43568 },
  { id: 'cli-0007', razao_social: 'AutoPrime Revestimentos Automotivos', cnpj_cpf: '77.888.999/0001-00', cidade: 'São Paulo', estado: 'SP', segmento: 'Automotivo', contato_nome: 'Sílvia Torres', email: 'silvia@autoprime.com.br', telefone: '(11) 2345-7777', limite_credito: 120000, compras_mes: 0 },
]

export default function ClientesPage() {
  const [search, setSearch] = useState('')

  const filtered = DEMO_CLIENTES.filter(c =>
    search === '' || c.razao_social.toLowerCase().includes(search.toLowerCase()) || c.cnpj_cpf.includes(search)
  )

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
          <p className="text-slate-500 text-sm mt-0.5">{DEMO_CLIENTES.length} clientes cadastrados</p>
        </div>
        <button className="btn-primary"><Plus size={16} /> Novo Cliente</button>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="Buscar por nome ou CNPJ..." value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9 py-1.5" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(c => (
          <div key={c.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-800 leading-tight">{c.razao_social}</h3>
                <div className="text-xs text-slate-400 font-mono mt-0.5">{c.cnpj_cpf}</div>
              </div>
              <span className="badge-blue text-xs">{c.segmento}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="text-xs text-slate-400">Limite de crédito</div>
                <div className="text-sm font-semibold text-slate-700">{formatCurrency(c.limite_credito)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Compras este mês</div>
                <div className={cn('text-sm font-semibold', c.compras_mes > 0 ? 'text-emerald-600' : 'text-slate-400')}>
                  {c.compras_mes > 0 ? formatCurrency(c.compras_mes) : 'Sem compras'}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <MapPin size={11} />{c.cidade}, {c.estado}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Phone size={11} />{c.telefone} — {c.contato_nome}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Mail size={11} />{c.email}
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <button className="btn-ghost py-1 px-3 text-xs">Ver histórico</button>
              <button className="btn-secondary py-1 px-3 text-xs">Nova proposta</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
