"use client"

import { useState, useEffect, useCallback } from "react"
import { StatsCards } from "@/components/stats-cards"
import { TransactionsTable } from "@/components/transactions-table"
import { ExpenseChart } from "@/components/expense-chart"
import { PersonExpenseChart } from "@/components/person-expense-chart"
import { InvoiceCards } from "@/components/invoice-cards"
import { AddTransactionDialog } from "@/components/add-transaction-dialog"

export default function DashboardPage() {
  const [cards, setCards] = useState([])
  const [people, setPeople] = useState([])
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  // 1. Transformado em useCallback e retornando a Promise para o InvoiceCards "esperar"
  const fetchData = useCallback(async () => {
    try {
      const [cardsRes, peopleRes, catsRes, txRes, invRes] = await Promise.all([
        fetch("/api/cards"),
        fetch("/api/people"),
        fetch("/api/categories"),
        fetch("/api/transactions?limit=200"),
        fetch("/api/invoices"),
      ])

      const [cardsData, peopleData, catsData, invData, txData] = await Promise.all([
        cardsRes.json(),
        peopleRes.json(),
        catsRes.json(),
        invRes.json(),
        txRes.json(),
      ])

      setCards(cardsData)
      setPeople(peopleData)
      setCategories(catsData)
      setInvoices(invData)
      setTransactions(txData.data || [])
      
      // Retornamos algo para a Promise ser considerada "resolvida"
      return { ok: true } 
    } catch (err) {
      console.error("Erro ao buscar dados:", err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // --- LÓGICA DE FILTROS ---
  const now = new Date()
  // Usamos UTC para bater com o banco de dados
  const currentMonthSQL = now.getUTCMonth() + 1
  const currentYear = now.getUTCFullYear()

  const monthlyInvoices = invoices.filter(inv => 
    inv.month === currentMonthSQL && inv.year === currentYear
  )

  const monthlyTotalFiltered = monthlyInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)

  const currentMonthTransactions = transactions.filter((t) => {
    const d = new Date(t.date)
    return (d.getUTCMonth() + 1) === currentMonthSQL && d.getUTCFullYear() === currentYear
  })

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background text-primary gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="animate-pulse font-medium">Sincronizando finanças...</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground capitalize">
            {now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <AddTransactionDialog 
          people={people} 
          cards={cards} 
          categories={categories} 
          onAdd={fetchData} 
        />
      </div>

      {/* Cards de Resumo */}
      <StatsCards
        totalCards={cards.length}
        totalPeople={people.length}
        totalExpenses={currentMonthTransactions.length}
        monthlyTotal={monthlyTotalFiltered}
      />

      {/* Gráficos em Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Gastos por Categoria</h3>
          <ExpenseChart transactions={currentMonthTransactions} categories={categories} />
        </div>
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Gastos por Pessoa</h3>
          <PersonExpenseChart transactions={currentMonthTransactions} people={people} />
        </div>
      </div>

      {/* Faturas do Mês */}
      <section>
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Faturas Atuais
        </h2>
        <InvoiceCards 
          invoices={monthlyInvoices} 
          cards={cards} 
          onRefresh={fetchData} 
        />
      </section>

      {/* Tabela de Transações */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Últimas Transações
        </h2>
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <TransactionsTable
            transactions={currentMonthTransactions}
            people={people}
            cards={cards}
            categories={categories}
          />
        </div>
      </section>
    </div>
  )
}