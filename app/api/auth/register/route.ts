/* c:\Users\Weri\Documents\dev\card-managment\app\api\auth\register\route.ts */
import { NextResponse } from 'next/server'
import { run } from '@/lib/db'
import initDb from '@/lib/init-db'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    await initDb()
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const id = crypto.randomUUID()
    const createdAt = new Date().toISOString()

    try {
      await run(
        `INSERT INTO users (id, name, email, password, createdAt) VALUES (?, ?, ?, ?, ?)`,
        [id, name, email, hashedPassword, createdAt]
      )
    } catch (e: any) {
      if (e.message?.includes('UNIQUE')) {
        return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 })
      }
      throw e
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro no registro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
