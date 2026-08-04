"use client"

import * as React from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
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
  if (lower.includes("quote") || lower.includes("quote") || lower.includes("quotation")) {
    return (
      <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
    )
  }
  if (lower.includes("ship") || lower.includes("deliver") || lower.includes("Shipped")) {
    return (
      <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M1 3h15v13H1zm15 4h4l3 3v6h-7V7z" /><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
      </div>
    )
  }
  if (lower.includes("message") || lower.includes("chat")) {
    return (
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
    )
  }
  if (lower.includes("order") || lower.includes("paid") || lower.includes("payment")) {
    return (
      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    )
  }
  return (
    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
      <Bell className="w-4 h-4 text-muted-foreground" />
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

export default function NotificationsPage() {
  
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
    // Prevents WebSocket channel proliferation on navigation.
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
      // Optimistic update — silently ignore failure
    }
  }

  const markAllRead = async () => {
    setIsMarkingAll(true)
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch {
      // silently fail
    } finally {
      setIsMarkingAll(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length
  const displayed = filter === "unread"
    ? notifications.filter((n) => !n.read)
    : notifications

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground flex items-center gap-3">
            <Bell className="w-7 h-7 text-primary" />
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stay updated on quotes, order progress, and messages.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            disabled={isMarkingAll}
            className="shrink-0 rounded-xl border-border font-semibold gap-2 h-9"
          >
            {isMarkingAll ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCheck className="w-3.5 h-3.5" />
            )}
            Mark all read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "unread"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              filter === tab
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
            }`}
          >
            {tab === "all" ? "All" : "Unread"}
            {tab === "unread" && unreadCount > 0 && (
              <span className="ml-2 text-[10px] bg-primary-foreground/20 px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-4 p-4 bg-card border border-border rounded-2xl">
              <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : errorMsg ? (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border border-dashed rounded-3xl space-y-4">
          <BellOff className="w-12 h-12 text-muted-foreground/45 mx-auto" />
          <h2 className="font-serif text-lg font-bold text-foreground">
            {filter === "unread" ? "All caught up!" : "No notifications yet"}
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            {filter === "unread"
              ? "You have no unread notifications at the moment."
              : "Quote quotes, order updates, and messages will appear here."}
          </p>
          {filter === "unread" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilter("all")}
              className="rounded-xl border-border font-semibold"
            >
              View all notifications
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {displayed.map((notif, i) => (
              <motion.div
                key={notif.id}
                custom={i}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className={`group flex items-start gap-4 p-4 rounded-2xl border transition-colors ${
                  notif.read
                    ? "bg-card border-border"
                    : "bg-primary/5 border-primary/20"
                }`}
              >
                {/* Icon */}
                {getNotifIcon(notif.message)}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm leading-relaxed ${
                      notif.read ? "text-muted-foreground" : "text-foreground font-medium"
                    }`}
                  >
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-[11px] text-muted-foreground">
                      {timeAgo(notif.created_at)}
                    </p>
                    {!notif.read && (
                      <span className="w-1.5 h-1.5 bg-primary rounded-full inline-block" />
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {notif.link && (
                    <Link
                      href={notif.link}
                      onClick={() => markRead(notif.id)}
                      className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      aria-label="Go to notification link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}
                  {!notif.read && (
                    <button
                      onClick={() => markRead(notif.id)}
                      className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      aria-label="Mark as read"
                      title="Mark as read"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Summary footer */}
          {notifications.length > 0 && (
            <div className="pt-4 text-center">
              <p className="text-xs text-muted-foreground">
                Showing {displayed.length} of {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
                {unreadCount === 0 && (
                  <span className="ml-1 inline-flex items-center gap-1 text-emerald-600 font-medium">
                    <CheckCheck className="w-3 h-3" /> All read
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
