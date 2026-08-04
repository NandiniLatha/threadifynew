"use client"

import * as React from "react"
import { Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface SaveTailorButtonProps {
  tailorId: string
  initialSaved: boolean
}

export function SaveTailorButton({ tailorId, initialSaved }: SaveTailorButtonProps) {
  const [saved, setSaved] = React.useState(initialSaved)
  const [loading, setLoading] = React.useState(false)
  const supabase = createClient()
  const router = useRouter()

  const toggleSave = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push(`/login?next=/tailor/${tailorId}`)
      return
    }

    if (saved) {
      await supabase
        .from("saved_tailors")
        .delete()
        .match({ customer_id: user.id, tailor_id: tailorId })
      setSaved(false)
    } else {
      await supabase
        .from("saved_tailors")
        .insert({ customer_id: user.id, tailor_id: tailorId })
      setSaved(true)
    }
    setLoading(false)
  }

  return (
    <Button 
      variant="outline" 
      className="flex items-center gap-2 h-11 px-6 rounded-2xl border-border bg-card shadow-sm hover:bg-muted"
      onClick={toggleSave}
      disabled={loading}
    >
      <Bookmark className={`w-4 h-4 ${saved ? "fill-primary text-primary" : "text-foreground"}`} />
      <span>{saved ? "Saved" : "Save Tailor"}</span>
    </Button>
  )
}
