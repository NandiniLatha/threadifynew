"use client"

import * as React from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { formatINR } from "@/lib/utils/currency"
import {
  FileText,
  Loader2,
  AlertCircle,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react"

interface PriceQuote {
  id: string
  requestId: string
  garmentName: string
  image_url: string
  price: number
  estimatedDays: number
  note: string
  status: string
  createdAt: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  pending:   { label: "Pending",  color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20", Icon: Clock },
  accepted:  { label: "Accepted", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20", Icon: CheckCircle },
  rejected:  { label: "Rejected", color: "bg-destructive/10 text-destructive border-destructive/20", Icon: XCircle },
}

export default function TailorQuotations() {
  const supabase = createClient()
  const [quotations, setQuotations] = React.useState<PriceQuote[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadQuotations() {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from("quotations")
          .select("id, request_id, price, estimated_days, note, status, created_at")
          .eq("tailor_id", user.id)
          .order("created_at", { ascending: false })

        if (error) {
          setErrorMsg(error.message)
          return
        }

        if (!data || data.length === 0) {
          setQuotations([])
          return
        }

        // Fetch associated design requests for image + tags
        const requestIds = data.map((q) => q.request_id)
        const { data: requests } = await supabase
          .from("design_requests")
          .select("id, ai_tags, image_url")
          .in("id", requestIds)

        const mapped: PriceQuote[] = data.map((q) => {
          const req = requests?.find((r) => r.id === q.request_id)
          return {
            id: q.id,
            requestId: q.request_id,
            garmentName: req?.ai_tags?.[0] || "Custom Garment",
            image_url: req?.image_url || "",
            price: Number(q.price),
            estimatedDays: q.estimated_days,
            note: q.note || "",
            status: q.status || "pending",
            createdAt: q.created_at?.split("T")[0] || "",
          }
        })

        setQuotations(mapped)
      } catch {
        setErrorMsg("Failed to load your quotations.")
      } finally {
        setIsLoading(false)
      }
    }
    loadQuotations()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">My Price Quotes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All quotes you&apos;ve submitted to customers, with status updates.
        </p>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" aria-label="Loading quotations" />
        </div>
      ) : errorMsg ? (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-2xl flex items-start gap-3" role="alert">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      ) : quotations.length === 0 ? (
        <div className="text-center py-24 bg-card border border-border border-dashed rounded-3xl space-y-4">
          <FileText className="w-12 h-12 text-muted-foreground/45 mx-auto" aria-hidden="true" />
          <h2 className="text-lg font-bold text-foreground">No Price Quotes Yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Browse open design requests and submit your first quote to get started.
          </p>
          <Link href="/tailor/requests">
            <button className="mt-2 h-11 px-6 bg-primary text-primary-foreground font-semibold rounded-2xl shadow-sm text-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              View Open Requests
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {quotations.map((q) => {
            const cfg = STATUS_CONFIG[q.status] || STATUS_CONFIG.pending
            const StatusIcon = cfg.Icon
            return (
              <div
                key={q.id}
                className="bg-card border border-border rounded-3xl p-5 shadow-sm flex flex-col md:flex-row gap-4 hover:border-primary/20 transition-colors"
              >
                {/* Thumbnail */}
                {q.image_url && (
                  <div className="w-full md:w-20 h-20 rounded-2xl overflow-hidden border border-border bg-muted shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={q.image_url}
                      alt={`${q.garmentName} design`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <h2 className="text-sm font-bold text-foreground">{q.garmentName}</h2>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${cfg.color} shrink-0`}>
                      <StatusIcon className="w-3 h-3" aria-hidden="true" />
                      {cfg.label}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed italic bg-muted/30 p-2.5 rounded-xl border border-border/40">
                    &ldquo;{q.note}&rdquo;
                  </p>

                  <div className="flex items-center gap-5 text-xs text-muted-foreground flex-wrap">
                    <span className="font-bold text-foreground text-sm">{formatINR(q.price / 100)}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                      {q.estimatedDays} days delivery
                    </span>
                    <span>Submitted: {q.createdAt}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
