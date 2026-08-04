"use client"

import * as React from "react"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface ChatButtonProps {
  tailorId: string
  existingOrderId: string | null
}

export function ChatButton({ tailorId, existingOrderId }: ChatButtonProps) {
  const router = useRouter()

  const handleChatClick = () => {
    if (existingOrderId) {
      router.push(`/dashboard/requests/${existingOrderId}`)
    } else {
      // No existing order yet, send to Custom Design
      router.push(`/design-studio?preferredTailor=${tailorId}`)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <Button 
        variant="outline" 
        className="flex items-center justify-center gap-2 h-11 px-6 rounded-2xl border-border bg-card shadow-sm hover:bg-muted w-full"
        onClick={handleChatClick}
      >
        <MessageSquare className="w-4 h-4" />
        <span>Chat with Tailor</span>
      </Button>
      {!existingOrderId && (
        <span className="text-[10px] text-muted-foreground mt-1 text-center">
          Chat unlocks once you start an order
        </span>
      )}
    </div>
  )
}
