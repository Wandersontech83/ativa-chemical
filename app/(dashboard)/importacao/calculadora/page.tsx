'use client'

import { useState, useEffect, useRef } from 'react'
import { Calculator, DollarSign, TrendingUp, Save, FileDown, RefreshCw, AlertCircle, Search, ChevronDown, Info } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { saveData, loadData, genId } from '@/lib/storage'

// Catálogo de produtos com alíquotas base
const PRODUTOS_CATALOGO = [
  { nome: 'Acetona Industrial 99,5%',    ncm: '2914.11.00', ii_base: 4,  ipi: 0,  descricao: 'Solvente orgânico, solvente polar aprótico' },
  { nome: 'Tolueno Industrial',           ncm: '2902.30.00', ii_base: 2,  ipi: 0,  descricao: 'Hidrocarboneto aromático, solvente' },
  { nome: 'Resina Epóxi Bisfenol A',     ncm: '3907.30.00', ii_base: 12, ipi: 5,  descricao: 'Polímero termodurecível' },
  { nome: 'Dióxido de Titânio R-902',    ncm: '2823.00.10', ii_base: 12, ipi: 0,  descricao: 'Pigmento branco TiO2, grau rutilo' },
  { nome: 'Ftalato de Dioctila (DOP)',   ncm: '2917.34.00', ii_base: 14, ipi: 5,  descricao: 'Plastificante para PVC' },
  { nome: 'Acetato de Etila',            ncm: '2915.31.00', ii_base: 6,  ipi: 0,  descricao: 'Solvente éster, tintas e vernizes' },
  { nome: 'Negro de Fumo N330',          ncm: '2803.00.10', ii_base: 4,  ipi: 0,  descricao: 'Reforçador para borracha/elastômeros' },
  { nome: 'Hexano Industrial 95%',       ncm: '2901.10.10', ii_base: 2,  ipi: 0,  descricao: 'Solvente alifático, extração de óleos' },
  { nome: 'Ácido Acético Glacial',       ncm: '2915.21.00', ii_base: 6,  ipi: 0,  descricao: 'Ácido carboxílico, grau industrial' },
  { nome: 'Metanol Industrial',          ncm: '2905.11.00', ii_base: 4,  ipi: 0,  descricao: 'Álcool metílico, solvente e combustível' },
  { nome: 'Ácido Sulfúrico 98%',         ncm: '2807.00.10', ii_base: 2,  ipi: 0,  descricao: 'Ácido inorgânico, processo industrial' },
  { nome: 'Hidróxido de Sódio (Soda)',   ncm: '2815.11.00', ii_base: 4,  ipi: 0,  descricao: 'Álcali forte, neutralização e tratamento' },
  { nome: 'Carbonato de Cálcio',         ncm: '2836.50.00', ii_base: 2,  ipi: 0,  descricao: 'Carga mineral para tintas e plásticos' },
  { nome: 'Personalizado (digitar NCM)', ncm: '',           ii_base: 0,  ipi: 0,  descricao: '' },
]

// Países de origem com fator de II e observações
const ORIGENS = [
  { pais: 'China',         codigo: 'CN', fator_ii: 1.0,  nota: 'Alíquota cheia — sem acordo comercial com o Brasil' },
  { pais: 'Estados Unidos',codigo: 'US', fator_ii: 1.0,  nota: 'Alíquota cheia — sem acordo Mercosul/TEC' },
  { pais: 'Alemanha',      codigo: 'DE', fator_ii: 1.0,  nota: 'Alíquota cheia — sem acordo Mercosul' },
  { pais: 'Índia',         codigo: 'IN', fator_ii: 1.0,  nota: 'Alíquota cheia — sem acordo preferencial' },
  { pais: 'Coreia do Sul', codigo: 'KR', fator_ii: 1.0,  nota: 'Alíquota cheia — negociações em andamento' },
  { pais: 'Argentina',     codigo: 'AR', fator_ii: 0.0,  nota: '✅ Mercosul — II zerado para maioria dos produtos' },
  { pais: 'Uruguai',       codigo: 'UY', fator_ii: 0.0,  nota: '✅ Mercosul — II zerado para maioria dos produtos' },
  { pais: 'Paraguai',      codigo: 'PY', fator_ii: 0.0,  nota: '✅ Mercosul — II zerado para maioria dos produtos' },
  { pais: 'Chile',         codigo: 'CL', fator_ii: 0.5,  nota: 'Acordo Mercosul-Chile — redução parcial de II' },
  { pais: 'Peru',          codigo: 'PE', fator_ii: 0.5,  nota: 'Acordo parcial Mercosul — redução de II' },
  { pais: 'México',        codigo: 'MX', fator_ii: 1.0,  nota: 'Alíquota cheia' },
]

