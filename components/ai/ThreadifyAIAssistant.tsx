"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Role } from "@/lib/ai/provider"
import { AIAssistantFloatingButton } from "./AIAssistantFloatingButton"
import { AIChatPanel } from "./AIChatPanel"

interface ThreadifyAIAssistantProps {
  forcedRole?: Role
}

export function ThreadifyAIAssistant({ forcedRole }: ThreadifyAIAssistantProps) {
  const pathname = usePathname()
  const supabase = createClient()

  const [isOpen, setIsOpen] = React.useState(false)
  const [role, setRole] = React.useState<Role>(forcedRole || "customer")
  const [userName, setUserName] = React.useState<string>("User")

  React.useEffect(() => {
    if (forcedRole) {
      setRole(forcedRole)
      return
    }

    // Determine role from URL or Supabase user
    if (pathname.startsWith("/tailor")) {
      setRole("tailor")
    } else if (pathname.startsWith("/admin")) {
      setRole("admin")
    } else {
      setRole("customer")
    }

    async function fetchUserData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("name, role")
          .eq("id", user.id)
          .single()

        if (profile?.name) {
          setUserName(profile.name)
        }
        if (profile?.role) {
          setRole(profile.role as Role)
        }
      }
    }

    fetchUserData()
  }, [pathname, forcedRole, supabase])

  return (
    <>
      <AIAssistantFloatingButton
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      />

      <AIChatPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        role={role}
        userName={userName}
        currentPage={pathname}
      />
    </>
  )
}
