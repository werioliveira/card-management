/* c:\Users\Weri\Documents\dev\card-managment\app\api\transactions\route.ts */
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import initDb from "@/lib/init-db"
import { all, run, get } from "@/lib/db"

// ... (função updateInvoice mantida igual) ...
async function updateInvoice(cardId: string, dateStr: string, userId: string) {
  const date = new Date(dateStr + "T12:00:00");
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const monthStr = month.toString().padStart(2, '0');
  const invoiceId = `inv-${cardId}-${year}-${monthStr}`;

  const result = await get(
    `SELECT SUM(amount) as total FROM transactions 
     WHERE cardId = ? AND userId = ? AND date LIKE ?`,
    [cardId, userId, `${year}-${monthStr}%`]
  );

  const total = result?.total || 0;

  await run(
    `INSERT INTO invoices (id, cardId, month, year, totalAmount, status, dueDate, userId)
     VALUES (?, ?, ?, ?, ROUND(?, 2), 'open', ?, ?)
     ON CONFLICT(id) DO UPDATE SET totalAmount = ROUND(?, 2)`,
    [
      invoiceId, 
      cardId, 
      month, 
      year, 
      total, 
      `${year}-${monthStr}-10`, 
      userId,
      total
    ]
  );
}

export async function GET(request: Request) {
  await initDb()
  const userId = request.headers.get("x-user-id")
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = parseInt(searchParams.get("limit") ?? "10")
  const monthFilter = searchParams.get("month")
  const search = searchParams.get("search")
  
  // Novos filtros
  const personId = searchParams.get("personId")
  const cardId = searchParams.get("cardId")

  const offset = (page - 1) * limit

  try {
    let query = `SELECT * FROM transactions WHERE userId = ?`
    let countQuery = `SELECT COUNT(*) as total FROM transactions WHERE userId = ?`
    let params: any[] = [userId]

    if (monthFilter) {
      query += ` AND date LIKE ?`
      countQuery += ` AND date LIKE ?`
      params.push(`${monthFilter}%`)
    }

    if (search) {
      query += ` AND description LIKE ?`
      countQuery += ` AND description LIKE ?`
      params.push(`%${search}%`)
    }

    // --- ADICIONADO: Filtros de Pessoa e Cartão no SQL ---
    if (personId && personId !== 'all') {
      query += ` AND personId = ?`
      countQuery += ` AND personId = ?`
      params.push(personId)
    }

    if (cardId && cardId !== 'all') {
      query += ` AND cardId = ?`
      countQuery += ` AND cardId = ?`
      params.push(cardId)
    }
    // -----------------------------------------------------

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
    return NextResponse.json({ error: "Erro ao buscar" }, { status: 500 })
  }
}

// ... (POST, DELETE, PUT mantidos iguais) ...
export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    await initDb()

    const startAt = Number(body.startInstallment) || 1
    const totalInstallments = Number(body.installments) || 1

    const addMonths = (date: Date, months: number) => {
      const d = new Date(date)
      d.setMonth(d.getMonth() + months)
      return d
    }

    if (totalInstallments > 1) {
      const baseDate = new Date(body.date + "T12:00:00")
      const installmentAmount = Number((body.amount / totalInstallments).toFixed(2))
      
      for (let i = startAt; i <= totalInstallments; i++) {
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
        await updateInvoice(body.cardId, formattedDate, userId);
      }
    } else {
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
      await updateInvoice(body.cardId, body.date, userId);
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

export async function DELETE(request: Request) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    await initDb()

    const tx = await get("SELECT cardId, date FROM transactions WHERE id = ? AND userId = ?", [id, userId])
    
    if (!tx) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 })
    }

    await run("DELETE FROM transactions WHERE id = ? AND userId = ?", [id, userId])
    await updateInvoice(tx.cardId, tx.date, userId)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Erro ao deletar:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const body = await request.json()

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    await initDb()

    // Lógica para atualizar TODAS as parcelas (se solicitado)
    if (body.updateAll) {
      // Tenta descobrir o ID base. Assumindo formato "baseId-parcela" gerado no POST
      const currentTx = await get("SELECT * FROM transactions WHERE id = ? AND userId = ?", [id, userId])
      
      if (currentTx && currentTx.installments > 1) {
        const lastDashIndex = id.lastIndexOf('-')
        if (lastDashIndex > 0) {
           const baseId = id.substring(0, lastDashIndex)
           
           // Busca todas as parcelas desse grupo
           const installments = await all(
             "SELECT * FROM transactions WHERE id LIKE ? AND userId = ?", 
             [`${baseId}-%`, userId]
           )

           for (const tx of installments) {
             // Se for a transação que estamos editando, usa a nova data. 
             // Para as outras, mantém a data original delas (para não mover todas para o mesmo mês).
             const newDate = (tx.id === id) ? body.date : tx.date

             await run(
               `UPDATE transactions 
                SET description = ?, amount = ?, date = ?, cardId = ?, personId = ?, categoryId = ?
                WHERE id = ? AND userId = ?`,
               [body.description, body.amount, newDate, body.cardId, body.personId, body.categoryId, tx.id, userId]
             )

             // Recalcula faturas (antiga e nova) para cada parcela
             await updateInvoice(tx.cardId, tx.date, userId)
             if (tx.cardId !== body.cardId || tx.date !== newDate || tx.amount !== body.amount) {
               await updateInvoice(body.cardId, newDate, userId)
             }
           }
           return NextResponse.json({ ok: true })
        }
      }
    }

    // Lógica padrão (atualizar apenas uma)
    const oldTx = await get("SELECT cardId, date, amount FROM transactions WHERE id = ? AND userId = ?", [id, userId])

    await run(
      `UPDATE transactions 
       SET description = ?, amount = ?, date = ?, cardId = ?, personId = ?, categoryId = ?
       WHERE id = ? AND userId = ?`,
      [body.description, body.amount, body.date, body.cardId, body.personId, body.categoryId, id, userId]
    )

    await updateInvoice(body.cardId, body.date, userId)

    // Verifica se mudou data, cartão OU valor para atualizar a fatura antiga
    if (oldTx && (oldTx.date !== body.date || oldTx.cardId !== body.cardId || oldTx.amount !== body.amount)) {
      await updateInvoice(oldTx.cardId, oldTx.date, userId)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Erro ao editar:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
