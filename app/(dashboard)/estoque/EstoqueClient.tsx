'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { formatNumber, formatCurrency, formatDateTime, cn } from '@/lib/utils'
import { Package, Upload, Camera, AlertTriangle, Search, Filter, TrendingDown, TrendingUp, Minus, FileText } from 'lucide-react'
import BarcodeScanner from '@/components/barcode-scanner/BarcodeScanner'

const DEMO_PRODUCTS = [
  { id: 'prd-006', codigo: 'TC-SOL-006', nome: 'Acetato de Etila', unidade: 'kg', estoque_atual: 95, estoque_minimo: 200, estoque_reservado: 0, preco_custo: 6.10, localizacao_armazem: 'A-01-06', categoria_nome: 'Solventes Industriais', fornecedor_nome: 'GZ Poly' },
  { id: 'prd-016', codigo: 'TC-PIG-005', nome: 'Amarelo Óxido de Ferro', unidade: 'kg', estoque_atual: 30, estoque_minimo: 100, estoque_reservado: 0, preco_custo: 7.20, localizacao_armazem: 'C-01-05', categoria_nome: 'Pigmentos e Corantes', fornecedor_nome: 'SD United' },
  { id: 'prd-001', codigo: 'TC-SOL-001', nome: 'Acetona Industrial 99,5%', unidade: 'kg', estoque_atual: 1250, estoque_minimo: 500, estoque_reservado: 0, preco_custo: 4.50, localizacao_armazem: 'A-01-01', categoria_nome: 'Solventes Industriais', fornecedor_nome: 'Quimibras' },
  { id: 'prd-002', codigo: 'TC-SOL-002', nome: 'Tolueno Industrial', unidade: 'kg', estoque_atual: 890, estoque_minimo: 300, estoque_reservado: 0, preco_custo: 5.20, localizacao_armazem: 'A-01-02', categoria_nome: 'Solventes Industriais', fornecedor_nome: 'Quimibras' },
  { id: 'prd-007', codigo: 'TC-RES-001', nome: 'Resina Epóxi Bisfenol A', unidade: 'kg', estoque_atual: 340, estoque_minimo: 100, estoque_reservado: 0, preco_custo: 18.50, localizacao_armazem: 'B-01-01', categoria_nome: 'Resinas e Polímeros', fornecedor_nome: 'Hunan Chemical' },
  { id: 'prd-012', codigo: 'TC-PIG-001', nome: 'Dióxido de Titânio R-902', unidade: 'kg', estoque_atual: 480, estoque_minimo: 200, estoque_reservado: 0, preco_custo: 28.00, localizacao_armazem: 'C-01-01', categoria_nome: 'Pigmentos e Corantes', fornecedor_nome: 'Hunan Chemical' },
  { id: 'prd-017', codigo: 'TC-ADI-001', nome: 'Ftalato de Dioctila (DOP)', unidade: 'kg', estoque_atual: 1100, estoque_minimo: 500, estoque_reservado: 0, preco_custo: 9.80, localizacao_armazem: 'D-01-01', categoria_nome: 'Aditivos Industriais', fornecedor_nome: 'GZ Poly' },
]

