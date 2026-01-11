export interface Person {
  id: string
  name: string
  email: string
  avatar?: string
  color: string
}

export interface CreditCard {
  id: string
  name: string
  lastDigits: string
  brand: "visa" | "mastercard" | "elo" | "amex"
  limit: number
  closingDay: number
  dueDay: number
  color: string
}

export interface ExpenseCategory {
  id: string
  name: string
  icon: string
  color: string
}

export interface Transaction {
  id: string
  description: string
  amount: number
  date: string
  cardId: string
  personId: string
  categoryId: string
  installments?: number
  currentInstallment?: number
}

export interface Invoice {
  id: string
  cardId: string
  month: number
  year: number
  totalAmount: number
  dueDate: string
  status: "open" | "closed" | "paid"
}
