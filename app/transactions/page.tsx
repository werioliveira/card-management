"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

// --- INTERFACES ---
interface Transaction {
  id: string
  description: string
  amount: number
  date: string
  cardId: string
  personId: string
  categoryId: string
  installments?: number
  currentInstallment?: number
}

interface PaginationInfo {
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface Card { id: string; name: string; color: string }
interface Person { id: string; name: string; color: string }
interface Category { id: string; name: string; color: string }

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState("")
  const [filterPerson, setFilterPerson] = useState("all")
  const [filterCard, setFilterCard] = useState("all")
  const [filterMonth, setFilterMonth] = useState<string>("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Adicionamos o filterMonth na URL
        const url = `/api/transactions?page=${currentPage}&limit=12${
          filterMonth ? `&month=${filterMonth}` : ""
        }`
        
        const txRes = await fetch(url)
        const [cardsRes, peopleRes, catsRes] = await Promise.all([
          fetch("/api/cards"),
          fetch("/api/people"),
          fetch("/api/categories"),
        ])
        
        if (txRes.ok) {
          const resJson = await txRes.json()
          if (cardsRes.ok) setCards(await cardsRes.json())
          if (peopleRes.ok) setPeople(await peopleRes.json())
          if (catsRes.ok) setCategories(await catsRes.json())
          setTransactions(resJson.data)
          setPagination(resJson.pagination)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchData()
  }, [currentPage, filterMonth])

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase())
    const matchesPerson = filterPerson === "all" || t.personId === filterPerson
    const matchesCard = filterCard === "all" || t.cardId === filterCard
    
    return matchesSearch && matchesPerson && matchesCard
  })

  // 3. Resete a página para 1 quando mudar o mês
  const handleMonthChange = (val: string) => {
    setFilterMonth(val)
    setCurrentPage(1)
  }

  const getPerson = (id: string) => people.find((p) => p.id === id)
  const getCard = (id: string) => cards.find((c) => c.id === id)
  const getCategory = (id: string) => categories.find((c) => c.id === id)

  return (
    <div className="min-h-screen bg-background pl-64 p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 hover:bg-secondary rounded-lg transition-colors border border-border">
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Transações</h1>
            <p className="text-muted-foreground">Histórico completo do banco de dados</p>
          </div>
        </div>

        {/* Filtros com seus tokens de cores */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nesta página..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary border-border text-foreground"
            />
          </div>
          
          <Select value={filterPerson} onValueChange={setFilterPerson}>
            <SelectTrigger className="w-full sm:w-48 bg-secondary border-border">
              <SelectValue placeholder="Pessoa" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">Todas as pessoas</SelectItem>
              {people.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterCard} onValueChange={setFilterCard}>
            <SelectTrigger className="w-full sm:w-48 bg-secondary border-border">
              <SelectValue placeholder="Cartão" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">Todos os cartões</SelectItem>
              {cards.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Input
            type="month"
            value={filterMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="w-full sm:w-48 bg-secondary border-border"
          />
        </div>

        {/* Tabela usando seus helpers de hover */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xl">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">Nenhuma transação encontrada</div>
          ) : (
            <>
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-semibold">Descrição</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">Pessoa</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">Cartão</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-center">Data</TableHead>
                    <TableHead className="text-right text-muted-foreground font-semibold pr-6">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => {
                    const person = getPerson(transaction.personId)
                    const card = getCard(transaction.cardId)
                    const category = getCategory(transaction.categoryId)

                    return (
                      <TableRow key={transaction.id} className="border-border table-row-hover transition-colors">
                        <TableCell className="py-4">
                          <div>
                            <div className="font-medium text-foreground">{transaction.description}</div>
                            {transaction.installments && transaction.installments > 1 && (
                              <div className="text-[10px] text-primary font-bold uppercase mt-1">
                                Parcela {transaction.currentInstallment}/{transaction.installments}
                              </div>
                            )}
                            <div className="text-[10px] text-muted-foreground">{category?.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7 border border-border">
                              <AvatarFallback 
                                className="text-[10px] text-white"
                                style={{ backgroundColor: person?.color || 'var(--primary)' }}
                              >
                                {person?.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-foreground">{person?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-secondary/50 border-border text-foreground">
                            {card?.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <span className="font-bold text-primary">
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(transaction.amount)}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {/* Controles de Paginação com seus tokens */}
              {pagination && (
                <div className="p-4 border-t border-border flex items-center justify-between bg-muted/10">
                  <p className="text-xs text-muted-foreground">
                    Total: {pagination.totalItems} registros
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border hover:bg-secondary"
                      onClick={() => setCurrentPage(prev => prev - 1)}
                      disabled={!pagination.hasPrevPage}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                    </Button>
                    <span className="text-sm font-medium text-foreground px-4">
                      {pagination.currentPage} / {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border hover:bg-secondary"
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={!pagination.hasNextPage}
                    >
                      Próximo <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}