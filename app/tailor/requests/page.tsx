"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { formatINR } from "@/lib/utils/currency"
import {
  Scissors,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle,
  Tag,
  ArrowRight,
  Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

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
  const [quotedRequestIds, setQuotedRequestIds] = React.useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch open requests
        const { data: openRequests, error: reqError } = await supabase
          .from("design_requests")
          .select("id, image_url, ai_tags, budget_min, budget_max, deadline, notes")
          .eq("status", "pending_bids")
          .order("created_at", { ascending: false })

        if (reqError) throw reqError

        // Fetch my quotes to know which ones I've already quoted
        const { data: myQuotes, error: quoteError } = await supabase
          .from("quotations")
          .select("request_id")
          .eq("tailor_id", user.id)

        if (quoteError) throw quoteError

        setRequests(openRequests || [])
        setQuotedRequestIds(new Set(myQuotes?.map(q => q.request_id) || []))

      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load requests"
        setErrorMsg(message)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const unquotedRequests = requests.filter(r => !quotedRequestIds.has(r.id))
  const alreadyQuotedRequests = requests.filter(r => quotedRequestIds.has(r.id))

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Open Client Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review client requirements and submit your price quotations.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-[2rem] p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <Skeleton className="aspect-[4/5] w-full rounded-3xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-4/5 rounded" />
                </div>
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
        <div className="text-center py-20 bg-card border border-border border-dashed rounded-[2rem] space-y-4">
          <Scissors className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <h2 className="text-lg font-bold text-foreground">No open requests right now.</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Check back soon! New custom design requirements from clients will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-12">

          {/* New Opportunities */}
          {unquotedRequests.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-lg font-serif font-bold text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                New Opportunities
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {unquotedRequests.map((req) => (
                  <RequestCard key={req.id} req={req} isQuoted={false} />
                ))}
              </div>
            </div>
          )}

          {/* Already Quoted */}
          {alreadyQuotedRequests.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-lg font-serif font-bold text-muted-foreground border-b border-border pb-2">
                Already Quoted by You
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80">
                {alreadyQuotedRequests.map((req) => (
                  <RequestCard key={req.id} req={req} isQuoted={true} />
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

function RequestCard({ req, isQuoted }: { req: DesignRequest, isQuoted: boolean }) {
  return (
    <div className="bg-card border border-border hover:shadow-lg transition-all rounded-[2rem] p-4 flex flex-col justify-between group overflow-hidden relative">
      <div className="space-y-4">
        {/* Thumbnail */}
        <div className="aspect-[4/5] relative rounded-3xl overflow-hidden bg-muted">
          <Image
            src={req.image_url}
            alt="Design inspiration"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          {/* Budget overlay */}
          <div className="absolute bottom-3 left-3 right-3 bg-background/80 backdrop-blur-md rounded-2xl p-3 border border-border/50">
            <div className="flex justify-between items-center text-xs">
              <div>
                <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px] mb-0.5">Budget</p>
                <p className="font-bold text-foreground">{formatINR(req.budget_min)} - {formatINR(req.budget_max)}</p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px] mb-0.5">Deadline</p>
                <p className="font-bold text-foreground flex items-center justify-end gap-1">
                  <Calendar className="w-3 h-3" /> {req.deadline}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-1">
          {/* AI Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(req.ai_tags ?? []).slice(0, 3).map((tag, i) => (<span key={i} className="inline-flex items-center text-[10px] font-bold px-2 py-1 bg-muted text-foreground border border-border rounded-full">
              {tag}
            </span>
            ))}
            {req.ai_tags.length > 3 && (
              <span className="inline-flex items-center text-[10px] font-bold px-2 py-1 bg-muted/50 text-muted-foreground rounded-full">
                +{req.ai_tags.length - 3}
              </span>
            )}
          </div>

          {/* Notes Preview */}
          {req.notes ? (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed h-8">
              {req.notes}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/50 italic h-8">No notes provided</p>
          )}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-border px-1">
        {isQuoted ? (
          <Link href={`/tailor/quotations`}>
            <Button variant="secondary" className="w-full rounded-2xl h-11 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Quote Submitted
            </Button>
          </Link>
        ) : (
          <Link href={`/tailor/requests/${req.id}`}>
            <Button className="w-full bg-primary text-primary-foreground font-semibold h-11 rounded-2xl shadow-sm hover:opacity-90">
              View Details <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
