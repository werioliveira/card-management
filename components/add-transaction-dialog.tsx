"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle } from "lucide-react"
import type { Person, CreditCard, ExpenseCategory } from "@/lib/types"
import { formatCurrency, parseCurrencyToNumber } from "@/lib/utils"

interface AddTransactionDialogProps {
  people: Person[]
  cards: CreditCard[]
  categories: ExpenseCategory[]
  onAdd?: (transaction: {
    description: string
    amount: number
    date: string
    cardId: string
    personId: string
    categoryId: string
    installments?: number
    startInstallment?: number
  }) => void
}

export function AddTransactionDialog({ people, cards, categories, onAdd }: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    cardId: "",
    personId: "",
    categoryId: "",
    installments: "1",
    startInstallment: "1", 
  })

  const amount = Number.parseFloat(formData.amount) || 0
  const installments = Number.parseInt(formData.installments) || 1
  const amountPerInstallment = amount / installments

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        id: Date.now().toString(),
        description: formData.description,
        amount: Number.parseFloat(formData.amount),
        date: formData.date,
        cardId: formData.cardId,
        personId: formData.personId,
        categoryId: formData.categoryId,
        installments: Number.parseInt(formData.installments),
        startInstallment: Number.parseInt(formData.startInstallment),
      }
      
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      
      if (res.ok) {
        if (onAdd) onAdd(payload)
        setFormData({
          description: "",
          amount: "",
          date: new Date().toISOString().split("T")[0],
          cardId: "",
          personId: "",
          categoryId: "",
          installments: "1",
          startInstallment: "1",
        })
        setOpen(false)
      }
    } catch (err) {
      console.error("Erro ao adicionar transação:", err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 cursor-pointer">
          <PlusCircle className="h-4 w-4" />
          Nova Despesa
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Adicionar Nova Despesa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">
              Descrição
            </Label>
            <Input
              id="description"
              placeholder="Ex: iFood, Uber, Netflix..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-secondary border-border"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-foreground">
                Valor Total
              </Label>
              <Input
                id="amount"
                type="text" // Mudamos para text para permitir símbolos
                placeholder="R$ 0,00"
                // Exibimos o valor formatado enquanto o usuário digita
                value={formatCurrency(formData.amount)} 
                onChange={(e) => {
                  const rawValue = e.target.value
                  // Converte a string "R$ 10,50" de volta para o número 10.50
                  const numericValue = parseCurrencyToNumber(rawValue).toString()
                  setFormData({ ...formData, amount: numericValue })
                }}
                className="bg-secondary border-border font-medium text-lg"
                required
              />
              <p className="text-xs text-muted-foreground">Valor total da despesa</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date" className="text-foreground">
                Data
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="bg-secondary border-border"
                required
              />
            </div>
          </div>

          {/* Resumo de parcelas */}
          {amount > 0 && installments > 1 && (
            <div className="bg-secondary/50 rounded-lg p-3 space-y-1 border border-border">
              <p className="text-sm font-semibold text-foreground">Resumo de Parcelas</p>
              <p className="text-sm text-muted-foreground">
                Valor total: <span className="font-semibold text-foreground">R$ {amount.toLocaleString("pt-BR")}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {installments}x de: <span className="font-semibold text-foreground">R$ {amountPerInstallment.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Pessoa</Label>
              <Select
                value={formData.personId}
                onValueChange={(value) => setFormData({ ...formData, personId: value })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {people.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Cartão</Label>
              <Select value={formData.cardId} onValueChange={(value) => setFormData({ ...formData, cardId: value })}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {cards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Categoria</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="installments" className="text-foreground">
                Número de Parcelas
              </Label>
              <Input
                id="installments"
                type="number"
                min="1"
                max="999"
                value={formData.installments}
                onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                className="bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground">1-24 parcelas</p>
            </div>
<div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label htmlFor="installments">Total de Parcelas</Label>
    <Input
      id="installments"
      type="number"
      value={formData.installments}
      onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
      className="bg-secondary border-border"
    />
  </div>
  <div className="space-y-2">
    <Label htmlFor="startInstallment">Já paguei até a...</Label>
    <Input
      id="startInstallment"
      type="number"
      min="1"
      max={formData.installments}
      value={formData.startInstallment}
      onChange={(e) => setFormData({ ...formData, startInstallment: e.target.value })}
      className="bg-secondary border-border"
    />
    <p className="text-[10px] text-muted-foreground">Ex: Se colocar 3, ele lança da 3 em diante.</p>
  </div>
</div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-border cursor-pointer">
              Cancelar
            </Button>
            <Button className="cursor-pointer" type="submit">Adicionar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
