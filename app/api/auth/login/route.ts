/* c:\Users\Weri\Documents\dev\card-managment\app\api\auth\login\route.ts */
import { NextResponse } from 'next/server'
import { get } from '@/lib/db'
import initDb from '@/lib/init-db'
import { encrypt } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    await initDb()
    const { email, password } = await request.json()

    const user = await get(`SELECT * FROM users WHERE email = ?`, [email])

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    // Cria o token JWT
    const token = await encrypt({ 
      sub: user.id, 
      email: user.email, 
      name: user.name 
    })

    // Define o cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 dia
    })

    return response
  } catch (error) {
    console.error('Erro no login:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
