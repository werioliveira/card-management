/* c:\Users\Weri\Documents\dev\card-managment\app\api\categories\route.ts */
import { NextResponse } from "next/server"
import initDb from "@/lib/init-db"
import { all, run } from "@/lib/db"

export async function GET(request: Request) {
  await initDb()
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const categories = await all('SELECT * FROM categories WHERE userId = ?', [userId])
  return NextResponse.json(categories)
}

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, icon, color } = await request.json()
  const id = crypto.randomUUID()

  await run(
    'INSERT INTO categories (id, name, icon, color, userId) VALUES (?, ?, ?, ?, ?)',
    [id, name, icon, color, userId]
  )

  return NextResponse.json({ id, name, icon, color })
}

export async function DELETE(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
  
  await initDb()
  await run(`DELETE FROM categories WHERE id = ? AND userId = ?`, [id, userId])
  return NextResponse.json({ ok: true })
}

export async function PUT(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 })
  }

  try {
    const body = await request.json()
    await initDb()
    await run(`UPDATE categories SET name = ?, icon = ?, color = ? WHERE id = ? AND userId = ?`, [body.name, body.icon, body.color, id, userId])
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
