import { NextRequest, NextResponse } from 'next/server'

type AgentMode = 'comercial' | 'financeiro' | 'compras' | 'estoque' | 'trade' | 'executivo'

// ── Regras por modo ──────────────────────────────────────────────
function buildReply(msg: string, mode: AgentMode): string {
  const t = msg.toLowerCase()

  // ── COMERCIAL ──────────────────────────────────────────────────
  if (mode === 'comercial') {
    // Criar proposta
    if ((t.includes('criar') || t.includes('gerar') || t.includes('nova')) && t.includes('proposta')) {
      const clientes: Record<string, string> = {
        'nordeste': 'Nordeste Química Ltda', 'indtext': 'IndTex Plásticos SA',
        'petrosul': 'PetroSul Derivados', 'fab têxtil': 'Fab Têxtil Nordeste',
        'agroquim': 'Agroquim Nordeste',
      }
      const produtos: Record<string, { nome: string; preco: number }> = {
        'acetona': { nome: 'Acetona Industrial 99,5%', preco: 6.80 },
        'tolueno': { nome: 'Tolueno Industrial', preco: 7.90 },
        'resina': { nome: 'Resina Epóxi Bisfenol A', preco: 28.00 },
        'dióxido': { nome: 'Dióxido de Titânio R-902', preco: 43.00 },
        'titanio': { nome: 'Dióxido de Titânio R-902', preco: 43.00 },
        'dop': { nome: 'Ftalato de Dioctila (DOP)', preco: 14.90 },
        'acetato': { nome: 'Acetato de Etila', preco: 9.20 },
      }
      let cliente = 'Nordeste Química Ltda'
      for (const [k, v] of Object.entries(clientes)) { if (t.includes(k)) { cliente = v; break } }
      let prod = { nome: 'Acetona Industrial 99,5%', preco: 6.80 }
      for (const [k, v] of Object.entries(produtos)) { if (t.includes(k)) { prod = v; break } }
      const qtdMatch = msg.match(/(\d+[\.,]?\d*)\s*(kg|ton|l|litros?)?/i)
      const qtd = qtdMatch ? parseFloat(qtdMatch[1].replace(',', '.')) : 500
      const total = (qtd * prod.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      return `Perfeito! Vou criar a proposta agora.\n\n**Resumo:**\n- Cliente: ${cliente}\n- Produto: ${prod.nome}\n- Quantidade: ${qtd} kg\n- Preço unitário: R$ ${prod.preco.toFixed(2)}/kg\n- Total: ${total}\n- Validade: 14 dias\n\n<action>{"type":"criar_proposta","data":{"cliente":"${cliente}","itens":[{"produto":"${prod.nome}","quantidade":${qtd},"preco_unitario":${prod.preco}}],"observacoes":"Entrega em 10 dias úteis","validade_dias":14}}</action>\n\nProposta registrada no sistema! Deseja enviar por e-mail para o cliente?`
    }
    // Criar pedido
    if ((t.includes('criar') || t.includes('gerar') || t.includes('novo')) && (t.includes('pedido') || t.includes('pv'))) {
      return `Criando pedido de venda...\n\n<action>{"type":"criar_pedido","data":{"cliente":"IndTex Plásticos SA","itens":[{"produto":"Resina Epóxi Bisfenol A","quantidade":200,"preco_unitario":28.00}],"forma_pagamento":"30 dias","prazo_dias":15}}</action>\n\nPedido PV criado e aguardando aprovação. Margem: 32% — dentro do limite mínimo.`
    }
    // Propostas pendentes
    if (t.includes('pendente') || t.includes('sem resposta') || t.includes('aberta')) {
      return `**Propostas pendentes de retorno:**\n\n1. **PROP-2024-002** — IndTex Plásticos (8 dias sem resposta) — R$ 45.600\n2. **PROP-2024-005** — Agroquim Nordeste (3 dias sem resposta) — R$ 75.600\n\n💡 Recomendo contato com Agroquim hoje — é a maior proposta do mês. Um desconto de 3-5% pode fechar o negócio.`
    }
    // Clientes
    if (t.includes('cliente') || t.includes('carteira')) {
      return `**Carteira de clientes ativa:**\n\n| Cliente | Faturamento 6M | Status |\n|---|---|---|\n| PetroSul Derivados | R$ 500.000 | ✅ Ativo |\n| IndTex Plásticos SA | R$ 385.000 | ✅ Ativo |\n| Agroquim Nordeste | R$ 320.000 | ✅ Ativo |\n| Nordeste Química | R$ 280.000 | ✅ Ativo |\n| Fab Têxtil Nordeste | R$ 120.000 | ⚠️ Inadimplente |\n\nFab Têxtil possui título vencido de R$ 43.000 — sugiro suspender novos pedidos até regularização.`
    }
    return `Como Consultor Comercial, posso ajudar com:\n\n- **Criar proposta** — "Criar proposta para [cliente] — [produto] [quantidade]kg"\n- **Criar pedido de venda** — "Criar pedido para [cliente]"\n- **Consultar carteira** — "Quais clientes tenho?"\n- **Propostas pendentes** — "Propostas sem resposta"\n\nComo posso ajudar?`
  }

  // ── FINANCEIRO ─────────────────────────────────────────────────
  if (mode === 'financeiro') {
    if (t.includes('receber') || t.includes('inadimpl') || t.includes('vencido')) {
      return `**Contas a Receber — Situação atual:**\n\n| Título | Cliente | Valor | Status |\n|---|---|---|---|\n| CR-2024-001 | PetroSul Derivados | R$ 125.000 | ✅ Em aberto |\n| CR-2024-002 | IndTex Plásticos | R$ 74.500 | ✅ Vence 03/12 |\n| CR-2024-003 | Agroquim Nordeste | R$ 43.200 | ✅ Vence 05/12 |\n| CR-2024-004 | Nordeste Química | R$ 42.300 | ✅ Vence 08/12 |\n| CR-2024-005 | Fab Têxtil Nordeste | R$ 43.000 | 🔴 VENCIDO (10d) |\n\n**Total a receber:** R$ 328.000\n**Inadimplência:** R$ 43.000 (4,5%)\n\n⚠️ Recomendo acionar cobrança imediata para Fab Têxtil e considerar suspensão de novos pedidos.`
    }
    if (t.includes('pagar') || t.includes('despesa') || t.includes('fornecedor')) {
      return `**Contas a Pagar — Situação atual:**\n\n| Título | Fornecedor | Valor | Vencimento | Status |\n|---|---|---|---|---|\n| CP-2024-001 | Hunan Chemical | R$ 43.120 | 08/12 | ✅ Pendente |\n| CP-2024-002 | GZ Poly Materials | R$ 37.730 | 29/11 | 🔴 VENCIDO |\n| CP-2024-003 | Quimibras Ind. | R$ 22.400 | 15/12 | ✅ Pendente |\n| CP-2024-004 | Despacho Alfa | R$ 8.600 | 20/12 | ✅ Agendado |\n\n**Total a pagar:** R$ 111.850\n\n⚠️ GZ Poly vencida — risco de bloqueio de crédito. Priorize este pagamento.`
    }
    if (t.includes('caixa') || t.includes('saldo') || t.includes('projeção')) {
      return `**Fluxo de Caixa — Dezembro 2024:**\n\n- Saldo atual: **R$ 394.530**\n- Entradas previstas (Dez): R$ 159.800 *(IndTex 03/12 + Agroquim 05/12 + Nordeste 08/12)*\n- Saídas previstas (Dez): R$ 73.720 *(Hunan 08/12 + Quimibras 15/12)*\n- **Saldo projetado fim de mês: R$ 480.610**\n\n✅ Caixa saudável. Recomendo usar o excedente para antecipar OC com Hunan antes do reajuste cambial (economia estimada R$ 4.200).`
    }
    if (t.includes('ebitda') || t.includes('margem') || t.includes('indicador') || t.includes('dre')) {
      return `**DRE Simplificada — Acumulado 2024:**\n\n| | Valor | % |\n|---|---|---|\n| Receita Bruta | R$ 3.245.500 | 100% |\n| Deduções | (R$ 324.550) | -10% |\n| Receita Líquida | R$ 2.920.950 | 90% |\n| CMV | (R$ 1.752.570) | -54% |\n| **Lucro Bruto** | **R$ 1.168.380** | **36%** |\n| Despesas Op. | (R$ 588.380) | -18,1% |\n| **EBITDA** | **R$ 580.000** | **17,9%** |\n| Lucro Líquido | R$ 1.105.530 | 34,1% |\n\nMargem bruta em expansão (+1,2pp vs 2023). EBITDA dentro da meta.`
    }
    return `Como Assistente Financeiro, posso ajudar com:\n\n- **Contas a receber** e inadimplência\n- **Contas a pagar** e priorização\n- **Fluxo de caixa** e projeções\n- **DRE e indicadores** (EBITDA, margens)\n\nO que deseja analisar?`
  }

  // ── COMPRAS ────────────────────────────────────────────────────
  if (mode === 'compras') {
    if ((t.includes('criar') || t.includes('gerar') || t.includes('nova')) && (t.includes('oc') || t.includes('ordem') || t.includes('compra'))) {
      const fornecedores: Record<string, { nome: string; moeda: string; prazo: number; cambio: number }> = {
        'hunan': { nome: 'Hunan Chemical', moeda: 'CNY', prazo: 45, cambio: 0.77 },
        'gz poly': { nome: 'GZ Poly Materials', moeda: 'CNY', prazo: 40, cambio: 0.77 },
        'quimibras': { nome: 'Quimibras Industrial', moeda: 'BRL', prazo: 7, cambio: 1.0 },
        'sinoresin': { nome: 'SinoResin Chemical', moeda: 'USD', prazo: 50, cambio: 5.05 },
      }
      let forn = { nome: 'Hunan Chemical', moeda: 'CNY', prazo: 45, cambio: 0.77 }
      for (const [k, v] of Object.entries(fornecedores)) { if (t.includes(k)) { forn = v; break } }
      const qtdMatch = msg.match(/(\d+[\.,]?\d*)\s*(kg|ton)?/i)
      const qtd = qtdMatch ? parseFloat(qtdMatch[1].replace(',', '.')) : 1000
      const valorCNY = qtd * 15 // ~15 CNY/kg estimado
      return `Criando Ordem de Compra para **${forn.nome}**:\n\n- Quantidade: ${qtd} kg\n- Moeda: ${forn.moeda}\n- Câmbio: ${forn.cambio}\n- Prazo entrega: ${forn.prazo} dias\n- Valor estimado: ${forn.moeda} ${valorCNY.toLocaleString('pt-BR')}\n\n<action>{"type":"criar_oc","data":{"fornecedor":"${forn.nome}","categoria":"Matéria-prima","descricao":"Conforme especificação técnica","valor_total":${valorCNY * forn.cambio},"moeda":"${forn.moeda}","cambio":${forn.cambio},"prazo_dias":${forn.prazo}}}</action>\n\nOC registrada e aguardando aprovação.`
    }
    if (t.includes('pendente') || t.includes('aprovação') || t.includes('aberta')) {
      return `**Ordens de Compra pendentes:**\n\n| OC | Fornecedor | Valor (BRL) | Status |\n|---|---|---|---|\n| OC-2024-003 | SinoResin Chemical | R$ 21.680 | 🟡 Solicitado |\n| OC-2024-004 | Quimibras Industrial | R$ 8.200 | 🟡 Solicitado |\n\nOC-2024-001 (Hunan) e OC-2024-002 (GZ Poly) já foram recebidas.`
    }
    if (t.includes('fornecedor') || t.includes('prazo') || t.includes('lead time')) {
      return `**Análise de fornecedores:**\n\n| Fornecedor | País | Lead Time | Moeda | Avaliação |\n|---|---|---|---|---|\n| Hunan Chemical | China 🇨🇳 | 43 dias | CNY | ⭐⭐⭐⭐⭐ |\n| GZ Poly Materials | China 🇨🇳 | 40 dias | CNY | ⭐⭐⭐⭐ |\n| SinoResin Chemical | China 🇨🇳 | 52 dias | USD | ⭐⭐⭐⭐ |\n| Quimibras Industrial | Brasil 🇧🇷 | 7 dias | BRL | ⭐⭐⭐ |\n\nPara urgência use Quimibras (7 dias). Para melhor custo-benefício use Hunan ou GZ Poly.`
    }
    return `Como Assistente de Compras, posso:\n\n- **Criar OC** — "Criar OC para Hunan Chemical — 2000kg TiO2"\n- **OC pendentes** — "Quais OC aguardam aprovação?"\n- **Análise de fornecedores** — "Qual fornecedor tem menor prazo?"\n\nO que deseja?`
  }

  // ── ESTOQUE ────────────────────────────────────────────────────
  if (mode === 'estoque') {
    if (t.includes('saldo') || t.includes('atual') || t.includes('posição') || t.includes('consultar')) {
      return `**Posição de Estoque — ${new Date().toLocaleDateString('pt-BR')}:**\n\n| Produto | Estoque | Mínimo | Status |\n|---|---|---|---|\n| Acetona Industrial 99,5% | 1.250 kg | 500 kg | ✅ OK |\n| Tolueno Industrial | 890 kg | 300 kg | ✅ OK |\n| Resina Epóxi Bisfenol A | 340 kg | 100 kg | ✅ OK |\n| Dióxido de Titânio R-902 | 480 kg | 200 kg | ✅ OK |\n| Ftalato de Dioctila (DOP) | 1.100 kg | 500 kg | ✅ OK |\n| Acetato de Etila | **95 kg** | 200 kg | 🔴 CRÍTICO |\n\n⚠️ Acetato de Etila abaixo do mínimo — risco de ruptura em ~3 dias. Emita OC urgente para Quimibras (prazo 7d).`
    }
    if (t.includes('mínimo') || t.includes('critico') || t.includes('crítico') || t.includes('ruptura')) {
      return `**Alertas de Estoque Mínimo:**\n\n🔴 **CRÍTICO** — Acetato de Etila: 95 kg (mínimo: 200 kg)\n   → Ruptura prevista em 3 dias. OC urgente recomendada.\n\n✅ Demais produtos dentro dos limites mínimos.`
    }
    if (t.includes('entrada') || t.includes('recebimento')) {
      const prodMatch = Object.entries({ 'acetona': 'Acetona Industrial 99,5%', 'tolueno': 'Tolueno Industrial', 'resina': 'Resina Epóxi Bisfenol A', 'titanio': 'Dióxido de Titânio R-902', 'dop': 'Ftalato de Dioctila (DOP)', 'acetato': 'Acetato de Etila' }).find(([k]) => t.includes(k))
      const produto = prodMatch ? prodMatch[1] : 'Acetona Industrial 99,5%'
      const qtdMatch = msg.match(/(\d+)/); const qtd = qtdMatch ? parseInt(qtdMatch[1]) : 500
      return `Registrando entrada de **${qtd} kg** de **${produto}**:\n\n<action>{"type":"movimentacao","data":{"produto":"${produto}","tipo":"entrada","quantidade":${qtd},"documento":"NF-${Date.now().toString().slice(-6)}","observacao":"Recebimento conforme OC"}}</action>\n\nMovimentação registrada! Estoque atualizado.`
    }
    return `Como Assistente de Estoque, posso:\n\n- **Consultar saldo** — "Qual o estoque atual?"\n- **Ver críticos** — "Quais estão abaixo do mínimo?"\n- **Registrar entrada** — "Entrada de 500kg de Acetona"\n\nO que deseja?`
  }

  // ── TRADE ──────────────────────────────────────────────────────
  if (mode === 'trade') {
    if (t.includes('câmbio') || t.includes('cambio') || t.includes('cny') || t.includes('dólar') || t.includes('dolar') || t.includes('usd')) {
      return `**Câmbio atual — ${new Date().toLocaleDateString('pt-BR')}:**\n\n| Par | Valor | Var. (mês) | Tendência |\n|---|---|---|---|\n| CNY/BRL | R$ 0,770 | +5,5% | 📈 Alta |\n| USD/BRL | R$ 5,050 | +1,0% | 📈 Alta |\n\n💡 **Recomendação NEXUS:** CNY em alta consistente. Recomendo antecipar próxima ordem Hunan Chemical antes de novo ajuste — economia estimada de **R$ 4.200** na OC de R$ 56.000.`
    }
    if (t.includes('status') || t.includes('trânsito') || t.includes('transit') || t.includes('ativa') || t.includes('processo')) {
      return `**Importações ativas:**\n\n**IMP-2024-001** — Hunan Chemical\n- Status: 🟡 Desembaraço (canal verde — 3 dias)\n- ETA original: 28/11 *(3 dias de atraso)*\n- Acione Despacho Alfa para verificar pendência\n\n**IMP-2024-002** — GZ Poly Materials\n- Status: 🚢 Em Trânsito\n- ETA: 18/12 *(no prazo)*\n- Contêiner: TCKU3456789\n\n**IMP-2024-003** — SinoResin Chemical\n- Status: 📋 Pedido confirmado\n- ETA: 25/01/2025`
    }
    if (t.includes('imp-2024-001') || t.includes('hunan') && t.includes('chega')) {
      return `**IMP-2024-001 — Hunan Chemical:**\n\n- Valor FOB: CNY 73.000 (R$ 56.210)\n- Porto Origem: Guangzhou → Porto Destino: Santos\n- Navio: COSCO Shanghai\n- Canal aduaneiro: 🟢 Verde\n- Status: Em desembaraço há 3 dias\n- ETA revisada: previsão de liberação em 1-2 dias úteis\n\n⚠️ Contate Despacho Alfa Ltda para atualização. Verificar se há pendência de LI ou taxa AFRMM.`
    }
    if (t.includes('lead time') || t.includes('prazo')) {
      return `**Lead Times médios por fornecedor:**\n\n| Fornecedor | Fabricação | Transporte | Desembaraço | Total |\n|---|---|---|---|---|\n| Hunan Chemical | 15d | 24d | 4d | **43 dias** |\n| GZ Poly Materials | 12d | 24d | 5d | **41 dias** |\n| SinoResin Chemical | 20d | 26d | 6d | **52 dias** |\n\nLead time médio China: **45 dias**. Planeje OCs com 60 dias de antecedência para segurança.`
    }
    return `Como Assistente Trade, posso:\n\n- **Câmbio** — "Qual o câmbio CNY hoje?"\n- **Status importações** — "Quais processos estão ativos?"\n- **Acompanhar processo** — "Quando chega IMP-2024-002?"\n- **Lead times** — "Qual o prazo médio dos fornecedores?"\n\nO que deseja?`
  }

  // ── EXECUTIVO ──────────────────────────────────────────────────
  if (mode === 'executivo') {
    if (t.includes('resumo') || t.includes('sumário') || t.includes('visão') || t.includes('geral')) {
      return `**Resumo Executivo — Dezembro 2024:**\n\n📈 **Financeiro:** Faturamento YTD R$ 3,24M (+12,4% vs 2023). EBITDA R$ 580k (17,9%). Caixa saudável em R$ 394k.\n\n⚠️ **Riscos imediatos:**\n1. Fab Têxtil inadimplente — R$ 43k (10 dias)\n2. GZ Poly pagamento vencido — R$ 37,7k\n3. Estoque crítico Acetato de Etila\n4. Contrato Hunan vencendo 31/12\n\n✅ **Pontos positivos:**\n- Margem bruta em expansão (+1,2pp)\n- 3 importações garantindo estoque Q1/2025\n- CNY favorável para antecipar compras\n\n**Recomendação:** Priorizar cobrança Fab Têxtil, renovar CT-2024-003 e emitir OC urgente Acetato de Etila.`
    }
    if (t.includes('risco') || t.includes('ameaça')) {
      return `**Matriz de Riscos — Ativa Chemical:**\n\n🔴 **Crítico:**\n- Inadimplência Fab Têxtil (R$ 43k, 10 dias)\n- Estoque crítico Acetato de Etila (ruptura em 3d)\n\n🟡 **Alto:**\n- Contrato Hunan vencendo 31/12 (R$ 78k/mês)\n- GZ Poly pagamento vencido (risco bloqueio crédito)\n- CNY/BRL +5,5% impacta custo de importação\n\n🟢 **Controlado:**\n- IMP-2024-001 em desembaraço (canal verde)\n- Demais estoque dentro dos mínimos\n- Caixa com 3 meses de cobertura operacional`
    }
    if (t.includes('faturamento') || t.includes('meta') || t.includes('receita')) {
      return `**Performance Faturamento 2024:**\n\n| Período | Valor | Meta | Status |\n|---|---|---|---|\n| Jan-Mar | R$ 622.500 | R$ 600.000 | ✅ +3,8% |\n| Abr-Jun | R$ 711.688 | R$ 700.000 | ✅ +1,7% |\n| Jul-Set | R$ 895.000 | R$ 850.000 | ✅ +5,3% |\n| Out-Dez | R$ 1.016.312 | R$ 950.000 | ✅ +7,0% |\n| **YTD** | **R$ 3.245.500** | **R$ 3.100.000** | **✅ +4,7%** |\n\nAnálise: crescimento consistente ao longo do ano. Out/Nov puxados por PetroSul (pedido especial R$ 180k).`
    }
    return `Como Assistente Executivo, posso:\n\n- **Resumo executivo** — "Visão geral do mês"\n- **Análise de riscos** — "Quais os principais riscos?"\n- **Faturamento vs meta** — "Performance de faturamento 2024"\n- **Recomendações estratégicas** — "O que priorizar agora?"\n\nO que deseja analisar?`
  }

  return `Como posso ajudar? Selecione um modo no menu acima para começar.`
}

// ── Handler ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { messages, mode } = await req.json()
    const lastMsg = messages.filter((m: any) => m.role === 'user').pop()?.content || ''

    // Tenta xAI primeiro se tiver chave
    if (process.env.XAI_API_KEY) {
      try {
        const { default: OpenAI } = await import('openai')
        const client = new OpenAI({ apiKey: process.env.XAI_API_KEY, baseURL: 'https://api.x.ai/v1' })
        const { systemPrompt } = await req.json().catch(() => ({})) || {}
        const response = await client.chat.completions.create({
          model: 'grok-beta',
          max_tokens: 1024,
          messages: [
            { role: 'system', content: systemPrompt || 'Você é o NEXUS Agent da Ativa Chemical. Responda em português.' },
            ...messages.map((m: any) => ({ role: m.role, content: m.content })),
          ],
        })
        return NextResponse.json({ reply: response.choices[0]?.message?.content || '' })
      } catch {
        // fallback para engine local
      }
    }

    // Engine local inteligente
    const reply = buildReply(lastMsg, (mode as AgentMode) || 'comercial')
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Agent error:', err)
    return NextResponse.json({ reply: 'Erro ao processar sua solicitação. Tente novamente.' }, { status: 200 })
  }
}
