import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'wanderson.tech83@gmail.com'
const FROM_EMAIL = process.env.FROM_EMAIL || 'Ativa Chemical <onboarding@resend.dev>'

export async function POST(req: NextRequest) {
  try {
    const { numero, fornecedor, valor_total, moeda, cambio, data, forma_pagamento, pdf_base64 } = await req.json()

    if (!process.env.RESEND_API_KEY) {
      console.warn('[send-email] RESEND_API_KEY não configurado — e-mail não enviado')
      return NextResponse.json({ ok: false, error: 'RESEND_API_KEY não configurado' }, { status: 200 })
    }

    const valorBRL = moeda === 'BRL' ? valor_total : valor_total * cambio
    const valorFormatado = valorBRL.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    const dataFormatada = new Date(data + 'T12:00').toLocaleDateString('pt-BR')

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px 0;">
        <div style="background: #0c1829; padding: 28px 32px; border-radius: 12px 12px 0 0;">
          <p style="color: #06b6d4; font-size: 20px; font-weight: bold; margin: 0;">Ativa Chemical</p>
          <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 0;">Sistema de Gestão Comercial</p>
        </div>
        <div style="background: #ffffff; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="color: #16a34a; font-weight: bold; margin: 0 0 4px; font-size: 14px;">✅ Ordem de Compra APROVADA</p>
            <p style="color: #166534; font-size: 28px; font-weight: bold; margin: 0;">${numero}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b;">Fornecedor</td>
              <td style="padding: 10px 0; font-weight: 600; text-align: right;">${fornecedor}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b;">Data da OC</td>
              <td style="padding: 10px 0; text-align: right;">${dataFormatada}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b;">Condição de Pagamento</td>
              <td style="padding: 10px 0; text-align: right;">${forma_pagamento}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b;">Valor Total (BRL)</td>
              <td style="padding: 10px 0; font-weight: bold; color: #0c1829; font-size: 18px; text-align: right;">${valorFormatado}</td>
            </tr>
          </table>
          <p style="margin: 24px 0 0; font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px;">
            O PDF completo da OC aprovada está anexado a este e-mail.<br>
            <span style="color: #cbd5e1;">Ativa Chemical Distribuidora Ltda · Sistema Ativa ERP</span>
          </p>
        </div>
      </div>
    `

    const attachments = pdf_base64
      ? [{ filename: `${numero}.pdf`, content: pdf_base64 }]
      : []

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject: `✅ OC Aprovada: ${numero} — ${fornecedor}`,
      html,
      attachments,
    })

    if (error) {
      console.error('[send-email] Resend error:', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[send-email] Erro:', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
