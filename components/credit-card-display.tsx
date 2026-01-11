import { cn } from "@/lib/utils"
import type { CreditCard } from "@/lib/types"

interface CreditCardDisplayProps {
  card: CreditCard
  compact?: boolean
}

export function CreditCardDisplay({ card, compact = false }: CreditCardDisplayProps) {
  const brandLogos: Record<string, string> = {
    visa: "VISA",
    mastercard: "MC",
    elo: "ELO",
    amex: "AMEX",
  }

  return (
    <div
      className={cn("relative rounded-xl p-4 text-white overflow-hidden", compact ? "h-28 w-44" : "h-44 w-72")}
      style={{ backgroundColor: card.color }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10" />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex justify-between items-start">
          <span className={cn("font-semibold", compact ? "text-sm" : "text-lg")}>{card.name}</span>
          <span className={cn("font-bold", compact ? "text-xs" : "text-sm")}>{brandLogos[card.brand]}</span>
        </div>

        {!compact && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-6 w-8 bg-amber-300 rounded" />
            </div>
          </div>
        )}

        <div className={cn("flex justify-between items-end", compact && "mt-auto")}>
          <span className={cn("font-mono tracking-wider", compact ? "text-xs" : "text-lg")}>
            •••• {card.lastDigits}
          </span>
          {!compact && (
            <div className="text-right text-xs opacity-80">
              <div>Fecha: {card.closingDay}</div>
              <div>Vence: {card.dueDay}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
