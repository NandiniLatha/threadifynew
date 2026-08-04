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
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface AdminDispute {
  id: string
  order_id: string
  raised_by: string
  reason: string
  status: "open" | "resolved"
  admin_notes: string
  created_at: string
  raisedByName?: string
  raisedByEmail?: string
}

export default function AdminDisputes() {
  const supabase = createClient()

  const [disputes, setDisputes] = React.useState<AdminDispute[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  // Local state for updates
  const [adminNotesMap, setAdminNotesMap] = React.useState<Record<string, string>>({})
  const [isUpdating, setIsUpdating] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadDisputes() {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("disputes")
          .select("id, order_id, raised_by, reason, status, admin_notes, created_at")
          .eq("status", "open")

        if (error) {
          setErrorMsg(error.message)
        } else if (data && data.length > 0) {
          const disputesWithNames = await Promise.all(
            data.map(async (item: { id: string; order_id: string; raised_by: string; reason: string; status: "open" | "resolved"; admin_notes: string; created_at: string }) => {
              const { data: userData } = await supabase
                .from("users")
                .select("name, email")
                .eq("id", item.raised_by)
                .single()
              return {
                ...item,
                raisedByName: userData?.name || "Bespoke User",
                raisedByEmail: userData?.email || "user@workspace.com",
              }
            })
          )
          setDisputes(disputesWithNames)
          
          // Prepopulate notes map
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
    loadDisputes()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleResolve = async (disputeId: string) => {
    setIsUpdating(disputeId)
    setErrorMsg(null)

    const notes = adminNotesMap[disputeId] || ""

    try {
      const { error } = await supabase
        .from("disputes")
        .update({
          status: "resolved",
          admin_notes: notes,
        })
        .eq("id", disputeId)

      if (error) {
        setErrorMsg(error.message)
      } else {
        // Remove resolved dispute from UI list
        setDisputes((prev) => prev.filter((d) => d.id !== disputeId))
      }
    } catch {
      setErrorMsg("Failed to connect and resolve dispute.")
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
        <h1 className="font-serif text-3xl font-bold text-foreground">Disputes Resolution Workspace</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review customer and tailor complaints, append notes, and issue resolution flags.
        </p>
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
          <h2 className="text-lg font-bold text-foreground">No Disputes Open</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            All user-submitted disputes have been investigated and resolved.
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
                <span className="text-[10px] bg-destructive/10 text-destructive border border-destructive/20 font-bold px-2.5 py-0.5 rounded-full uppercase">
                  Open Issue
                </span>
              </div>

              {/* User details */}
              <div className="flex items-center gap-2 text-xs text-foreground/80 bg-muted/40 p-3 rounded-xl border border-border/60">
                <User className="w-4 h-4 text-primary" />
                <span className="font-bold">Raised By:</span>
                <span>{d.raisedByName} ({d.raisedByEmail})</span>
              </div>

              {/* Dispute statement */}
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Dispute Reason</h3>
                <p className="text-xs text-foreground leading-relaxed bg-destructive/5 p-4 border border-destructive/10 rounded-2xl">
                  {d.reason}
                </p>
              </div>

              {/* Notes Form */}
              <div className="space-y-3 pt-2">
                <div>
                  <label htmlFor={`notes-${d.id}`} className="block text-xs font-semibold text-foreground mb-1">
                    Resolution Admin Notes
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

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => handleResolve(d.id)}
                    disabled={isUpdating !== null}
                    className="bg-primary text-primary-foreground font-semibold h-11 px-6 rounded-2xl shadow-sm flex items-center gap-1.5"
                  >
                    {isUpdating === d.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>Resolve Dispute</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
