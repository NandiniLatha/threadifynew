"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { ChatWindow } from "@/components/shared/ChatWindow"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  MessageSquare,
  Star,
  AlertCircle,
  ChevronRight,
} from "lucide-react"

interface Conversation {
  orderId: string
  tailorName: string
  tailorRating: number
  garmentType: string
  image_url: string
  status: string
  lastActivity: string
}

const STATUS_LABEL: Record<string, string> = {
  paid:          "Paid",
  in_production: "In Production",
  shipped:       "Shipped",
  delivered:     "Delivered",
}

export default function CustomerMessages() {
  const supabase = createClient()
  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = React.useState<string>("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadConversations() {
      setIsLoading(true)
      setErrorMsg(null)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setCurrentUserId(user.id)

        // Fetch orders assigned to this customer that have an active tailor
        const { data: requests, error } = await supabase
          .from("design_requests")
          .select(`
            id,
            image_url,
            ai_tags,
            status,
            created_at,
            tailor:users!tailor_id (
              name,
              tailor_profiles ( avg_rating )
            )
          `)
          .eq("customer_id", user.id)
          .in("status", ["paid", "in_production", "shipped", "delivered"])
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Supabase Error loading messages:", error.message, error.details, error.hint)
          setErrorMsg("Could not load your conversations. Please refresh.")
          return
        }

        if (!requests || requests.length === 0) {
          setConversations([])
          return
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: Conversation[] = (requests as any[]).map((req) => ({
          orderId:     req.id,
          tailorName:  req.tailor?.name    ?? "Tailor",
          tailorRating: Number(req.tailor?.tailor_profiles?.[0]?.avg_rating ?? 5.0),
          garmentType: req.ai_tags?.[0]   ?? "Custom Garment",
          image_url:   req.image_url      ?? "",
          status:      req.status         ?? "paid",
          lastActivity: req.created_at
            ? new Date(req.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
            : "—",
        }))

        setConversations(mapped)
        // Auto-select the first conversation
        if (mapped.length > 0) setSelectedOrderId(mapped[0].orderId)
      } catch {
        setErrorMsg("An unexpected error occurred.")
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
        <h1 className="font-serif text-3xl font-bold text-foreground">Your Conversations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Direct message with your assigned tailors regarding designs, sizing updates, and deliveries.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[600px] rounded-3xl md:col-span-1" />
          <Skeleton className="h-[600px] rounded-3xl md:col-span-2" />
        </div>
      ) : errorMsg ? (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-2xl flex items-start gap-3" role="alert">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      ) : conversations.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-8 space-y-8 text-center max-w-3xl mx-auto shadow-sm">
          <div className="space-y-4">
            <MessageSquare className="w-12 h-12 text-primary/40 mx-auto" />
            <h2 className="font-serif text-2xl font-bold text-foreground">No conversations yet.</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Once a tailor accepts your request, you can start chatting here. Connect with one of our verified master tailors to discuss your custom design ideas.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {[
              { name: "Priya Sharma", specialty: "Bridal & Evening Wear", avatarBg: "from-rust/30 to-terracotta/30" },
              { name: "Vikram Singh", specialty: "Bespoke Menswear & Suiting", avatarBg: "from-thread-green/30 to-rust/20" },
              { name: "Anjali Desai", specialty: "Casual & Sustainable", avatarBg: "from-terracotta/40 to-thread-green/20" }
            ].map((tailor, idx) => (
              <Link key={idx} href="/explore" className="block p-4 rounded-2xl border border-border bg-muted/20 hover:bg-muted/50 hover:border-primary/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary group">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${tailor.avatarBg} flex items-center justify-center mb-3 border border-border/50`}>
                  <span className="font-serif text-xs font-bold text-foreground">
                    {tailor.name.split(" ").map(n => n[0]).join("")}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{tailor.name}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{tailor.specialty}</p>
              </Link>
            ))}
          </div>
          <div className="pt-2">
            <Link href="/explore" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl inline-block">
              <Button className="bg-primary text-primary-foreground font-semibold rounded-xl h-11 px-8 shadow-sm">
                View All Tailors
              </Button>
            </Link>
          </div>
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
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border border-border bg-muted shrink-0">
                    {conv.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={conv.image_url}
                        alt={`${conv.garmentType} thumbnail`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground truncate">{conv.tailorName}</h3>
                      <div className="flex items-center text-amber-500 text-[10px] shrink-0">
                        <Star className="w-3 h-3 fill-amber-500 mr-0.5" />
                        <span>{conv.tailorRating.toFixed(1)}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-primary font-semibold mt-0.5">{conv.garmentType}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {STATUS_LABEL[conv.status] ?? conv.status}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{conv.lastActivity}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              </div>
            ))}
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-7">
            {selectedOrderId && currentUserId ? (
              <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-3 h-full">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Order Chat —{" "}
                  {conversations.find((c) => c.orderId === selectedOrderId)?.garmentType}
                </p>
                <ChatWindow orderId={selectedOrderId} currentUserId={currentUserId} />
              </div>
            ) : (
              <div className="bg-card border border-border border-dashed rounded-3xl h-64 flex flex-col items-center justify-center gap-3 text-center p-6">
                <MessageSquare className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-sm font-bold text-foreground">Select a conversation</p>
                <p className="text-xs text-muted-foreground">
                  Choose an order from the list to open the chat workspace.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
