"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { PlusCircle, ArrowLeft, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories")
        if (res.ok) setCategories(await res.json())
      } catch (err) {
        console.error("Erro ao buscar categorias:", err)
        toast.error("Não foi possível carregar as categorias.")
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setCategories(categories.filter((c) => c.id !== id))
        toast.success("Categoria excluída com sucesso!")
      } else {
        toast.error("Erro ao excluir categoria")
      }
    } catch (err) {
      console.error("Erro ao deletar categoria:", err)
      toast.error("Erro de conexão ao excluir")
    }
  }

  const handleEdit = async (category: Category) => {
    try {
      const formData = new FormData()
      formData.append("name", category.name)
      formData.append("icon", category.icon)
      formData.append("color", category.color)

      const res = await fetch(`/api/categories/${category.id}`, {
        method: "PUT",
        body: formData,
      })
      if (res.ok) {
        setCategories(categories.map((c) => (c.id === category.id ? category : c)))
        setEditingCategory(null)
        setEditDialogOpen(false)
        toast.success("Categoria atualizada!")
      } else {
        toast.error("Erro ao salvar alterações")
      }
    } catch (err) {
      console.error("Erro ao editar categoria:", err)
      toast.error("Erro de conexão ao editar")
    }
  }

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const form = e.currentTarget
    const formData = new FormData(form)
    const data = Object.fromEntries(formData.entries())

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        const newCategory = await res.json()
        setCategories((prev) => [...prev, newCategory])
        setAddDialogOpen(false)
        form.reset()
        toast.success("Categoria criada!", { description: `${newCategory.name} foi adicionada.` })
      } else {
        toast.error("Erro ao criar categoria")
      }
    } catch (err) {
      toast.error("Erro de conexão ao adicionar")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="p-2 hover:bg-secondary rounded-lg transition-colors cursor-pointer">
          <ArrowLeft className="h-6 w-6 text-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Categorias</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas categorias de despesas</p>
        </div>
        
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 cursor-pointer">
              <PlusCircle className="h-4 w-4" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-card-foreground">Adicionar Nova Categoria</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Nome</Label>
                <Input name="name" placeholder="Ex: Alimentação, Transporte..." className="bg-secondary border-border" required />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Ícone</Label>
                <Input name="icon" placeholder="Ex: utensils, car, gamepad..." className="bg-secondary border-border" required />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Cor</Label>
                <Input name="color" type="color" defaultValue="#6366f1" className="h-10 cursor-pointer" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" className="cursor-pointer" onClick={() => setAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button className="cursor-pointer" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Adicionar"}
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
      ) : categories.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground mb-4">Nenhuma categoria cadastrada</p>
          <Button
            onClick={async () => {
              try {
                const res = await fetch("/api/seed/categories", { method: "POST" })
                if (res.ok) {
                  const allCategories = await fetch("/api/categories")
                  if (allCategories.ok) setCategories(await allCategories.json())
                  toast.success("Categorias padrão adicionadas!")
                }
              } catch (err) {
                toast.error("Erro ao popular categorias")
              }
            }}
            className="mx-auto cursor-pointer"
          >
            Popular categorias padrão
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                <TableHead className="text-muted-foreground">Categoria</TableHead>
                <TableHead className="text-muted-foreground">Ícone</TableHead>
                <TableHead className="text-muted-foreground">Cor</TableHead>
                <TableHead className="text-right text-muted-foreground w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id} className="border-border hover:bg-secondary/30">
                  <TableCell className="font-medium text-foreground">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">{category.icon}</TableCell>
                  <TableCell>
                    <div className="w-8 h-8 rounded border border-border" style={{ backgroundColor: category.color }} title={category.color} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Dialog open={editDialogOpen && editingCategory?.id === category.id} onOpenChange={(open) => {
                        setEditDialogOpen(open)
                        if (open) setEditingCategory(category)
                      }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle className="text-card-foreground">Editar Categoria</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-foreground">Nome</Label>
                              <Input
                                defaultValue={category.name}
                                onChange={(e) => setEditingCategory({ ...category, name: e.target.value })}
                                className="bg-secondary border-border"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-foreground">Ícone</Label>
                              <Input
                                defaultValue={category.icon}
                                onChange={(e) => setEditingCategory({ ...category, icon: e.target.value })}
                                className="bg-secondary border-border"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-foreground">Cor</Label>
                              <Input
                                type="color"
                                defaultValue={category.color}
                                onChange={(e) => setEditingCategory({ ...category, color: e.target.value })}
                                className="h-10 cursor-pointer"
                              />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                              <Button type="button" variant="outline" className="cursor-pointer" onClick={() => setEditDialogOpen(false)}>
                                Cancelar
                              </Button>
                              <Button className="cursor-pointer" onClick={() => handleEdit(editingCategory || category)}>
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
                          <AlertDialogTitle className="text-foreground">Deletar categoria?</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            Tem certeza que deseja deletar {category.name}?
                          </AlertDialogDescription>
                          <div className="flex gap-3 justify-end">
                            <AlertDialogCancel className="border-border cursor-pointer">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(category.id)} className="bg-destructive hover:bg-destructive/90 cursor-pointer">
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