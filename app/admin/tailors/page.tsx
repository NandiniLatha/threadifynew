"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import {
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Scissors,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
  ChevronRight
} from "lucide-react"

interface TailorRecord {
  id: string
  name: string
  email: string
  profile: {
    boutique_name: string | null
    verification_status: string
    profile_photo_url: string | null
  }
  experience: {
    total_years: number
  } | null
}

export default function AdminTailorsList() {
  const supabase = createClient()
  
  const [tailors, setTailors] = React.useState<TailorRecord[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("ALL")

  React.useEffect(() => {
    async function loadTailors() {
      setIsLoading(true)
      try {
        let query = supabase
          .from("users")
          .select(`
            id,
            name,
            email,
            profile:tailor_profiles(boutique_name, verification_status, profile_photo_url),
            experience:tailor_experience(total_years)
          `)
          .eq("role", "tailor")
          .order("created_at", { ascending: false })

        if (searchQuery.trim() !== "") {
          query = query.ilike("name", `%${searchQuery}%`)
        }

        const { data, error } = await query

        if (error) throw error

        let loadedTailors = (data as any[]).map(d => ({
          id: d.id,
          name: d.name,
          email: d.email,
          profile: Array.isArray(d.profile) ? d.profile[0] : d.profile,
          experience: Array.isArray(d.experience) ? d.experience[0] : d.experience
        }))

        if (statusFilter !== "ALL") {
          loadedTailors = loadedTailors.filter(t => 
            t.profile?.verification_status === statusFilter.toLowerCase()
          )
        }

        setTailors(loadedTailors || [])
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to load tailors.")
      } finally {
        setIsLoading(false)
      }
    }
    
    const delayDebounceFn = setTimeout(() => {
      loadTailors()
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter])

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-600 dark:text-green-400 uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </span>
        )
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 uppercase tracking-wider">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        )
      case "suspended":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            <AlertCircle className="w-3.5 h-3.5" />
            Suspended
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-500 uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        )
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Tailor Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage tailors, verify credentials, and review platform presence.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-card border border-border p-4 rounded-3xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by tailor name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                statusFilter === status
                  ? "bg-foreground text-background"
                  : "bg-background border border-border text-foreground hover:bg-muted"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Tailors List */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : tailors.length === 0 ? (
          <div className="text-center py-20 px-4 space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Scissors className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No tailors found</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                No tailors match your search criteria or the current filter selection.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {tailors.map((tailor) => (
              <div key={tailor.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-muted/50 transition-colors group">
                
                <div className="flex items-start sm:items-center gap-4">
                  {tailor.profile?.profile_photo_url ? (
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-background shrink-0">
                      <Image 
                        src={tailor.profile.profile_photo_url} 
                        alt={tailor.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl shrink-0">
                      {tailor.name.charAt(0)}
                    </div>
                  )}

                  <div className="space-y-1">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      {tailor.name}
                    </h3>
                    {tailor.profile?.boutique_name && (
                      <p className="text-sm font-semibold text-primary">
                        {tailor.profile.boutique_name}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {tailor.email}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Experience</span>
                    <span className="text-sm font-medium">
                      {tailor.experience?.total_years ? `${tailor.experience.total_years} years` : "Unknown"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 w-28">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Status</span>
                    <div>{getStatusBadge(tailor.profile?.verification_status)}</div>
                  </div>

                  <Link href={`/admin/tailors/${tailor.id}`}>
                    <button className="w-full sm:w-auto px-4 py-2.5 bg-background border border-border hover:border-primary text-foreground hover:text-primary rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 group-hover:shadow-sm">
                      View Details
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
