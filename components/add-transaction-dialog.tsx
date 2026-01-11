"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Calculator, ReceiptText } from "lucide-react"
import type { Person, CreditCard, ExpenseCategory } from "@/lib/types"
import { formatCurrency, parseCurrencyToNumber } from "@/lib/utils"

interface AddTransactionDialogProps {
  people: Person[]
  cards: CreditCard[]
  categories: ExpenseCategory[]
  onAdd?: (transaction: any) => void
}

export function AddTransactionDialog({ people, cards, categories, onAdd }: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false)
  const [entryMode, setEntryMode] = useState<"total" | "installment">("total")
  
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

  // Lógica de Cálculo Dinâmico
  const installmentsNum = Math.max(1, Number.parseInt(formData.installments) || 1)
  const rawAmount = Number.parseFloat(formData.amount) || 0
  
  // Se for modo parcela, multiplicamos para achar o total. Se for total, mantemos.
  const calculatedTotal = entryMode === "total" ? rawAmount : rawAmount * installmentsNum
  const amountPerInstallment = entryMode === "total" ? rawAmount / installmentsNum : rawAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        id: Date.now().toString(),
        description: formData.description,
        amount: calculatedTotal, // Sempre envia o total para o backend
        date: formData.date,
        cardId: formData.cardId,
        personId: formData.personId,
        categoryId: formData.categoryId,
        installments: installmentsNum,
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
        <Button className="gap-2 cursor-pointer shadow-lg hover:scale-105 transition-transform">
          <PlusCircle className="h-4 w-4" />
          Nova Despesa
        </Button>
      </DialogTrigger>
      
      <DialogContent className="bg-card border-border sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-primary" />
            Adicionar Transação
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Seletor de Modo de Entrada */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Como deseja informar o valor?</Label>
            <div className="flex bg-secondary/50 p-1 rounded-lg gap-1 border border-border">
              <Button
                type="button"
                variant={entryMode === "total" ? "default" : "ghost"}
                size="sm"
                className="flex-1 h-8 text-xs font-semibold cursor-pointer"
                onClick={() => setEntryMode("total")}
              >
                Valor Total da Compra
              </Button>
              <Button
                type="button"
                variant={entryMode === "installment" ? "default" : "ghost"}
                size="sm"
                className="flex-1 h-8 text-xs font-semibold cursor-pointer"
                onClick={() => setEntryMode("installment")}
              >
                Valor de 1 Parcela
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Tênis Nike, Mercado Mensal..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-secondary/50 border-border"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-primary font-bold">
                {entryMode === "total" ? "Valor Total" : "Valor da Parcela"}
              </Label>
              <Input
                id="amount"
                type="text"
                value={formatCurrency(formData.amount)} 
                onChange={(e) => {
                  const numericValue = parseCurrencyToNumber(e.target.value).toString()
                  setFormData({ ...formData, amount: numericValue })
                }}
                className="bg-secondary/50 border-border text-lg font-bold"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data da Compra</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="bg-secondary/50 border-border"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pessoa Responsável</Label>
              <Select value={formData.personId} onValueChange={(v) => setFormData({ ...formData, personId: v })}>
                <SelectTrigger className="bg-secondary/50 border-border">
                  <SelectValue placeholder="Quem gastou?" />
                </SelectTrigger>
                <SelectContent>
                  {people.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cartão Utilizado</Label>
              <Select value={formData.cardId} onValueChange={(v) => setFormData({ ...formData, cardId: v })}>
                <SelectTrigger className="bg-secondary/50 border-border">
                  <SelectValue placeholder="Qual cartão?" />
                </SelectTrigger>
                <SelectContent>
                  {cards.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 col-span-1">
              <Label>Parcelas</Label>
              <Input
                type="number"
                min="1"
                value={formData.installments}
                onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                className="bg-secondary/50 border-border text-center"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Já paguei até a...</Label>
              <Input
                type="number"
                min="1"
                max={formData.installments}
                value={formData.startInstallment}
                onChange={(e) => setFormData({ ...formData, startInstallment: e.target.value })}
                className="bg-secondary/50 border-border text-center"
              />
            </div>
          </div>

          {/* Card de Resumo e Conferência */}
          {calculatedTotal > 0 && (
            <div className="bg-primary/10 rounded-xl p-4 border border-primary/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-primary uppercase flex items-center gap-1">
                  <Calculator className="h-3 w-3" /> Resumo do Lançamento
                </span>
                {entryMode === "installment" && (
                  <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                    Calculado: Parcela × {installmentsNum}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {installmentsNum}x de <span className="text-foreground font-bold">R$ {amountPerInstallment.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </p>
                  {Number(formData.startInstallment) > 1 && (
                    <p className="text-[10px] text-orange-500 font-medium">
                      ⚠️ Começará na parcela {formData.startInstallment}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground leading-none">Total da Despesa</p>
                  <p className="text-xl font-black text-primary tracking-tight">
                    R$ {calculatedTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="cursor-pointer bg-destructive/80 hover:bg-destructive px-8 font-bold">
              Cancelar
            </Button>
            <Button type="submit" className="px-8 font-bold cursor-pointer hover:bg-primary/90">
              Confirmar Lançamento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}