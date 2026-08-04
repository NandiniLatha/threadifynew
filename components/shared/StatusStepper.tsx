import * as React from "react"
import { Check, XCircle } from "lucide-react"

export type OrderStatus =
  | "draft"
  | "pending_bids"
  | "assigned"
  | "paid"
  | "in_production"
  | "shipped"
  | "delivered"
  | "reviewed"
  | "cancelled"

interface StatusStepperProps {
  status: OrderStatus
  className?: string
}

const STEPS = [
  "Requested",
  "Quoted",
  "Assigned",
  "Paid",
  "Production", // Shortened from "In Production" for visual fit
  "Shipped",
  "Delivered",
  "Reviewed",
]

export function StatusStepper({ status, className = "" }: StatusStepperProps) {
  if (status === "cancelled") {
    return (
      <div className={`p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center justify-center gap-2 text-destructive ${className}`}>
        <XCircle className="w-5 h-5" />
        <span className="font-bold">This order was cancelled.</span>
      </div>
    )
  }

  let currentIdx = 0
  switch (status) {
    case "draft":
      currentIdx = -1
      break
    case "pending_bids":
      currentIdx = 0
      break
    case "assigned":
      currentIdx = 2 // Skips "Quoted" visually making it completed
      break
    case "paid":
      currentIdx = 3
      break
    case "in_production":
      currentIdx = 4
      break
    case "shipped":
      currentIdx = 5
      break
    case "delivered":
      currentIdx = 6
      break
    case "reviewed":
      currentIdx = 7
      break
  }

  return (
    <div className={`w-full overflow-x-auto pb-4 ${className}`}>
      <div className="flex items-center justify-between min-w-[600px] max-w-4xl mx-auto px-2">
        {STEPS.map((label, i) => {
          const isPast = i < currentIdx
          const isCurrent = i === currentIdx
          
          return (
            <React.Fragment key={label}>
              {i > 0 && (
                <div
                  className={`h-[2px] flex-1 mx-2 transition-colors duration-500 ${
                    isPast || isCurrent ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
              <div className="flex flex-col items-center relative group">
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors duration-500 z-10 ${
                    isPast
                      ? "bg-primary border-primary text-primary-foreground"
                      : isCurrent
                      ? "bg-primary/10 border-primary text-primary ring-4 ring-primary/20"
                      : "bg-background border-border text-muted-foreground"
                  }`}
                >
                  {isPast ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span
                  className={`absolute top-10 text-[10px] font-semibold whitespace-nowrap transition-colors duration-500 ${
                    isPast || isCurrent ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </div>
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
