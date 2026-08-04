"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { formatINR } from "@/lib/utils/currency"
import {
  Scissors,
  AlertCircle,
  Tag,
  Calendar,
  ArrowRight,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export const dynamic = "force-dynamic"

interface DesignRequest {
  id: string
  image_url: string
  ai_tags: string[]
  budget_min: number
  budget_max: number
  deadline: string
  status: string
  notes: string | null
  created_at: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_bids: { label: "Awaiting Quotes", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  assigned:     { label: "In Production", color: "bg-primary/10 text-primary border-primary/20" },
  in_production:{ label: "In Production", color: "bg-primary/10 text-primary border-primary/20" },
  shipped:      { label: "Shipped", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" },
  delivered:    { label: "Delivered", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  reviewed:     { label: "Reviewed", color: "bg-muted text-muted-foreground border-border" },
}

export default function CustomerRequests() {
  const supabase = createClient()
  const [requests, setRequests] = React.useState<DesignRequest[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadRequests() {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from("design_requests")
          .select("id, image_url, ai_tags, budget_min, budget_max, deadline, status, notes, created_at")
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false })

        if (error) {
          setErrorMsg(error.message)
        } else {
          setRequests(data || [])
        }
      } catch {
        setErrorMsg("Failed to load your design requests.")
      } finally {
        setIsLoading(false)
      }
    }
    loadRequests()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const statusInfo = (status: string) =>
    STATUS_LABELS[status] || { label: status, color: "bg-muted text-muted-foreground border-border" }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">My Design Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All submitted garment requests and their current status.
          </p>
        </div>
        <Link href="/design-studio" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
          <Button className="bg-primary text-primary-foreground font-semibold h-10 rounded-2xl shadow-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" aria-hidden="true" />
            New Request
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
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-2xl flex items-start gap-3" role="alert">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-24 bg-card border border-border border-dashed rounded-3xl space-y-4">
          <Scissors className="w-12 h-12 text-muted-foreground/45 mx-auto" aria-hidden="true" />
          <h2 className="text-lg font-bold text-foreground">No Design Requests Yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Upload your first garment inspiration in the Custom Design to get started.
          </p>
          <Link href="/design-studio">
            <Button className="bg-primary text-primary-foreground font-semibold px-6 rounded-2xl h-11 mt-2">
              Open Custom Design
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const { label, color } = statusInfo(req.status)
            return (
              <div
                key={req.id}
                className="bg-card border border-border rounded-3xl p-5 shadow-sm flex flex-col md:flex-row gap-4 hover:border-primary/20 transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-full md:w-24 h-24 rounded-2xl overflow-hidden border border-border bg-muted shrink-0 relative">
                  <Image
                    src={req.image_url}
                    alt={req.ai_tags[0] ? `${req.ai_tags[0]} inspiration` : "Design request preview"}
                    fill
                    sizes="96px"
                    className="object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <h2 className="text-sm font-bold text-foreground truncate">
                      {req.ai_tags[0] || "Custom Garment Request"}
                    </h2>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${color} shrink-0`}>
                      {label}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {req.ai_tags.slice(0, 4).map((tag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center text-[9px] font-semibold px-2 py-0.5 bg-primary/5 text-primary border border-primary/10 rounded-full"
                      >
                        <Tag className="w-2.5 h-2.5 mr-0.5" aria-hidden="true" />
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span className="font-semibold text-foreground">
                      {req.budget_min && req.budget_max
                        ? `${formatINR(req.budget_min)} – ${formatINR(req.budget_max)}`
                        : "Budget TBD"}
                    </span>
                    {req.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                        Deadline: {req.deadline}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action */}
                <div className="flex items-center shrink-0">
                  <Link
                    href={`/dashboard/orders/${req.id}`}
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                    aria-label={`View details for ${req.ai_tags[0] || "this request"}`}
                  >
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground text-xs font-semibold h-9 rounded-xl flex items-center gap-1.5"
                    >
                      View Details
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
