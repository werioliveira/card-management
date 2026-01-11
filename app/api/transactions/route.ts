import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import initDb from "@/lib/init-db"
import { all, run, get } from "@/lib/db"

// --- GET: Busca Transações com Paginação ---
export async function GET(request: Request) {
  await initDb()

  // Pega o usuário injetado pelo middleware
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = parseInt(searchParams.get("limit") ?? "10")
  const monthFilter = searchParams.get("month") // Ex: "2026-01"

  const offset = (page - 1) * limit

  try {
    // Filtra sempre pelo userId
    let query = `SELECT * FROM transactions WHERE userId = ?`
    let countQuery = `SELECT COUNT(*) as total FROM transactions WHERE userId = ?`
    let params: any[] = [userId]

    // Adiciona o filtro de mês no SQL se ele existir
    if (monthFilter) {
      const filter = `${monthFilter}%` // Busca tudo que começa com YYYY-MM
      query += ` AND date LIKE ?`
      countQuery += ` AND date LIKE ?`
      params.push(filter)
    }

    query += ` ORDER BY date DESC LIMIT ? OFFSET ?`
    
    const countResult = await get(countQuery, params)
    const totalItems = countResult?.total ?? 0
    
    const rows = await all(query, [...params, limit, offset])

    return NextResponse.json({
      data: rows,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        pageSize: limit,
        hasNextPage: page < Math.ceil(totalItems / limit),
        hasPrevPage: page > 1
      }
    })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar transações" }, { status: 500 })
  }
}

// --- POST: Cria Transação (Única ou Parcelada) ---
export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    await initDb()

    // Nova variável para definir por qual parcela começar
    // Se o usuário quer lançar a 3/5, o loop deve começar no 3.
    const startAt = Number(body.startInstallment) || 1
    const totalInstallments = Number(body.installments) || 1

    const addMonths = (date: Date, months: number) => {
      const d = new Date(date)
      // Usar setMonth em vez de setUTCMonth costuma ser mais intuitivo 
      // para datas vindas de inputs tipo 'date' (YYYY-MM-DD)
      d.setMonth(d.getMonth() + months)
      return d
    }

    if (totalInstallments > 1) {
      const baseDate = new Date(body.date + "T12:00:00") // Meio do dia evita problemas de fuso
      const installmentAmount = Number((body.amount / totalInstallments).toFixed(2))
      
      // O loop agora começa em startAt
      for (let i = startAt; i <= totalInstallments; i++) {
        // Cálculo do offset: 
        // Se começo na 3, a parcela 3 tem offset 0 (mesma data do input)
        // A parcela 4 tem offset 1 (próximo mês), e assim por diante.
        const monthOffset = i - startAt
        const parceleDate = addMonths(baseDate, monthOffset)
        const formattedDate = parceleDate.toISOString().split("T")[0]
        
        await run(
          `INSERT INTO transactions (id, description, amount, date, cardId, personId, categoryId, installments, currentInstallment, userId) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `${body.id}-${i}`, 
            body.description,
            installmentAmount,
            formattedDate,
            body.cardId,
            body.personId,
            body.categoryId,
            totalInstallments,
            i,
            userId,
          ]
        )
      }
    } else {
      // Transação Única (Mantida)
      await run(
        `INSERT INTO transactions (id, description, amount, date, cardId, personId, categoryId, installments, currentInstallment, userId) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          body.id || `tx-${Date.now()}`,
          body.description,
          body.amount,
          body.date,
          body.cardId,
          body.personId,
          body.categoryId,
          1,
          1,
          userId,
        ]
      )
    }

    revalidatePath("/")
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("Erro ao inserir transação:", error)
    return NextResponse.json(
      { error: "Erro ao processar transação", details: error.message }, 
      { status: 500 }
    )
  }
}