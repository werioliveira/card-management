"use client"

import { useOptimistic, useTransition, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { CreditCardDisplay } from "./credit-card-display"
import type { Invoice, CreditCard } from "@/lib/types"

interface InvoiceCardsProps {
  /** Faturas a exibir na lista (mês atual + anteriores) */
  invoices: Invoice[]
  /** Todas as faturas em aberto — para cálculo real do uso do limite (inclui parcelas futuras) */
  allUnpaidInvoices?: Invoice[]
  cards: CreditCard[]
  onRefresh?: () => Promise<void>
}

export function InvoiceCards({ invoices, allUnpaidInvoices, cards, onRefresh }: InvoiceCardsProps) {
  const [isPending, startTransition] = useTransition()
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null)

  const [optimisticInvoices, addOptimisticInvoice] = useOptimistic(
    invoices,
    (state, updatedInvoiceId: string) =>
      state.map((inv) =>
        inv.id === updatedInvoiceId ? { ...inv, status: "paid" as const } : inv
      )
  )

  const getCard = (id: string) => cards.find((c) => c.id === id)

  // Uso real do limite: todas as faturas em aberto do cartão; ao marcar como paga, diminui (otimista)
  const getCardUsedAmount = (cardId: string) => {
    const allUnpaid = allUnpaidInvoices ?? invoices
    const totalUnpaid = allUnpaid
      .filter((inv) => inv.cardId === cardId)
      .reduce((sum, inv) => sum + inv.totalAmount, 0)
    const optimisticallyPaid = optimisticInvoices
      .filter((inv) => inv.cardId === cardId && inv.status === "paid")
      .reduce((sum, inv) => sum + inv.totalAmount, 0)
    return totalUnpaid - optimisticallyPaid
  }

  const formatMonthYear = (month: number, year: number) =>
    new Date(year, month - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })

  const handlePayInvoice = (invoiceId: string) => {
    setActiveInvoiceId(invoiceId)
    
    startTransition(async () => {
      // 1. Atualiza a UI instantaneamente (sem blink)
      addOptimisticInvoice(invoiceId)

      try {
        const res = await fetch(`/api/invoices/${invoiceId}/pay`, {
          method: "PATCH",
        })

        if (res.ok && onRefresh) {
          // 2. Aguarda o pai buscar os dados reais antes de encerrar a transição
          await onRefresh()
        }
      } catch (error) {
        console.error("Erro ao pagar:", error)
      } finally {
        setActiveInvoiceId(null)
      }
    })
  }

  const getStatusBadge = (status: Invoice["status"]) => {
    const styles = {
      paid: "bg-success/20 text-success border-0",
      open: "bg-warning/20 text-warning border-0",
      closed: "bg-info/20 text-info border-0"
    }

    return (
      <Badge className={styles[status]}>
        {status === "paid" && <CheckCircle2 className="h-3 w-3 mr-1" />}
        {status === "open" && <AlertCircle className="h-3 w-3 mr-1" />}
        {status === "paid" ? "Paga" : status === "open" ? "Em aberto" : "Fechada"}
      </Badge>
    )
  }

  // Agrupa faturas por cartão: 1 componente por cartão, não 1 por mês
  const unpaidByCardId = optimisticInvoices
    .filter((inv) => inv.status !== "paid")
    .reduce<Record<string, Invoice[]>>((acc, inv) => {
      if (!acc[inv.cardId]) acc[inv.cardId] = []
      acc[inv.cardId].push(inv)
      return acc
    }, {})

  const cardIdsWithUnpaid = Object.keys(unpaidByCardId)

  return (
    <Card className="bg-card border-border shadow-xl">
      <CardHeader>
        <CardTitle className="text-card-foreground">Faturas em aberto</CardTitle>
      </CardHeader>
      <CardContent>
        {cardIdsWithUnpaid.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">Nenhuma fatura em aberto</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {cardIdsWithUnpaid.map((cardId) => {
              const card = getCard(cardId)
              if (!card) return <div key={cardId} className="p-4 bg-gray-500/20 rounded-lg">Cartão Excluído</div>

              const cardInvoices = unpaidByCardId[cardId] ?? []
              const used = getCardUsedAmount(card.id)
              const limit = card.limit || 1
              const percent = Math.min(100, (used / limit) * 100)

              return (
                <div key={cardId} className="rounded-xl border border-border bg-secondary/30 p-4 space-y-4 transition-opacity duration-300">
                  {/* Um bloco por cartão: cabeçalho + barra de progresso */}
                  <div className="flex items-start justify-between">
                    <CreditCardDisplay card={card} compact />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Usado: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(used)}</span>
                      <span>Limite: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(card.limit)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: card.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* Lista de faturas desse cartão (por mês) */}
                  <div className="space-y-3 pt-2 border-t border-border">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Faturas</span>
                    {cardInvoices
                      .sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month))
                      .map((invoice) => {
                        const isThisLoading = isPending && activeInvoiceId === invoice.id
                        return (
                          <div key={invoice.id} className="flex flex-col gap-2 rounded-lg bg-muted/50 p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium capitalize text-foreground">
                                {formatMonthYear(invoice.month, invoice.year)}
                              </span>
                              {getStatusBadge(invoice.status)}
                            </div>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Venc. {new Date(invoice.dueDate).toLocaleDateString("pt-BR")}
                              </span>
                              <span className="font-semibold text-foreground">
                                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(invoice.totalAmount)}
                              </span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isPending}
                              onClick={() => handlePayInvoice(invoice.id)}
                              className="w-full border-border hover:bg-primary hover:text-primary-foreground bg-transparent transition-all cursor-pointer"
                            >
                              {isThisLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                "Marcar como Paga"
                              )}
                            </Button>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}