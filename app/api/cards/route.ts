/* c:\Users\Weri\Documents\dev\card-managment\app\api\cards\route.ts */
import { NextResponse } from "next/server"
import initDb from "@/lib/init-db"
import { all, run } from "@/lib/db"

export async function GET(request: Request) {
  await initDb()
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cards = await all('SELECT * FROM cards WHERE userId = ?', [userId])
  return NextResponse.json(cards)
}

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const id = crypto.randomUUID()

    await run(
      `INSERT INTO cards (id, name, lastDigits, brand, "limit", closingDay, dueDay, color, userId) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, body.name, body.lastDigits, body.brand, body.limit, body.closingDay, body.dueDay, body.color, userId]
    )

    return NextResponse.json({ id, ...body })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar cartão" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  await initDb()
  // Soft delete para manter histórico, ou delete real se preferir
  await run(`DELETE FROM cards WHERE id = ? AND userId = ?`, [id, userId])
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
    await run(
      `UPDATE cards SET name = ?, lastDigits = ?, brand = ?, "limit" = ?, closingDay = ?, dueDay = ?, color = ? WHERE id = ? AND userId = ?`,
      [body.name, body.lastDigits, body.brand, body.limit, body.closingDay, body.dueDay, body.color, id, userId]
    )
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
