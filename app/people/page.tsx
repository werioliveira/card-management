"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { PlusCircle, ArrowLeft, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner" // Importação correta do Sonner

interface Person {
  id: string
  name: string
  email: string
  color: string
}

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([])
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const res = await fetch("/api/people")
        if (res.ok) setPeople(await res.json())
      } catch (err) {
        console.error("Erro ao buscar pessoas:", err)
        toast.error("Erro ao carregar lista de pessoas")
      } finally {
        setLoading(false)
      }
    }
    fetchPeople()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/people?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setPeople(people.filter((p) => p.id !== id))
        toast.success("Pessoa removida com sucesso")
      } else {
        toast.error("Erro ao deletar", { description: "Não foi possível excluir o registro." })
      }
    } catch (err) {
      console.error("Erro ao deletar pessoa:", err)
      toast.error("Erro de conexão ao deletar")
    }
  }

  const handleEdit = async (person: Person) => {
    try {
      const formData = new FormData()
      formData.append("name", person.name)
      formData.append("email", person.email)
      formData.append("color", person.color)

      const res = await fetch(`/api/people/${person.id}`, {
        method: "PUT",
        body: formData,
      })
      if (res.ok) {
        setPeople(people.map((p) => (p.id === person.id ? person : p)))
        setEditingPerson(null)
        setEditDialogOpen(false)
        toast.success("Alterações salvas!", {
          description: `${person.name} foi atualizado(a).`
        })
      } else {
        toast.error("Erro ao editar", { description: "Verifique os dados e tente novamente." })
      }
    } catch (err) {
      console.error("Erro ao editar pessoa:", err)
      toast.error("Erro de conexão ao editar")
    }
  }

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    setIsSubmitting(true)

    const formData = new FormData(form)
    const data = Object.fromEntries(formData.entries())

    try {
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        const newPerson = await res.json()
        setPeople((prev) => [...prev, newPerson])
        form.reset()
        setAddDialogOpen(false)
        toast.success("Sucesso!", {
          description: `${newPerson.name} foi adicionado(a) com sucesso.`,
        })
      } else {
        toast.error("Erro ao adicionar", {
          description: "Não foi possível salvar a pessoa.",
        })
      }
    } catch (err) {
      toast.error("Erro de conexão", {
        description: "Verifique sua internet.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="p-2 hover:bg-secondary rounded-lg transition-colors cursor-pointer">
          <ArrowLeft className="h-6 w-6 text-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Pessoas</h1>
          <p className="text-muted-foreground mt-1">Gerencie as pessoas da sua conta</p>
        </div>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 cursor-pointer">
              <PlusCircle className="h-4 w-4" />
              Adicionar Pessoa
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Pessoa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input name="name" placeholder="Ex: João Silva" required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input name="email" type="email" placeholder="joao@email.com" />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <Input name="color" type="color" defaultValue="#10b981" className="h-10 cursor-pointer" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" className="cursor-pointer" onClick={() => setAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                  {isSubmitting ? "Adicionando..." : "Adicionar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : people.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhuma pessoa cadastrada</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                <TableHead className="text-muted-foreground">Pessoa</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-right text-muted-foreground w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {people.map((person) => (
                <TableRow key={person.id} className="border-border hover:bg-secondary/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback style={{ backgroundColor: person.color }} className="text-xs font-semibold text-white">
                          {person.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-medium text-foreground">{person.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{person.email}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 cursor-pointer" onClick={() => setEditingPerson(person)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle className="text-card-foreground">Editar Pessoa</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-foreground">Nome</Label>
                              <Input
                                defaultValue={person.name}
                                onChange={(e) => setEditingPerson(prev => prev ? { ...prev, name: e.target.value } : person)}
                                className="bg-secondary border-border"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-foreground">Email</Label>
                              <Input
                                type="email"
                                defaultValue={person.email}
                                onChange={(e) => setEditingPerson(prev => prev ? { ...prev, email: e.target.value } : person)}
                                className="bg-secondary border-border"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-foreground">Cor</Label>
                              <Input
                                type="color"
                                defaultValue={person.color}
                                onChange={(e) => setEditingPerson(prev => prev ? { ...prev, color: e.target.value } : person)}
                                className="h-10 cursor-pointer"
                              />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                              <Button type="button" variant="outline" className="cursor-pointer" onClick={() => {
                                setEditingPerson(null)
                                setEditDialogOpen(false)
                              }}>Cancelar</Button>
                              <Button className="cursor-pointer" onClick={() => handleEdit(editingPerson || person)}>
                                Salvar
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive cursor-pointer">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-border">
                          <AlertDialogTitle className="text-foreground">Deletar pessoa?</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            Tem certeza que deseja deletar {person.name}? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                          <div className="flex gap-3 justify-end">
                            <AlertDialogCancel className="border-border cursor-pointer">Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(person.id)}
                              className="bg-destructive hover:bg-destructive/90 cursor-pointer"
                            >
                              Deletar
                            </AlertDialogAction>
                          </div>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}