"use client"

import { useOptimistic, useTransition, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { CreditCardDisplay } from "./credit-card-display"
import type { Invoice, CreditCard } from "@/lib/types"

interface InvoiceCardsProps {
  invoices: Invoice[]
  cards: CreditCard[]
  onRefresh?: () => Promise<void> // Mudamos para retornar Promise
}

export function InvoiceCards({ invoices, cards, onRefresh }: InvoiceCardsProps) {
  const [isPending, startTransition] = useTransition()
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null)

  // O useOptimistic cria uma cópia das faturas que podemos editar instantaneamente
  const [optimisticInvoices, addOptimisticInvoice] = useOptimistic(
    invoices,
    (state, updatedInvoiceId: string) => 
      state.map(inv => 
        inv.id === updatedInvoiceId ? { ...inv, status: 'paid' as const } : inv
      )
  )

  const getCard = (id: string) => cards.find((c) => c.id === id)

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

  return (
    <Card className="bg-card border-border shadow-xl">
      <CardHeader>
        <CardTitle className="text-card-foreground">Faturas do Mês</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {optimisticInvoices.map((invoice) => {
            const card = getCard(invoice.cardId)
            if (!card) {
              // Retorna um placeholder se o cartão foi deletado
              return <div key={invoice.cardId} className="p-4 bg-gray-500/20 rounded-lg">Cartão Excluído</div>
            }

            const isThisLoading = isPending && activeInvoiceId === invoice.id

            return (
              <div key={invoice.id} className="rounded-xl border border-border bg-secondary/30 p-4 space-y-4 transition-opacity duration-300">
                <div className="flex items-start justify-between">
                  <CreditCardDisplay card={card} compact />
                  {getStatusBadge(invoice.status)}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> Vencimento
                    </span>
                    <span className="text-foreground font-medium">
                      {new Date(invoice.dueDate).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Total</span>
                    <span className="text-xl font-bold text-foreground">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(invoice.totalAmount)}
                    </span>
                  </div>
                </div>

                {invoice.status !== "paid" && (
                  <Button
                    variant="outline"
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
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}