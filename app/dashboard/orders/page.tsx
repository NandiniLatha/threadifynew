"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { formatINR } from "@/lib/utils/currency"
import {
  Package,
  Calendar,
  AlertCircle,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export const dynamic = "force-dynamic"

interface CustomerOrder {
  id: string
  image_url: string
  ai_tags: string[]
  budget_min: number
  budget_max: number
  deadline: string
  status: "Requested" | "Paid" | "In Production" | "Shipped" | "Delivered" | "Reviewed"
  notes?: string
}

export default function CustomerOrders() {
  const supabase = createClient()
  
  const [orders, setOrders] = React.useState<CustomerOrder[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadOrders() {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data, error } = await supabase
            .from("design_requests")
            .select("id, image_url, ai_tags, budget_min, budget_max, deadline, status, notes")
            .eq("customer_id", user.id)
            .order("created_at", { ascending: false })

          if (error) {
            setErrorMsg(error.message)
          } else {
            const mapped: CustomerOrder[] = (data || []).map((item: {
              id: string
              image_url: string
              ai_tags?: string[]
              budget_min: number
              budget_max: number
              deadline: string
              status: string
              notes?: string
            }) => {
              let uiStatus: CustomerOrder["status"] = "Requested"
              if (item.status === "pending_bids") uiStatus = "Requested"
              else if (item.status === "assigned") uiStatus = "Paid"
              else if (item.status === "in_production") uiStatus = "In Production"
              else if (item.status === "delivered") uiStatus = "Delivered"
              else if (item.status === "cancelled") uiStatus = "Requested" // fallback
              return {
                id: item.id,
                image_url: item.image_url,
                ai_tags: item.ai_tags || [],
                budget_min: item.budget_min,
                budget_max: item.budget_max,
                deadline: item.deadline,
                status: uiStatus,
                notes: item.notes,
              }
            })
            setOrders(mapped)
          }
        }
      } catch {
        setErrorMsg("Failed to query your orders from the database.")
      } finally {
        setIsLoading(false)
      }
    }
    loadOrders()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getStatusColor = (status: CustomerOrder["status"]) => {
    switch (status) {
      case "Requested":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "Paid":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "In Production":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
      case "Shipped":
        return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
      case "Delivered":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Your Orders & Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track bidding progress, current production phases, and shipping states for all designs.
          </p>
        </div>
        <Link href="/design-studio" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
          <Button className="bg-primary text-primary-foreground font-semibold h-11 rounded-2xl shadow flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>Create New Request</span>
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      ) : errorMsg ? (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border border-dashed rounded-3xl space-y-4">
          <Package className="w-12 h-12 text-muted-foreground/45 mx-auto" />
          <h2 className="text-lg font-bold text-foreground">No Custom Orders Yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Design your first garment in our Custom Design to connect with tailors and start receiving quotes!
          </p>
          <div className="pt-2">
            <Link href="/design-studio">
              <Button className="bg-primary text-primary-foreground font-semibold px-6 rounded-2xl h-11">
                Start Designing
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {orders.map((ord) => (
            <div key={ord.id} className="bg-card border border-border hover:shadow-sm transition-shadow rounded-3xl p-5 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Image */}
                <div className="aspect-video relative rounded-2xl overflow-hidden border border-border bg-muted">
                  <Image
                    src={ord.image_url}
                    alt="Inspiration preview"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground truncate flex-1 mr-2">
                    {ord.ai_tags[0] || "Custom Design"} Request
                  </h3>
                  <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 border rounded-full ${getStatusColor(ord.status)}`}>
                    {ord.status}
                  </span>
                </div>

                {ord.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2 italic leading-relaxed">
                    &ldquo;{ord.notes}&rdquo;
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4 pt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-foreground">{formatINR(ord.budget_min)} - {formatINR(ord.budget_max)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>Due: {ord.deadline}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <Link href={`/dashboard/orders/${ord.id}`}>
                  <Button variant="outline" className="w-full flex items-center justify-center space-x-1 border-border font-semibold h-10 rounded-2xl">
                    <span>Manage Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
