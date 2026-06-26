const N8N_BASE_URL = process.env.NEXT_PUBLIC_N8N_URL || 'http://localhost:5678'
const N8N_PUBLIC_URL = process.env.NEXT_PUBLIC_N8N_PUBLIC_URL || 'http://localhost:5678'

export async function callN8nWebhook<T = unknown>(
  path: string,
  data: unknown,
  method: 'POST' | 'GET' = 'POST'
): Promise<T> {
  const baseUrl = typeof window !== 'undefined' ? N8N_PUBLIC_URL : N8N_BASE_URL
  const url = `${baseUrl}/webhook/${path}`

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'POST' ? JSON.stringify(data) : undefined,
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`N8N webhook erro ${res.status}: ${err}`)
  }

  return res.json() as Promise<T>
}

export const n8nWebhooks = {
  entradaXmlNfe: (data: unknown) => callN8nWebhook('entrada-xml-nfe', data),
  leituraCodigoBarras: (chave: string) => callN8nWebhook('leitura-codigo-barras', { chave }),
  criarProposta: (data: unknown) => callN8nWebhook('proposta-criar', data),
  aprovarProposta: (id: string) => callN8nWebhook('proposta-aprovar', { id }),
  criarPedido: (data: unknown) => callN8nWebhook('pedido-criar', data),
  aprovarPedido: (id: string) => callN8nWebhook('pedido-aprovar', { id }),
  emitirNfe: (orderId: string) => callN8nWebhook('emitir-nfe', { orderId }),
  atualizarLogistica: (data: unknown) => callN8nWebhook('logistica-update', data),
  executarAgente: () => callN8nWebhook('agente-ia', {}),
}
