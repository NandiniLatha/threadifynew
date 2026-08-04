"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import {
  UserCheck,
  FileCheck,
  XCircle,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface TailorApplication {
  user_id: string
  bio: string
  verification_status: "pending" | "approved" | "rejected"
  verification_docs_url: string
  portfolio_images: string[]
  userName?: string
  userEmail?: string
}

export default function TailorVerification() {
  const supabase = createClient()
  
  const [applications, setApplications] = React.useState<TailorApplication[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  
  const [isUpdating, setIsUpdating] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadApplications() {
      setIsLoading(true)
      try {
        // Single join query — replaces the previous N+1 pattern where a separate
        // users lookup was made for each tailor_profile row.
        const { data, error } = await supabase
          .from("tailor_profiles")
          .select(`
            user_id,
            bio,
            verification_status,
            verification_docs_url,
            portfolio_images,
            user:users!user_id ( name, email )
          `)
          .eq("verification_status", "pending")

        if (error) {
          setErrorMsg(error.message)
        } else if (data && data.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped: TailorApplication[] = (data as any[]).map((item) => ({
            user_id:               item.user_id,
            bio:                   item.bio,
            verification_status:   item.verification_status,
            verification_docs_url: item.verification_docs_url,
            portfolio_images:      item.portfolio_images ?? [],
            userName:              item.user?.name  ?? "Tailor",
            userEmail:             item.user?.email ?? "—",
          }))
          setApplications(mapped)
        } else {
          setApplications([])
        }
      } catch {
        setErrorMsg("Failed to query pending applications.")
      } finally {
        setIsLoading(false)
      }
    }
    loadApplications()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUpdateStatus = async (userId: string, status: "approved" | "rejected") => {
    setIsUpdating(userId)
    setErrorMsg(null)

    try {
      const { error } = await supabase
        .from("tailor_profiles")
        .update({ verification_status: status })
        .eq("user_id", userId)

      if (error) {
        setErrorMsg(error.message)
      } else {
        // Remove from local list
        setApplications((prev) => prev.filter((app) => app.user_id !== userId))
      }
    } catch {
      setErrorMsg("Connection failure updating application status.")
    } finally {
      setIsUpdating(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Tailor Curation Queue</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review business records, biography write-ups, and portfolio images to approve network access.
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
      ) : applications.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border border-dashed rounded-3xl space-y-4">
          <UserCheck className="w-12 h-12 text-muted-foreground/45 mx-auto" />
          <h2 className="text-lg font-bold text-foreground">Curation Queue Clear</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            No pending tailor applications require review at this time.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map((app) => (
            <div key={app.user_id} className="bg-card border border-border rounded-3xl p-6 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 hover:border-primary/10 transition-colors">
              {/* Application Details */}
              <div className="lg:col-span-8 space-y-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-base font-bold text-foreground">{app.userName}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{app.userEmail}</p>
                  </div>
                  <span className="text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold px-2.5 py-0.5 rounded-full uppercase">
                    Pending
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Tailor Bio</h3>
                  <p className="text-xs text-foreground/80 leading-relaxed italic bg-muted/40 p-4 border border-border rounded-2xl">
                    &ldquo;{app.bio}&rdquo;
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Previous Work Highlights</h3>
                  {app.portfolio_images.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No portfolio work uploaded.</p>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {app.portfolio_images.map((src, i) => (
                        <div key={i} className="w-20 h-20 rounded-xl overflow-hidden border border-border bg-muted shrink-0 relative">
                          <Image src={src} alt="Previous Work thumbnail" fill sizes="80px" className="object-cover" loading="lazy" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Credentials Document</h3>
                  {app.verification_docs_url ? (
                    <a
                      href={app.verification_docs_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs font-semibold text-primary hover:underline gap-1 bg-primary/5 px-3 py-1.5 border border-primary/10 rounded-xl"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>View Credential Document</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No verification document uploaded.</p>
                  )}
                </div>
              </div>

              {/* Actions Side */}
              <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-border pt-6 lg:pt-0 lg:pl-8 flex flex-col justify-center gap-3">
                <Button
                  onClick={() => handleUpdateStatus(app.user_id, "approved")}
                  disabled={isUpdating !== null}
                  className="bg-primary text-primary-foreground font-semibold h-11 rounded-2xl shadow flex items-center justify-center gap-1.5 w-full"
                >
                  {isUpdating === app.user_id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>Accept Registration</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus(app.user_id, "rejected")}
                  disabled={isUpdating !== null}
                  className="border-border text-destructive hover:bg-destructive/10 hover:border-destructive/20 font-semibold h-11 rounded-2xl flex items-center justify-center gap-1.5 w-full"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Registration</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
