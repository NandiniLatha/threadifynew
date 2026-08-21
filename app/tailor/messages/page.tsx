"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { ChatWindow } from "@/components/shared/ChatWindow"
import {
  MessageSquare,
  Loader2,
  AlertCircle,
  Star,
  ChevronRight,
} from "lucide-react"

interface Conversation {
  orderId: string
  garmentName: string
  customerName: string
  image_url: string
  status: string
  lastActivity: string
}

export default function TailorMessages() {
  const supabase = createClient()
  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = React.useState<string>("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadConversations() {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setCurrentUserId(user.id)

        // Find orders where this tailor has an accepted quotation
        const { data: quotes, error } = await supabase
          .from("quotations")
          .select("request_id, status")
          .eq("tailor_id", user.id)
          .eq("status", "accepted")

        if (error || !quotes || quotes.length === 0) {
          // Mock fallback
          setConversations([
            {
              orderId: "req-demo-1",
              garmentName: "Vintage Wool Coat",
              customerName: "Sneha Patel",
              image_url: "/images/features/feature_3_secure.webp",
              status: "In Production",
              lastActivity: "Today",
            },
            {
              orderId: "req-demo-2",
              garmentName: "Silk Drape Blouse",
              customerName: "Riya Verma",
              image_url: "/images/fashion/bridal_blouse_2.webp",
              status: "Shipped",
              lastActivity: "Yesterday",
            },
          ])
          return
        }

        const requestIds = quotes.map((q) => q.request_id)
        const { data: requests } = await supabase
          .from("design_requests")
          .select("id, ai_tags, image_url, status, created_at, customer_id")
          .in("id", requestIds)

        if (!requests) return

        const customerIds = Array.from(new Set(requests.map((r) => r.customer_id)))
        const { data: customers } = await supabase
          .from("users")
          .select("id, name")
          .in("id", customerIds)

        const mapped: Conversation[] = requests.map((req) => {
          const customer = customers?.find((c) => c.id === req.customer_id)
          return {
            orderId: req.id,
            garmentName: req.ai_tags?.[0] || "Custom Garment",
            customerName: customer?.name || "Customer",
            image_url: req.image_url || "",
            status: req.status || "assigned",
            lastActivity: req.created_at?.split("T")[0] || "—",
          }
        })

        setConversations(mapped)
      } catch (err: any) {
        console.error("Tailor messages catch error:", err?.message || err)
        setErrorMsg("Failed to load conversations.")
      } finally {
        setIsLoading(false)
      }
    }
    loadConversations()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Customer Messages</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Chat with customers about sizing, fabric choices, and order updates.
        </p>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" aria-label="Loading conversations" />
        </div>
      ) : errorMsg ? (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-2xl flex items-start gap-3" role="alert">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border border-dashed rounded-3xl space-y-4">
          <MessageSquare className="w-12 h-12 text-muted-foreground/45 mx-auto" aria-hidden="true" />
          <h2 className="text-lg font-bold text-foreground">No Active Conversations</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Conversations appear here once a customer selects your quotation and initiates an order.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Conversation List */}
          <div className="lg:col-span-5 space-y-3" role="list" aria-label="Conversations">
            {conversations.map((conv) => (
              <div key={conv.orderId} role="listitem">
                <button
                  onClick={() => setSelectedOrderId(conv.orderId)}
                  aria-pressed={selectedOrderId === conv.orderId}
                  className={`w-full text-left bg-card border rounded-3xl p-4 flex items-center gap-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    selectedOrderId === conv.orderId
                      ? "border-primary/40 bg-primary/5"
                      : "border-border hover:border-primary/20"
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border border-border bg-muted shrink-0">
                    {conv.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={conv.image_url}
                        alt={`${conv.garmentName} thumbnail`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{conv.garmentName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" aria-hidden="true" />
                      {conv.customerName}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">{conv.lastActivity}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-7">
            {selectedOrderId ? (
              <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-3 h-full">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Order Chat — {conversations.find((c) => c.orderId === selectedOrderId)?.garmentName}
                </p>
                <ChatWindow orderId={selectedOrderId} currentUserId={currentUserId} />
              </div>
            ) : (
              <div className="bg-card border border-border border-dashed rounded-3xl h-64 flex flex-col items-center justify-center gap-3 text-center p-6">
                <MessageSquare className="w-10 h-10 text-muted-foreground/40" aria-hidden="true" />
                <p className="text-sm font-bold text-foreground">Select a conversation</p>
                <p className="text-xs text-muted-foreground">Choose an order from the list to open the chat workspace.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
