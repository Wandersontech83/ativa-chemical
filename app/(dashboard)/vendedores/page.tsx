'use client'

import { useState } from 'react'
import { Users, TrendingUp, DollarSign, Target, Trophy, ChevronRight, Star, MapPin } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { VENDEDORES_SEED, CLIENTES_SEED } from '@/lib/clientes-seed'
import { loadData, saveData } from '@/lib/storage'

type Vendedor = typeof VENDEDORES_SEED[0]

// Vendas simuladas por vendedor
const VENDAS_MES: Record<string, { faturamento: number; quantidade: number; pedidos: number; lucro: number }> = {
  'Wanderson Lima': { faturamento: 327500, quantidade: 4200, pedidos: 18, lucro: 115000 },
  'Carlos Souza':   { faturamento: 485000, quantidade: 5900, pedidos: 24, lucro: 168000 },
  'Ana Lima':       { faturamento: 298000, quantidade: 3700, pedidos: 16, lucro: 102000 },
  'Marcos Pereira': { faturamento: 215000, quantidade: 2800, pedidos: 12, lucro: 74000 },
}

const HISTORICO_MENSAL: Record<string, { mes: string; fat: number }[]> = {
  'Wanderson Lima': [
    { mes:'Jul', fat:210000 },{ mes:'Ago', fat:240000 },{ mes:'Set', fat:195000 },
    { mes:'Out', fat:310000 },{ mes:'Nov', fat:285000 },{ mes:'Dez', fat:327500 },
  ],
  'Carlos Souza': [
    { mes:'Jul', fat:320000 },{ mes:'Ago', fat:380000 },{ mes:'Set', fat:290000 },
    { mes:'Out', fat:450000 },{ mes:'Nov', fat:420000 },{ mes:'Dez', fat:485000 },
  ],
  'Ana Lima': [
    { mes:'Jul', fat:180000 },{ mes:'Ago', fat:210000 },{ mes:'Set', fat:175000 },
    { mes:'Out', fat:265000 },{ mes:'Nov', fat:245000 },{ mes:'Dez', fat:298000 },
  ],
  'Marcos Pereira': [
    { mes:'Jul', fat:140000 },{ mes:'Ago', fat:160000 },{ mes:'Set', fat:130000 },
    { mes:'Out', fat:200000 },{ mes:'Nov', fat:185000 },{ mes:'Dez', fat:215000 },
  ],
}

function calcularComissao(faturamento: number, lucro: number, faixas: Vendedor['comissao_faixas']) {
  const margem = faturamento > 0 ? (lucro / faturamento) * 100 : 0
  const faixa = faixas.find(f => margem >= f.margem_min && margem < f.margem_max) || faixas[faixas.length - 1]
  return { pct: faixa.pct, valor: faturamento * (faixa.pct / 100), margem }
}

