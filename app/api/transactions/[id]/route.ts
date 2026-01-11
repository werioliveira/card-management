// app/api/transactions/[id]/route.ts
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import initDb from "@/lib/init-db"
import { run, get } from "@/lib/db"

export async function DELETE(
  request: Request,

  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get("x-user-id")
    const { searchParams } = new URL(request.url)
    const deleteAll = searchParams.get("all") === "true" // Verifica se o usuário quer deletar tudo

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await initDb()
    const { id } = await params

    // 1. Busca a transação alvo
    const tx = await get("SELECT * FROM transactions WHERE id = ? AND userId = ?", [id, userId])
    if (!tx) return NextResponse.json({ error: "Não encontrada" }, { status: 404 })

    if (deleteAll && tx.installments > 1) {
      // 2. Lógica para Deletar em Massa
      // Pegamos o prefixo do ID (ex: tiramos o "-1", "-2" do final)
      const baseId = id.split('-').slice(0, -1).join('-')
      
      // Deletamos todas que começam com esse prefixo
      await run(
        "DELETE FROM transactions WHERE id LIKE ? AND userId = ?", 
        [`${baseId}-%`, userId]
      )
    } else {
      // 3. Deleta apenas a parcela individual
      await run("DELETE FROM transactions WHERE id = ? AND userId = ?", [id, userId])
    }

    revalidatePath("/")
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}