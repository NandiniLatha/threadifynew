"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  UserCheck,
  Package,
  AlertTriangle,
  LogOut,
  Menu,
  X,
  Sparkles,
} from "lucide-react"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Button } from "@/components/ui/button"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [adminName, setAdminName] = React.useState("Admin Console")

  React.useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("name")
          .eq("id", user.id)
          .single()
        if (profile?.name) {
          setAdminName(profile.name)
        }
      }
    }
    fetchProfile()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const menuItems = [
    { name: "Tailor Verification", href: "/admin/tailor-verification", icon: UserCheck },
    { name: "All Orders", href: "/admin/orders", icon: Package },
    { name: "Disputes Board", href: "/admin/disputes", icon: AlertTriangle },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md h-16 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
            <Image src="/brand/threadify-logo.svg" alt="Threadify" width={140} height={36} className="h-8 w-auto dark:invert" />
            <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Admin</span>
          </Link>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 border border-border rounded-xl text-foreground hover:bg-muted"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-card border-r border-border flex flex-col justify-between transform md:translate-x-0 transition-transform duration-300 md:static ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col flex-1">
          {/* Sidebar Brand header */}
          <div className="h-16 border-b border-border items-center px-6 hidden md:flex justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/brand/threadify-logo.svg" alt="Threadify" width={140} height={36} className="h-8 w-auto dark:invert" />
            </Link>
            <ThemeToggle />
          </div>

          {/* User info capsule */}
          <div className="p-4 border-b border-border/60">
            <div className="flex items-center space-x-3 p-2 bg-muted/40 rounded-2xl border border-border/50">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center font-bold">
                {adminName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{adminName}</p>
                <p className="text-[10px] text-destructive font-semibold flex items-center gap-0.5 mt-0.5">
                  <Sparkles className="w-3 h-3 text-destructive" />
                  <span>Admin Authority</span>
                </p>
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.name}</span>
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
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-h-[calc(100vh-4rem)] md:min-h-screen bg-background relative overflow-y-auto z-10 p-6 md:p-10 container mx-auto max-w-5xl">
        {children}
      </main>
    </div>
  )
}

