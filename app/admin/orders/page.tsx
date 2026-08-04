"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { formatINR } from "@/lib/utils/currency"
import {
  Package,
  Search,
  Filter,
  Loader2,
  AlertCircle,
} from "lucide-react"

interface AdminOrder {
  id: string
  clientName: string
  clientEmail: string
  tailorName: string
  status: string
  price: number
  createdDate: string
}

export default function AdminOrders() {
  const supabase = createClient()

  const [orders, setOrders] = React.useState<AdminOrder[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("ALL")

  React.useEffect(() => {
    async function loadAllOrders() {
      setIsLoading(true)
      try {
        // Single join query — replaces the previous N+1 pattern (3 queries per order).
        // Supabase embedded relations let us fetch customer, accepted quotation,
        // and tailor name in one round trip regardless of order count.
        const { data: requests, error } = await supabase
          .from("design_requests")
          .select(`
            id,
            status,
            created_at,
            customer:users!customer_id ( name, email ),
            accepted_quotation:quotations!accepted_quotation_id (
              price,
              tailor:users!tailor_id ( name )
            )
          `)
          .order("created_at", { ascending: false })
          .limit(200)

        if (error) {
          setErrorMsg(error.message)
        } else if (requests && requests.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mappedOrders = (requests as any[]).map((req) => {
            const customer = req.customer
            const quote    = req.accepted_quotation
            const tailor   = quote?.tailor

            return {
              id:          req.id,
              clientName:  customer?.name  ?? "Client",
              clientEmail: customer?.email ?? "—",
              tailorName:  tailor?.name    ?? "Not Assigned",
              status:      req.status === "assigned"  ? "Paid"
                         : req.status === "delivered" ? "Delivered"
                         : req.status,
              price:       quote ? Number(quote.price) : 0,
              createdDate: new Date(req.created_at).toLocaleDateString("en-IN", {
                year: "numeric", month: "short", day: "numeric",
              }),
            }
          })
          setOrders(mappedOrders)
        } else {
          setOrders([])
        }
      } catch {
        setErrorMsg("Failed to query order records.")
      } finally {
        setIsLoading(false)
      }
    }
    loadAllOrders()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filter logic
  const filteredOrders = orders.filter((ord) => {
    const matchesSearch =
      ord.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.tailorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === "ALL" || ord.status.toUpperCase() === statusFilter.toUpperCase()

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Global Orders Audit</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor transaction statuses, pricing variables, assignments, and audit client requests.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Query Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card border border-border p-4 rounded-2xl shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Search by client, tailor, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 border border-border rounded-xl bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Dropdown status filter */}
        <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0 justify-end">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 border border-border rounded-xl bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="REQUESTED">Requested</option>
            <option value="PAID">Paid</option>
            <option value="DELIVERED">Delivered</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border border-dashed rounded-3xl space-y-2">
          <Package className="w-12 h-12 text-muted-foreground/45 mx-auto" />
          <h2 className="text-base font-bold text-foreground">No Audited Orders</h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No active or past orders match your search parameters.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border/80 text-muted-foreground font-bold">
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Assigned Tailor</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-mono font-semibold text-foreground">{ord.id}</td>
                    <td className="p-4">
                      <div className="font-bold text-foreground">{ord.clientName}</div>
                      <div className="text-[10px] text-muted-foreground">{ord.clientEmail}</div>
                    </td>
                    <td className="p-4 font-semibold text-foreground/80">{ord.tailorName}</td>
                    <td className="p-4 font-bold text-foreground">{formatINR(ord.price)}</td>
                    <td className="p-4 text-muted-foreground">{ord.createdDate}</td>
                    <td className="p-4 text-right">
                      <span
                        className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 border rounded-full ${
                          ord.status === "Paid"
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                            : ord.status === "Delivered"
                            ? "bg-blue-500/10 border-blue-500/20 text-blue-600"
                            : "bg-muted border-border text-muted-foreground"
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
