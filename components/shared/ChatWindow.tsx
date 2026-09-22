"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Loader2,
  X,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface Message {
  id: string
  order_id: string
  sender_id: string
  content: string
  attachment_url?: string | null
  created_at: string
}

interface ChatWindowProps {
  orderId: string
  currentUserId: string
  placeholderText?: string
}

export function ChatWindow({
  orderId,
  currentUserId,
  placeholderText = "Write your message...",
}: ChatWindowProps) {
  const supabase = createClient()
  
  const [messages, setMessages] = React.useState<Message[]>([])
  const [newMessage, setNewMessage] = React.useState("")
  const [attachment, setAttachment] = React.useState<string | null>(null)
  const [attachmentName, setAttachmentName] = React.useState("")
  const [isSending, setIsSending] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [sendError, setSendError] = React.useState<string | null>(null)
  const [announcement, setAnnouncement] = React.useState("")

  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Helper to mark conversation as read
  const markAsRead = React.useCallback(async () => {
    if (!orderId) return
    try {
      const res = await fetch("/api/messages/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      })
      if (res.ok) {
        window.dispatchEvent(new CustomEvent("messages-read", { detail: { orderId } }))
      }
    } catch {
      // Silently ignore network failures
    }
  }, [orderId])

  // 1. Load existing messages and subscribe to Supabase Realtime channel
  React.useEffect(() => {
    async function loadMessages() {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("id, order_id, sender_id, content, attachment_url, created_at")
          .eq("order_id", orderId)
          .order("created_at", { ascending: true })

        if (error) {
          throw new Error(error.message)
        }

        if (data) {
          setMessages(data)
          // Mark conversation read when messages load for active window
          markAsRead()
        }
      } catch (err) {
        console.error("Failed to load chat history", err)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadMessages()

    // Realtime Postgres-backed Channel subscription
    // Use a truly unique name so StrictMode rapid re-mounting doesn't reuse the same string
    const uniqueChannelName = `chat:${orderId}-${Math.random().toString(36).substring(2)}`
    const channel = supabase
      .channel(uniqueChannelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const msg = payload.new as Message
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          
          // Accessibility announcement & mark read if message is from chat partner
          if (msg.sender_id !== currentUserId) {
            setAnnouncement(`New message from partner: ${msg.content}`)
            markAsRead()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId, supabase, currentUserId, markAsRead])

  // Scroll to bottom on new messages
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Handle attachment upload
  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAttachmentName(file.name)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAttachment(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Send message handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!newMessage.trim() && !attachment) return

    setIsSending(true)
    setSendError(null)
    const contentToSend = newMessage.trim()
    const currentAttachment = attachment

    setNewMessage("")
    setAttachment(null)
    setAttachmentName("")

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          content: contentToSend,
          attachmentBase64: currentAttachment,
        }),
      })
      
      const responseJson = await res.json()
      
      if (!res.ok) {
        setSendError(responseJson.error || "Failed to send message. Please try again.")
        // Restore input
        setNewMessage(contentToSend)
        if (currentAttachment) {
          setAttachment(currentAttachment)
        }
      } else {
        // Immediately add the returned message to local state
        const sentMessage = responseJson.data
        if (sentMessage) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === sentMessage.id)) return prev
            return [...prev, sentMessage]
          })
        }
      }
    } catch {
      setSendError("Network error. Please check your connection and try again.")
      // Restore input
      setNewMessage(contentToSend)
      if (currentAttachment) {
        setAttachment(currentAttachment)
      }
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex flex-col max-h-[420px] bg-background overflow-hidden">
      {/* Screen Reader Live Announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {isLoading ? (
          <div className="space-y-5 py-2">
            <div className="flex items-start gap-2.5 max-w-[70%]">
              <Skeleton className="w-8 h-8 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-10 w-44 rounded-2xl rounded-tl-none" />
                <Skeleton className="h-3 w-8 rounded" />
              </div>
            </div>
            <div className="flex items-start gap-2.5 max-w-[70%] ml-auto justify-end">
              <div className="space-y-1.5 flex flex-col items-end flex-1">
                <Skeleton className="h-12 w-56 rounded-2xl rounded-tr-none" />
                <Skeleton className="h-3 w-8 rounded" />
              </div>
              <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            </div>
            <div className="flex items-start gap-2.5 max-w-[70%]">
              <Skeleton className="w-8 h-8 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-8 w-28 rounded-2xl rounded-tl-none" />
                <Skeleton className="h-3 w-8 rounded" />
              </div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10 space-y-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <p className="text-xs text-muted-foreground">No messages yet.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId
            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${
                  isMe ? "ml-auto items-end" : "mr-auto items-start"
                }`}
              >
                {/* Bubble content */}
                <div
                  className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted/50 text-foreground rounded-tl-sm border border-border/40"
                  }`}
                >
                  {msg.content}
                  
                  {msg.attachment_url && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-black/10 max-w-[200px] bg-black/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={msg.attachment_url} alt="Uploaded detail" className="w-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <span className="text-[10px] text-muted-foreground/60 mt-1 px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )
          })
        )}
        <div ref={scrollRef} />
      </div>

      {/* Attachment Previews */}
      {attachment && (
        <div className="px-4 py-2 border-t border-border bg-muted/40 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-foreground font-semibold">
            <ImageIcon className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate max-w-[250px]">{attachmentName}</span>
          </div>
          <button
            onClick={() => {
              setAttachment(null)
              setAttachmentName("")
            }}
            className="p-1 hover:bg-muted rounded-full"
            aria-label="Remove attachment preview"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Error state */}
      {sendError && (
        <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20 text-destructive text-xs font-semibold flex items-center justify-between">
          <span>{sendError}</span>
          <button 
            type="button" 
            onClick={() => handleSendMessage()} 
            className="underline underline-offset-2 hover:text-destructive/80"
          >
            Retry
          </button>
        </div>
      )}

      {/* Input panel form */}
      <form onSubmit={handleSendMessage} className="p-2 border-t border-border/40 bg-background flex items-center gap-2">
        <label className="p-1.5 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors shrink-0 text-muted-foreground hover:text-foreground">
          <input
            type="file"
            accept="image/*"
            onChange={handleAttachmentChange}
            className="hidden"
            aria-label="Add image attachment"
          />
          <Paperclip className="w-4 h-4" />
        </label>

        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={placeholderText}
          aria-label="Chat input message"
          className="flex-1 h-9 px-3 border border-border/50 rounded-lg bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
        />

        <Button
          type="submit"
          disabled={isSending || (!newMessage.trim() && !attachment)}
          className="bg-primary text-primary-foreground h-9 w-9 p-0 rounded-lg shrink-0 flex items-center justify-center transition-opacity disabled:opacity-50"
          aria-label="Send message button"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
        </Button>
      </form>
    </div>
  )
}
