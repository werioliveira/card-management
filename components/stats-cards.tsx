import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, TrendingUp, Users, Receipt } from "lucide-react"

interface StatsCardsProps {
  totalCards: number
  totalPeople: number
  totalExpenses: number
  monthlyTotal: number
}

export function StatsCards({ totalCards, totalPeople, totalExpenses, monthlyTotal }: StatsCardsProps) {
  const stats = [
    {
      title: "Total de Cartões",
      value: totalCards,
      icon: CreditCard,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Pessoas Cadastradas",
      value: totalPeople,
      icon: Users,
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      title: "Despesas do Mês",
      value: totalExpenses,
      icon: Receipt,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Total Gasto",
      value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(monthlyTotal),
      icon: TrendingUp,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
