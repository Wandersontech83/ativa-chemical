export type Regiao = 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul'

export const UF_REGIAO: Record<string, Regiao> = {
  AC: 'Norte', AM: 'Norte', AP: 'Norte', PA: 'Norte', RO: 'Norte', RR: 'Norte', TO: 'Norte',
  AL: 'Nordeste', BA: 'Nordeste', CE: 'Nordeste', MA: 'Nordeste', PB: 'Nordeste',
  PE: 'Nordeste', PI: 'Nordeste', RN: 'Nordeste', SE: 'Nordeste',
  DF: 'Centro-Oeste', GO: 'Centro-Oeste', MS: 'Centro-Oeste', MT: 'Centro-Oeste',
  ES: 'Sudeste', MG: 'Sudeste', RJ: 'Sudeste', SP: 'Sudeste',
  PR: 'Sul', RS: 'Sul', SC: 'Sul',
}

export const REGIOES: Regiao[] = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul']

export const REGIAO_COR: Record<Regiao, string> = {
  'Norte':        '#f59e0b',
  'Nordeste':     '#ef4444',
  'Centro-Oeste': '#8b5cf6',
  'Sudeste':      '#3b82f6',
  'Sul':          '#10b981',
}

export const REGIAO_EMOJI: Record<Regiao, string> = {
  'Norte':        '🌿',
  'Nordeste':     '☀️',
  'Centro-Oeste': '🌾',
  'Sudeste':      '🏙️',
  'Sul':          '🌲',
}

export function getRegiao(uf: string): Regiao {
  return UF_REGIAO[uf] || 'Sudeste'
}

export function getUFsRegiao(regiao: Regiao): string[] {
  return Object.entries(UF_REGIAO).filter(([, r]) => r === regiao).map(([uf]) => uf)
}

// Health score: 0–100
export function calcularHealthScore(cliente: any): { score: number; label: string; cor: string } {
  let score = 100
  const hoje = new Date()

  if (cliente.ultima_compra) {
    const dias = Math.floor((hoje.getTime() - new Date(cliente.ultima_compra).getTime()) / 86400000)
    if (dias > 180) score -= 40
    else if (dias > 90) score -= 25
    else if (dias > 60) score -= 10
  } else {
    score -= 50
  }

  if (cliente.status === 'inadimplente') score -= 30
  else if (cliente.status === 'inativo') score -= 25
  else if (cliente.status === 'sem_compra') score -= 20

  if (cliente.faturamento12m > 300000) score += 15
  else if (cliente.faturamento12m > 150000) score += 8

  score = Math.max(0, Math.min(100, score))

  if (score >= 70) return { score, label: 'Saudável', cor: '#10b981' }
  if (score >= 40) return { score, label: 'Atenção', cor: '#f59e0b' }
  return { score, label: 'Em risco', cor: '#ef4444' }
}

// Priority score for route
export function calcularPrioridade(
  cliente: any,
  origemLat: number,
  origemLng: number
): number {
  let score = 0
  const hoje = new Date()

  if (cliente.ultima_compra) {
    const dias = Math.floor((hoje.getTime() - new Date(cliente.ultima_compra).getTime()) / 86400000)
    score += Math.min(dias, 180) * 0.3
  } else {
    score += 54
  }

  if (cliente.status === 'sem_compra') score += 30
  if (cliente.status === 'inadimplente') score += 20
  if (cliente.status === 'prospecto') score += 25
  if (cliente.faturamento12m > 300000) score += 20
  else if (cliente.faturamento12m > 150000) score += 10

  const dist = Math.sqrt(
    Math.pow(cliente.lat - origemLat, 2) + Math.pow(cliente.lng - origemLng, 2)
  )
  score += Math.max(0, 30 - dist * 8)

  return Math.round(score)
}

// Explica o score
export function explicarPrioridade(cliente: any, origemLat: number, origemLng: number): string {
  const hoje = new Date()
  const razoes: string[] = []

  if (cliente.ultima_compra) {
    const dias = Math.floor((hoje.getTime() - new Date(cliente.ultima_compra).getTime()) / 86400000)
    if (dias > 30) razoes.push(`${dias}d sem compra`)
  }
  if (cliente.status === 'sem_compra') razoes.push('sem compra +90d')
  if (cliente.status === 'inadimplente') razoes.push('inadimplente')
  if (cliente.faturamento12m > 300000) razoes.push('alto potencial')

  const dist = Math.sqrt(
    Math.pow(cliente.lat - origemLat, 2) + Math.pow(cliente.lng - origemLng, 2)
  )
  const km = Math.round(dist * 111)
  if (km < 200) razoes.push(`~${km} km de você`)

  return razoes.join(' · ') || 'Cliente ativo'
}
