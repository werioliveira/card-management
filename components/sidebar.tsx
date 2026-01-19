"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { CreditCard, LayoutDashboard, Users, Receipt, Tags, PlusCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cards", label: "Cartões", icon: CreditCard },
  { href: "/people", label: "Pessoas", icon: Users },
  { href: "/transactions", label: "Transações", icon: Receipt },
  { href: "/categories", label: "Categorias", icon: Tags },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "fixed z-40 bg-sidebar transition-all duration-300 border-sidebar-border",
        // Mobile: Barra de navegação inferior
        "bottom-0 left-0 w-full h-16 border-t flex flex-row items-center justify-between px-4",
        // Desktop: Sidebar lateral
        "md:left-0 md:top-0 md:h-screen md:border-r md:border-t-0 md:flex-col md:justify-start md:items-stretch md:px-0",
        collapsed ? "md:w-20" : "md:w-64",
      )}
    >
        {/* Logo */}
        <div className="hidden md:flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg text-sidebar-foreground">CardManager</span>
            </div>
          )}
          {collapsed && (
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
              <CreditCard className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn("text-sidebar-foreground cursor-pointer", collapsed && "hidden")}
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-row md:flex-col gap-1 p-0 md:p-4 justify-around md:justify-start w-full md:w-auto items-center md:items-stretch">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  collapsed && "md:justify-center",
                  "flex-col md:flex-row gap-1 md:gap-3 p-1 md:px-3 md:py-2.5 text-[10px] md:text-sm"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className={cn("md:inline", collapsed ? "md:hidden" : "")}>{item.label}</span>
              </Link>
            )
          })}
        </nav>


        {/* Expand Button */}
        {collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex absolute -right-3 top-20 h-6 w-6 rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground cursor-pointer"
            onClick={() => setCollapsed(false)}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        )}
    </aside>
  )
}
