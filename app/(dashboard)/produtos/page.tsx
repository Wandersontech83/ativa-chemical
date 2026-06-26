'use client'

import { useState } from 'react'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'
import { Plus, Search, Package } from 'lucide-react'

const DEMO_PRODUTOS = [
  { id: 'prd-001', codigo: 'TC-SOL-001', nome: 'Acetona Industrial 99,5%', unidade: 'kg', ncm: '2914.11.00', categoria: 'Solventes Industriais', fornecedor: 'Quimibras', preco_custo: 4.50, preco_venda_sugerido: 6.80, estoque_atual: 1250, estoque_minimo: 500 },
  { id: 'prd-002', codigo: 'TC-SOL-002', nome: 'Tolueno Industrial', unidade: 'kg', ncm: '2902.30.00', categoria: 'Solventes Industriais', fornecedor: 'Quimibras', preco_custo: 5.20, preco_venda_sugerido: 7.90, estoque_atual: 890, estoque_minimo: 300 },
  { id: 'prd-007', codigo: 'TC-RES-001', nome: 'Resina Epóxi Bisfenol A', unidade: 'kg', ncm: '3907.30.11', categoria: 'Resinas e Polímeros', fornecedor: 'Hunan Chemical', preco_custo: 18.50, preco_venda_sugerido: 28.00, estoque_atual: 340, estoque_minimo: 100 },
  { id: 'prd-012', codigo: 'TC-PIG-001', nome: 'Dióxido de Titânio R-902', unidade: 'kg', ncm: '3206.11.10', categoria: 'Pigmentos e Corantes', fornecedor: 'Hunan Chemical', preco_custo: 28.00, preco_venda_sugerido: 43.00, estoque_atual: 480, estoque_minimo: 200 },
  { id: 'prd-017', codigo: 'TC-ADI-001', nome: 'Ftalato de Dioctila (DOP)', unidade: 'kg', ncm: '2917.34.00', categoria: 'Aditivos Industriais', fornecedor: 'GZ Poly', preco_custo: 9.80, preco_venda_sugerido: 14.90, estoque_atual: 1100, estoque_minimo: 500 },
  { id: 'prd-006', codigo: 'TC-SOL-006', nome: 'Acetato de Etila', unidade: 'kg', ncm: '2915.31.10', categoria: 'Solventes Industriais', fornecedor: 'GZ Poly', preco_custo: 6.10, preco_venda_sugerido: 9.20, estoque_atual: 95, estoque_minimo: 200 },
]

export default function ProdutosPage() {
  const [search, setSearch] = useState('')

  const filtered = DEMO_PRODUTOS.filter(p =>
    search === '' || p.nome.toLowerCase().includes(search.toLowerCase()) || p.codigo.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Produtos</h1>
          <p className="text-slate-500 text-sm mt-0.5">{DEMO_PRODUTOS.length} produtos cadastrados</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs">Importar CSV</button>
          <button className="btn-primary"><Plus size={16} /> Novo Produto</button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9 py-1.5" />
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>NCM</th>
              <th>Categoria</th>
              <th className="text-right">Custo</th>
              <th className="text-right">Venda</th>
              <th className="text-right">Margem</th>
              <th className="text-right">Estoque</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const margem = ((p.preco_venda_sugerido - p.preco_custo) / p.preco_venda_sugerido) * 100
              const critico = p.estoque_atual <= p.estoque_minimo
              return (
                <tr key={p.id}>
                  <td className="font-mono text-xs text-slate-500">{p.codigo}</td>
                  <td>
                    <div className="font-medium text-slate-800">{p.nome}</div>
                    <div className="text-xs text-slate-400">{p.fornecedor} · {p.unidade}</div>
                  </td>
                  <td className="font-mono text-xs text-slate-500">{p.ncm}</td>
                  <td className="text-xs text-slate-500">{p.categoria}</td>
                  <td className="text-right text-sm">{formatCurrency(p.preco_custo)}</td>
                  <td className="text-right text-sm font-medium">{formatCurrency(p.preco_venda_sugerido)}</td>
                  <td className="text-right">
                    <span className={cn('text-sm font-semibold', margem >= 30 ? 'text-emerald-600' : 'text-yellow-600')}>
                      {margem.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-right">
                    <span className={cn('text-sm font-semibold', critico ? 'text-red-600' : 'text-slate-700')}>
                      {formatNumber(p.estoque_atual, 0)} {p.unidade}
                    </span>
                    {critico && <div className="text-[10px] text-red-500">abaixo do mín.</div>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
