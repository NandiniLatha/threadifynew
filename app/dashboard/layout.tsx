"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  User,
  Scissors,
  Package,
  MessageSquare,
  Heart,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  Bell,
  Ruler,
} from "lucide-react"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { NotificationsBell } from "@/components/shared/NotificationsBell"
import { Button } from "@/components/ui/button"

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [userName, setUserName] = React.useState("Customer")
  const [userId, setUserId] = React.useState<string | null>(null)
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [notifUnreadCount, setNotifUnreadCount] = React.useState(0)

  React.useEffect(() => {
    let active = true
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (active && user) {
        setUserId(user.id)
        const { data: profile } = await supabase
          .from("users")
          .select("name")
          .eq("id", user.id)
          .single()
        if (active && profile?.name) {
          setUserName(profile.name)
        }
      }
    }
    fetchProfile()

    // Fetch notification unread count via lightweight endpoint (count query only —
    // no payload). Avoids duplicating the full fetch that NotificationsBell also makes.
    async function fetchNotifCount() {
      try {
        const res = await fetch("/api/notifications/unread-count")
        if (res.ok) {
          const data = await res.json()
          setNotifUnreadCount(data.count ?? 0)
        }
      } catch { /* silently fail */ }
    }
    fetchNotifCount()

    return () => {
      active = false
    }
  }, [supabase])

  // Realtime subscription for unread messages badge (depends on userId)
  React.useEffect(() => {
    if (!userId) return

    const uniqueChannelName = `global-customer-messages-${userId}-${Math.random().toString(36).substring(7)}`
    const channel = supabase
      .channel(uniqueChannelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const msg = payload.new as any
          if (msg.sender_id !== userId) {
            if (!window.location.pathname.includes("/messages") && !window.location.pathname.includes("/orders/")) {
              setUnreadCount((prev) => prev + 1)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, userId])


  const menuItems = [
    { name: "Overview", href: "/dashboard", icon: User },
    { name: "My Requests", href: "/dashboard/requests", icon: Scissors },
    { name: "Orders", href: "/dashboard/orders", icon: Package },
    { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
    { name: "Wishlist", href: "/dashboard/wishlist", icon: Heart },
    { name: "Measurements", href: "/dashboard/measurements", icon: Ruler },
    { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Skip to main content — accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-xl focus:font-semibold focus:text-sm"
      >
        Skip to main content
      </a>

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md h-16 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
            <Image src="/brand/threadify-logo.svg" alt="Threadify" width={140} height={36} className="h-8 w-auto dark:invert" />
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Studio</span>
          </Link>
        <div className="flex items-center space-x-2">
          <NotificationsBell />
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 border border-border rounded-xl text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <aside
        aria-label="Customer navigation"
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-card border-r border-border flex flex-col justify-between transform md:translate-x-0 transition-transform duration-300 md:static ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col flex-1">
          {/* Sidebar Brand header */}
          <div className="h-16 border-b border-border items-center px-6 hidden md:flex justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/brand/threadify-logo.svg" alt="Threadify" width={140} height={36} className="h-8 w-auto dark:invert" />
            </Link>
            <div className="flex items-center gap-2">
              <NotificationsBell />
              <ThemeToggle />
            </div>
          </div>

          {/* User info capsule */}
          <div className="p-4 border-b border-border/60">
            <div className="flex items-center space-x-3 p-2 bg-muted/40 rounded-2xl border border-border/50">
              <div
                className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold"
                aria-hidden="true"
              >
                {userName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{userName}</p>
                <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-0.5 mt-0.5">
                  <Sparkles className="w-3 h-3 text-rust" aria-hidden="true" />
                  <span>Customer Workspace</span>
                </p>
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Dashboard navigation">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                    <span>{item.name}</span>
                  </div>
                  {item.name === "Messages" && unreadCount > 0 && (
                    <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                  {item.name === "Notifications" && notifUnreadCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {notifUnreadCount > 9 ? "9+" : notifUnreadCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer - Logout */}
        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 border-border text-destructive hover:bg-destructive/10 hover:border-destructive/20 font-semibold h-11 rounded-2xl"
          >
            <LogOut className="w-5 h-5" aria-hidden="true" />
            <span>Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 min-h-[calc(100vh-4rem)] md:min-h-screen bg-background relative overflow-y-auto z-10"
      >
        {/* Visual background gradient elements */}
        <div className="absolute inset-0 z-0 opacity-5 pointer-events-none" aria-hidden="true">
          <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-radial from-rust/30 to-transparent blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-radial from-terracotta/30 to-transparent blur-3xl" />
        </div>
        <div className="relative z-10 p-6 md:p-10 container mx-auto max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  )
}

