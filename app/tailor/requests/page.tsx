"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { formatINR } from "@/lib/utils/currency"
import { motion } from "framer-motion"
import {
  Scissors,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle,
  Tag,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface DesignRequest {
  id: string
  image_url: string
  ai_tags: string[]
  budget_min: number
  budget_max: number
  deadline: string
  notes?: string
}

export default function TailorRequests() {
  const supabase = createClient()
  
  const [requests, setRequests] = React.useState<DesignRequest[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  
  // Modal State
  const [activeRequest, setActiveRequest] = React.useState<DesignRequest | null>(null)
  const [quotePrice, setQuotePrice] = React.useState("")
  const [quoteDays, setQuoteDays] = React.useState("")
  const [quoteNote, setQuoteNote] = React.useState("")
  const [isSubmittingQuote, setIsSubmittingQuote] = React.useState(false)
  const [modalSuccessMsg, setModalSuccessMsg] = React.useState<string | null>(null)
  const [modalErrorMsg, setModalErrorMsg] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadRequests() {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("design_requests")
          .select("id, image_url, ai_tags, budget_min, budget_max, deadline, notes")
          .eq("status", "pending_bids")
          .order("created_at", { ascending: false })

        if (error) {
          setErrorMsg(error.message)
        } else {
          setRequests(data || [])
        }
      } catch {
        setErrorMsg("Failed to query open requests from the database.")
      } finally {
        setIsLoading(false)
      }
    }
    loadRequests()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeRequest) return

    setModalSuccessMsg(null)
    setModalErrorMsg(null)

    if (!quotePrice || !quoteDays) {
      setModalErrorMsg("Please enter both the quote price and estimated delivery days.")
      return
    }

    setIsSubmittingQuote(true)
    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: activeRequest.id,
          price: quotePrice,
          estimatedDays: quoteDays,
          note: quoteNote,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setModalSuccessMsg("Price Quote successfully submitted!")
        setQuotePrice("")
        setQuoteDays("")
        setQuoteNote("")
        // Refresh local requests (optionally remove request we just quote on)
        setRequests((prev) => prev.filter((r) => r.id !== activeRequest.id))
        setTimeout(() => {
          setActiveRequest(null)
          setModalSuccessMsg(null)
        }, 1500)
      } else {
        setModalErrorMsg(data.error || "Failed to submit quote.")
      }
    } catch {
      setModalErrorMsg("Could not submit quotation. Please try again.")
    } finally {
      setIsSubmittingQuote(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Open Client Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review matching garments uploaded by users and submit bidding quotes.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card border border-border rounded-3xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <Skeleton className="aspect-video w-full rounded-2xl" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-full rounded" />
                  <Skeleton className="h-3.5 w-4/5 rounded" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-4 w-28 rounded" />
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-border">
                <Skeleton className="h-10 w-full rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      ) : errorMsg ? (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border border-dashed rounded-3xl space-y-4">
          <Scissors className="w-12 h-12 text-muted-foreground/45 mx-auto" />
          <h2 className="text-lg font-bold text-foreground">No open client requests right now.</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Check back soon! New custom design requirements from clients will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.map((req) => (
            <div key={req.id} className="bg-card border border-border hover:shadow-md transition-shadow rounded-3xl p-5 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Thumbnail */}
                <div className="aspect-video relative rounded-2xl overflow-hidden border border-border bg-muted">
                  <Image
                    src={req.image_url}
                    alt="Design inspiration"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    loading="lazy"
                  />
                </div>

                {/* AI Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {req.ai_tags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 bg-primary/5 text-primary border border-primary/10 rounded-full">
                      <Tag className="w-2.5 h-2.5 mr-1 text-primary/70" />
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Notes */}
                {req.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2 italic leading-relaxed">
                    &ldquo;{req.notes}&rdquo;
                  </p>
                )}

                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 pt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-foreground">{formatINR(req.budget_min)} - {formatINR(req.budget_max)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>Until {req.deadline}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <Button
                  onClick={() => setActiveRequest(req)}
                  className="w-full bg-primary text-primary-foreground font-semibold h-10 rounded-2xl"
                >
                  Submit Price Quote
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quote Modal Popup */}
      {activeRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-3xl shadow-xl w-full max-w-md p-6 relative space-y-6"
          >
            <button
              onClick={() => {
                setActiveRequest(null)
                setModalErrorMsg(null)
                setModalSuccessMsg(null)
              }}
              className="absolute top-4 right-4 p-1 hover:bg-muted rounded-full"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            <div>
              <h3 className="font-serif text-xl font-bold text-foreground">Submit Price Quote</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Enter your proposal details for this garment design.
              </p>
            </div>

            {modalSuccessMsg && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 text-xs rounded-2xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{modalSuccessMsg}</span>
              </div>
            )}

            {modalErrorMsg && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-2xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleQuoteSubmit} className="space-y-4">
              <div>
                <label htmlFor="price" className="block text-xs font-semibold text-foreground mb-1">
                  Quote Price (₹)
                </label>
                <input
                  id="price"
                  type="number"
                  required
                  value={quotePrice}
                  onChange={(e) => setQuotePrice(e.target.value)}
                  placeholder="e.g. 240"
                  className="w-full h-10 px-3 border border-border rounded-2xl bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="days" className="block text-xs font-semibold text-foreground mb-1">
                  Estimated Delivery (days)
                </label>
                <input
                  id="days"
                  type="number"
                  required
                  value={quoteDays}
                  onChange={(e) => setQuoteDays(e.target.value)}
                  placeholder="e.g. 14"
                  className="w-full h-10 px-3 border border-border rounded-2xl bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="note" className="block text-xs font-semibold text-foreground mb-1">
                  Proposing Notes
                </label>
                <textarea
                  id="note"
                  value={quoteNote}
                  onChange={(e) => setQuoteNote(e.target.value)}
                  placeholder="Tell the client about your fabric selections, fitting adjustments, etc..."
                  rows={3}
                  className="w-full p-3 border border-border rounded-2xl bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmittingQuote}
                  className="w-full bg-primary text-primary-foreground font-semibold h-11 rounded-2xl shadow-sm"
                >
                  {isSubmittingQuote ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Send Proposal
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