const DEMO_MOVEMENTS = [
  { id: '1', produto_nome: 'Acetona Industrial 99,5%', produto_codigo: 'TC-SOL-001', tipo: 'entrada', quantidade: 1500, documento_tipo: 'NF-e', documento_numero: 'NF-2024-0892', preco_unitario: 4.50, created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: '2', produto_nome: 'Dióxido de Titânio R-902', produto_codigo: 'TC-PIG-001', tipo: 'saida', quantidade: 250, documento_tipo: 'Pedido', documento_numero: 'PV-2024-002', preco_unitario: 43.00, created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: '3', produto_nome: 'Resina Epóxi Bisfenol A', produto_codigo: 'TC-RES-001', tipo: 'entrada', quantidade: 400, documento_tipo: 'NF-e', documento_numero: 'NF-2024-0756', preco_unitario: 18.50, created_at: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: '4', produto_nome: 'Acetato de Etila', produto_codigo: 'TC-SOL-006', tipo: 'saida', quantidade: 505, documento_tipo: 'Pedido', documento_numero: 'PV-2024-historico', preco_unitario: 9.20, created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
]

interface EstoqueData {
  products: Record<string, unknown>[]
  movements: Record<string, unknown>[]
}

export default function EstoqueClient({ data }: { data: EstoqueData }) {
  const products = data.products?.length ? data.products : DEMO_PRODUCTS
  const movements = data.movements?.length ? data.movements : DEMO_MOVEMENTS
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'todos' | 'critico' | 'normal'>('todos')
  const [activeTab, setActiveTab] = useState<'estoque' | 'movimentacoes' | 'entrada-xml' | 'entrada-barcode'>('estoque')
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [xmlFile, setXmlFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtered = (products as typeof DEMO_PRODUCTS).filter((p) => {
    const matchSearch = search === '' ||
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'todos' ||
      (filter === 'critico' && p.estoque_atual <= p.estoque_minimo) ||
      (filter === 'normal' && p.estoque_atual > p.estoque_minimo)
    return matchSearch && matchFilter
  })

  const criticos = (products as typeof DEMO_PRODUCTS).filter(p => p.estoque_atual <= p.estoque_minimo).length

  async function handleXmlUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!xmlFile) return
    setUploading(true)
    try {
      const text = await xmlFile.text()
      const res = await fetch('/api/estoque/entrada-xml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xml: text, filename: xmlFile.name }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      toast.success(`NF-e processada! ${result.itens?.length || 0} itens atualizados no estoque.`)
      setXmlFile(null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao processar XML')
    } finally {
      setUploading(false)
    }
  }

  function handleBarcodeRead(chave: string) {
    setShowBarcodeScanner(false)
    toast.info(`Chave lida: ${chave}. Consultando SEFAZ...`)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Estoque</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {products.length} produtos cadastrados
            {criticos > 0 && (
              <span className="ml-2 text-red-600 font-medium">· {criticos} abaixo do mínimo</span>
            )}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {[
          { id: 'estoque', label: 'Posição de Estoque' },
          { id: 'movimentacoes', label: 'Movimentações' },
          { id: 'entrada-xml', label: 'Entrada por XML' },
          { id: 'entrada-barcode', label: 'Leitor de Código' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Posição de Estoque */}
      {activeTab === 'estoque' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar produto ou código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input pl-9 py-1.5"
              />
            </div>
            <div className="flex gap-1">
              {(['todos', 'critico', 'normal'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    filter === f ? 'bg-primary-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  )}
                >
                  {f === 'todos' ? 'Todos' : f === 'critico' ? '⚠ Crítico' : 'Normal'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th className="text-right">Estoque Atual</th>
                  <th className="text-right">Mínimo</th>
                  <th>Localização</th>
                  <th className="text-right">Vlr. Custo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const critico = p.estoque_atual <= p.estoque_minimo
                  const percentual = p.estoque_minimo > 0 ? (p.estoque_atual / p.estoque_minimo) * 100 : 100
                  return (
                    <tr key={p.id} className={cn(critico && 'bg-red-50/30')}>
                      <td className="font-mono text-xs text-slate-500">{p.codigo}</td>
                      <td>
                        <div className="font-medium text-slate-800">{p.nome}</div>
                        <div className="text-xs text-slate-400">{p.fornecedor_nome}</div>
                      </td>
                      <td className="text-xs text-slate-500">{p.categoria_nome}</td>
                      <td className="text-right font-semibold">
                        <span className={critico ? 'text-red-600' : 'text-slate-800'}>
                          {formatNumber(p.estoque_atual, 0)} {p.unidade}
                        </span>
                      </td>
                      <td className="text-right text-slate-500 text-sm">
                        {formatNumber(p.estoque_minimo, 0)} {p.unidade}
                      </td>
                      <td className="font-mono text-xs text-slate-500">{p.localizacao_armazem}</td>
                      <td className="text-right text-sm">{formatCurrency(p.preco_custo)}/{p.unidade}</td>
                      <td>
                        {critico ? (
                          <span className="badge-red flex items-center gap-1">
                            <AlertTriangle size={10} /> Crítico
                          </span>
                        ) : percentual < 150 ? (
                          <span className="badge-yellow">Baixo</span>
                        ) : (
                          <span className="badge-green">Normal</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Movimentações */}
      {activeTab === 'movimentacoes' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Produto</th>
                <th>Tipo</th>
                <th className="text-right">Quantidade</th>
                <th>Documento</th>
                <th className="text-right">Vlr. Unit.</th>
              </tr>
            </thead>
            <tbody>
              {(movements as typeof DEMO_MOVEMENTS).map((m) => (
                <tr key={m.id}>
                  <td className="text-xs text-slate-500">{formatDateTime(m.created_at)}</td>
                  <td>
                    <div className="font-medium text-slate-800 text-sm">{m.produto_nome}</div>
                    <div className="text-xs text-slate-400 font-mono">{m.produto_codigo}</div>
                  </td>
                  <td>
                    <span className={cn('flex items-center gap-1 text-xs font-medium w-fit px-2 py-0.5 rounded-full',
                      m.tipo === 'entrada' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    )}>
                      {m.tipo === 'entrada' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {m.tipo.charAt(0).toUpperCase() + m.tipo.slice(1)}
                    </span>
                  </td>
                  <td className="text-right font-semibold text-sm">{formatNumber(m.quantidade, 0)} kg</td>
                  <td className="text-xs text-slate-500">
                    <span className="font-medium">{m.documento_tipo}</span> — {m.documento_numero}
                  </td>
                  <td className="text-right text-sm">{formatCurrency(m.preco_unitario)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Entrada por XML */}
      {activeTab === 'entrada-xml' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 max-w-lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-primary-50 rounded-lg">
              <FileText size={20} className="text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Entrada por XML de NF-e</h3>
              <p className="text-sm text-slate-500">Faça upload do arquivo XML da nota fiscal</p>
            </div>
          </div>

          <form onSubmit={handleXmlUpload} className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
            >
              <Upload size={32} className="mx-auto text-slate-300 mb-3" />
              {xmlFile ? (
                <div>
                  <p className="font-medium text-slate-700">{xmlFile.name}</p>
                  <p className="text-sm text-slate-400">{(xmlFile.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="text-slate-500 font-medium">Clique para selecionar o XML</p>
                  <p className="text-slate-400 text-sm mt-1">Arquivo .xml de NF-e de entrada</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xml"
              className="hidden"
              onChange={(e) => setXmlFile(e.target.files?.[0] || null)}
            />

            <button type="submit" disabled={!xmlFile || uploading} className="btn-primary w-full justify-center">
              {uploading ? 'Processando...' : 'Processar NF-e'}
            </button>
          </form>

          <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
            <strong>O que acontece após o upload:</strong>
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>N8N parseia as tags det, prod, emit e dest</li>
              <li>Produtos são criados/atualizados no banco</li>
              <li>Estoque é incrementado automaticamente</li>
              <li>NF de entrada é registrada como documento fiscal</li>
            </ul>
          </div>
        </div>
      )}

      {/* Leitor de Código de Barras */}
      {activeTab === 'entrada-barcode' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 max-w-lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-secondary-50 rounded-lg">
              <Camera size={20} className="text-secondary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Leitor de Código de Barras</h3>
              <p className="text-sm text-slate-500">Leia o código da DANFE ou insira a chave manualmente</p>
            </div>
          </div>

          {showBarcodeScanner ? (
            <BarcodeScanner
              onRead={handleBarcodeRead}
              onClose={() => setShowBarcodeScanner(false)}
            />
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setShowBarcodeScanner(true)}
                className="w-full flex items-center justify-center gap-3 py-4 border-2 border-dashed border-secondary-200 rounded-xl hover:border-secondary-400 hover:bg-secondary-50/30 transition-colors text-secondary-600 font-medium"
              >
                <Camera size={24} />
                Abrir câmera
              </button>

              <div className="relative flex items-center gap-2">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400">ou</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <div>
                <label className="form-label">Chave de Acesso (44 dígitos)</label>
                <input
                  type="text"
                  placeholder="Digite ou cole a chave de acesso..."
                  maxLength={44}
                  className="form-input font-mono text-sm"
                  onChange={(e) => {
                    if (e.target.value.length === 44) {
                      handleBarcodeRead(e.target.value)
                    }
                  }}
                />
                <p className="text-xs text-slate-400 mt-1">
                  A chave é lida automaticamente ao completar 44 dígitos
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
