'use client'

import { useState, useEffect } from 'react'
import { Calculator, DollarSign, TrendingUp, Save, FileDown, RefreshCw, AlertCircle, ChevronDown, Printer } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { saveData, loadData, genId } from '@/lib/storage'

const PRODUTOS = [
  { nome:'Acetona Industrial 99,5%', ncm:'2914.11.00', ii:4, ipi:0 },
  { nome:'Tolueno Industrial',       ncm:'2902.30.00', ii:2, ipi:0 },
  { nome:'Resina Epóxi Bisfenol A',  ncm:'3907.30.00', ii:12, ipi:5 },
  { nome:'Dióxido de Titânio R-902', ncm:'2823.00.10', ii:12, ipi:0 },
  { nome:'Ftalato de Dioctila (DOP)',ncm:'2917.34.00', ii:14, ipi:5 },
  { nome:'Acetato de Etila',         ncm:'2915.31.00', ii:6, ipi:0 },
]

const ALIQ_ICMS: Record<string, number> = {
  SP:18, MG:18, RJ:20, RS:17, PR:12, SC:17, GO:17, DF:18, BA:19, CE:18, PE:17, AM:20
}

const UFS = Object.keys(ALIQ_ICMS)

interface Calculo {
  va: number; ii: number; ipi: number; pis: number; cofins: number
  icms: number; afrmm: number; siscomex: number; frete_interno: number; despachante: number
  total: number; custo_unitario: number; preco_venda: number; margem: number
}

