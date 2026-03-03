"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { FileDown, Loader2 } from "lucide-react"

interface ExportInvoiceDialogProps {
  transactions: any[]
  people: any[]
  cards: any[]
  categories: any[]
  month: string
}

export function ExportInvoiceDialog({
  transactions,
  people,
  cards,
  categories,
  month,
}: ExportInvoiceDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState("all")
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const jsPDF = (await import("jspdf")).default
      const autoTable = (await import("jspdf-autotable")).default

      const doc = new jsPDF()
      
      const filtered = transactions.filter(t => {
        if (selectedPerson === "all") return true
        return t.personId === selectedPerson
      })

      const totalGeral = filtered.reduce((sum, t) => sum + t.amount, 0)
      const [year, monthStr] = month.split("-")
      const dateStr = new Date(parseInt(year), parseInt(monthStr) - 1, 1)
        .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()

      // --- DESIGN DO CABEÇALHO (ESTILO BANCO) ---
      doc.setFillColor(240, 240, 240)
      doc.rect(0, 0, 210, 40, 'F') // Faixa cinza no topo

      doc.setFont("helvetica", "bold")
      doc.setFontSize(22)
      doc.setTextColor(40, 40, 40)
      doc.text("EXTRATO DE CARTÃO", 14, 20)

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(100, 100, 100)
      doc.text(`PERÍODO: ${dateStr}`, 14, 28)

      // Box de Resumo no Topo
      doc.setDrawColor(200, 200, 200)
      doc.line(14, 45, 196, 45) // Linha divisória

      doc.setFontSize(12)
      doc.setTextColor(40, 40, 40)
      doc.text("TOTAL DA FATURA", 14, 55)
      
      doc.setFontSize(20)
      doc.setTextColor(33, 150, 243) // Azul vibrante para o total
      doc.text(`R$ ${totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 14, 65)

      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      const personName = selectedPerson === "all" ? "Todos os usuários" : people.find(p => p.id === selectedPerson)?.name
      doc.text(`Titular/Filtro: ${personName}`, 14, 72)

      let finalY = 80

      // --- PROCESSAMENTO POR CARTÃO ---
      cards.forEach(card => {
        const cardTxs = filtered.filter(t => t.cardId === card.id)
        if (cardTxs.length === 0) return

        // Título do Cartão (Subheader)
        if (finalY > 250) { doc.addPage(); finalY = 20 }
        
        doc.setFillColor(252, 252, 252)
        doc.rect(14, finalY, 182, 8, 'F')
        
        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(card.color || "#333333")
        doc.text(card.name.toUpperCase(), 16, finalY + 6)
        
        const tableData = cardTxs.map(t => [
          new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          t.description.toUpperCase(),
          categories.find(c => c.id === t.categoryId)?.name || "-",
          t.installments > 1 ? `${t.currentInstallment}/${t.installments}` : "À VISTA",
          `R$ ${t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ])

        autoTable(doc, {
          startY: finalY + 10,
          head: [['DATA', 'DESCRIÇÃO', 'CATEGORIA', 'PARCELA', 'VALOR (R$)']],
          body: tableData,
          theme: 'plain', // 'plain' remove as bordas pesadas para parecer fatura real
          headStyles: { 
            fillColor: [255, 255, 255], 
            textColor: [120, 120, 120], 
            fontSize: 7, 
            fontStyle: 'bold',
            borderBottomColor: [200, 200, 200]
          },
          styles: { 
            fontSize: 9, 
            cellPadding: 3,
            textColor: [60, 60, 60] 
          },
          columnStyles: { 
            4: { halign: 'right', fontStyle: 'bold' },
            0: { textColor: [120, 120, 120] }
          },
          didDrawPage: (data) => {
             // Adiciona rodapé se necessário
          }
        })

        // @ts-ignore
        finalY = doc.lastAutoTable.finalY + 15
      })

      // Rodapé Final
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 285)

      doc.save(`fatura-${month}.pdf`)
      setOpen(false)
    } catch (error) {
      console.error(error)
      alert("Erro ao gerar PDF.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-border">
          <FileDown className="h-4 w-4" />
          <span className="hidden sm:inline">Exportar Extrato</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurações do Extrato</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Filtrar por Pessoa</Label>
            <Select value={selectedPerson} onValueChange={setSelectedPerson}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as pessoas</SelectItem>
                {people.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileDown className="h-4 w-4 mr-2" />}
            {isExporting ? "Processando..." : "Gerar PDF"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}