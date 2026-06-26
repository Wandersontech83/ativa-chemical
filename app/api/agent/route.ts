import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
})

const SYSTEM_PROMPT_DEFAULT = `Você é o Assistente Comercial da Ativa Chemical, distribuidora brasileira de químicos industriais importados da China.

Pode criar propostas, pedidos e ordens de compra usando tags <action> com JSON.
Responda sempre em português brasileiro, de forma objetiva e profissional.`

export async function POST(req: NextRequest) {
  try {
    const { messages, systemPrompt } = await req.json()

    if (!process.env.XAI_API_KEY) {
      return NextResponse.json(
        { reply: 'Agente não configurado. Adicione XAI_API_KEY nas variáveis de ambiente do Vercel.' },
        { status: 200 }
      )
    }

    const response = await client.chat.completions.create({
      model: 'grok-3-mini',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt || SYSTEM_PROMPT_DEFAULT },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
    })

    const reply = response.choices[0]?.message?.content || ''
    return NextResponse.json({ reply })
  } catch (err: any) {
    console.error('Agent error:', err)
    return NextResponse.json({ reply: 'Erro ao processar sua solicitação. Tente novamente.' }, { status: 200 })
  }
}
