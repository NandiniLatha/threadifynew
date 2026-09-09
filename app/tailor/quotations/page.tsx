"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
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
  Edit2,
  Undo2,
  Tag,
  ArrowRight,
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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  pending:   { label: "Pending Client",  color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", Icon: Clock },
  accepted:  { label: "Price Accepted", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", Icon: CheckCircle },
  rejected:  { label: "Quote Declined", color: "text-destructive", bg: "bg-destructive/10 border-destructive/20", Icon: XCircle },
  withdrawn: { label: "Withdrawn by You", color: "text-muted-foreground", bg: "bg-muted border-border", Icon: Undo2 },
}

export default function TailorQuotations() {
  const supabase = createClient()
  const [quotations, setQuotations] = React.useState<PriceQuote[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<"pending" | "past">("pending")

  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editPrice, setEditPrice] = React.useState("")
  const [editDays, setEditDays] = React.useState("")
  const [editNote, setEditNote] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)

  const startEdit = (q: PriceQuote) => {
    setEditingId(q.id)
    setEditPrice(q.price.toString())
    setEditDays(q.estimatedDays.toString())
    setEditNote(q.note)
  }

  const saveEdit = async () => {
    if (!editingId) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/quotations/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: editPrice, estimatedDays: editDays, note: editNote })
      })
      if (res.ok) {
        setQuotations(prev => prev.map(q => q.id === editingId ? { ...q, price: Number(editPrice), estimatedDays: Number(editDays), note: editNote } : q))
        setEditingId(null)
      } else {
        const data = await res.json()
        alert(data.error || "Failed to update quote")
      }
    } catch {
      alert("Network error")
    } finally {
      setIsSaving(false)
    }
  }

  const handleWithdraw = async (id: string) => {
    if (!window.confirm("Are you sure you want to withdraw this quote?")) return
    try {
      const res = await fetch(`/api/quotations/${id}/withdraw`, { method: "POST" })
      if (res.ok) {
        setQuotations(prev => prev.map(q => q.id === id ? { ...q, status: "withdrawn" } : q))
      } else {
        const data = await res.json()
        alert(data.error || "Failed to withdraw quote.")
      }
    } catch {
      alert("Network error.")
    }
  }

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
            garmentName: req?.ai_tags?.[0] || "Custom Clothing",
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

  const pendingQuotes = quotations.filter(q => q.status === "pending")
  const pastQuotes = quotations.filter(q => q.status !== "pending")
  const displayedQuotes = activeTab === "pending" ? pendingQuotes : pastQuotes

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">My Proposals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track the status of your submitted price quotes to clients.
        </p>
      </div>

      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("pending")}
          className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "pending"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Pending Review ({pendingQuotes.length})
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors ml-4 ${
            activeTab === "past"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Past Quotes ({pastQuotes.length})
        </button>
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
      ) : displayedQuotes.length === 0 ? (
        <div className="text-center py-24 bg-card border border-border border-dashed rounded-[2rem] space-y-4">
          <FileText className="w-12 h-12 text-muted-foreground/45 mx-auto" aria-hidden="true" />
          <h2 className="text-lg font-bold text-foreground">
            No {activeTab === "pending" ? "pending" : "past"} quotes.
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {activeTab === "pending" 
              ? "Browse open design requests and submit a quote to win a client." 
              : "Quotes that have been accepted, declined, or withdrawn will appear here."}
          </p>
          {activeTab === "pending" && (
            <Link href="/tailor/requests">
              <button className="mt-4 h-11 px-6 bg-primary text-primary-foreground font-semibold rounded-2xl shadow-sm text-sm hover:opacity-90 transition-opacity">
                View Open Requests
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {displayedQuotes.map((q) => {
            const cfg = STATUS_CONFIG[q.status] || STATUS_CONFIG.pending
            const StatusIcon = cfg.Icon
            const isEditing = editingId === q.id
            
            return (
              <div
                key={q.id}
                className="bg-card border border-border rounded-[2rem] p-6 shadow-sm flex flex-col md:flex-row gap-6 hover:border-primary/20 transition-colors relative overflow-hidden group"
              >
                {/* Thumbnail */}
                {q.image_url && (
                  <div className="w-full md:w-32 h-40 md:h-32 rounded-2xl overflow-hidden border border-border bg-muted shrink-0 relative">
                    <Image
                      src={q.image_url}
                      alt={`${q.garmentName} design`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                      <Link href={`/tailor/requests/${q.requestId}`} className="hover:underline hover:text-primary transition-colors">
                         <h2 className="text-lg font-bold text-foreground font-serif">{q.garmentName}</h2>
                      </Link>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 shrink-0 ${cfg.bg} ${cfg.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" />
                        {cfg.label}
                      </span>
                    </div>

                    {!isEditing && q.note && (
                      <p className="text-sm text-muted-foreground leading-relaxed italic line-clamp-2">
                        &ldquo;{q.note}&rdquo;
                      </p>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-4 mt-6 bg-muted/30 p-5 rounded-2xl border border-border/50">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price (₹)</label>
                          <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="w-full h-10 px-3 border border-border rounded-xl text-sm bg-background" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Delivery Days</label>
                          <input type="number" value={editDays} onChange={e => setEditDays(e.target.value)} className="w-full h-10 px-3 border border-border rounded-xl text-sm bg-background" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Note</label>
                        <textarea value={editNote} onChange={e => setEditNote(e.target.value)} className="w-full p-3 border border-border rounded-xl text-sm min-h-[80px] bg-background resize-none" />
                      </div>
                      <div className="flex gap-3 justify-end pt-2">
                        <button onClick={() => setEditingId(null)} className="px-5 h-10 text-sm font-semibold rounded-xl hover:bg-muted border border-transparent hover:border-border transition-colors">Cancel</button>
                        <button onClick={saveEdit} disabled={isSaving} className="px-5 h-10 text-sm font-semibold bg-primary text-primary-foreground rounded-xl shadow-sm flex items-center">
                          {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50 flex-wrap gap-4">
                      <div className="flex items-center gap-6 flex-wrap">
                        <div>
                           <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Offered Price</p>
                           <p className="font-bold text-foreground">{formatINR(q.price)}</p>
                        </div>
                        <div>
                           <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Timeline</p>
                           <p className="font-bold text-foreground flex items-center gap-1.5">
                             <Clock className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                             {q.estimatedDays} days
                           </p>
                        </div>
                        <div>
                           <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Submitted On</p>
                           <p className="font-medium text-foreground text-sm">{q.createdAt}</p>
                        </div>
                      </div>

                      {q.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEdit(q)} className="text-sm flex items-center gap-1.5 px-4 h-10 border border-border rounded-xl hover:bg-muted font-semibold transition-colors">
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                          <button onClick={() => handleWithdraw(q.id)} className="text-sm flex items-center gap-1.5 px-4 h-10 border border-destructive/20 text-destructive bg-destructive/5 rounded-xl hover:bg-destructive/10 font-semibold transition-colors">
                            <Undo2 className="w-4 h-4" />
                            Withdraw
                          </button>
                        </div>
                      )}
                      
                      {q.status !== "pending" && (
                         <Link href={`/tailor/requests/${q.requestId}`}>
                            <button className="text-sm flex items-center gap-1.5 text-primary font-semibold hover:underline">
                              View Request <ArrowRight className="w-4 h-4" />
                            </button>
                         </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

