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
  Trash2,
  Loader2,
  CheckCircle2,
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

const CANCELLABLE_STATUSES = ["draft", "pending_bids", "quoted", "cancelled"]

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_bids: { label: "Awaiting Quotes", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  quoted:       { label: "Price Sent", color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20" },
  assigned:     { label: "In Production", color: "bg-primary/10 text-primary border-primary/20" },
  in_production:{ label: "In Production", color: "bg-primary/10 text-primary border-primary/20" },
  shipped:      { label: "Shipped", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" },
  delivered:    { label: "Delivered", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  reviewed:     { label: "Reviewed", color: "bg-muted text-muted-foreground border-border" },
  cancelled:    { label: "Cancelled", color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20" },
}

export default function CustomerRequests() {
  const supabase = createClient()
  const [requests, setRequests] = React.useState<DesignRequest[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null)

  // Deletion Modal state
  const [requestToDelete, setRequestToDelete] = React.useState<DesignRequest | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [deleteErrorMsg, setDeleteErrorMsg] = React.useState<string | null>(null)

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

  const handleConfirmDelete = async () => {
    if (!requestToDelete) return
    setIsDeleting(true)
    setDeleteErrorMsg(null)

    try {
      const res = await fetch(`/api/design-requests/${requestToDelete.id}`, {
        method: "DELETE",
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete request.")
      }

      // Deletion successful: remove item immediately from UI
      setRequests((prev) => prev.filter((r) => r.id !== requestToDelete.id))
      setSuccessMsg("Request deleted successfully.")
      setRequestToDelete(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete request."
      setDeleteErrorMsg(msg)
    } finally {
      setIsDeleting(false)
    }
  }

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

      {/* Success Notification Banner */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm rounded-2xl flex items-center justify-between gap-3 animate-in fade-in" role="status">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-xs font-semibold hover:underline opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

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
            const isCancellable = CANCELLABLE_STATUSES.includes(req.status)

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
                      {req.ai_tags[0] || "Custom Clothing Request"}
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

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap md:flex-nowrap">
                  {isCancellable && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setDeleteErrorMsg(null)
                        setRequestToDelete(req)
                      }}
                      className="text-xs font-semibold h-9 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center gap-1.5 transition-colors"
                      aria-label={`Delete request for ${req.ai_tags[0] || "this garment"}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Delete Request</span>
                    </Button>
                  )}

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

      {/* Delete Confirmation Modal Dialog */}
      {requestToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive shrink-0">
                <AlertCircle className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="space-y-1 flex-1">
                <h2 id="delete-dialog-title" className="text-base font-bold text-foreground">
                  Delete this request?
                </h2>
                <p className="text-xs text-muted-foreground">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Target Item Brief */}
            <div className="p-3 bg-muted/50 rounded-2xl border border-border flex items-center gap-3 text-xs">
              <div className="w-10 h-10 rounded-lg overflow-hidden relative border border-border bg-muted shrink-0">
                <Image
                  src={requestToDelete.image_url}
                  alt="Request preview"
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground truncate">
                  {requestToDelete.ai_tags[0] || "Custom Design Request"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Status: {statusInfo(requestToDelete.status).label}
                </p>
              </div>
            </div>

            {/* Error Message inside Modal if API fails */}
            {deleteErrorMsg && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-start gap-2" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{deleteErrorMsg}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                disabled={isDeleting}
                onClick={() => {
                  if (!isDeleting) {
                    setRequestToDelete(null)
                    setDeleteErrorMsg(null)
                  }
                }}
                className="h-10 rounded-xl px-4 text-xs font-semibold border-border hover:bg-accent"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="h-10 rounded-xl px-4 text-xs font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center gap-2 shadow-sm"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Delete Request</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
