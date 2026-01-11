import { NextResponse } from "next/server"
import initDb from "@/lib/init-db"
import { all, run } from "@/lib/db"

export async function GET() {
  await initDb()
  const rows = await all(`SELECT * FROM categories ORDER BY name`)
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
        icon: formData.get("icon"),
        color: formData.get("color"),
      }
    }
  } catch (e) {
    body = {
      id: Date.now().toString(),
      name: "",
      icon: "tag",
      color: "#6366f1",
    }
  }

  await initDb()
  await run(`INSERT INTO categories (id,name,icon,color) VALUES (?,?,?,?)`, [body.id, body.name, body.icon, body.color])
  return NextResponse.redirect(new URL("/categories", request.url), { status: 303 })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
  await initDb()
  await run(`DELETE FROM categories WHERE id = ?`, [id])
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
        icon: formData.get("icon"),
        color: formData.get("color"),
      }
    }
  } catch (e) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  await initDb()
  await run(`UPDATE categories SET name = ?, icon = ?, color = ? WHERE id = ?`, [body.name, body.icon, body.color, id])
  return NextResponse.json({ ok: true })
}