export default function CalculadoraImportacaoPage() {
  // Inputs
  const [produto, setProduto] = useState(PRODUTOS[0])
  const [precoUnitario, setPrecoUnitario] = useState(10000)
  const [moeda, setMoeda] = useState<'USD'|'EUR'|'CNY'>('USD')
  const [quantidade, setQuantidade] = useState(1000)
  const [incoterm, setIncoterm] = useState<'FOB'|'CIF'|'EXW'>('FOB')
  const [freteInt, setFreteInt] = useState(1200)
  const [seguroPct, setSeguroPct] = useState(0.5)
  const [modal, setModal] = useState<'maritimo'|'aereo'>('maritimo')
  const [ufDestino, setUfDestino] = useState('SP')
  const [margemDesejada, setMargemDesejada] = useState(35)
  const [considerarCreditos, setConsiderarCreditos] = useState(false)
  const [freteInterno, setFreteInterno] = useState(3500)
  const [despachante, setDespachante] = useState(4200)
  const [siscomex, setSiscomex] = useState(185)

  // Câmbio
  const [cambio, setCambio] = useState<Record<string, number>>({ USD: 5.05, EUR: 5.55, CNY: 0.77 })
  const [cambioManual, setCambioManual] = useState(false)
  const [loadingCambio, setLoadingCambio] = useState(false)
  const [dataCambio, setDataCambio] = useState('')

  const [calc, setCalc] = useState<Calculo | null>(null)
  const [historico, setHistorico] = useState<any[]>(() => loadData('calc_importacao', []))
  const [nomeSim, setNomeSim] = useState('')

  async function buscarPTAX() {
    setLoadingCambio(true)
    try {
      const hoje = new Date()
      const d = `${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}-${hoje.getFullYear()}`
      const [rUsd, rEur] = await Promise.all([
        fetch(`https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${d}'&$top=1&$format=json`).then(r => r.json()),
        fetch(`https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)?@moeda='EUR'&@dataCotacao='${d}'&$top=1&$format=json`).then(r => r.json()),
      ])
      const usdVal = rUsd?.value?.[0]?.cotacaoVenda
      const eurVal = rEur?.value?.[0]?.cotacaoVenda
      if (usdVal) setCambio(prev => ({ ...prev, USD: usdVal }))
      if (eurVal) setCambio(prev => ({ ...prev, EUR: eurVal }))
      setDataCambio(new Date().toLocaleDateString('pt-BR'))
    } catch { } finally { setLoadingCambio(false) }
  }

  useEffect(() => { buscarPTAX() }, [])

  useEffect(() => { calcular() }, [produto, precoUnitario, moeda, quantidade, incoterm, freteInt, seguroPct, modal, ufDestino, margemDesejada, considerarCreditos, freteInterno, despachante, siscomex, cambio])

  function calcular() {
    const taxa = cambio[moeda] || 5.05
    const valorMerc = precoUnitario * taxa
    const freteBRL = incoterm === 'CIF' ? freteInt * taxa : freteInt * taxa
    const seguroBRL = (valorMerc + freteBRL) * (seguroPct / 100)
    const va = valorMerc + freteBRL + seguroBRL

    const ii = va * (produto.ii / 100)
    const ipi = (va + ii) * (produto.ipi / 100)
    const pis = va * 0.021
    const cofins = va * 0.0965
    const afrmm = modal === 'maritimo' ? (freteInt * taxa * 0.08) : 0
    const aliqICMS = (ALIQ_ICMS[ufDestino] || 18) / 100
    const baseICMS = va + ii + ipi + pis + cofins + freteInterno
    const icms = (aliqICMS * baseICMS) / (1 - aliqICMS)

    const tributosRecuperaveis = considerarCreditos ? (pis + cofins + icms * 0.5) : 0
    const total = va + ii + ipi + pis + cofins + icms + afrmm + siscomex + freteInterno + despachante - tributosRecuperaveis
    const custo_unitario = quantidade > 0 ? total / quantidade : 0

    const preco_venda = custo_unitario / (1 - margemDesejada / 100)
    const margem = preco_venda > 0 ? ((preco_venda - custo_unitario) / preco_venda) * 100 : 0

    setCalc({ va, ii, ipi, pis, cofins, icms, afrmm, siscomex: Number(siscomex), frete_interno: freteInterno, despachante, total, custo_unitario, preco_venda, margem })
  }

  async function exportarPDF() {
    if (!calc) return
    const { jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF()

    // Cabeçalho
    doc.setFillColor(12, 24, 41)
    doc.rect(0, 0, 210, 30, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('ATIVA CHEMICAL', 14, 13)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Simulação de Custo de Importação', 14, 21)
    doc.setFontSize(9)
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 14, 27)

    // Info do produto
    doc.setTextColor(30, 41, 59)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Parâmetros da Simulação', 14, 42)
    autoTable(doc, {
      startY: 46,
      head: [['Campo', 'Valor']],
      body: [
        ['Produto', produto.nome],
        ['NCM', produto.ncm],
        ['Valor FOB', `${moeda} ${precoUnitario.toLocaleString('pt-BR')}`],
        ['Câmbio', `${cambio[moeda].toFixed(4)} BRL/${moeda}`],
        ['Quantidade', `${quantidade.toLocaleString('pt-BR')} kg`],
        ['Incoterm', incoterm],
        ['Modal', modal === 'maritimo' ? 'Marítimo' : 'Aéreo'],
        ['UF Destino', ufDestino],
        ['Alíquota ICMS', `${ALIQ_ICMS[ufDestino] || 18}% (por dentro)`],
        ['Créditos recuperáveis', considerarCreditos ? 'Sim' : 'Não'],
      ],
      headStyles: { fillColor: [6, 182, 212], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 9 },
    })

    // Breakdown de custos
    const y2 = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    doc.text('Composição do Custo Total', 14, y2)
    autoTable(doc, {
      startY: y2 + 4,
      head: [['Componente', 'Valor (R$)', '% do Total']],
      body: [
        ...parcelas.map(p => [p.l, p.v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), `${((p.v / calc.total) * 100).toFixed(1)}%`]),
        ['TOTAL', calc.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), '100%'],
      ],
      headStyles: { fillColor: [12, 24, 41], textColor: 255, fontStyle: 'bold' },
      footStyles: { fillColor: [6, 182, 212], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9 },
    })

    // Resultado final
    const y3 = (doc as any).lastAutoTable.finalY + 10
    doc.setFillColor(6, 182, 212)
    doc.rect(14, y3, 182, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('RESULTADO FINAL', 18, y3 + 8)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Custo Unitário: R$ ${calc.custo_unitario.toFixed(4)}/kg`, 18, y3 + 15)
    doc.text(`Preço de Venda (${margemDesejada}% margem): R$ ${calc.preco_venda.toFixed(4)}/kg`, 18, y3 + 21)
    doc.text(`Custo Total (${quantidade.toLocaleString('pt-BR')} kg): R$ ${calc.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 100, y3 + 15)
    doc.text(`Margem efetiva: ${calc.margem.toFixed(2)}%`, 100, y3 + 21)

    doc.setTextColor(148, 163, 184)
    doc.setFontSize(7)
    doc.text('Este documento é gerado automaticamente pelo sistema Ativa Chemical ERP. Sujeito a variações cambiais e tributárias.', 14, 290)

    doc.save(`simulacao-importacao-${produto.nome.toLowerCase().replace(/\s+/g,'-')}-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  function salvarSimulacao() {
    if (!calc) return
    const nova = {
      id: genId('sim'), nome: nomeSim || `Simulação ${new Date().toLocaleDateString('pt-BR')}`,
      data: new Date().toISOString(), produto: produto.nome, moeda, cambio_usado: cambio[moeda],
      valor_fob: precoUnitario, quantidade, ...calc
    }
    const atualizado = [nova, ...historico].slice(0, 20)
    saveData('calc_importacao', atualizado)
    setHistorico(atualizado)
    setNomeSim('')
  }

  const parcelas = calc ? [
    { l:'Valor Aduaneiro (VA)', v:calc.va, cor:'#06b6d4' },
    { l:`II (${produto.ii}%)`, v:calc.ii, cor:'#2563eb' },
    { l:`IPI (${produto.ipi}%)`, v:calc.ipi, cor:'#7c3aed' },
    { l:'PIS-Importação (2,10%)', v:calc.pis, cor:'#0891b2' },
    { l:'COFINS-Importação (9,65%)', v:calc.cofins, cor:'#0e7490' },
    { l:`ICMS-${ufDestino} (${ALIQ_ICMS[ufDestino] || 18}% por dentro)`, v:calc.icms, cor:'#1d4ed8' },
    { l:'AFRMM (8%)', v:calc.afrmm, cor:'#4338ca' },
    { l:'Taxa Siscomex', v:calc.siscomex, cor:'#6d28d9' },
    { l:'Frete Interno', v:calc.frete_interno, cor:'#7c2d12' },
    { l:'Despachante', v:calc.despachante, cor:'#92400e' },
  ].filter(p => p.v > 0) : []

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Calculadora de Importação</h1>
          <p className="text-slate-500 text-sm mt-0.5">Custo real de importação + precificação química</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <span className="text-xs text-slate-500">PTAX hoje:</span>
            <span className="text-xs font-bold text-slate-800">USD {cambio.USD.toFixed(3)}</span>
            <button onClick={buscarPTAX} disabled={loadingCambio} className="text-cyan-500 hover:text-cyan-600">
              <RefreshCw size={12} className={loadingCambio ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* FORMULÁRIO */}
        <div className="col-span-2 space-y-4">
          {/* Produto */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Produto e Origem</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-slate-500 mb-1 block">Produto</label>
                <select value={produto.nome} onChange={e => setProduto(PRODUTOS.find(p => p.nome === e.target.value) || PRODUTOS[0])}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
                  {PRODUTOS.map(p => <option key={p.nome} value={p.nome}>{p.nome} · NCM {p.ncm}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Valor FOB (moeda origem)</label>
                <div className="flex gap-2">
                  <select value={moeda} onChange={e => setMoeda(e.target.value as any)} className="border border-slate-200 rounded-xl px-2 py-2 text-sm w-20">
                    {['USD','EUR','CNY'].map(m => <option key={m}>{m}</option>)}
                  </select>
                  <input type="number" value={precoUnitario} onChange={e => setPrecoUnitario(Number(e.target.value))}
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Quantidade (kg)</label>
                <input type="number" value={quantidade} onChange={e => setQuantidade(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Câmbio {moeda}/BRL</label>
                <div className="flex gap-2 items-center">
                  <input type="number" step="0.001" value={cambio[moeda]} onChange={e => { setCambioManual(true); setCambio(p => ({ ...p, [moeda]: Number(e.target.value) })) }}
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                  {cambioManual && <span className="text-xs text-amber-600 whitespace-nowrap">manual</span>}
                </div>
                {dataCambio && <p className="text-[10px] text-slate-400 mt-0.5">PTAX de {dataCambio}</p>}
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Incoterm</label>
                <select value={incoterm} onChange={e => setIncoterm(e.target.value as any)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
                  {['FOB','CIF','EXW'].map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Frete internacional ({moeda})</label>
                <input type="number" value={freteInt} onChange={e => setFreteInt(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Seguro (%)</label>
                <input type="number" step="0.1" value={seguroPct} onChange={e => setSeguroPct(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Modal</label>
                <select value={modal} onChange={e => setModal(e.target.value as any)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
                  <option value="maritimo">Marítimo</option><option value="aereo">Aéreo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tributação */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Tributação e Despesas</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">II (%) — NCM auto</label>
                <input type="number" value={produto.ii} readOnly className="w-full border border-slate-100 bg-slate-50 rounded-xl px-3 py-2 text-sm text-slate-500" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">IPI (%) — NCM auto</label>
                <input type="number" value={produto.ipi} readOnly className="w-full border border-slate-100 bg-slate-50 rounded-xl px-3 py-2 text-sm text-slate-500" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">UF destino (ICMS)</label>
                <select value={ufDestino} onChange={e => setUfDestino(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
                  {UFS.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Frete interno (R$)</label>
                <input type="number" value={freteInterno} onChange={e => setFreteInterno(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Despachante (R$)</label>
                <input type="number" value={despachante} onChange={e => setDespachante(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Taxa Siscomex (R$)</label>
                <input type="number" value={siscomex} onChange={e => setSiscomex(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button onClick={() => setConsiderarCreditos(!considerarCreditos)}
                className={cn('w-10 h-5 rounded-full transition-colors relative', considerarCreditos ? 'bg-cyan-500' : 'bg-slate-200')}>
                <div className={cn('w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow', considerarCreditos ? 'left-5' : 'left-0.5')} />
              </button>
              <span className="text-sm text-slate-600">Considerar créditos recuperáveis (PIS/COFINS/ICMS)</span>
            </div>
            {considerarCreditos && <p className="text-xs text-amber-600 mt-2 flex items-center gap-1"><AlertCircle size={11} /> Depende do regime tributário da empresa. Consulte seu contador.</p>}
          </div>

          {/* Precificação */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Precificação (chemical_advanced)</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block">Margem desejada (%)</label>
                <input type="range" min="5" max="80" value={margemDesejada} onChange={e => setMargemDesejada(Number(e.target.value))} className="w-full" />
                <div className="flex justify-between text-xs text-slate-400"><span>5%</span><span className="font-bold text-cyan-600">{margemDesejada}%</span><span>80%</span></div>
              </div>
              {calc && (
                <div className="text-right">
                  <p className="text-xs text-slate-500">Preço venda sugerido</p>
                  <p className="text-2xl font-bold text-cyan-700">{formatCurrency(calc.preco_venda)}<span className="text-sm text-slate-400">/kg</span></p>
                  <p className="text-xs text-emerald-600">Margem efetiva: {calc.margem.toFixed(1)}%</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RESULTADO */}
        <div className="space-y-4">
          {calc && (
            <>
              <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
                <p className="text-slate-400 text-xs mb-1">Custo total importação</p>
                <p className="text-3xl font-bold">{formatCurrency(calc.total)}</p>
                <p className="text-slate-300 text-sm mt-1">Custo/kg: <strong className="text-cyan-300">{formatCurrency(calc.custo_unitario)}</strong></p>
                <div className="border-t border-slate-700 my-3" />
                <p className="text-slate-400 text-xs mb-1">Preço venda ({margemDesejada}% margem)</p>
                <p className="text-2xl font-bold text-cyan-300">{formatCurrency(calc.preco_venda)}/kg</p>
              </div>

              {/* Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <p className="text-sm font-semibold text-slate-800 mb-3">Composição do custo</p>
                <div className="space-y-2">
                  {parcelas.map(p => (
                    <div key={p.l}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{p.l}</span>
                        <span className="font-semibold text-slate-800">{formatCurrency(p.v)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(p.v / calc.total) * 100}%`, background: p.cor }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Salvar / Exportar */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
                <input value={nomeSim} onChange={e => setNomeSim(e.target.value)} placeholder="Nome da simulação (opcional)" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                <button onClick={salvarSimulacao} className="w-full py-2 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg,#06b6d4,#2563eb)' }}>
                  <Save size={14} /> Salvar simulação
                </button>
                <button onClick={exportarPDF} className="w-full py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
                  <Printer size={14} /> Exportar PDF
                </button>
              </div>
            </>
          )}

          {/* Histórico */}
          {historico.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-slate-800 mb-3">Simulações salvas</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {historico.map(h => (
                  <div key={h.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                    <div>
                      <p className="text-xs font-medium text-slate-800 truncate max-w-[140px]">{h.nome}</p>
                      <p className="text-[10px] text-slate-400">{h.produto} · {new Date(h.data).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <span className="text-xs font-bold text-cyan-700">{formatCurrency(h.custo_unitario)}/kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
