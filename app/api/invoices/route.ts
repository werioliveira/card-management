import { NextResponse } from "next/server"
import initDb from "@/lib/init-db"
import { all } from "@/lib/db"

export async function GET() {
  await initDb()
  const rows = await all(`SELECT * FROM invoices ORDER BY year DESC, month DESC`)
  return NextResponse.json(rows)
}
