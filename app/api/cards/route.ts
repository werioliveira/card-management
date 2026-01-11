import { NextResponse } from "next/server"
import initDb from "@/lib/init-db"
import { all, run } from "@/lib/db"

export async function GET() {
  await initDb()
  // Pegamos apenas os que não foram "deletados" logicamente
  const rows = await all(`SELECT * FROM cards WHERE active = 1 ORDER BY name`)
  return NextResponse.json(rows)
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || ""
  let body: any = {}

  try {
    if (contentType.includes("application/json")) {
      body = await request.json()
    } else {
      const formData = await request.formData()
      body = {
        id: Date.now().toString(),
        name: formData.get("name"),
        lastDigits: formData.get("lastDigits"),
        brand: formData.get("brand"),
        limit: Number.parseFloat(formData.get("limit") as string),
        closingDay: Number.parseInt(formData.get("closingDay") as string),
        dueDay: Number.parseInt(formData.get("dueDay") as string),
        color: formData.get("color"),
      }
    }
  } catch (e) {
    body = {
      id: Date.now().toString(),
      name: "",
      lastDigits: "",
      brand: "mastercard",
      limit: 0,
      closingDay: 1,
      dueDay: 8,
      color: "#8b5cf6",
    }
  }

  await initDb()
  await run(
    `INSERT INTO cards (id,name,lastDigits,brand,"limit",closingDay,dueDay,color) VALUES (?,?,?,?,?,?,?,?)`,
    [body.id, body.name, body.lastDigits, body.brand, body.limit, body.closingDay, body.dueDay, body.color]
  )
  return NextResponse.redirect(new URL("/cards", request.url), { status: 303 })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  await initDb()
  // Adicione uma coluna 'active' (0 ou 1) na sua tabela cards se ainda não tiver
  await run(`UPDATE cards SET active = 0 WHERE id = ?`, [id])
  return NextResponse.json({ ok: true })
}

export async function PUT(request: Request) {
  const url = new URL(request.url)
  const pathParts = url.pathname.split("/")
  const id = pathParts[pathParts.length - 1]

  if (!id || id === "route.ts") {
    return NextResponse.json({ error: "ID required" }, { status: 400 })
  }

  const contentType = request.headers.get("content-type") || ""
  let body: any = {}

  try {
    if (contentType.includes("application/json")) {
      body = await request.json()
    } else {
      const formData = await request.formData()
      body = {
        name: formData.get("name"),
        lastDigits: formData.get("lastDigits"),
        brand: formData.get("brand"),
        limit: Number.parseFloat(formData.get("limit") as string),
        closingDay: Number.parseInt(formData.get("closingDay") as string),
        dueDay: Number.parseInt(formData.get("dueDay") as string),
        color: formData.get("color"),
      }
    }
  } catch (e) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  await initDb()
  await run(
    `UPDATE cards SET name = ?, lastDigits = ?, brand = ?, "limit" = ?, closingDay = ?, dueDay = ?, color = ? WHERE id = ?`,
    [body.name, body.lastDigits, body.brand, body.limit, body.closingDay, body.dueDay, body.color, id]
  )
  return NextResponse.json({ ok: true })
}
