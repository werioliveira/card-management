"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { PlusCircle, ArrowLeft, Edit, Trash2 } from "lucide-react"
import { formatCurrency, parseCurrencyToNumber } from "@/lib/utils"

interface Card {
  id: string
  name: string
  lastDigits: string
  brand: string
  "limit": number
  closingDay: number
  dueDay: number
  color: string
}

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [newLimit, setNewLimit] = useState(0)

  // Fetch cards on mount
  useEffect(() => {
    const fetchCards = async () => {
      try {
        const res = await fetch("/api/cards")
        if (res.ok) setCards(await res.json())
      } catch (err) {
        console.error("Erro ao buscar cartões:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchCards()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/cards?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setCards(cards.filter((c) => c.id !== id))
      }
    } catch (err) {
      console.error("Erro ao deletar cartão:", err)
    }
  }

const handleEdit = async (card: Card) => {
  // 1. Criamos o JSON com os dados (mais limpo que FormData para PUT)
  const payload = {
    name: card.name,
    lastDigits: card.lastDigits,
    brand: card.brand,
    limit: card.limit, // Aqui já vai o número puro vindo da máscara
    closingDay: card.closingDay,
    dueDay: card.dueDay,
    color: card.color,
  }

  try {
    // 2. A URL deve terminar com o ID para sua API ler via pathParts
    const res = await fetch(`/api/cards?id=${card.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      setCards(cards.map((c) => (c.id === card.id ? card : c)))
      setEditingCard(null)
      setEditDialogOpen(false)
    }
  } catch (err) {
    console.error("Erro ao editar cartão:", err)
  }
}

  return (
    <div className="min-h-screen bg-background pl-64 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">Cartões de Crédito</h1>
            <p className="text-muted-foreground mt-1">Gerencie seus cartões</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2 cursor-pointer">
                <PlusCircle className="h-4 w-4" />
                Novo Cartão
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-card-foreground">Adicionar Novo Cartão</DialogTitle>
              </DialogHeader>
              <form action="/api/cards" method="POST" className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Nome do Cartão</Label>
                  <Input
                    name="name"
                    placeholder="Ex: Nubank, Itaú..."
                    className="bg-secondary border-border"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Últimos 4 dígitos</Label>
                    <Input
                      name="lastDigits"
                      placeholder="1234"
                      maxLength={4}
                      className="bg-secondary border-border"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Marca</Label>
                    <Select defaultValue="mastercard">
                      <SelectTrigger name="brand" className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mastercard">MasterCard</SelectItem>
                        <SelectItem value="visa">Visa</SelectItem>
                        <SelectItem value="amex">American Express</SelectItem>
                        <SelectItem value="elo">Elo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
<div className="space-y-2">
  <Label className="text-foreground">Limite (R$)</Label>
  {/* Campo invisível que realmente envia o número para o banco */}
  <input type="hidden" name="limit" value={newLimit} /> 
  
  <Input
    type="text"
    placeholder="R$ 0,00"
    value={formatCurrency(newLimit)}
    onChange={(e) => setNewLimit(parseCurrencyToNumber(e.target.value))}
    className="bg-secondary border-border"
    required
  />
</div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Cor</Label>
                    <Input
                      name="color"
                      type="color"
                      defaultValue="#8b5cf6"
                      className="h-10 cursor-pointer"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Dia de Fechamento</Label>
                    <Input
                      name="closingDay"
                      type="number"
                      min="1"
                      max="31"
                      placeholder="1"
                      className="bg-secondary border-border"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Dia de Vencimento</Label>
                    <Input
                      name="dueDay"
                      type="number"
                      min="1"
                      max="31"
                      placeholder="8"
                      className="bg-secondary border-border"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 ">
                  <Button type="submit" className="cursor-pointer">Adicionar Cartão</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum cartão cadastrado</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.id}
                className="p-6 rounded-xl text-white shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 relative flex flex-col h-full"
                style={{ backgroundColor: card.color }}
              >
                {/* Conteúdo do cartão */}
                <div className="flex-1">
                  <div className="mb-4">
                    <div className="text-sm opacity-75 mb-1">CARTÃO DE CRÉDITO</div>
                    <div className="text-2xl font-bold tracking-wider">•••• {card.lastDigits}</div>
                  </div>
                  <div className="mb-6">
                    <div className="font-semibold text-lg">{card.name}</div>
                    <div className="text-xs opacity-75 uppercase mt-1">{card.brand}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="opacity-75 text-xs">Limite</div>
                      <div className="font-semibold">R$ {card["limit"].toLocaleString("pt-BR")}</div>
                    </div>
                    <div>
                      <div className="opacity-75 text-xs">Fechamento</div>
                      <div className="font-semibold">Dia {card.closingDay}</div>
                    </div>
                    <div>
                      <div className="opacity-75 text-xs">Vencimento</div>
                      <div className="font-semibold">Dia {card.dueDay}</div>
                    </div>
                  </div>
                </div>

                {/* Botões - sempre visíveis no footer */}
                <div className="flex gap-2 mt-6 pt-4 border-t border-white border-opacity-20">
                  <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="secondary" className="flex-1 h-9 cursor-pointer">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle className="text-card-foreground">Editar Cartão</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-foreground">Nome do Cartão</Label>
                          <Input
                            defaultValue={card.name}
                            onChange={(e) => setEditingCard({ ...card, name: e.target.value })}
                            className="bg-secondary border-border"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-foreground">Últimos 4 dígitos</Label>
                            <Input
                              defaultValue={card.lastDigits}
                              onChange={(e) => setEditingCard({ ...card, lastDigits: e.target.value })}
                              maxLength={4}
                              className="bg-secondary border-border"
                            />
                          </div>
<div className="space-y-2">
  <Label className="text-foreground">Limite (R$)</Label>
  <Input
    type="text"
    placeholder="R$ 0,00"
    // Usa o limite do cartão que está sendo editado ou 0
    value={formatCurrency(editingCard?.limit || card.limit)}
    onChange={(e) => {
      const numeric = parseCurrencyToNumber(e.target.value)
      // Atualiza o objeto de edição com o número puro
      setEditingCard({ ...(editingCard || card), limit: numeric })
    }}
    className="bg-secondary border-border"
  />
</div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                          <Button type="button" variant="outline" className="cursor-pointer" onClick={() => {
                            setEditingCard(null)
                            setEditDialogOpen(false)
                          }}>
                            Cancelar
                          </Button>
                          <Button className="cursor-pointer" onClick={() => {
                            handleEdit(editingCard || card)
                            setEditDialogOpen(false)
                          }}>Salvar</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive" className="h-9 px-3 cursor-pointer">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border">
                      <AlertDialogTitle className="text-foreground">Deletar cartão?</AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground">
                        Tem certeza que deseja deletar {card.name}? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                      <div className="flex gap-3 justify-end">
                        <AlertDialogCancel className="border-border cursor-pointer">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(card.id)}
                          className="bg-destructive hover:bg-destructive/90 cursor-pointer"
                        >
                          Deletar
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
