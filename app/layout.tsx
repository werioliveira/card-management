import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Sidebar } from "@/components/sidebar"
const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CardManager - Gerenciamento de Faturas",
  description: "Sistema completo de gerenciamento de faturas de cartão de crédito",
    generator: 'v0.app'
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="min-h-screen bg-background">
          <Sidebar />
          <main className="md:pl-64 pb-20 md:pb-0 transition-all duration-300">
            {children}
            <Analytics />
          </main>
        </div>
      </body>
    </html>
  )
}
