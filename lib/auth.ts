import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { query, queryOne } from './db'

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'ativa_nextauth_secret_2024'
)

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'gestor' | 'analista' | 'vendedor' | 'comprador'
}

export async function signToken(user: User): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as User
  } catch {
    return null
  }
}

export async function getSession(): Promise<User | null> {
  const cookieStore = cookies()
  const token = cookieStore.get('ativa_session')?.value
  if (!token) return null
  return verifyToken(token)
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<User | null> {
  // Demo: aceita qualquer senha para os usuários demo
  const demoUsers: Record<string, { user: User; senha: string }> = {
    'admin@ativachemical.com.br':       { user: { id: '11111111-1111-1111-1111-111111111111', email: 'admin@ativachemical.com.br',       name: 'Wanderson Lima',    role: 'admin'    }, senha: 'ativa2024'      },
    'gestor@ativachemical.com.br':      { user: { id: '22222222-2222-2222-2222-222222222222', email: 'gestor@ativachemical.com.br',      name: 'Ana Rodrigues',     role: 'gestor'   }, senha: 'ativa2024'      },
    'analista@ativachemical.com.br':    { user: { id: '33333333-3333-3333-3333-333333333333', email: 'analista@ativachemical.com.br',    name: 'Lucas Ferreira',    role: 'analista' }, senha: 'ativa2024'      },
    'fagner.lima@ativachemical.com':    { user: { id: '44444444-4444-4444-4444-444444444444', email: 'fagner.lima@ativachemical.com',    name: 'Fagner Lima',       role: 'gestor'   }, senha: 'Fagner@2024'    },
    'reginaldo.alves@ativachemical.com':{ user: { id: '55555555-5555-5555-5555-555555555555', email: 'reginaldo.alves@ativachemical.com',name: 'Reginaldo Alves',   role: 'vendedor' }, senha: 'Reginaldo@2024' },
  }

  const entry = demoUsers[email.toLowerCase()]
  if (entry && password === entry.senha) {
    return entry.user
  }

  // Produção: verificar no banco
  try {
    const user = await queryOne<User & { password_hash: string }>(
      'SELECT id, email, name, role, password_hash FROM users WHERE email = $1 AND active = true',
      [email]
    )
    if (!user) return null

    const bcrypt = await import('bcryptjs')
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return null

    return { id: user.id, email: user.email, name: user.name, role: user.role }
  } catch {
    return null
  }
}
