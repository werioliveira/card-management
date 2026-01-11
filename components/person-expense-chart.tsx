"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import type { Transaction, Person } from "@/lib/types"

interface PersonExpenseChartProps {
  transactions: Transaction[]
  people: Person[]
}

export function PersonExpenseChart({ transactions, people }: PersonExpenseChartProps) {
  const personTotals = people.map((person) => {
    const total = transactions.filter((t) => t.personId === person.id).reduce((sum, t) => sum + t.amount, 0)
    return {
      name: person.name.split(" ")[0],
      value: total,
      color: person.color,
    }
  })

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Despesas por Pessoa</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={personTotals} layout="vertical">
              <XAxis
                type="number"
                tick={{ fill: '#e6eef8' }}
                tickFormatter={(value) =>
                  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(
                    value,
                  )
                }
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis type="category" tick={{ fill: '#e6eef8' }} dataKey="name" stroke="hsl(var(--primary))"  fontSize={12} width={80} color="#e6eef8"/>
              <Tooltip
                formatter={(value: number) =>
                  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
                }
                contentStyle={{
                  backgroundColor: "#0f1724",
                  borderColor: "#2a3f5f",
                  borderRadius: "8px",
                  color: "#e6eef8",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
                }}
                labelStyle={{ color: "#e6eef8" }}
                cursor={{ fill: "rgba(99, 102, 241, 0.1)" }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="hsl(var(--primary))">
                {personTotals.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
