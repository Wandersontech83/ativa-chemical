import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const FROM = process.env.RESEND_FROM || 'Ativa Chemical ERP <agenda@ativachemical.com.br>'

interface VisitaPayload {
  id: string
  cliente_nome: string
  cliente_cidade: string
  cliente_uf: string
  data: string
  hora: string
  objetivo: string
  observacoes?: string
}

function htmlLembrete(vendedor: string, visitas: VisitaPayload[], tipo: 'confirmacao' | 'resumo_dia') {
  const fmtData = (d: string) => {
    const [y, m, dd] = d.split('-')
    return `${dd}/${m}/${y}`
  }

  const titulo = tipo === 'confirmacao'
    ? `🔔 Lembrete: visita agendada — ${fmtData(visitas[0]?.data)}`
    : `☀️ Bom dia, ${vendedor.split(' ')[0]}! Suas visitas de hoje`

  const linhasVisita = visitas.map(v => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;">
        <strong style="color:#0f172a;">${v.cliente_nome}</strong><br>
        <span style="color:#64748b;font-size:13px;">${v.cliente_cidade}/${v.cliente_uf}</span>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#2563eb;font-weight:600;white-space:nowrap;">
        ${v.hora}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#475569;font-size:13px;">
        ${v.objetivo}${v.observacoes ? `<br><em style="color:#94a3b8">${v.observacoes}</em>` : ''}
      </td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0c1829 0%,#1e3a5f 100%);padding:32px;border-radius:16px 16px 0 0;text-align:center;">
          <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#67e8f9;">Ativa Chemical</p>
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">${titulo}</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:32px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <p style="color:#475569;margin:0 0 24px;">Olá, <strong>${vendedor}</strong>! Aqui está${visitas.length > 1 ? 'm' : ''} sua${visitas.length > 1 ? 's' : ''} visita${visitas.length > 1 ? 's' : ''} agendada${visitas.length > 1 ? 's' : ''}:</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;">Cliente</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;">Horário</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;">Objetivo</th>
              </tr>
            </thead>
            <tbody>${linhasVisita}</tbody>
          </table>

          <div style="margin-top:28px;padding:16px;background:#eff6ff;border-radius:10px;border-left:3px solid #2563eb;">
            <p style="margin:0;color:#1e40af;font-size:13px;">💡 Acesse o ERP para registrar check-in, observações e resultados das visitas em tempo real.</p>
          </div>

          <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;text-align:center;">
            Ativa Chemical ERP · Este é um e-mail automático. Não responda esta mensagem.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// POST /api/agenda/lembrete — chamado pela agenda ao criar visita com lembrete=true
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('ativa_session')?.value
    const user = token ? await verifyToken(token) : null
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY não configurada', tip: 'Configure em Vercel > Settings > Environment Variables' }, { status: 503 })
    }

    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const { visitas, tipo } = await req.json() as { visitas: VisitaPayload[]; tipo: 'confirmacao' | 'resumo_dia' }
    if (!visitas?.length) return NextResponse.json({ error: 'Nenhuma visita informada' }, { status: 400 })

    const assunto = tipo === 'confirmacao'
      ? `🔔 Visita agendada: ${visitas[0].cliente_nome} em ${new Date(visitas[0].data + 'T12:00:00').toLocaleDateString('pt-BR')}`
      : `☀️ Suas visitas de hoje — ${new Date().toLocaleDateString('pt-BR')}`

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [user.email],
      subject: assunto,
      html: htmlLembrete(user.name, visitas, tipo),
    })

    if (error) {
      console.error('[Resend]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, id: data?.id })
  } catch (err: any) {
    console.error('[agenda/lembrete]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
