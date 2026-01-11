"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import type { Transaction, ExpenseCategory } from "@/lib/types"

interface ExpenseChartProps {
  transactions: Transaction[]
  categories: ExpenseCategory[]
}

export function ExpenseChart({ transactions, categories }: ExpenseChartProps) {
  const categoryTotals = categories
    .map((category) => {
      const total = transactions.filter((t) => t.categoryId === category.id).reduce((sum, t) => sum + t.amount, 0)
      return {
        name: category.name,
        value: total,
        color: category.color,
      }
    })
    .filter((c) => c.value > 0)

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Despesas por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryTotals}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                
              >
                {categoryTotals.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) =>
                  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
                }
                contentStyle={{
                  backgroundColor: "#f1f1f1",
                  borderColor: "#2a3f5f",
                  borderRadius: "8px",
                  color: "#e6eef8",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
                }}
                labelStyle={{ color: "#e6eef8" }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => <span className="text-white text-sm">{value}</span>} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