export default function VendedoresPage() {
  const vendedores = loadData('vendedores', VENDEDORES_SEED)
  const clientes = loadData('clientes_geo', CLIENTES_SEED)
  const [selecionado, setSelecionado] = useState<Vendedor>(vendedores[0])
  const [abaDetalhe, setAbaDetalhe] = useState<'kpis' | 'comissao' | 'clientes' | 'meta'>('kpis')
  const [editandoMeta, setEditandoMeta] = useState(false)
  const [novaMeta, setNovaMeta] = useState({ brl: 0, kg: 0 })

  const totalEmpresa = Object.values(VENDAS_MES).reduce((s, v) => s + v.faturamento, 0)

  const ranking = vendedores.map(v => {
    const vendas = VENDAS_MES[v.nome] || { faturamento: 0, quantidade: 0, pedidos: 0, lucro: 0 }
    const comissao = calcularComissao(vendas.faturamento, vendas.lucro, v.comissao_faixas)
    const carteira = clientes.filter(c => c.vendedor === v.nome)
    const ativos = carteira.filter(c => c.status === 'ativo').length
    const atingimento = v.meta_mensal_brl > 0 ? (vendas.faturamento / v.meta_mensal_brl) * 100 : 0
    return { ...v, vendas, comissao, carteira, ativos, atingimento }
  }).sort((a, b) => b.vendas.faturamento - a.vendas.faturamento)

  const detalhe = ranking.find(r => r.id === selecionado.id) || ranking[0]
  const vendas = detalhe.vendas
  const comissao = detalhe.comissao
  const historico = HISTORICO_MENSAL[selecionado.nome] || []

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Painel de Vendedores</h1>
        <p className="text-slate-500 text-sm mt-0.5">Carteira, comissões e metas — Dezembro 2024</p>
      </div>

      {/* Ranking rápido */}
      <div className="grid grid-cols-4 gap-3">
        {ranking.map((v, i) => (
          <button key={v.id} onClick={() => setSelecionado(v)}
            className={cn('bg-white rounded-2xl border shadow-sm p-4 text-left transition-all hover:shadow-md', v.id === selecionado.id ? 'border-cyan-400 ring-1 ring-cyan-200' : 'border-slate-100')}>
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center text-sm font-bold', i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : 'bg-orange-50 text-orange-600')}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </div>
              <span className="text-xs font-semibold text-slate-700 leading-tight">{v.nome.split(' ')[0]}</span>
            </div>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(v.vendas.faturamento)}</p>
            <p className="text-xs text-slate-400">{((v.vendas.faturamento / totalEmpresa) * 100).toFixed(1)}% do total</p>
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all"
                style={{ width: `${Math.min(v.atingimento, 100)}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">{v.atingimento.toFixed(0)}% da meta</p>
          </button>
        ))}
      </div>

      {/* Detalhe do vendedor */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header vendedor */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-4" style={{ background: 'linear-gradient(135deg,#0c1829,#162035)' }}>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
            {selecionado.nome.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-lg">{selecionado.nome}</p>
            <p className="text-cyan-300 text-xs">{selecionado.email} · UFs: {selecionado.ufs.join(', ')}</p>
          </div>
          <div className="flex gap-3">
            {[{ k:'kpis', l:'KPIs' }, { k:'comissao', l:'Comissão' }, { k:'clientes', l:'Carteira' }, { k:'meta', l:'Meta' }].map(a => (
              <button key={a.k} onClick={() => setAbaDetalhe(a.k as any)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors', abaDetalhe === a.k ? 'bg-cyan-500 text-white' : 'text-slate-300 hover:text-white')}>
                {a.l}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* ABA KPIs */}
          {abaDetalhe === 'kpis' && (
            <div className="space-y-5">
              <div className="grid grid-cols-4 gap-4">
                {[
                  { l:'Faturamento', v:formatCurrency(vendas.faturamento), icon:<DollarSign size={16} className="text-cyan-500" />, bg:'bg-cyan-50' },
                  { l:'Qtd (kg)', v:`${vendas.quantidade.toLocaleString('pt-BR')} kg`, icon:<TrendingUp size={16} className="text-blue-500" />, bg:'bg-blue-50' },
                  { l:'Lucro', v:formatCurrency(vendas.lucro), icon:<Trophy size={16} className="text-emerald-500" />, bg:'bg-emerald-50' },
                  { l:'Participação', v:`${((vendas.faturamento / totalEmpresa) * 100).toFixed(1)}%`, icon:<Star size={16} className="text-amber-500" />, bg:'bg-amber-50' },
                ].map(k => (
                  <div key={k.l} className="bg-slate-50 rounded-xl p-4 flex items-center gap-3">
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', k.bg)}>{k.icon}</div>
                    <div><p className="text-xs text-slate-500">{k.l}</p><p className="text-lg font-bold text-slate-900">{k.v}</p></div>
                  </div>
                ))}
              </div>

              {/* Mini gráfico de barras */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Evolução mensal</p>
                <div className="flex items-end gap-2 h-28">
                  {historico.map((h, i) => {
                    const max = Math.max(...historico.map(x => x.fat))
                    const pct = (h.fat / max) * 100
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] text-slate-400">{(h.fat/1000).toFixed(0)}k</span>
                        <div className="w-full rounded-t-md" style={{ height: `${pct}%`, minHeight: 4, background: 'linear-gradient(180deg,#06b6d4,#2563eb)' }} />
                        <span className="text-[10px] text-slate-500">{h.mes}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ABA COMISSÃO */}
          {abaDetalhe === 'comissao' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-50 rounded-xl p-4">
                  <p className="text-xs text-emerald-600">Margem do mês</p>
                  <p className="text-2xl font-bold text-emerald-700">{comissao.margem.toFixed(1)}%</p>
                </div>
                <div className="bg-cyan-50 rounded-xl p-4">
                  <p className="text-xs text-cyan-600">% Comissão (faixa)</p>
                  <p className="text-2xl font-bold text-cyan-700">{comissao.pct}%</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs text-blue-600">Comissão acumulada</p>
                  <p className="text-2xl font-bold text-blue-700">{formatCurrency(comissao.valor)}</p>
                </div>
              </div>

              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">Tabela de faixas (tiered)</div>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100"><th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">Margem</th><th className="text-right px-4 py-2 text-xs text-slate-500 font-medium">% Comissão</th><th className="px-4 py-2"></th></tr></thead>
                  <tbody>
                    {selecionado.comissao_faixas.map((f, i) => {
                      const ativa = comissao.margem >= f.margem_min && comissao.margem < f.margem_max
                      return (
                        <tr key={i} className={cn('border-b border-slate-50', ativa && 'bg-cyan-50')}>
                          <td className="px-4 py-2 text-slate-700">{f.margem_min}% – {f.margem_max === 100 ? '+' : f.margem_max + '%'}</td>
                          <td className="px-4 py-2 text-right font-bold text-slate-800">{f.pct}%</td>
                          <td className="px-4 py-2 text-right">{ativa && <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-semibold">✓ Faixa atual</span>}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500">
                Projeção mês (se manter ritmo): <strong className="text-slate-800">{formatCurrency(comissao.valor * 1.1)}</strong>
              </div>
            </div>
          )}

          {/* ABA CARTEIRA */}
          {abaDetalhe === 'clientes' && (
            <div>
              <p className="text-sm text-slate-500 mb-3">{detalhe.carteira.length} clientes na carteira · {detalhe.ativos} ativos</p>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {detalhe.carteira.map(c => (
                  <div key={c.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: { ativo:'#10b981', inativo:'#94a3b8', prospecto:'#3b82f6', sem_compra:'#f59e0b', inadimplente:'#ef4444' }[c.status] || '#64748b' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{c.nome}</p>
                      <p className="text-xs text-slate-400">{c.cidade}/{c.uf}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-700">{c.faturamento12m > 0 ? formatCurrency(c.faturamento12m) : '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA META */}
          {abaDetalhe === 'meta' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { l:'Meta BRL', meta: selecionado.meta_mensal_brl, atual: vendas.faturamento, fmt: formatCurrency },
                  { l:'Meta KG', meta: selecionado.meta_mensal_kg, atual: vendas.quantidade, fmt: (v: number) => `${v.toLocaleString('pt-BR')} kg` },
                ].map(({ l, meta, atual, fmt }) => {
                  const pct = meta > 0 ? Math.min((atual / meta) * 100, 100) : 0
                  return (
                    <div key={l} className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">{l}</p>
                      <p className="text-xl font-bold text-slate-900 mb-1">{fmt(atual)}</p>
                      <p className="text-xs text-slate-400 mb-2">Meta: {fmt(meta)}</p>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all', pct >= 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-cyan-500' : 'bg-amber-400')} style={{ width: `${pct}%` }} />
                      </div>
                      <p className={cn('text-xs font-bold mt-1', pct >= 100 ? 'text-emerald-600' : pct >= 70 ? 'text-cyan-600' : 'text-amber-600')}>{pct.toFixed(0)}% atingido</p>
                    </div>
                  )
                })}
              </div>

              {!editandoMeta ? (
                <button onClick={() => { setEditandoMeta(true); setNovaMeta({ brl: selecionado.meta_mensal_brl, kg: selecionado.meta_mensal_kg }) }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors">
                  Editar metas
                </button>
              ) : (
                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Editar metas mensais</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Meta BRL (R$)</label>
                      <input type="number" value={novaMeta.brl} onChange={e => setNovaMeta(p => ({ ...p, brl: Number(e.target.value) }))}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Meta KG</label>
                      <input type="number" value={novaMeta.kg} onChange={e => setNovaMeta(p => ({ ...p, kg: Number(e.target.value) }))}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      const atualizado = loadData('vendedores', VENDEDORES_SEED).map(v => v.id === selecionado.id ? { ...v, meta_mensal_brl: novaMeta.brl, meta_mensal_kg: novaMeta.kg } : v)
                      saveData('vendedores', atualizado)
                      setSelecionado(atualizado.find(v => v.id === selecionado.id)!)
                      setEditandoMeta(false)
                    }} className="px-4 py-1.5 bg-cyan-600 text-white text-sm font-semibold rounded-lg">Salvar</button>
                    <button onClick={() => setEditandoMeta(false)} className="px-4 py-1.5 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg">Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
