"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { motion } from "framer-motion"
import {
  Scissors,
  FileText,
  Package,
  FolderKanban,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  Bell,
} from "lucide-react"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { NotificationsBell } from "@/components/shared/NotificationsBell"
import { EditProfileModal } from "@/components/shared/EditProfileModal"
import { Button } from "@/components/ui/button"

export default function TailorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [tailorName, setTailorName] = React.useState("Master Tailor")
  const [tailorPhoto, setTailorPhoto] = React.useState<string | null>(null)
  const [tailorBio, setTailorBio] = React.useState("")
  const [lastChangedAt, setLastChangedAt] = React.useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [userId, setUserId] = React.useState<string | null>(null)
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [notifUnreadCount, setNotifUnreadCount] = React.useState(0)

  const fetchNotifCount = React.useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count")
      if (res.ok) {
        const data = await res.json()
        setNotifUnreadCount(data.count ?? 0)
      }
    } catch { /* silently fail */ }
  }, [])

  React.useEffect(() => {
    let active = true
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (active && user) {
        setUserId(user.id)
        
        // Fetch base user name
        const { data: baseProfile } = await supabase
          .from("users")
          .select("name, bio, display_name_changed_at, avatar_url")
          .eq("id", user.id)
          .single()

        // Fetch tailor-specific profile info
        const { data: tailorProfile } = await supabase
          .from("tailor_profiles")
          .select("boutique_name, profile_photo_url")
          .eq("user_id", user.id)
          .single()

        if (active) {
          const finalName = tailorProfile?.boutique_name || baseProfile?.name || "Master Tailor"
          setTailorName(finalName)
          setTailorPhoto(baseProfile?.avatar_url || tailorProfile?.profile_photo_url || null)
          setTailorBio(baseProfile?.bio || "")
          setLastChangedAt(baseProfile?.display_name_changed_at || null)
        }
      }
    }
    fetchProfile()
    fetchNotifCount()

    window.addEventListener("tailor-profile-updated", fetchProfile)

    return () => {
      active = false
      window.removeEventListener("tailor-profile-updated", fetchProfile)
    }
  }, [supabase, fetchNotifCount])

  const fetchUnreadMessageCount = React.useCallback(async () => {
    if (!userId) return
    try {
      const { data: convs } = await supabase
        .from("conversations")
        .select("tailor_unread")
        .eq("tailor_id", userId)

      const totalUnread = convs?.reduce((sum, c) => sum + (c.tailor_unread || 0), 0) ?? 0
      setUnreadCount(totalUnread)
    } catch { /* silently fail */ }
  }, [supabase, userId])

  // Realtime subscription for unread messages badge and notifications
  React.useEffect(() => {
    if (!userId) return

    fetchUnreadMessageCount()

    // Listen for read events
    const handleMessagesRead = () => {
      fetchUnreadMessageCount()
    }
    window.addEventListener("messages-read", handleMessagesRead)

    // Realtime subscription for unread messages badge
    const messageChannelName = `global-tailor-messages-${userId}-${Math.random().toString(36).substring(7)}`
    const messageChannel = supabase
      .channel(messageChannelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations", filter: `tailor_id=eq.${userId}` },
        () => {
          fetchUnreadMessageCount()
        }
      )
      .subscribe()

    // Realtime subscription for notifications badge
    const notifChannelName = `global-tailor-notifs-${userId}-${Math.random().toString(36).substring(7)}`
    const notifChannel = supabase
      .channel(notifChannelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => {
          fetchNotifCount() // Re-fetch count when any notification changes for this user
        }
      )
      .subscribe()

    return () => {
      window.removeEventListener("messages-read", handleMessagesRead)
      supabase.removeChannel(messageChannel)
      supabase.removeChannel(notifChannel)
    }
  }, [supabase, userId, fetchNotifCount, fetchUnreadMessageCount])


  // Restructured Menu (Work, Communication, Account)
  const workItems = [
    { name: "Requests", href: "/tailor/requests", icon: Scissors },
    { name: "Price Quotes", href: "/tailor/quotations", icon: FileText },
    { name: "Orders", href: "/tailor/orders", icon: Package },
    { name: "Previous Work", href: "/tailor/portfolio", icon: FolderKanban },
  ]

  const commItems = [
    { name: "Messages", href: "/tailor/messages", icon: MessageSquare },
    { name: "Notifications", href: "/tailor/notifications", icon: Bell },
  ]

  const accountItems = [
    { name: "Settings", href: "/tailor/settings", icon: Settings },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  // Regex to match UUIDs: e.g. /tailor/123e4567-e89b-12d3-a456-426614174000
  const isTailorPublicProfile = /^\/tailor\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pathname)

  if (pathname === "/tailor/apply" || isTailorPublicProfile) {
    return <div className="min-h-screen bg-background">{children}</div>
  }

  const renderNavLinks = (items: typeof workItems) => (
    <div className="space-y-1.5">
      {items.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setMobileMenuOpen(false)}
            aria-current={isActive ? "page" : undefined}
            className={`group relative flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isActive
                ? "text-foreground font-bold"
                : "text-muted-foreground hover:text-foreground font-medium"
            }`}
          >
            {/* Active Indicator Line */}
            {isActive && (
              <motion.div
                layoutId="active-tailor-sidebar-nav"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            {/* Subtle Background Hover/Active */}
            {isActive && (
              <div className="absolute inset-0 bg-muted/30 rounded-lg pointer-events-none" />
            )}
            <div className="absolute inset-0 bg-muted/0 hover:bg-muted/30 rounded-lg transition-colors pointer-events-none group-hover:bg-muted/30" />
            
            <div className="flex items-center space-x-3 relative z-10">
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} aria-hidden="true" />
              <span className="tracking-wide">{item.name}</span>
            </div>
            
            <div className="flex items-center gap-2 relative z-10">
              {item.name === "Messages" && unreadCount > 0 && (
                <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
              {item.name === "Notifications" && notifUnreadCount > 0 && (
                <span className="bg-foreground text-background text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  {notifUnreadCount > 9 ? "9+" : notifUnreadCount}
                </span>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row md:h-screen md:overflow-hidden">
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
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Tailor Shop</span>
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
        aria-label="Tailor navigation"
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-background border-r border-border/40 flex flex-col justify-between transform md:translate-x-0 transition-transform duration-300 md:static md:h-full md:shrink-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Sidebar Brand header */}
          <div className="h-20 border-b border-border/40 items-center px-8 hidden md:flex justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/brand/threadify-logo.svg" alt="Threadify" width={140} height={36} className="h-7 w-auto dark:invert" />
            </Link>
          </div>

          {/* User info capsule (Elevated Editorial) */}
          <div className="p-8 pb-4">
            <div className="flex items-center space-x-4">
              {tailorPhoto ? (
                <div className="w-12 h-12 rounded-full overflow-hidden border border-primary/20 shadow-sm shrink-0">
                  <Image 
                    src={tailorPhoto} 
                    alt={tailorName} 
                    width={48} 
                    height={48} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-lg font-bold border border-primary/20 shadow-sm shrink-0"
                  aria-hidden="true"
                >
                  {tailorName.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground font-serif tracking-tight truncate">{tailorName}</p>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1 mt-1">
                  Tailor Shop
                </p>
              </div>
            </div>
            {tailorBio && (
              <p className="mt-4 text-xs text-muted-foreground line-clamp-3">
                {tailorBio}
              </p>
            )}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="mt-4 w-full px-3 py-1.5 text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors border border-border"
            >
              Edit Profile
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-4 py-2 space-y-6 overflow-y-auto" aria-label="Tailor workspace navigation">
            
            <div>
              <h3 className="px-4 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-2">Work</h3>
              {renderNavLinks(workItems)}
            </div>

            <div>
              <h3 className="px-4 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-2">Communication</h3>
              {renderNavLinks(commItems)}
            </div>

            <div>
              <h3 className="px-4 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-2">Account</h3>
              {renderNavLinks(accountItems)}
            </div>
            
          </nav>
        </div>

        {/* Sidebar Footer - Settings & Logout */}
        <div className="p-4 border-t border-border/40 space-y-4">
           <div className="flex items-center gap-2 px-4 justify-between">
              <ThemeToggle />
              <NotificationsBell align="left" side="top" />
           </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full flex items-center justify-start space-x-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium h-10 rounded-lg"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span className="tracking-wide text-sm">Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 min-h-[calc(100vh-4rem)] md:min-h-0 md:h-full bg-background relative overflow-y-auto"
      >
        <div className="p-6 md:p-10 container mx-auto max-w-5xl">
          {children}
        </div>
      </main>

      {userId && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          initialName={tailorName}
          initialBio={tailorBio}
          initialAvatar={tailorPhoto || ""}
          lastChangedAt={lastChangedAt}
          userId={userId}
        />
      )}
    </div>
  )
}
