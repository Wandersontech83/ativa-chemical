import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const BRAND = { primary: [6, 182, 212] as [number, number, number], dark: [12, 24, 41] as [number, number, number], accent: [37, 99, 235] as [number, number, number] }

async function getLogoDataUrl(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  try {
    const res = await fetch('/logo.svg')
    const svgText = await res.text()
    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
      img.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = 480
    canvas.height = 120
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, 480, 120)
    URL.revokeObjectURL(url)
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

async function drawHeader(doc: jsPDF, titulo: string, numero: string) {
  // Fundo escuro no topo
  doc.setFillColor(...BRAND.dark)
  doc.rect(0, 0, 210, 36, 'F')

  // Logo (tenta carregar; fallback para texto)
  try {
    const logoData = await getLogoDataUrl()
    if (logoData) {
      doc.addImage(logoData, 'PNG', 10, 4, 52, 13)
    } else {
      throw new Error('no logo')
    }
  } catch {
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(15)
    doc.setFont('helvetica', 'bold')
    doc.text('Ativa Chemical', 14, 13)
  }

  // Subtítulo empresa
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text('DISTRIBUIÇÃO DE PRODUTOS QUÍMICOS INDUSTRIAIS', 14, 23)
  doc.text('comercial@ativachemical.com.br  |  (11) 3000-0000', 14, 28)

  // Título do documento (direita)
  doc.setTextColor(6, 182, 212)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(titulo, 196, 14, { align: 'right' })
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.text(numero, 196, 22, { align: 'right' })

  // Linha decorativa
  doc.setDrawColor(...BRAND.primary)
  doc.setLineWidth(0.8)
  doc.line(0, 36, 210, 36)
}

function drawFooter(doc: jsPDF) {
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.line(14, 282, 196, 282)
    doc.setFontSize(7)
    doc.setTextColor(148, 163, 184)
    doc.setFont('helvetica', 'normal')
    doc.text('Ativa Chemical Distribuidora Ltda — Documento gerado automaticamente', 14, 287)
    doc.text(`Criado por Cyber Records  |  Página ${i}/${pageCount}`, 196, 287, { align: 'right' })
  }
}

function infoBlock(doc: jsPDF, y: number, left: { title: string; lines: string[] }, right?: { title: string; lines: string[] }) {
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(14, y, right ? 87 : 182, 4 + left.lines.length * 5.5, 2, 2, 'F')
  if (right) {
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(109, y, 87, 4 + right.lines.length * 5.5, 2, 2, 'F')
  }

  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BRAND.primary)
  doc.text(left.title, 17, y + 5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(51, 65, 85)
  left.lines.forEach((l, i) => doc.text(l, 17, y + 10 + i * 5.5))

  if (right) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BRAND.primary)
    doc.text(right.title, 112, y + 5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(51, 65, 85)
    right.lines.forEach((l, i) => doc.text(l, 112, y + 10 + i * 5.5))
  }
  return y + 8 + left.lines.length * 5.5
}

