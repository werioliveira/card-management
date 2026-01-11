import { NextResponse } from "next/server"
import initDb from "@/lib/init-db"
import { all, run } from "@/lib/db"

export async function POST(request: Request) {
  await initDb()
  
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Buscar IDs de cartões, pessoas e categorias
    const cards = await all("SELECT id FROM cards LIMIT 1")
    const people = await all("SELECT id FROM people LIMIT 1")
    const categories = await all("SELECT id FROM categories LIMIT 1")

    if (!cards.length || !people.length || !categories.length) {
      return NextResponse.json(
        { error: "Certifique-se de que existe pelo menos um cartão, pessoa e categoria" },
        { status: 400 }
      )
    }

    const cardId = cards[0].id
    const personId = people[0].id
    const categoryId = categories[0].id
    const now = new Date()

    // Cria 12 transações de teste: 2 em cada dos últimos 6 meses e 2 no mês atual
    const transactionsToCreate = []
    for (let i = 0; i < 12; i++) {
      const monthOffset = Math.floor(i / 2) - 5 // Distribui 2 transações por mês nos últimos 5 meses + atual
      const txDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 15 + (i % 2) * 10)
      
      const baseId = `test-${Date.now()}-${i}`
      const installments = i % 3 === 0 ? 3 : i % 3 === 1 ? 12 : 1 // Alguns com 3, alguns com 12, alguns com 1
      
      // Se tem parcelas, cria uma para cada uma
      if (installments > 1) {
        const addMonths = (date: Date, months: number) => {
          const d = new Date(date)
          d.setMonth(d.getMonth() + months)
          return d
        }

        for (let j = 1; j <= installments; j++) {
          const parceleDate = addMonths(txDate, j - 1)
          const formattedDate = parceleDate.toISOString().split("T")[0]
          
          await run(
            `INSERT INTO transactions (id,description,amount,date,cardId,personId,categoryId,installments,currentInstallment,userId) VALUES (?,?,?,?,?,?,?,?,?,?)`,
            [
              `${baseId}-${j}`,
              `Transação de teste ${i + 1} - Parcela ${j}/${installments}`,
              Math.floor(Math.random() * 2000) + 100,
              formattedDate,
              cardId,
              personId,
              categoryId,
              installments,
              j,
              userId,
            ]
          )
        }
      } else {
        const formattedDate = txDate.toISOString().split("T")[0]
        await run(
          `INSERT INTO transactions (id,description,amount,date,cardId,personId,categoryId,installments,currentInstallment,userId) VALUES (?,?,?,?,?,?,?,?,?,?)`,
          [
            baseId,
            `Transação de teste ${i + 1}`,
            Math.floor(Math.random() * 2000) + 100,
            formattedDate,
            cardId,
            personId,
            categoryId,
            1,
            1,
            userId,
          ]
        )
      }

      transactionsToCreate.push({
        id: baseId,
        installments,
      })
    }

    return NextResponse.json({
      ok: true,
      message: `${transactionsToCreate.length} transações de teste criadas com sucesso (com diferentes datas e parcelas)`,
      transactions: transactionsToCreate,
    })
  } catch (error) {
    console.error("Erro ao popular transações:", error)
    return NextResponse.json({ error: "Erro ao criar transações de teste" }, { status: 500 })
  }
}
