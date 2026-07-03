'use client'

import { useState, useMemo } from 'react'
import { Search, Package, Users, Building2, ChevronRight, ArrowRight, TrendingUp, Calendar, Tag } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { CLIENTES_SEED } from '@/lib/clientes-seed'
import { PRODUTOS_CATALOGO, FORNECEDORES_CATALOGO, HISTORICO_CONSUMO } from '@/lib/consultas-seed'

type Aba = 'produto' | 'cliente' | 'fornecedor'

export default function ConsultasPage() {
  const [aba, setAba] = useState<Aba>('produto')
  const [busca, setBusca] = useState('')
  const [selecionado, setSelecionado] = useState<string | null>(null)

  // ── Produto → Clientes ──────────────────────────────────────────────
  const produtosFiltrados = useMemo(() =>
    PRODUTOS_CATALOGO.filter(p =>
      !busca || p.nome.toLowerCase().includes(busca.toLowerCase()) || p.codigo.toLowerCase().includes(busca.toLowerCase())
    ), [busca])

  const clientesDoProduto = useMemo(() => {
    if (aba !== 'produto' || !selecionado) return []
    return HISTORICO_CONSUMO
      .filter(h => h.produto_id === selecionado)
      .map(h => {
        const cliente = CLIENTES_SEED.find(c => c.id === h.cliente_id)
        return cliente ? { ...h, cliente } : null
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.valor_mensal - a.valor_mensal) as any[]
  }, [aba, selecionado])

  // ── Cliente → Produtos ──────────────────────────────────────────────
  const clientesFiltrados = useMemo(() =>
    CLIENTES_SEED.filter(c =>
      c.status !== 'prospecto' &&
      (!busca || c.nome.toLowerCase().includes(busca.toLowerCase()) || c.cidade.toLowerCase().includes(busca.toLowerCase()))
    ), [busca])

  const produtosDoCliente = useMemo(() => {
    if (aba !== 'cliente' || !selecionado) return []
    return HISTORICO_CONSUMO
      .filter(h => h.cliente_id === selecionado)
      .map(h => {
        const produto = PRODUTOS_CATALOGO.find(p => p.id === h.produto_id)
        return produto ? { ...h, produto } : null
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.valor_mensal - a.valor_mensal) as any[]
  }, [aba, selecionado])

  // ── Fornecedor → Produtos ───────────────────────────────────────────
  const fornecedoresFiltrados = useMemo(() =>
    FORNECEDORES_CATALOGO.filter(f =>
      !busca || f.nome.toLowerCase().includes(busca.toLowerCase()) || f.pais.toLowerCase().includes(busca.toLowerCase())
    ), [busca])

  const produtosDoFornecedor = useMemo(() => {
    if (aba !== 'fornecedor' || !selecionado) return []
    const forn = FORNECEDORES_CATALOGO.find(f => f.id === selecionado)
    if (!forn) return []
    return forn.produtos_ids.map(pid => {
      const produto = PRODUTOS_CATALOGO.find(p => p.id === pid)
      if (!produto) return null
      const totalClientes = HISTORICO_CONSUMO.filter(h => h.produto_id === pid).length
      const volTotal = HISTORICO_CONSUMO.filter(h => h.produto_id === pid).reduce((s, h) => s + h.volume_medio_kg, 0)
      return { produto, totalClientes, volTotal }
    }).filter(Boolean) as any[]
  }, [aba, selecionado])

  function mudarAba(a: Aba) {
    setAba(a)
    setBusca('')
    setSelecionado(null)
  }

  const ABAS = [
    { key: 'produto'    as Aba, label: 'Produto → Clientes',    icon: Package,   cor: 'text-cyan-600',    bg: 'bg-cyan-50',    active: 'bg-cyan-600' },
    { key: 'cliente'    as Aba, label: 'Cliente → Produtos',    icon: Users,     cor: 'text-violet-600',  bg: 'bg-violet-50',  active: 'bg-violet-600' },
    { key: 'fornecedor' as Aba, label: 'Fornecedor → Produtos', icon: Building2, cor: 'text-emerald-600', bg: 'bg-emerald-50', active: 'bg-emerald-600' },
  ]

  const abaAtual = ABAS.find(a => a.key === aba)!

  // Listas e resultados por aba
  const lista = aba === 'produto' ? produtosFiltrados : aba === 'cliente' ? clientesFiltrados : fornecedoresFiltrados
  const resultado = aba === 'produto' ? clientesDoProduto : aba === 'cliente' ? produtosDoCliente : produtosDoFornecedor
  const nomeItem = (item: any) => aba === 'produto' ? item.nome : aba === 'cliente' ? item.nome : item.nome
  const subItem  = (item: any) => {
    if (aba === 'produto')    return `${item.codigo} · NCM ${item.ncm}`
    if (aba === 'cliente')    return `${item.cidade}/${item.uf} · ${item.vendedor}`
    return `${item.cidade}, ${item.pais} · Prazo ${item.prazo_dias}d`
  }
  const qtdConexoes = (item: any) => {
    if (aba === 'produto')    return HISTORICO_CONSUMO.filter(h => h.produto_id === item.id).length
    if (aba === 'cliente')    return HISTORICO_CONSUMO.filter(h => h.cliente_id === item.id).length
    return (item as any).produtos_ids?.length || 0
  }

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Consulta Cruzada</h1>
        <p className="text-slate-500 text-sm mt-0.5">Relacionamento entre produtos, clientes e fornecedores</p>
      </div>

      {/* Abas */}
      <div className="flex gap-2">
        {ABAS.map(a => {
          const Icon = a.icon
          return (
            <button key={a.key} onClick={() => mudarAba(a.key)}
              className={cn('flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                aba === a.key ? `${a.active} text-white shadow-sm` : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              )}>
              <Icon size={15} /> {a.label}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-5 gap-5" style={{ minHeight: 520 }}>
        {/* Painel esquerdo — lista de itens */}
        <div className="col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
          {/* Busca */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={busca}
                onChange={e => { setBusca(e.target.value); setSelecionado(null) }}
                placeholder={`Buscar ${aba === 'produto' ? 'produto' : aba === 'cliente' ? 'cliente' : 'fornecedor'}…`}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {lista.map((item: any) => {
              const Icon = abaAtual.icon
              const conexoes = qtdConexoes(item)
              const ativo = selecionado === item.id
              return (
                <button key={item.id} onClick={() => setSelecionado(ativo ? null : item.id)}
                  className={cn('w-full text-left px-4 py-3 flex items-center gap-3 transition-colors hover:bg-slate-50',
                    ativo && 'bg-slate-50 border-l-2 border-cyan-500'
                  )}>
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', abaAtual.bg)}>
                    <Icon size={16} className={abaAtual.cor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{nomeItem(item)}</p>
                    <p className="text-[11px] text-slate-400 truncate">{subItem(item)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', abaAtual.bg, abaAtual.cor)}>
                      {conexoes}
                    </span>
                    <ChevronRight size={13} className={cn('transition-transform', ativo && 'rotate-90', 'text-slate-300')} />
                  </div>
                </button>
              )
            })}
            {lista.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                <Search size={32} className="mb-2" />
                <p className="text-sm">Nenhum resultado</p>
              </div>
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
            <p className="text-[11px] text-slate-400">{lista.length} {aba === 'produto' ? 'produtos' : aba === 'cliente' ? 'clientes' : 'fornecedores'} encontrados</p>
          </div>
        </div>

        {/* Painel direito — resultado */}
        <div className="col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
          {!selecionado ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-3">
              <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center', abaAtual.bg)}>
                {aba === 'produto' ? <Package size={28} className={abaAtual.cor} /> :
                 aba === 'cliente' ? <Users size={28} className={abaAtual.cor} /> :
                 <Building2 size={28} className={abaAtual.cor} />}
              </div>
              <p className="text-sm font-medium text-slate-400">Selecione um item à esquerda</p>
              <p className="text-xs text-slate-300">para ver as relações cadastradas</p>
            </div>
          ) : (
            <>
              {/* Header do resultado */}
              {(() => {
                const item = lista.find((i: any) => i.id === selecionado) as any
                if (!item) return null
                return (
                  <div className={cn('px-5 py-4 border-b border-slate-100 flex items-center gap-3')}>
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', abaAtual.bg)}>
                      {aba === 'produto' ? <Package size={18} className={abaAtual.cor} /> :
                       aba === 'cliente' ? <Users size={18} className={abaAtual.cor} /> :
                       <Building2 size={18} className={abaAtual.cor} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 truncate">{nomeItem(item)}</p>
                      <p className="text-xs text-slate-400">{subItem(item)}</p>
                    </div>
                    <div className={cn('text-sm font-bold px-3 py-1 rounded-xl', abaAtual.bg, abaAtual.cor)}>
                      {resultado.length} {aba === 'produto' ? 'clientes' : 'produtos'}
                    </div>
                  </div>
                )
              })()}

              {/* Resultados */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                {resultado.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-300 gap-2">
                    <p className="text-sm">Nenhum histórico encontrado</p>
                  </div>
                )}

                {/* Produto → Clientes */}
                {aba === 'produto' && resultado.map((r: any, i: number) => (
                  <div key={i} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                      <Users size={14} className="text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{r.cliente.nome}</p>
                      <p className="text-[11px] text-slate-400">{r.cliente.cidade}/{r.cliente.uf} · {r.cliente.vendedor}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <TrendingUp size={10} className="text-emerald-500" />
                          {r.volume_medio_kg.toLocaleString('pt-BR')} kg/mês
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Calendar size={10} className="text-cyan-500" />
                          Últ. compra: {r.ultima_compra}
                        </span>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
                          r.cliente.status === 'ativo' ? 'bg-emerald-50 text-emerald-700' :
                          r.cliente.status === 'inadimplente' ? 'bg-red-50 text-red-700' :
                          'bg-amber-50 text-amber-700'
                        )}>
                          {r.cliente.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-slate-900">{formatCurrency(r.valor_mensal)}</p>
                      <p className="text-[10px] text-slate-400">mensal médio</p>
                      <p className="text-[10px] text-slate-400">a cada {r.freq_meses}x/mês</p>
                    </div>
                  </div>
                ))}

                {/* Cliente → Produtos */}
                {aba === 'cliente' && resultado.map((r: any, i: number) => (
                  <div key={i} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-cyan-50 flex items-center justify-center flex-shrink-0">
                      <Package size={14} className="text-cyan-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{r.produto.nome}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Tag size={10} className="text-slate-400" />
                          {r.produto.codigo} · NCM {r.produto.ncm}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <TrendingUp size={10} className="text-emerald-500" />
                          {r.volume_medio_kg.toLocaleString('pt-BR')} kg/mês
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Calendar size={10} className="text-cyan-500" />
                          Últ. compra: {r.ultima_compra}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-slate-900">{formatCurrency(r.valor_mensal)}</p>
                      <p className="text-[10px] text-slate-400">mensal médio</p>
                      <p className="text-[10px] text-slate-400">
                        Preço ref: {formatCurrency(r.produto.preco_medio)}/kg
                      </p>
                    </div>
                  </div>
                ))}

                {/* Fornecedor → Produtos */}
                {aba === 'fornecedor' && resultado.map((r: any, i: number) => (
                  <div key={i} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-cyan-50 flex items-center justify-center flex-shrink-0">
                      <Package size={14} className="text-cyan-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{r.produto.nome}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-slate-500">{r.produto.codigo} · NCM {r.produto.ncm}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                          <Users size={10} />
                          {r.totalClientes} clientes compram este produto
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Vol. total: {r.volTotal.toLocaleString('pt-BR')} kg/mês
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-slate-900">{formatCurrency(r.produto.preco_medio)}/kg</p>
                      <p className="text-[10px] text-slate-400">preço médio venda</p>
                      <p className="text-[10px] text-slate-400">
                        Fat. pot: {formatCurrency(r.produto.preco_medio * r.volTotal)}/mês
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rodapé com totais */}
              {resultado.length > 0 && (
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                  {aba === 'produto' && (
                    <>
                      <span className="text-xs text-slate-500">
                        Volume total: <strong className="text-slate-800">{resultado.reduce((s: number, r: any) => s + r.volume_medio_kg, 0).toLocaleString('pt-BR')} kg/mês</strong>
                      </span>
                      <span className="text-xs text-slate-500">
                        Faturamento mensal: <strong className="text-slate-800">{formatCurrency(resultado.reduce((s: number, r: any) => s + r.valor_mensal, 0))}</strong>
                      </span>
                    </>
                  )}
                  {aba === 'cliente' && (
                    <>
                      <span className="text-xs text-slate-500">
                        {resultado.length} produto{resultado.length > 1 ? 's' : ''} no mix
                      </span>
                      <span className="text-xs text-slate-500">
                        Wallet mensal: <strong className="text-slate-800">{formatCurrency(resultado.reduce((s: number, r: any) => s + r.valor_mensal, 0))}</strong>
                      </span>
                    </>
                  )}
                  {aba === 'fornecedor' && (
                    <>
                      <span className="text-xs text-slate-500">
                        {resultado.length} produto{resultado.length > 1 ? 's' : ''} fornecidos
                      </span>
                      <span className="text-xs text-slate-500">
                        Fat. potencial: <strong className="text-slate-800">{formatCurrency(resultado.reduce((s: number, r: any) => s + r.produto.preco_medio * r.volTotal, 0))}/mês</strong>
                      </span>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
