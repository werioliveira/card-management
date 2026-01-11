import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const formatCurrency = (value: number | string) => {
  const amount = typeof value === "string" ? parseFloat(value) : value
  if (isNaN(amount)) return ""
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount)
}

// Transforma a string digitada em número puro: "R$ 1.250,50" -> 1250.50
export const parseCurrencyToNumber = (value: string) => {
  return Number(value.replace(/\D/g, "")) / 100
}