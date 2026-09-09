"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import {
  AlertTriangle,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileText,
  User,
  XCircle,
  Archive
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface AdminAudit {
  id: string
  action: string
  reason: string
  created_at: string
}

interface AdminDispute {
  id: string
  order_id: string
  raised_by: string
  reason: string
  status: "open" | "resolved" | "rejected" | "closed"
  admin_notes: string
  created_at: string
  raisedByName?: string
  raisedByEmail?: string
  history?: AdminAudit[]
}

type FilterType = "open" | "resolved" | "rejected" | "closed" | "all"

export default function AdminDisputes() {
  const supabase = createClient()

  const [disputes, setDisputes] = React.useState<AdminDispute[]>([])
  const [filter, setFilter] = React.useState<FilterType>("open")
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  const [adminNotesMap, setAdminNotesMap] = React.useState<Record<string, string>>({})
  const [isUpdating, setIsUpdating] = React.useState<string | null>(null)

  const loadDisputes = async () => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      let query = supabase
        .from("disputes")
        .select("id, order_id, raised_by, reason, status, admin_notes, created_at")
        .order("created_at", { ascending: false })
        
      if (filter !== "all") {
        query = query.eq("status", filter)
      }

      const { data, error } = await query

      if (error) {
        setErrorMsg(error.message)
      } else if (data && data.length > 0) {
        const disputesWithNames = await Promise.all(
          data.map(async (item: any) => {
            const { data: userData } = await supabase
              .from("users")
              .select("name, email")
              .eq("id", item.raised_by)
              .single()
              
            // Fetch audit history for this dispute
            const { data: historyData } = await supabase
              .from("admin_audit_logs")
              .select("id, action, reason, created_at")
              .eq("dispute_id", item.id)
              .order("created_at", { ascending: false })
              
            return {
              ...item,
              raisedByName: userData?.name || "Bespoke User",
              raisedByEmail: userData?.email || "user@workspace.com",
              history: historyData || []
            }
          })
        )
        setDisputes(disputesWithNames)
        
        const notes: Record<string, string> = {}
        disputesWithNames.forEach((d) => {
          notes[d.id] = d.admin_notes || ""
        })
        setAdminNotesMap(notes)
      } else {
        setDisputes([])
      }
    } catch {
      setErrorMsg("Failed to query disputes registry.")
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    loadDisputes()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const handleUpdate = async (disputeId: string, status?: "resolved" | "rejected" | "closed") => {
    setIsUpdating(disputeId)
    setErrorMsg(null)

    const notes = adminNotesMap[disputeId] || ""
    const actionReason = window.prompt("Enter an audit reason for this action:")

    if (actionReason === null) {
      setIsUpdating(null)
      return // User cancelled prompt
    }

    try {
      const payload: any = { adminNotes: notes, actionReason }
      if (status) payload.status = status

      const res = await fetch(`/api/admin/disputes/${disputeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Update failed")
      }
      
      // Refresh list to pull new audit logs and statuses
      await loadDisputes()
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update dispute.")
    } finally {
      setIsUpdating(null)
    }
  }

  const handleNoteChange = (disputeId: string, value: string) => {
    setAdminNotesMap((prev) => ({
      ...prev,
      [disputeId]: value,
    }))
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-3xl font-bold text-foreground">Disputes Resolution Workspace</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Investigate customer and tailor complaints, append notes, and issue resolution flags safely.
        </p>
      </div>
      
      <div className="flex gap-2 bg-muted/50 p-2 rounded-xl border border-border w-fit overflow-x-auto">
        <Button variant={filter === "open" ? "default" : "ghost"} size="sm" onClick={() => setFilter("open")}>Open</Button>
        <Button variant={filter === "resolved" ? "default" : "ghost"} size="sm" onClick={() => setFilter("resolved")}>Resolved</Button>
        <Button variant={filter === "rejected" ? "default" : "ghost"} size="sm" onClick={() => setFilter("rejected")}>Rejected</Button>
        <Button variant={filter === "closed" ? "default" : "ghost"} size="sm" onClick={() => setFilter("closed")}>Closed</Button>
        <Button variant={filter === "all" ? "default" : "ghost"} size="sm" onClick={() => setFilter("all")}>All</Button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : disputes.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border border-dashed rounded-3xl space-y-4">
          <AlertTriangle className="w-12 h-12 text-muted-foreground/45 mx-auto" />
          <h2 className="text-lg font-bold text-foreground">No Disputes Found</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            No disputes match the current filter.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {disputes.map((d) => (
            <div key={d.id} className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5 hover:border-primary/10 transition-colors">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold text-muted-foreground">Dispute ID: {d.id}</div>
                  <div className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Order Ref: {d.order_id}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${d.status === "open" ? "bg-destructive/10 text-destructive border-destructive/20" : d.status === "resolved" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted text-muted-foreground border-border"}`}>
                  {d.status}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-foreground/80 bg-muted/40 p-3 rounded-xl border border-border/60">
                <User className="w-4 h-4 text-primary" />
                <span className="font-bold">Raised By:</span>
                <span>{d.raisedByName} ({d.raisedByEmail})</span>
              </div>

              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Dispute Reason</h3>
                <p className="text-xs text-foreground leading-relaxed bg-destructive/5 p-4 border border-destructive/10 rounded-2xl">
                  {d.reason}
                </p>
              </div>
              
              {d.history && d.history.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Audit History</h3>
                  <div className="space-y-2">
                    {d.history.map(h => (
                      <div key={h.id} className="text-[11px] bg-muted/30 p-2 rounded-lg flex gap-2 border border-border/40">
                        <span className="text-muted-foreground whitespace-nowrap">{new Date(h.created_at).toLocaleString()}</span>
                        <span className="font-semibold text-primary">{h.action}</span>
                        <span className="text-muted-foreground">{h.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <div>
                  <label htmlFor={`notes-${d.id}`} className="block text-xs font-semibold text-foreground mb-1">
                    Internal Admin Notes
                  </label>
                  <textarea
                    id={`notes-${d.id}`}
                    rows={3}
                    placeholder="Enter details on investigation steps, refund splits, or communication with tailor..."
                    value={adminNotesMap[d.id] || ""}
                    onChange={(e) => handleNoteChange(d.id, e.target.value)}
                    className="w-full p-3 border border-border rounded-2xl bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary leading-relaxed"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <Button
                    onClick={() => handleUpdate(d.id)}
                    variant="outline"
                    disabled={isUpdating !== null}
                    className="h-10 px-4 rounded-xl text-xs font-semibold"
                  >
                    {isUpdating === d.id && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
                    Save Notes Only
                  </Button>
                  
                  <div className="flex flex-wrap gap-2">
                    {d.status !== "resolved" && (
                      <Button
                        onClick={() => handleUpdate(d.id, "resolved")}
                        disabled={isUpdating !== null}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-10 px-4 rounded-xl flex items-center gap-1.5 text-xs"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Resolve</span>
                      </Button>
                    )}
                    {d.status !== "rejected" && (
                      <Button
                        onClick={() => handleUpdate(d.id, "rejected")}
                        disabled={isUpdating !== null}
                        variant="destructive"
                        className="font-semibold h-10 px-4 rounded-xl flex items-center gap-1.5 text-xs"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </Button>
                    )}
                    {d.status !== "closed" && (
                      <Button
                        onClick={() => handleUpdate(d.id, "closed")}
                        disabled={isUpdating !== null}
                        variant="secondary"
                        className="font-semibold h-10 px-4 rounded-xl flex items-center gap-1.5 text-xs"
                      >
                        <Archive className="w-4 h-4" />
                        <span>Close</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
