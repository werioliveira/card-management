"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import type { Transaction, Person, CreditCard, ExpenseCategory } from "@/lib/types"

interface TransactionsTableProps {
  transactions: Transaction[]
  people: Person[]
  cards: CreditCard[]
  categories: ExpenseCategory[]
}

export function TransactionsTable({ transactions, people, cards, categories }: TransactionsTableProps) {
  const [search, setSearch] = useState("")
  const [filterPerson, setFilterPerson] = useState<string>("all")
  const [filterCard, setFilterCard] = useState<string>("all")

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase())
    const matchesPerson = filterPerson === "all" || t.personId === filterPerson
    const matchesCard = filterCard === "all" || t.cardId === filterCard
    return matchesSearch && matchesPerson && matchesCard
  })

  const getPerson = (id: string) => people.find((p) => p.id === id)
  const getCard = (id: string) => cards.find((c) => c.id === id)
  const getCategory = (id: string) => categories.find((c) => c.id === id)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar transações..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
        <Select value={filterPerson} onValueChange={setFilterPerson}>
          <SelectTrigger className="w-full sm:w-48 bg-secondary border-border">
            <SelectValue placeholder="Filtrar por pessoa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as pessoas</SelectItem>
            {people.map((person) => (
              <SelectItem key={person.id} value={person.id}>
                {person.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCard} onValueChange={setFilterCard}>
          <SelectTrigger className="w-full sm:w-48 bg-secondary border-border">
            <SelectValue placeholder="Filtrar por cartão" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os cartões</SelectItem>
            {cards.map((card) => (
              <SelectItem key={card.id} value={card.id}>
                {card.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50">
              <TableHead className="text-muted-foreground">Descrição</TableHead>
              <TableHead className="text-muted-foreground">Pessoa</TableHead>
              <TableHead className="text-muted-foreground">Cartão</TableHead>
              <TableHead className="text-muted-foreground">Categoria</TableHead>
              <TableHead className="text-muted-foreground">Data</TableHead>
              <TableHead className="text-right text-muted-foreground">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((transaction) => {
              const person = getPerson(transaction.personId)
              const card = getCard(transaction.cardId)
              const category = getCategory(transaction.categoryId)

              return (
                <TableRow key={transaction.id} className="border-border hover:bg-secondary/30">
                  <TableCell>
                    <div>
                      <div className="font-medium text-foreground">{transaction.description}</div>
                      {transaction.installments && transaction.installments > 1 && (
                        <div className="text-xs text-muted-foreground">
                          Parcela {transaction.currentInstallment}/{transaction.installments}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-xs text-white" style={{ backgroundColor: person?.color }}>
                          {person?.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground">{person?.name}</span>
                    </div>
                  </TableCell>
<TableCell>
        {card ? (
          <Badge
            variant="outline"
            className="border-transparent text-white"
            style={{ backgroundColor: card.color }}
          >
            {card.name}
          </Badge>
        ) : (
          /* Fallback para cartão deletado/inativo */
          <Badge
            variant="outline"
            className="border-dashed border-muted-foreground text-muted-foreground bg-transparent"
          >
            Deletado
          </Badge>
        )}
      </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      style={{ backgroundColor: category?.color + "20", color: category?.color }}
                    >
                      {category?.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(transaction.date).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(transaction.amount)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
