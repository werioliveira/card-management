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
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-20" : "w-64",
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
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
            className={cn("text-sidebar-foreground", collapsed && "hidden")}
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  collapsed && "justify-center",
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>


        {/* Expand Button */}
        {collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground"
            onClick={() => setCollapsed(false)}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        )}
      </div>
    </aside>
  )
}
