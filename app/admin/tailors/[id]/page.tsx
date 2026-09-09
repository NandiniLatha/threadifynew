"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Scissors,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Mail,
  User,
  Briefcase,
  Image as ImageIcon,
  Package,
  FileText
} from "lucide-react"

export default function AdminTailorDetail() {
  const params = useParams()
  const router = useRouter()
  const tailorId = params.id as string
  const supabase = createClient()
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tailor, setTailor] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [metrics, setMetrics] = React.useState({ activeOrders: 0, activeRequests: 0 })

  React.useEffect(() => {
    async function fetchTailor() {
      setIsLoading(true)
      try {
        // Fetch User and Profile Data
        const { data, error } = await supabase
          .from("users")
          .select(`
            id, name, email,
            profile:tailor_profiles(
              bio, verification_status, mobile, gender, 
              boutique_name, profile_photo_url, portfolio_images
            ),
            experience:tailor_experience(total_years),
            portfolio_items:tailor_portfolio_items(public_url)
          `)
          .eq("id", tailorId)
          .eq("role", "tailor")
          .single()

        if (error || !data) {
          throw new Error("Tailor not found or inaccessible.")
        }

        // Fetch Metrics
        // Active Orders (accepted quotations not yet delivered)
        const { count: activeOrdersCount } = await supabase
          .from("quotations")
          .select("id, request:design_requests!inner(status)", { count: "exact", head: true })
          .eq("tailor_id", tailorId)
          .eq("status", "accepted")
          .not("request.status", "eq", "delivered")

        // Active Requests (quotations made that are still pending/quoting)
        const { count: activeRequestsCount } = await supabase
          .from("quotations")
          .select("id, request:design_requests!inner(status)", { count: "exact", head: true })
          .eq("tailor_id", tailorId)
          .eq("status", "pending")
          .in("request.status", ["open", "quoting"])

        setTailor(data)
        setMetrics({
          activeOrders: activeOrdersCount || 0,
          activeRequests: activeRequestsCount || 0
        })

      } catch (err: any) {
        setErrorMsg(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    if (tailorId) fetchTailor()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tailorId])

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (errorMsg || !tailor) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.back()} className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Tailors
        </button>
        <div className="p-6 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-3xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMsg || "An error occurred."}</span>
        </div>
      </div>
    )
  }

  const profile = Array.isArray(tailor.profile) ? tailor.profile[0] : tailor.profile
  const experience = Array.isArray(tailor.experience) ? tailor.experience[0] : tailor.experience
  const portfolioItems = tailor.portfolio_items || []
  const legacyImages = profile?.portfolio_images || []
  const mergedPortfolio = Array.from(new Set([...legacyImages, ...portfolioItems.map((p: any) => p.public_url)]))

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button onClick={() => router.push("/admin/tailors")} className="flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
        </button>
        
        {profile?.verification_status === "pending" && (
          <Link href="/admin/tailor-verification">
            <button className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors shadow-sm">
              Review Application
            </button>
          </Link>
        )}
      </div>

      {/* Main Profile Header */}
      <div className="bg-card border border-border p-6 sm:p-10 rounded-3xl shadow-sm flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
        
        <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-5">
          <Scissors className="w-64 h-64" />
        </div>

        {profile?.profile_photo_url ? (
          <div className="relative w-32 h-32 rounded-3xl overflow-hidden border-4 border-background shadow-md shrink-0">
            <Image 
              src={profile.profile_photo_url} 
              alt={tailor.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-32 h-32 rounded-3xl bg-primary/10 text-primary flex items-center justify-center font-bold text-4xl shadow-md shrink-0">
            {tailor.name.charAt(0)}
          </div>
        )}

        <div className="space-y-4 flex-1 relative z-10">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">
              {profile?.boutique_name || tailor.name}
            </h1>
            <p className="text-muted-foreground mt-1 text-lg">
              {profile?.boutique_name ? tailor.name : "Independent Tailor"}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl text-sm font-bold bg-muted text-foreground">
              <Briefcase className="w-4 h-4" />
              {experience?.total_years ? `${experience.total_years} Years Experience` : "Experience not listed"}
            </span>
            
            {profile?.verification_status === "approved" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-sm font-bold bg-green-500/10 text-green-600 dark:text-green-400 uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" /> Verified
              </span>
            )}
            {profile?.verification_status === "pending" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-sm font-bold bg-amber-500/10 text-amber-600 dark:text-amber-500 uppercase tracking-wider">
                <Clock className="w-4 h-4" /> Pending Verification
              </span>
            )}
            {profile?.verification_status === "rejected" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-sm font-bold bg-red-500/10 text-red-600 dark:text-red-400 uppercase tracking-wider">
                <XCircle className="w-4 h-4" /> Rejected
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Details & Stats */}
        <div className="space-y-8 lg:col-span-1">
          
          {/* Contact Details */}
          <div className="bg-card border border-border p-6 rounded-3xl shadow-sm space-y-6">
            <h3 className="font-serif text-xl font-bold text-foreground">Contact & Identity</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-foreground">{tailor.email}</span>
              </div>
              
              {profile?.mobile && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-foreground">{profile.mobile}</span>
                </div>
              )}
              
              {profile?.gender && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-foreground capitalize">{profile.gender.replace("_", " ")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Platform Activity */}
          <div className="bg-card border border-border p-6 rounded-3xl shadow-sm space-y-6">
            <h3 className="font-serif text-xl font-bold text-foreground">Platform Activity</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 text-center">
                <Package className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-foreground">{metrics.activeOrders}</p>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-1">Active Orders</p>
              </div>
              <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 text-center">
                <FileText className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-foreground">{metrics.activeRequests}</p>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-1">Active Bids</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Bio & Portfolio */}
        <div className="space-y-8 lg:col-span-2">
          
          <div className="bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-serif text-xl font-bold text-foreground">Biography & About</h3>
            {profile?.bio ? (
              <div className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                {profile.bio}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No biography provided.</p>
            )}
          </div>

          <div className="bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-muted-foreground" /> Portfolio Items
              </h3>
              <span className="text-xs font-bold bg-muted px-2 py-1 rounded-full">{mergedPortfolio.length}</span>
            </div>

            {mergedPortfolio.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-border rounded-2xl">
                <p className="text-sm text-muted-foreground">This tailor has not uploaded any portfolio items.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {mergedPortfolio.map((url, i) => (
                  <div key={i} className="aspect-square relative rounded-2xl overflow-hidden border border-border bg-muted group">
                    {/* Fallback pattern if image is missing/broken */}
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground opacity-20 group-hover:opacity-10 transition-opacity">
                      <Scissors className="w-12 h-12" />
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url as string}
                      alt={`Portfolio item ${i + 1}`}
                      className="w-full h-full object-cover relative z-10 transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
