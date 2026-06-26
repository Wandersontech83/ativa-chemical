import { query } from '@/lib/db'
import EstoqueClient from './EstoqueClient'

async function getEstoqueData() {
  try {
    const [products, movements] = await Promise.all([
      query(`
        SELECT p.id, p.codigo, p.nome, p.unidade, p.ncm,
               p.estoque_atual, p.estoque_minimo, p.estoque_reservado,
               p.preco_custo, p.localizacao_armazem, p.ativo,
               pc.nome as categoria_nome,
               s.nome_fantasia as fornecedor_nome
        FROM products p
        LEFT JOIN product_categories pc ON pc.id = p.categoria_id
        LEFT JOIN suppliers s ON s.id = p.fornecedor_padrao_id
        WHERE p.ativo = true
        ORDER BY p.estoque_atual <= p.estoque_minimo DESC, p.nome
        LIMIT 50
      `),
      query(`
        SELECT sm.*, p.nome as produto_nome, p.codigo as produto_codigo, u.name as usuario_nome
        FROM stock_movements sm
        JOIN products p ON p.id = sm.product_id
        LEFT JOIN users u ON u.id = sm.usuario_id
        ORDER BY sm.created_at DESC
        LIMIT 20
      `),
    ])
    return { products, movements }
  } catch {
    return { products: [], movements: [] }
  }
}

export default async function EstoquePage() {
  const data = await getEstoqueData()
  return <EstoqueClient data={data} />
}
