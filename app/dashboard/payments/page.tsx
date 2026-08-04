"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { formatINR } from "@/lib/utils/currency"
import { Skeleton } from "@/components/ui/skeleton"
import {
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react"

interface PaymentRecord {
  id: string
  garmentName: string
  tailorName: string
  amount: number
  status: string
  date: string
}

const STATUS_STYLE: Record<string, string> = {
  paid:         "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  released:     "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  in_escrow:    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  assigned:     "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  in_production:"bg-primary/10 text-primary border-primary/20",
  pending:      "bg-muted text-muted-foreground border-border",
}

function StatusIcon({ status }: { status: string }) {
  if (status === "paid" || status === "released") return <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
  if (status === "in_escrow" || status === "assigned") return <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
  return <CreditCard className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
}

export default function CustomerPayments() {
  const supabase = createClient()
  const [payments, setPayments] = React.useState<PaymentRecord[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [totalSpent, setTotalSpent] = React.useState(0)
  const [totalEscrow, setTotalEscrow] = React.useState(0)

  React.useEffect(() => {
    async function loadPayments() {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: requests, error } = await supabase
          .from("design_requests")
          .select("id, ai_tags, status, created_at")
          .eq("customer_id", user.id)
          .in("status", ["assigned", "in_production", "shipped", "delivered", "reviewed"])

        if (error) {
          setErrorMsg("Could not load your payment history. Please try again later.")
          return
        }

        if (requests && requests.length > 0) {
          const requestIds = requests.map((r) => r.id)
          const { data: quotes } = await supabase
            .from("quotations")
            .select("request_id, price, tailor_id, status")
            .in("request_id", requestIds)
            .eq("status", "accepted")

          const mapped: PaymentRecord[] = requests.map((req) => {
            const quote = quotes?.find((q) => q.request_id === req.id)
            const isReleased = ["delivered", "reviewed"].includes(req.status)
            return {
              id: req.id,
              garmentName: req.ai_tags?.[0] || "Custom Garment",
              tailorName: "Studio Tailor",
              amount: quote ? Number(quote.price) * 100 : 0,
              status: isReleased ? "released" : "in_escrow",
              date: req.created_at.split("T")[0],
            }
          })

          setPayments(mapped)
          setTotalSpent(mapped.filter(p => p.status === "released").reduce((s, p) => s + p.amount, 0))
          setTotalEscrow(mapped.filter(p => p.status === "in_escrow").reduce((s, p) => s + p.amount, 0))
        }
      } catch {
        setErrorMsg("Failed to load payment history.")
      } finally {
        setIsLoading(false)
      }
    }
    loadPayments()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Payments & Secure Payment</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your transaction history and escrow balances across all orders.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="w-4 h-4 text-emerald-500" aria-hidden="true" />
            Total Released to Tailors
          </div>
          <p className="text-3xl font-bold font-serif text-foreground">{formatINR(totalSpent / 100)}</p>
          <p className="text-xs text-muted-foreground">Completed & confirmed orders</p>
        </div>
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Clock className="w-4 h-4 text-amber-500" aria-hidden="true" />
            Held in Secure Payment
          </div>
          <p className="text-3xl font-bold font-serif text-foreground">{formatINR(totalEscrow / 100)}</p>
          <p className="text-xs text-muted-foreground">Active in-production orders</p>
        </div>
      </div>

      {/* Transaction List */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : errorMsg ? (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-2xl flex items-start gap-3" role="alert">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border border-dashed rounded-3xl space-y-4">
          <CreditCard className="w-12 h-12 text-muted-foreground/45 mx-auto" aria-hidden="true" />
          <h2 className="text-lg font-bold text-foreground">No Transactions Yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Once you assign a tailor and make a payment, your transaction history will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
          <table className="w-full text-sm" role="table" aria-label="Payment history">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th scope="col" className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Garment</th>
                <th scope="col" className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Date</th>
                <th scope="col" className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Amount</th>
                <th scope="col" className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.map((pay) => (
                <tr key={pay.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <StatusIcon status={pay.status} />
                      <div>
                        <p className="font-semibold text-foreground text-xs">{pay.garmentName}</p>
                        <p className="text-[10px] text-muted-foreground">{pay.tailorName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-muted-foreground hidden sm:table-cell">{pay.date}</td>
                  <td className="px-5 py-4 font-bold text-foreground text-xs">{formatINR(pay.amount / 100)}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border capitalize ${STATUS_STYLE[pay.status] || STATUS_STYLE.pending}`}>
                      {pay.status === "in_escrow" ? "In Secure Payment" : pay.status === "released" ? "Released" : pay.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
