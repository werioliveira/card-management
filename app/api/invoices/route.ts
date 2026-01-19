import { NextResponse } from "next/server"
import initDb from "@/lib/init-db"
import { all } from "@/lib/db"

export async function GET(request: Request) {
  await initDb()
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Filtra apenas as faturas do usuário logado
  const invoices = await all('SELECT * FROM invoices WHERE userId = ?', [userId])
  return NextResponse.json(invoices)
}
