import { query } from '@/lib/db'
import DashboardClient from './DashboardClient'

async function getDashboardData() {
  try {
    const [kpis, alerts, chartData, topProducts] = await Promise.all([
      query(`
        SELECT
          (SELECT COALESCE(SUM(total),0) FROM sales_orders WHERE status NOT IN ('cancelado') AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())) as faturamento_mes,
          (SELECT COUNT(*) FROM sales_orders WHERE status IN ('aguardando_aprovacao','aprovado')) as pedidos_aberto,
          (SELECT COUNT(*) FROM products WHERE estoque_atual <= estoque_minimo AND ativo = true) as estoque_critico,
          (SELECT COUNT(*) FROM proposals WHERE status = 'enviada') as propostas_pendentes,
          (SELECT COALESCE(SUM(total),0) FROM sales_orders WHERE status NOT IN ('cancelado') AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month')) as faturamento_mes_anterior,
          (SELECT COUNT(*) FROM agent_alerts WHERE status = 'novo') as alertas_novos
      `),
      query(`
        SELECT id, tipo, titulo, descricao, sugestao_agente, status, prioridade, referencia_tipo, referencia_id, acao_url, created_at
        FROM agent_alerts
        WHERE status IN ('novo', 'lido')
        ORDER BY prioridade = 'alta' DESC, created_at DESC
        LIMIT 8
      `),
      query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as mes,
          EXTRACT(MONTH FROM created_at) as mes_num,
          COALESCE(SUM(total),0) as faturamento,
          COALESCE(SUM(lucro_bruto),0) as lucro
        FROM sales_orders
        WHERE created_at >= NOW() - INTERVAL '6 months'
          AND status NOT IN ('cancelado')
        GROUP BY DATE_TRUNC('month', created_at), EXTRACT(MONTH FROM created_at)
        ORDER BY DATE_TRUNC('month', created_at)
      `),
      query(`
        SELECT p.nome, p.codigo, SUM(soi.quantidade) as qtd_vendida, SUM(soi.subtotal) as valor_total
        FROM sales_order_items soi
        JOIN products p ON p.id = soi.product_id
        JOIN sales_orders so ON so.id = soi.sales_order_id
        WHERE so.status NOT IN ('cancelado') AND so.created_at >= NOW() - INTERVAL '3 months'
        GROUP BY p.id, p.nome, p.codigo
        ORDER BY valor_total DESC
        LIMIT 5
      `),
    ])

    return { kpis: kpis[0], alerts, chartData, topProducts }
  } catch (err) {
    console.error('Dashboard query error:', err)
    return { kpis: null, alerts: [], chartData: [], topProducts: [] }
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()
  return <DashboardClient data={data} />
}
