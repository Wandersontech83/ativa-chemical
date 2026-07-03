import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout']

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'ativa_nextauth_secret_2024'
)

// Rotas que exigem role mínimo — vendedor é bloqueado nestas
const ROTAS_FINANCEIRO = [
  '/financeiro', '/compras', '/contratos', '/importacao',
  '/executivo', '/alertas', '/admin', '/configuracoes', '/vendedores',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const token = req.cookies.get('ativa_session')?.value
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    const { payload } = await jwtVerify(token, SECRET)
    const role = (payload as any).role as string

    // vendedor e comprador não podem acessar rotas financeiras/admin
    if (['vendedor', 'comprador'].includes(role)) {
      const bloqueada = ROTAS_FINANCEIRO.some(r => pathname.startsWith(r))
      if (bloqueada) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  } catch {
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.delete('ativa_session')
    return res
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.ico).*)'],
}
