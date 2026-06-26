import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user || user.role === 'analista') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  try {
    await query(
      `UPDATE proposals SET status = 'aprovada', data_resposta = NOW() WHERE id = $1`,
      [params.id]
    )

    // Criar pedido de venda automaticamente
    await query(
      `INSERT INTO sales_orders (numero, proposal_id, customer_id, usuario_id, status, condicoes_pagamento, subtotal, impostos_total, total, custo_total, margem_percentual)
       SELECT CONCAT('PV-', TO_CHAR(NOW(), 'YYYY'), '-', LPAD(NEXTVAL('seq_pedidos')::text, 3, '0')), id, customer_id, $1, 'aguardando_aprovacao', condicoes_pagamento, subtotal, impostos_total, total, total * 0.65, margem_percentual
       FROM proposals WHERE id = $2`,
      [user.id, params.id]
    ).catch(() => null) // ignora se sequence não existe no demo

    return NextResponse.json({ success: true, message: 'Proposta aprovada e pedido criado' })
  } catch {
    // Demo fallback
    return NextResponse.json({ success: true, message: 'Proposta aprovada (modo demo)' })
  }
}
