import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { tipo, numero, valor, cliente, fornecedor } = body

    const RESEND_API_KEY = process.env.RESEND_API_KEY
    const GESTOR_EMAIL = process.env.GESTOR_EMAIL || 'gestor@ativachemical.com.br'

    if (!RESEND_API_KEY) {
      // sem API key, só logamos — não falha o fluxo principal
      console.log('[aprovacao] sem RESEND_API_KEY, email não enviado', { tipo, numero })
      return NextResponse.json({ ok: true, emailEnviado: false })
    }

    const { Resend } = await import('resend')
    const resend = new Resend(RESEND_API_KEY)

    const descricao = tipo === 'PV'
      ? `Pedido de Venda <strong>${numero}</strong> — Cliente: ${cliente}`
      : `Ordem de Compra <strong>${numero}</strong> — Fornecedor: ${fornecedor}`

    const html = `
      <div style="font-family:Inter,sans-serif;max-width:580px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
        <div style="background:linear-gradient(135deg,#1e3a5f 0%,#2d6a9f 100%);padding:28px 32px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
            <div style="background:rgba(255,255,255,0.2);border-radius:8px;padding:6px;display:inline-block">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <span style="color:#93c5fd;font-size:12px;font-weight:600;letter-spacing:0.05em">ATIVA CHEMICAL ERP</span>
          </div>
          <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0">Aprovação Necessária</h1>
          <p style="color:#bfdbfe;font-size:14px;margin:4px 0 0">${tipo === 'PV' ? 'Pedido de Venda' : 'Ordem de Compra'} aguardando sua aprovação</p>
        </div>
        <div style="padding:28px 32px">
          <p style="color:#475569;font-size:14px;margin:0 0 20px">Um novo documento foi submetido para aprovação e requer sua ação:</p>
          <div style="background:#f8fafc;border-radius:10px;padding:20px;border-left:4px solid #3b82f6;margin-bottom:20px">
            <p style="margin:0 0 8px;color:#1e293b;font-size:14px">${descricao}</p>
            <p style="margin:0;color:#64748b;font-size:13px">Valor: <strong style="color:#0f172a">${valor}</strong></p>
          </div>
          <p style="color:#64748b;font-size:13px;margin:0 0 20px">Acesse o painel de aprovações no ERP para visualizar os detalhes e tomar uma decisão.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/aprovacoes"
            style="display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">
            Ver Painel de Aprovações →
          </a>
        </div>
        <div style="background:#f1f5f9;padding:16px 32px;border-top:1px solid #e2e8f0">
          <p style="margin:0;color:#94a3b8;font-size:11px">Ativa Chemical Distribuidora de Produtos Químicos · Este e-mail é automático, não responda.</p>
        </div>
      </div>
    `

    await resend.emails.send({
      from: process.env.RESEND_FROM || 'Ativa Chemical ERP <erp@ativachemical.com.br>',
      to: [GESTOR_EMAIL],
      subject: `[Aprovação] ${tipo === 'PV' ? 'Pedido de Venda' : 'Ordem de Compra'} ${numero} — Valor: ${valor}`,
      html,
    })

    return NextResponse.json({ ok: true, emailEnviado: true })
  } catch (err) {
    console.error('[aprovacao/notificar]', err)
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 })
  }
}