// Produtos com anti-dumping conhecido (China)
const ANTI_DUMPING_CN: Record<string, number> = {
  '2823.00.10': 18.4, // TiO2 da China tem anti-dumping histórico
  '2803.00.10': 8.2,  // Negro de fumo
}

const ALIQ_ICMS: Record<string, number> = {
  SP: 18, MG: 18, RJ: 20, RS: 17, PR: 12, SC: 17,
  GO: 17, DF: 18, BA: 19, CE: 18, PE: 17, AM: 20,
  MT: 17, MS: 17, ES: 17, PA: 17, MA: 18, PI: 18,
  RN: 18, PB: 18, SE: 18, AL: 17, TO: 18, AC: 17,
  AP: 18, RO: 17, RR: 17,
}

const UFS = Object.keys(ALIQ_ICMS).sort()

interface Calculo {
  va: number; ii: number; anti_dumping: number; ipi: number; pis: number; cofins: number
  icms: number; afrmm: number; siscomex: number; frete_interno: number; despachante: number
  total: number; custo_unitario: number; preco_venda: number; margem: number
}

export default function CalculadoraImportacaoPage() {
  const [produto, setProduto] = useState(PRODUTOS_CATALOGO[0])
  const [ncmCustom, setNcmCustom] = useState('')
  const [iiCustom, setIiCustom] = useState(0)
  const [ipiCustom, setIpiCustom] = useState(0)
  const [nomeProdutoCustom, setNomeProdutoCustom] = useState('')
  const [buscaProduto, setBuscaProduto] = useState('')
  const [showProdutos, setShowProdutos] = useState(false)
  const produtoRef = useRef<HTMLDivElement>(null)

  const [origem, setOrigem] = useState(ORIGENS[0]) // China default
  const [precoUnitario, setPrecoUnitario] = useState(10000)
  const [moeda, setMoeda] = useState<'USD' | 'EUR' | 'CNY'>('USD')
  const [quantidade, setQuantidade] = useState(1000)
  const [incoterm, setIncoterm] = useState<'FOB' | 'CIF' | 'EXW'>('FOB')
  const [freteInt, setFreteInt] = useState(1200)
  const [seguroPct, setSeguroPct] = useState(0.5)
  const [modal, setModal] = useState<'maritimo' | 'aereo'>('maritimo')
  const [ufDestino, setUfDestino] = useState('SP')
  const [margemDesejada, setMargemDesejada] = useState(35)
  const [considerarCreditos, setConsiderarCreditos] = useState(false)
  const [freteInterno, setFreteInterno] = useState(3500)
  const [despachante, setDespachante] = useState(4200)
  const [siscomex, setSiscomex] = useState(185)
  const [antiDumpingManual, setAntiDumpingManual] = useState<number | null>(null)

  const [cambio, setCambio] = useState<Record<string, number>>({ USD: 5.05, EUR: 5.55, CNY: 0.72 })
  const [cambioManual, setCambioManual] = useState(false)
  const [loadingCambio, setLoadingCambio] = useState(false)
  const [dataCambio, setDataCambio] = useState('')

  const [calc, setCalc] = useState<Calculo | null>(null)
  const [historico, setHistorico] = useState<any[]>(() => loadData('calc_importacao', []))
  const [nomeSim, setNomeSim] = useState('')

  const isCustom = produto.nome === 'Personalizado (digitar NCM)'
  const ncmAtual = isCustom ? ncmCustom : produto.ncm
  const iiBase = isCustom ? iiCustom : produto.ii_base
  const ipiAtual = isCustom ? ipiCustom : produto.ipi
  const nomeAtual = isCustom ? (nomeProdutoCustom || 'Produto personalizado') : produto.nome

  // Anti-dumping: só aplica China
  const antiDumpingPct = antiDumpingManual !== null
    ? antiDumpingManual
    : (origem.codigo === 'CN' ? (ANTI_DUMPING_CN[ncmAtual] || 0) : 0)

  const iiEfetivo = iiBase * origem.fator_ii

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (produtoRef.current && !produtoRef.current.contains(e.target as Node)) setShowProdutos(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function buscarPTAX() {
    setLoadingCambio(true)
    try {
      const hoje = new Date()
      const d = `${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}-${hoje.getFullYear()}`
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

  useEffect(() => { calcular() }, [produto, ncmCustom, iiCustom, ipiCustom, origem, precoUnitario, moeda, quantidade, incoterm, freteInt, seguroPct, modal, ufDestino, margemDesejada, considerarCreditos, freteInterno, despachante, siscomex, cambio, antiDumpingManual])

  function calcular() {
    const taxa = cambio[moeda] || 5.05
    const valorMerc = precoUnitario * taxa
    const freteBRL = freteInt * taxa
    const seguroBRL = (valorMerc + (incoterm !== 'CIF' ? freteBRL : 0)) * (seguroPct / 100)
    const va = valorMerc + (incoterm !== 'CIF' ? freteBRL : 0) + seguroBRL

    const ii = va * (iiEfetivo / 100)
    const antiDumping = va * (antiDumpingPct / 100)
    const ipi = (va + ii + antiDumping) * (ipiAtual / 100)
    const pis = va * 0.021
    const cofins = va * 0.0965
    const afrmm = modal === 'maritimo' ? (freteBRL * 0.08) : 0
    const aliqICMS = (ALIQ_ICMS[ufDestino] || 18) / 100
    const baseICMS = va + ii + antiDumping + ipi + pis + cofins + freteInterno
    const icms = (aliqICMS * baseICMS) / (1 - aliqICMS)

    const tributosRecuperaveis = considerarCreditos ? (pis + cofins + icms * 0.5) : 0
    const total = va + ii + antiDumping + ipi + pis + cofins + icms + afrmm + siscomex + freteInterno + despachante - tributosRecuperaveis
    const custo_unitario = quantidade > 0 ? total / quantidade : 0
    const preco_venda = custo_unitario / (1 - margemDesejada / 100)
    const margem = preco_venda > 0 ? ((preco_venda - custo_unitario) / preco_venda) * 100 : 0

    setCalc({ va, ii, anti_dumping: antiDumping, ipi, pis, cofins, icms, afrmm, siscomex: Number(siscomex), frete_interno: freteInterno, despachante, total, custo_unitario, preco_venda, margem })
  }

  function salvarSimulacao() {
    if (!calc) return
    const nova = {
      id: genId('sim'), nome: nomeSim || `Simulação ${new Date().toLocaleDateString('pt-BR')}`,
      data: new Date().toISOString(), produto: nomeAtual, ncm: ncmAtual, origem: origem.pais,
      moeda, cambio_usado: cambio[moeda], valor_fob: precoUnitario, quantidade, ...calc
    }
    const atualizado = [nova, ...historico].slice(0, 20)
    saveData('calc_importacao', atualizado)
    setHistorico(atualizado)
    setNomeSim('')
  }

  async function exportarPDF() {
    if (!calc) return
    const { jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF()

    doc.setFillColor(12, 24, 41)
    doc.rect(0, 0, 210, 32, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text('ATIVA CHEMICAL', 14, 13)
    doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    doc.text('Simulação de Custo de Importação', 14, 21)
    doc.setFontSize(8)
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 14, 28)

    doc.setTextColor(30, 41, 59); doc.setFontSize(11); doc.setFont('helvetica', 'bold')
    doc.text('Parâmetros da Simulação', 14, 44)

    autoTable(doc, {
      startY: 47,
      head: [['Campo', 'Valor']],
      body: [
        ['Produto', nomeAtual],
        ['NCM', ncmAtual || '—'],
        ['País de Origem', `${origem.pais} (${origem.codigo})`],
        ['Observação Tributária', origem.nota],
        ['Valor FOB', `${moeda} ${precoUnitario.toLocaleString('pt-BR')}`],
        ['Câmbio', `${cambio[moeda].toFixed(4)} BRL/${moeda}`],
        ['Quantidade', `${quantidade.toLocaleString('pt-BR')} kg`],
        ['Incoterm', incoterm], ['Modal', modal === 'maritimo' ? 'Marítimo' : 'Aéreo'],
        ['UF Destino', `${ufDestino} — ICMS ${ALIQ_ICMS[ufDestino] || 18}% (por dentro)`],
        ['II efetivo', `${iiEfetivo.toFixed(2)}% (base ${iiBase}% × fator ${origem.fator_ii})`],
        ['Anti-dumping', antiDumpingPct > 0 ? `${antiDumpingPct}%` : 'Não aplicável'],
        ['Créditos recuperáveis', considerarCreditos ? 'Sim' : 'Não'],
      ],
      headStyles: { fillColor: [6, 182, 212], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 8 },
    })

    const y2 = (doc as any).lastAutoTable.finalY + 8
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59)
    doc.text('Composição do Custo Total', 14, y2)

    const parcelas = getParcelas(calc!)
    autoTable(doc, {
      startY: y2 + 4,
      head: [['Componente', 'Valor (R$)', '% do Total']],
      body: [
        ...parcelas.map(p => [p.l, p.v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), `${((p.v / calc!.total) * 100).toFixed(1)}%`]),
        ['TOTAL', calc!.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), '100%'],
      ],
      headStyles: { fillColor: [12, 24, 41], textColor: 255, fontStyle: 'bold' },
      footStyles: { fillColor: [6, 182, 212], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8 },
    })

    const y3 = (doc as any).lastAutoTable.finalY + 8
    doc.setFillColor(6, 182, 212)
    doc.rect(14, y3, 182, 28, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont('helvetica', 'bold')
    doc.text('RESULTADO FINAL', 18, y3 + 8)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
    doc.text(`Custo Unitário: R$ ${calc!.custo_unitario.toFixed(4)}/kg`, 18, y3 + 15)
    doc.text(`Preço de Venda (${margemDesejada}% margem): R$ ${calc!.preco_venda.toFixed(4)}/kg`, 18, y3 + 21)
    doc.text(`Custo Total (${quantidade.toLocaleString('pt-BR')} kg): R$ ${calc!.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 105, y3 + 15)
    doc.text(`Margem efetiva: ${calc!.margem.toFixed(2)}%`, 105, y3 + 21)

    doc.setTextColor(148, 163, 184); doc.setFontSize(7)
    doc.text('Valores sujeitos a variações cambiais e atualizações tributárias. Consulte sempre um despachante aduaneiro.', 14, 290)
    doc.save(`simulacao-${nomeAtual.toLowerCase().replace(/\s+/g, '-').slice(0, 30)}-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  function getParcelas(c: Calculo) {
    return [
      { l: 'Valor Aduaneiro (VA)', v: c.va, cor: '#06b6d4' },
      { l: `II — Imposto de Importação (${iiEfetivo.toFixed(1)}%)`, v: c.ii, cor: '#2563eb' },
      ...(c.anti_dumping > 0 ? [{ l: `Anti-Dumping ${origem.pais} (${antiDumpingPct}%)`, v: c.anti_dumping, cor: '#dc2626' }] : []),
      { l: `IPI (${ipiAtual}%)`, v: c.ipi, cor: '#7c3aed' },
      { l: 'PIS-Importação (2,10%)', v: c.pis, cor: '#0891b2' },
      { l: 'COFINS-Importação (9,65%)', v: c.cofins, cor: '#0e7490' },
      { l: `ICMS/${ufDestino} (${ALIQ_ICMS[ufDestino] || 18}% por dentro)`, v: c.icms, cor: '#1d4ed8' },
      { l: 'AFRMM (8% frete marítimo)', v: c.afrmm, cor: '#4338ca' },
      { l: 'Taxa Siscomex', v: c.siscomex, cor: '#6d28d9' },
      { l: 'Frete Interno', v: c.frete_interno, cor: '#7c2d12' },
      { l: 'Despachante Aduaneiro', v: c.despachante, cor: '#92400e' },
    ].filter(p => p.v > 0.01)
  }

  const parcelas = calc ? getParcelas(calc) : []
  const produtosFiltrados = PRODUTOS_CATALOGO.filter(p =>
    !buscaProduto || p.nome.toLowerCase().includes(buscaProduto.toLowerCase()) || p.ncm.includes(buscaProduto)
  )

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Calculadora de Importação</h1>
          <p className="text-slate-500 text-sm mt-0.5">Custo real DDP + alíquotas por origem + precificação</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <span className="text-xs text-slate-500">PTAX hoje:</span>
          <span className="text-xs font-bold text-slate-800">USD {cambio.USD.toFixed(3)} · CNY {cambio.CNY.toFixed(3)}</span>
          <button onClick={buscarPTAX} disabled={loadingCambio} className="text-cyan-500 hover:text-cyan-600 ml-1">
            <RefreshCw size={12} className={loadingCambio ? 'animate-spin' : ''} />
          </button>
          {dataCambio && <span className="text-[10px] text-slate-400">{dataCambio}</span>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* FORMULÁRIO */}
        <div className="col-span-2 space-y-4">

          {/* PRODUTO */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Calculator size={16} className="text-cyan-600" /> Produto e Origem
            </h3>
            <div className="grid grid-cols-2 gap-4">

              {/* Busca de produto */}
              <div className="col-span-2" ref={produtoRef}>
                <label className="text-xs text-slate-500 mb-1 block">Produto *</label>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    value={isCustom ? (nomeProdutoCustom || 'Personalizado (digitar NCM)') : produto.nome}
                    onFocus={() => setShowProdutos(true)}
                    onChange={e => { setBuscaProduto(e.target.value); setShowProdutos(true) }}
                    placeholder="Buscar produto ou digitar NCM..."
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-300 focus:border-transparent outline-none"
                  />
                  {showProdutos && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-100 z-50 max-h-56 overflow-y-auto">
                      {produtosFiltrados.map(p => (
                        <button key={p.nome} onClick={() => { setProduto(p); setBuscaProduto(''); setShowProdutos(false) }}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors">
                          <p className="text-xs font-semibold text-slate-800">{p.nome}</p>
                          <p className="text-[10px] text-slate-400">{p.ncm ? `NCM ${p.ncm} · II ${p.ii_base}% · IPI ${p.ipi}%` : 'Informe NCM manualmente'} {p.descricao ? `· ${p.descricao}` : ''}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {produto.descricao && !isCustom && (
                  <p className="text-[10px] text-slate-400 mt-1 ml-1">📋 {produto.descricao} · NCM {produto.ncm}</p>
                )}
              </div>

              {/* NCM customizado */}
              {isCustom && (
                <>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Nome do produto</label>
                    <input value={nomeProdutoCustom} onChange={e => setNomeProdutoCustom(e.target.value)}
                      placeholder="Ex.: Parafina Industrial"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">NCM</label>
                    <input value={ncmCustom} onChange={e => setNcmCustom(e.target.value)}
                      placeholder="0000.00.00"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">II base (%)</label>
                    <input type="number" value={iiCustom} onChange={e => setIiCustom(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">IPI (%)</label>
                    <input type="number" value={ipiCustom} onChange={e => setIpiCustom(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" />
                  </div>
                </>
              )}

              {/* PAÍS DE ORIGEM */}
              <div className="col-span-2">
                <label className="text-xs text-slate-500 mb-1 block">País de Origem *</label>
                <div className="grid grid-cols-2 gap-2">
                  <select value={origem.codigo} onChange={e => setOrigem(ORIGENS.find(o => o.codigo === e.target.value) || ORIGENS[0])}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none">
                    {ORIGENS.map(o => <option key={o.codigo} value={o.codigo}>{o.pais} ({o.codigo})</option>)}
                  </select>
                  <div className={cn('rounded-xl px-3 py-2 text-xs flex items-center gap-2',
                    origem.fator_ii === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    origem.fator_ii < 1 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-blue-50 text-blue-700 border border-blue-200')}>
                    <Info size={12} className="flex-shrink-0" />
                    <span className="leading-tight">{origem.nota}</span>
                  </div>
                </div>

                {/* Resumo alíquotas efetivas */}
                <div className="mt-2 flex gap-2 flex-wrap">
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-semibold border border-blue-100">
                    II efetivo: {iiEfetivo.toFixed(1)}% {origem.fator_ii < 1 ? `(reduzido de ${iiBase}%)` : ''}
                  </span>
                  {antiDumpingPct > 0 && (
                    <span className="text-[10px] bg-red-50 text-red-700 px-2 py-1 rounded-lg font-semibold border border-red-100">
                      ⚠️ Anti-dumping: {antiDumpingPct}%
                    </span>
                  )}
                  <span className="text-[10px] bg-slate-50 text-slate-600 px-2 py-1 rounded-lg border border-slate-100">
                    IPI: {ipiAtual}% · PIS: 2,10% · COFINS: 9,65%
                  </span>
                </div>

                {/* Anti-dumping manual */}
                {origem.codigo === 'CN' && (
                  <div className="mt-2 flex items-center gap-3">
                    <label className="text-[10px] text-slate-500 whitespace-nowrap">Anti-dumping China (%):</label>
                    <input type="number" step="0.1" min="0"
                      value={antiDumpingManual !== null ? antiDumpingManual : antiDumpingPct}
                      onChange={e => setAntiDumpingManual(Number(e.target.value))}
                      className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-xs text-center" />
                    {antiDumpingManual !== null && (
                      <button onClick={() => setAntiDumpingManual(null)} className="text-[10px] text-slate-400 hover:text-slate-600">reset auto</button>
                    )}
                    <span className="text-[10px] text-slate-400">Verificar CAMEX para NCM {ncmAtual}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* VALORES FOB / FRETE / CÂMBIO */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-600" /> Valores e Frete
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Moeda</label>
                <select value={moeda} onChange={e => setMoeda(e.target.value as any)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
                  <option value="USD">USD — Dólar</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="CNY">CNY — Yuan (¥)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Valor FOB ({moeda})</label>
                <input type="number" value={precoUnitario} onChange={e => setPrecoUnitario(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                <p className="text-[10px] text-slate-400 mt-0.5">≈ {formatCurrency(precoUnitario * (cambio[moeda] || 5.05))}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Quantidade (kg)</label>
                <input type="number" value={quantidade} onChange={e => setQuantidade(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Câmbio {moeda}/BRL</label>
                <input type="number" step="0.001" value={cambio[moeda]}
                  onChange={e => { setCambioManual(true); setCambio(p => ({ ...p, [moeda]: Number(e.target.value) })) }}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                {cambioManual && <p className="text-[10px] text-amber-600 mt-0.5">⚠️ editado manualmente</p>}
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Frete internacional ({moeda})</label>
                <input type="number" value={freteInt} onChange={e => setFreteInt(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Seguro (%)</label>
                <input type="number" step="0.1" value={seguroPct} onChange={e => setSeguroPct(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Incoterm</label>
                <select value={incoterm} onChange={e => setIncoterm(e.target.value as any)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
                  <option value="FOB">FOB — Free On Board</option>
                  <option value="CIF">CIF — Cost Insurance Freight</option>
                  <option value="EXW">EXW — Ex Works</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Modal de transporte</label>
                <select value={modal} onChange={e => setModal(e.target.value as any)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
                  <option value="maritimo">Marítimo (AFRMM 8%)</option>
                  <option value="aereo">Aéreo (sem AFRMM)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">UF de destino</label>
                <select value={ufDestino} onChange={e => setUfDestino(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
                  {UFS.map(u => <option key={u} value={u}>{u} — ICMS {ALIQ_ICMS[u]}%</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* CUSTOS NACIONAIS */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-violet-600" /> Custos Nacionais e Margem
            </h3>
            <div className="grid grid-cols-3 gap-4">
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
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Margem desejada (%)</label>
                <input type="number" value={margemDesejada} onChange={e => setMargemDesejada(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2 flex items-center gap-3 pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={considerarCreditos} onChange={e => setConsiderarCreditos(e.target.checked)} className="w-4 h-4 rounded" />
                  <span className="text-sm text-slate-600">Considerar créditos de PIS/COFINS/ICMS</span>
                </label>
              </div>
            </div>

            {/* Salvar simulação */}
            <div className="mt-4 flex gap-2 pt-4 border-t border-slate-100">
              <input value={nomeSim} onChange={e => setNomeSim(e.target.value)} placeholder="Nome da simulação (opcional)"
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none" />
              <button onClick={salvarSimulacao}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
                <Save size={14} /> Salvar
              </button>
              <button onClick={exportarPDF}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors"
                style={{ background: 'linear-gradient(135deg,#06b6d4,#2563eb)' }}>
                <FileDown size={14} /> PDF
              </button>
            </div>
          </div>
        </div>

        {/* RESULTADO */}
        <div className="space-y-4">

          {calc && (
            <>
              {/* KPIs principais */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Resultado</p>
                <div className="space-y-3">
                  <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl p-4 text-white">
                    <p className="text-xs opacity-80 mb-0.5">Custo Total (DDP)</p>
                    <p className="text-2xl font-bold">{formatCurrency(calc.total)}</p>
                    <p className="text-xs opacity-75 mt-0.5">{quantidade.toLocaleString('pt-BR')} kg</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-slate-500">Custo/kg</p>
                      <p className="text-base font-bold text-slate-900">R$ {calc.custo_unitario.toFixed(2)}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-emerald-600">Preço venda</p>
                      <p className="text-base font-bold text-emerald-700">R$ {calc.preco_venda.toFixed(2)}</p>
                      <p className="text-[10px] text-emerald-500">{margemDesejada}% margem</p>
                    </div>
                  </div>
                  {/* Carga tributária total */}
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <p className="text-[10px] text-amber-600 font-semibold mb-1">Carga tributária total</p>
                    <p className="text-lg font-bold text-amber-700">
                      {(((calc.ii + calc.anti_dumping + calc.ipi + calc.pis + calc.cofins + calc.icms) / calc.total) * 100).toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-amber-500">{formatCurrency(calc.ii + calc.anti_dumping + calc.ipi + calc.pis + calc.cofins + calc.icms)}</p>
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Composição do custo</p>
                <div className="space-y-2">
                  {parcelas.map(p => (
                    <div key={p.l}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600 truncate pr-2">{p.l}</span>
                        <span className="font-semibold text-slate-800 whitespace-nowrap">{((p.v / calc.total) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${(p.v / calc.total) * 100}%`, background: p.cor }} />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 text-right">{formatCurrency(p.v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Histórico */}
          {historico.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Simulações salvas</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {historico.map(h => (
                  <div key={h.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-xs font-semibold text-slate-800 truncate">{h.nome}</p>
                    <p className="text-[10px] text-slate-400">{h.produto}</p>
                    {h.origem && <p className="text-[10px] text-blue-500">Origem: {h.origem}</p>}
                    <p className="text-xs font-bold text-cyan-700 mt-1">{formatCurrency(h.total)}</p>
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
