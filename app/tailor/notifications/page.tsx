"use client"

import * as React from "react"
import { realtimeService } from "@/lib/supabase/realtime"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import {
  Bell,
  CheckCheck,
  ExternalLink,
  Loader2,
  AlertCircle,
  BellOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface Notification {
  id: string
  message: string
  link: string
  read: boolean
  created_at: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function getNotifIcon(message: string) {
  const lower = message.toLowerCase()
  if (lower.includes("quote") || lower.includes("quotation")) {
    return (
      <div className="w-10 h-10 border border-border/40 rounded-full flex items-center justify-center shrink-0 bg-muted/20">
        <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
    )
  }
  if (lower.includes("ship") || lower.includes("deliver") || lower.includes("shipped")) {
    return (
      <div className="w-10 h-10 border border-border/40 rounded-full flex items-center justify-center shrink-0 bg-muted/20">
        <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path d="M1 3h15v13H1zm15 4h4l3 3v6h-7V7z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      </div>
    )
  }
  if (lower.includes("message") || lower.includes("chat")) {
    return (
      <div className="w-10 h-10 border border-border/40 rounded-full flex items-center justify-center shrink-0 bg-muted/20">
        <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
    )
  }
  if (lower.includes("order") || lower.includes("paid") || lower.includes("payment") || lower.includes("escrow")) {
    return (
      <div className="w-10 h-10 border border-border/40 rounded-full flex items-center justify-center shrink-0 bg-muted/20">
        <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    )
  }
  return (
    <div className="w-10 h-10 border border-border/40 rounded-full flex items-center justify-center shrink-0 bg-muted/20">
      <Bell className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
    </div>
  )
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visible: (i: number): any => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  }),
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
}

export default function TailorNotificationsPage() {

  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [isMarkingAll, setIsMarkingAll] = React.useState(false)
  const [filter, setFilter] = React.useState<"all" | "unread">("all")

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(Array.isArray(data) ? data : [])
        setErrorMsg(null)
      } else {
        setErrorMsg("Failed to load notifications.")
      }
    } catch {
      setErrorMsg("Could not reach the server. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchNotifications()

    // Use the shared singleton realtimeService instead of a per-mount random channel.
    const unsubscribe = realtimeService?.subscribeToFeature(
      "notifications",
      "notifications",
      () => { fetchNotifications() }
    )

    return () => {
      unsubscribe?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchNotifications])

  const markRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      })
    } catch {
      // silently fail fallback
    }
  }

  const markAllRead = async () => {
    setIsMarkingAll(true)
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      }
    } catch {
      // fallback
    } finally {
      setIsMarkingAll(false)
    }
  }

  const filteredNotifs = filter === "unread"
    ? notifications.filter(n => !n.read)
    : notifications

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Updates on orders, client messages, and your atelier activity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {notifications.length > 0 && notifications.some(n => !n.read) && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllRead}
              disabled={isMarkingAll}
              className="rounded-full text-xs font-semibold"
            >
              {isMarkingAll ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <CheckCheck className="w-3 h-3 mr-2" />}
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2 border-b border-border/40 pb-4">
        <button
          onClick={() => setFilter("all")}
          className={`text-sm font-semibold px-4 py-1.5 rounded-full transition-colors ${filter === "all" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
            }`}
        >
          All Activity
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`text-sm font-semibold px-4 py-1.5 rounded-full transition-colors ${filter === "unread" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
            }`}
        >
          Unread
          {notifications.filter(n => !n.read).length > 0 && (
            <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${filter === "unread" ? "bg-background/20 text-background" : "bg-primary/10 text-primary"}`}>
              {notifications.filter(n => !n.read).length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {errorMsg && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-center gap-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-4 p-4 border border-border/40 rounded-2xl bg-card">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 px-4 border border-border/40 border-dashed rounded-3xl bg-muted/10">
            <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
              <BellOff className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <h3 className="font-serif text-lg font-bold text-foreground">You&apos;re all caught up</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-[250px]">
              {filter === "unread" ? "No new unread notifications." : "When you receive messages or order updates, they will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredNotifs.map((n, i) => (
                <motion.div
                  key={n.id}
                  custom={i}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  className={`group relative flex items-start gap-4 p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${n.read
                    ? "bg-card border-border/40"
                    : "bg-background border-primary/20 shadow-sm"
                    }`}
                >
                  {/* Unread Indicator dot */}
                  {!n.read && (
                    <div className="absolute top-5 right-5 w-2 h-2 rounded-full bg-primary" />
                  )}

                  {getNotifIcon(n.message)}

                  <div className="flex-1 min-w-0 pr-6">
                    <p className={`text-sm ${n.read ? "text-foreground font-medium" : "text-foreground font-bold"} leading-relaxed`}>
                      {n.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {timeAgo(n.created_at)}
                      </span>
                      {n.link && (
                        <a
                          href={n.link}
                          onClick={() => {
                            if (!n.read) markRead(n.id)
                          }}
                          className="inline-flex items-center text-xs font-semibold text-primary hover:underline"
                        >
                          View Details <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      )}
                    </div>
                  </div>

                  {!n.read && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="absolute bottom-3 right-3 p-2 rounded-full hover:bg-muted text-primary sm:hidden"
                      aria-label="Mark as read"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
