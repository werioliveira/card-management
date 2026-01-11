import { NextResponse } from "next/server"
import initDb from "@/lib/init-db"
import { run } from "@/lib/db"
import { categories } from "@/lib/mock-data"

export async function POST() {
  await initDb()
  
  for (const cat of categories) {
    try {
      await run(`INSERT INTO categories (id,name,icon,color) VALUES (?,?,?,?)`, [cat.id, cat.name, cat.icon, cat.color])
    } catch (e) {
      // Ignora se já existe
    }
  }
  
  return NextResponse.json({ ok: true, message: "Categorias populadas com sucesso" })
}
