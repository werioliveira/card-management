import { NextResponse } from "next/server"
import { run } from "@/lib/db"
import initDb from "@/lib/init-db"

export async function PATCH(
  request: Request,
  // Tipagem correta para Next.js 15/16
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb()
    
    // OBRIGATÓRIO no React 19 / Next.js 15
    const resolvedParams = await params
    const id = resolvedParams.id

    await run(
      `UPDATE invoices SET status = 'paid' WHERE id = ?`,
      [id]
    )

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("Erro na API de pagamento:", error)
    return NextResponse.json({ error: "Erro ao pagar fatura" }, { status: 500 })
  }
}