export async function gerarPDFProposta(proposta: {
  numero: string; cliente: string; data: string; validade: string
  status: string; itens: { produto: string; quantidade: number; preco_unitario: number }[]
  observacoes: string; responsavel: string
}) {
  const doc = new jsPDF()
  await drawHeader(doc, 'PROPOSTA COMERCIAL', proposta.numero)

  let y = 44
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.setFont('helvetica', 'normal')

  y = infoBlock(doc, y,
    { title: 'CLIENTE', lines: [proposta.cliente] },
    {
      title: 'INFORMAÇÕES', lines: [
        `Data: ${new Date(proposta.data).toLocaleDateString('pt-BR')}`,
        `Validade: ${new Date(proposta.validade).toLocaleDateString('pt-BR')}`,
        `Status: ${proposta.status.toUpperCase()}`,
        `Responsável: ${proposta.responsavel}`
      ]
    }
  )
  y += 6

  autoTable(doc, {
    startY: y,
    head: [['Produto / Descrição', 'Qtd', 'Un.', 'Preço Unit. (R$)', 'Total (R$)']],
    body: proposta.itens.map(i => [
      i.produto,
      i.quantidade.toLocaleString('pt-BR'),
      'kg',
      i.preco_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      (i.quantidade * i.preco_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    ]),
    headStyles: { fillColor: BRAND.dark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 75 }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
  })

  const finalY = (doc as any).lastAutoTable.finalY + 4
  const total = proposta.itens.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0)

  doc.setFillColor(...BRAND.dark)
  doc.roundedRect(130, finalY, 66, 10, 2, 2, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(6, 182, 212)
  doc.text('TOTAL GERAL', 134, finalY + 6.5)
  doc.setTextColor(255, 255, 255)
  doc.text(`R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 193, finalY + 6.5, { align: 'right' })

  if (proposta.observacoes) {
    const obsY = finalY + 16
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BRAND.primary)
    doc.text('OBSERVAÇÕES', 14, obsY)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(proposta.observacoes, 14, obsY + 5)
  }

  drawFooter(doc)
  doc.save(`${proposta.numero}.pdf`)
}

export async function gerarPDFPedido(pedido: {
  numero: string; cliente: string; data: string; prazo_entrega: string
  status: string; itens: { produto: string; quantidade: number; preco_unitario: number }[]
  forma_pagamento: string; observacoes: string
}) {
  const doc = new jsPDF()
  await drawHeader(doc, 'PEDIDO DE VENDA', pedido.numero)

  let y = 44
  y = infoBlock(doc, y,
    { title: 'CLIENTE / DESTINO', lines: [pedido.cliente] },
    {
      title: 'DADOS DO PEDIDO', lines: [
        `Data Pedido: ${new Date(pedido.data).toLocaleDateString('pt-BR')}`,
        `Prazo Entrega: ${new Date(pedido.prazo_entrega).toLocaleDateString('pt-BR')}`,
        `Pagamento: ${pedido.forma_pagamento}`,
        `Status: ${pedido.status.toUpperCase()}`,
      ]
    }
  )
  y += 6

  autoTable(doc, {
    startY: y,
    head: [['Produto / Descrição', 'Qtd', 'Un.', 'Preço Unit. (R$)', 'Total (R$)']],
    body: pedido.itens.map(i => [
      i.produto,
      i.quantidade.toLocaleString('pt-BR'),
      'kg',
      i.preco_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      (i.quantidade * i.preco_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    ]),
    headStyles: { fillColor: BRAND.dark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 75 }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
  })

  const finalY = (doc as any).lastAutoTable.finalY + 4
  const total = pedido.itens.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0)

  doc.setFillColor(...BRAND.dark)
  doc.roundedRect(130, finalY, 66, 10, 2, 2, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(6, 182, 212)
  doc.text('TOTAL DO PEDIDO', 134, finalY + 6.5)
  doc.setTextColor(255, 255, 255)
  doc.text(`R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 193, finalY + 6.5, { align: 'right' })

  if (pedido.observacoes) {
    const obsY = finalY + 16
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BRAND.primary)
    doc.text('OBSERVAÇÕES', 14, obsY)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(pedido.observacoes, 14, obsY + 5)
  }

  drawFooter(doc)
  doc.save(`${pedido.numero}.pdf`)
}

export async function gerarPDFCompra(compra: {
  numero: string; fornecedor: string; data: string; previsao_entrega: string
  categoria: string; descricao: string; valor_total: number
  moeda: string; cambio: number; forma_pagamento: string; status: string
}) {
  const doc = new jsPDF()
  await drawHeader(doc, 'ORDEM DE COMPRA', compra.numero)

  const valorBRL = compra.moeda === 'BRL' ? compra.valor_total : compra.valor_total * compra.cambio

  let y = 44
  y = infoBlock(doc, y,
    { title: 'FORNECEDOR', lines: [compra.fornecedor, `Categoria: ${compra.categoria}`] },
    {
      title: 'DADOS DA OC', lines: [
        `Data OC: ${new Date(compra.data).toLocaleDateString('pt-BR')}`,
        `Previsão Entrega: ${new Date(compra.previsao_entrega).toLocaleDateString('pt-BR')}`,
        `Pagamento: ${compra.forma_pagamento}`,
        `Status: ${compra.status.toUpperCase()}`,
      ]
    }
  )
  y += 8

  autoTable(doc, {
    startY: y,
    head: [['Descrição dos Itens', 'Moeda', 'Valor Orig.', 'Câmbio', 'Valor BRL']],
    body: [[
      compra.descricao,
      compra.moeda,
      compra.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      compra.moeda === 'BRL' ? '—' : `R$ ${compra.cambio.toFixed(3)}`,
      valorBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })
    ]],
    headStyles: { fillColor: BRAND.dark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
  })

  const finalY = (doc as any).lastAutoTable.finalY + 4
  doc.setFillColor(...BRAND.dark)
  doc.roundedRect(114, finalY, 82, 10, 2, 2, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(6, 182, 212)
  doc.text('TOTAL EM BRL', 118, finalY + 6.5)
  doc.setTextColor(255, 255, 255)
  doc.text(valorBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' }), 193, finalY + 6.5, { align: 'right' })

  const assinY = finalY + 24
  doc.setDrawColor(200, 212, 226)
  doc.setLineWidth(0.3)
  doc.line(14, assinY, 90, assinY)
  doc.line(120, assinY, 196, assinY)
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text('Solicitante', 14, assinY + 4)
  doc.text('Aprovação / Diretor', 120, assinY + 4)

  drawFooter(doc)
  doc.save(`${compra.numero}.pdf`)
}
