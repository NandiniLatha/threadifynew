"use client"

import * as React from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  Users,
  Scissors,
  UserCheck,
  Package,
  FileText,
  AlertCircle,
  Loader2,
  ArrowRight,
  Clock
} from "lucide-react"

export default function AdminDashboard() {
  const supabase = createClient()
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  const [metrics, setMetrics] = React.useState({
    customers: 0,
    tailors: 0,
    pendingVerifications: 0,
    activeRequests: 0,
    activeOrders: 0,
    openDisputes: 0,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recentActivity, setRecentActivity] = React.useState<any[]>([])

  React.useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true)
      try {
        // 1. Customers count
        const { count: customersCount, error: cErr } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("role", "customer")

        if (cErr) throw cErr

        // 2. Tailors count
        const { count: tailorsCount, error: tErr } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("role", "tailor")

        if (tErr) throw tErr

        // 3. Pending Verifications count
        const { count: pendingCount, error: pErr } = await supabase
          .from("tailor_profiles")
          .select("*", { count: "exact", head: true })
          .eq("verification_status", "pending")

        if (pErr) throw pErr

        // 4. Active Requests count
        const { count: requestsCount, error: rErr } = await supabase
          .from("design_requests")
          .select("*", { count: "exact", head: true })
          .in("status", ["open", "quoting"])

        if (rErr) throw rErr

        // 5. Active Orders count (assuming anything not delivered/cancelled)
        const { count: ordersCount, error: oErr } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .not("status", "eq", "delivered")

        if (oErr) throw oErr

        // 6. Open Disputes count
        const { count: disputesCount, error: dErr } = await supabase
          .from("disputes")
          .select("*", { count: "exact", head: true })
          .eq("status", "open")

        if (dErr) throw dErr

        // 7. Recent Activity (Recent Design Requests)
        const { data: recentRequests, error: rrErr } = await supabase
          .from("design_requests")
          .select(`
            id,
            title,
            status,
            created_at,
            customer:users!customer_id(name)
          `)
          .order("created_at", { ascending: false })
          .limit(5)

        if (rrErr) throw rrErr

        setMetrics({
          customers: customersCount || 0,
          tailors: tailorsCount || 0,
          pendingVerifications: pendingCount || 0,
          activeRequests: requestsCount || 0,
          activeOrders: ordersCount || 0,
          openDisputes: disputesCount || 0,
        })
        setRecentActivity(recentRequests || [])

      } catch (err: any) {
        setErrorMsg(err.message || "Failed to load dashboard data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="p-6 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-3xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <span>{errorMsg}</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Command Center</h1>
        <p className="text-sm text-muted-foreground mt-1">
          High-level operational overview of the Threadify platform.
        </p>
      </div>

      {metrics.pendingVerifications > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-sm">
              {metrics.pendingVerifications} Tailor Application{metrics.pendingVerifications !== 1 && "s"} Awaiting Review
            </span>
          </div>
          <Link href="/admin/tailor-verification" className="shrink-0">
            <button className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors">
              Review Now
            </button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-5 rounded-3xl shadow-sm flex flex-col">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground">Total Customers</p>
            <div className="p-2 bg-primary/10 rounded-xl">
              <Users className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-4 text-foreground">{metrics.customers}</p>
        </div>

        <Link href="/admin/disputes" className="bg-card border border-border p-5 rounded-3xl shadow-sm flex flex-col hover:border-destructive/50 transition-colors group">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground group-hover:text-destructive transition-colors">Open Disputes</p>
            <div className="p-2 bg-destructive/10 rounded-xl">
              <AlertCircle className="w-4 h-4 text-destructive" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-4 text-foreground">{metrics.openDisputes}</p>
        </Link>

        <div className="bg-card border border-border p-5 rounded-3xl shadow-sm flex flex-col">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground">Total Tailors</p>
            <div className="p-2 bg-primary/10 rounded-xl">
              <Scissors className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-4 text-foreground">{metrics.tailors}</p>
        </div>

        <Link href="/admin/orders" className="bg-card border border-border p-5 rounded-3xl shadow-sm flex flex-col hover:border-primary/50 transition-colors group">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground group-hover:text-primary transition-colors">Active Requests</p>
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <FileText className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-4 text-foreground">{metrics.activeRequests}</p>
        </Link>

        <Link href="/admin/orders" className="bg-card border border-border p-5 rounded-3xl shadow-sm flex flex-col hover:border-primary/50 transition-colors group">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground group-hover:text-primary transition-colors">Active Orders</p>
            <div className="p-2 bg-green-500/10 rounded-xl">
              <Package className="w-4 h-4 text-green-500" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-4 text-foreground">{metrics.activeOrders}</p>
        </Link>
      </div>

      <div className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-bold text-foreground">Recent Requests</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        {recentActivity.length === 0 ? (
          <div className="bg-card border border-border border-dashed p-8 rounded-3xl text-center text-muted-foreground text-sm">
            No recent activity found.
          </div>
        ) : (
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="divide-y divide-border">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-xl">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{activity.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        by {activity.customer?.name || "Unknown"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondary text-secondary-foreground">
                      {activity.status.replace("_", " ")}
                    </span>
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground w-28 justify-end">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(activity.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
