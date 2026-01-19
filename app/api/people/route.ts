/* c:\Users\Weri\Documents\dev\card-managment\app\api\people\route.ts */
import { NextResponse } from "next/server"
import initDb from "@/lib/init-db"
import { all, run } from "@/lib/db"

export async function GET(request: Request) {
  await initDb()
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const people = await all('SELECT * FROM people WHERE userId = ?', [userId])
  return NextResponse.json(people)
}

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, email, color } = await request.json()
  const id = crypto.randomUUID()

  await run(
    'INSERT INTO people (id, name, email, color, userId) VALUES (?, ?, ?, ?, ?)',
    [id, name, email, color, userId]
  )

  return NextResponse.json({ id, name, email, color })
}

export async function DELETE(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
  
  await initDb()
  await run(`DELETE FROM people WHERE id = ? AND userId = ?`, [id, userId])
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
    await run(`UPDATE people SET name = ?, email = ?, color = ? WHERE id = ? AND userId = ?`, [body.name, body.email, body.color, id, userId])
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
