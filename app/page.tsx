/* c:\Users\Weri\Documents\dev\card-managment\app\page.tsx */
"use client"

import { useState, useEffect, useCallback } from "react"
import { StatsCards } from "@/components/stats-cards"
import { TransactionsTable } from "@/components/transactions-table"
import { ExpenseChart } from "@/components/expense-chart"
import { PersonExpenseChart } from "@/components/person-expense-chart"
import { InvoiceCards } from "@/components/invoice-cards"
import { AddTransactionDialog } from "@/components/add-transaction-dialog"
import { UserMenu } from "@/components/user-menu"
import { Input } from "@/components/ui/input"

export default function DashboardPage() {
  const [cards, setCards] = useState([])
  const [people, setPeople] = useState([])
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Estado para o filtro de mês (Padrão: Mês atual YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return now.toISOString().slice(0, 7)
  })

  const fetchData = useCallback(async () => {
    try {
      // Passamos o mês selecionado para a API de transações
      const [cardsRes, peopleRes, catsRes, txRes, invRes] = await Promise.all([
        fetch("/api/cards"),
        fetch("/api/people"),
        fetch("/api/categories"),
        fetch(`/api/transactions?limit=200&month=${selectedMonth}`),
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
      
      return { ok: true } 
    } catch (err) {
      console.error("Erro ao buscar dados:", err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [selectedMonth]) // Recarrega quando o mês muda

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Extrair ano e mês do input (YYYY-MM)
  const [yearStr, monthStr] = selectedMonth.split('-')
  const selectedYearInt = parseInt(yearStr)
  const selectedMonthInt = parseInt(monthStr)

  // Filtra faturas pelo mês selecionado
  const monthlyInvoices = invoices.filter(inv => 
    inv.month === selectedMonthInt && inv.year === selectedYearInt
  )

  const monthlyTotalFiltered = monthlyInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)

  // As transações já vêm filtradas pela API, mas garantimos a consistência
  const currentMonthTransactions = transactions

  const detailedDebt = people.map(person => {
    const personTransactions = currentMonthTransactions.filter(t => t.personId === person.id);
    
    const debtsByCard = cards.map(card => {
      const amount = personTransactions
        .filter(t => t.cardId === card.id)
        .reduce((sum, t) => sum + t.amount, 0);
      
      return { cardName: card.name, amount };
    }).filter(d => d.amount > 0);

    return { 
      personName: person.name, 
      debtsByCard 
    };
  }).filter(p => p.debtsByCard.length > 0);

  // Formata a data para exibição no título
  const displayDate = new Date(selectedYearInt, selectedMonthInt - 1, 1)
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background text-primary gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="animate-pulse font-medium">Sincronizando finanças...</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-[1600px] mx-auto space-y-6 md:space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-2">Dashboard</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="capitalize text-lg">{displayDate}</span>
          </div>
        </div>

        {/* Toolbar unificada */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-card p-2 rounded-xl border border-border shadow-sm w-full md:w-auto">
          {/* Filtro de Mês */}
          <div className="relative">
            <Input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full sm:w-[180px] border-none bg-transparent shadow-none focus-visible:ring-0 hover:bg-secondary/50 transition-colors rounded-lg cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
            />
          </div>
          
          <div className="hidden sm:block h-8 w-px bg-border mx-1" />

          {/* Ações */}
          <div className="flex items-center gap-2 justify-between sm:justify-start">
             <AddTransactionDialog 
              transactions={currentMonthTransactions}
              people={people} 
              cards={cards} 
              categories={categories} 
              onAdd={fetchData} 
            />
            <UserMenu />
          </div>
        </div>
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
          Faturas de {displayDate}
        </h2>
        <InvoiceCards 
          invoices={monthlyInvoices} 
          cards={cards} 
          onRefresh={fetchData} 
        />
      </section>

      {/* Seção: Detalhamento por Pessoa e Cartão */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          Divisão Detalhada por Cartão
        </h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {detailedDebt.map((debt) => (
            <div key={debt.personName} className="bg-card rounded-xl border border-border overflow-hidden shadow-sm flex flex-col">
              <div className="p-4 border-b border-border bg-muted/20 flex items-center gap-3">
                 <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
                  style={{ backgroundColor: people.find(p => p.name === debt.personName)?.color || '#ccc' }}
                >
                  {debt.personName.substring(0, 2).toUpperCase()}
                </div>
                <span className="font-bold text-foreground">{debt.personName}</span>
              </div>

              <div className="p-4 space-y-3 flex-1">
                {debt.debtsByCard.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                      {item.cardName}
                    </span>
                    <span className="font-semibold text-foreground">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(item.amount)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-primary/5 border-t border-border flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-primary/70">Total Individual</span>
                <span className="text-lg font-black text-primary">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(debt.debtsByCard.reduce((acc, curr) => acc + curr.amount, 0))}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tabela de Transações */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Transações de {displayDate}
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
