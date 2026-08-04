"use client"

/**
 * AIChatPanel — Premium AI Copilot Chat Interface
 *
 * Uses Vercel AI SDK's useChat for real streaming.
 * Supports: markdown rendering, function-call navigation cards,
 * image upload (gpt-4o vision), voice input (Whisper),
 * Supabase conversation persistence, feedback (👍/👎),
 * keyboard shortcuts, and full accessibility.
 */

import * as React from "react"
import { useRouter } from "next/navigation"
import { useChat, type UIMessage } from "@ai-sdk/react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  Sparkles,
  Bot,
  Send,
  X,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Paperclip,
  Mic,
  MicOff,
  History,
  Plus,
  ImageIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { modalBackdrop, scaleIn } from "@/lib/variants"
import { Role } from "@/lib/ai/provider"
import { AIToolResultCard, type ToolResult } from "./AIToolResultCard"
import { AIConversationSidebar } from "./AIConversationSidebar"
import { useAIConversations } from "@/hooks/useAIConversations"


function getMessageText(msg: any): string {
  if (typeof getMessageText(msg) === 'string') return getMessageText(msg);
  if (Array.isArray(msg.parts)) {
    const textPart = msg.parts.find((p: any) => p.type === 'text');
    return textPart?.text || '';
  }
  return '';
}

interface AIChatPanelProps {
  isOpen: boolean
  onClose: () => void
  role: Role
  userName?: string
  userId?: string
  currentPage?: string
}

// ── Welcome message builder ───────────────────────────────────────────────────
function buildWelcomeContent(role: Role, userName: string): string {
  if (role === "tailor") {
    return `Welcome back, **${userName}**! 👋 I'm **Threadify AI**, your workspace copilot.\n\nI can help you manage client requests, update order statuses, grow your portfolio, and navigate your workspace. What can I help you with today?`
  }
  if (role === "admin") {
    return `Hello, **${userName}**! 👋 I'm **Threadify AI**, your platform assistant.\n\nI can help you with tailor verification, dispute resolution, order monitoring, and platform management. How can I assist?`
  }
  return `Hello, **${userName}**! 👋 I'm **Threadify AI**, your personal fashion assistant.\n\nI can help you with custom orders, finding the perfect tailor, payments, and tracking your garments. What would you like to do today?`
}

// ── Suggestion chips per role ─────────────────────────────────────────────────
const ROLE_SUGGESTIONS: Record<Role, { label: string; icon: string }[]> = {
  customer: [
    { label: "How do I place a custom order?", icon: "🎨" },
    { label: "Track my latest order", icon: "📦" },
    { label: "How does payment escrow work?", icon: "💳" },
    { label: "Find a verified tailor", icon: "🧵" },
    { label: "Where do I save my measurements?", icon: "📏" },
    { label: "Compare my quotations", icon: "📊" },
  ],
  tailor: [
    { label: "How do I submit a price quote?", icon: "💰" },
    { label: "View my active orders", icon: "📦" },
    { label: "When will I get paid?", icon: "💳" },
    { label: "How do I upload portfolio photos?", icon: "📷" },
    { label: "How do I become verified?", icon: "⭐" },
    { label: "View incoming client requests", icon: "📋" },
  ],
  admin: [
    { label: "Review tailor verification queue", icon: "✅" },
    { label: "Monitor platform orders", icon: "📊" },
    { label: "Resolve a dispute", icon: "⚖️" },
  ],
}

// ── Markdown component overrides ──────────────────────────────────────────────
const MarkdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-bold text-foreground">{children}</strong>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="space-y-1 my-1.5 ml-1">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="space-y-1 my-1.5 ml-1 list-decimal list-inside">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="flex items-start gap-1.5">
      <span className="text-primary font-bold mt-0.5 shrink-0">•</span>
      <span>{children}</span>
    </li>
  ),
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="font-serif font-bold text-sm text-foreground mt-2 mb-1">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="font-serif font-semibold text-xs text-foreground mt-2 mb-1">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="font-semibold text-xs text-foreground mt-1.5 mb-0.5">{children}</h3>
  ),
  code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) =>
    inline ? (
      <code className="bg-muted px-1 py-0.5 rounded font-mono text-[10px] border border-border">
        {children}
      </code>
    ) : (
      <pre className="bg-muted p-2.5 rounded-lg font-mono text-[10px] border border-border overflow-x-auto my-2">
        <code>{children}</code>
      </pre>
    ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto my-2">
      <table className="w-full text-[10px] border-collapse border border-border rounded-lg overflow-hidden">
        {children}
      </table>
    </div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="bg-muted px-2 py-1.5 text-left font-semibold border border-border">{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="px-2 py-1.5 border border-border">{children}</td>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-primary pl-3 my-2 text-muted-foreground italic">
      {children}
    </blockquote>
  ),
}

export function AIChatPanel({
  isOpen,
  onClose,
  role,
  userName = "User",
  userId,
  currentPage = "/",
}: AIChatPanelProps) {
  const router = useRouter()
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Local UI state
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const [feedbackMap, setFeedbackMap] = React.useState<Record<string, "up" | "down">>({})
  const [showSidebar, setShowSidebar] = React.useState(false)
  const [conversationId, setConversationId] = React.useState<string | null>(null)
  const [pendingImageUrl, setPendingImageUrl] = React.useState<string | null>(null)
  const [pendingImageFile, setPendingImageFile] = React.useState<File | null>(null)
  const [isUploadingImage, setIsUploadingImage] = React.useState(false)
  const [isRecording, setIsRecording] = React.useState(false)
  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null)
  const [isTranscribing, setIsTranscribing] = React.useState(false)
  const [toolResults, setToolResults] = React.useState<Record<string, ToolResult>>({})
  const [isFirstReply, setIsFirstReply] = React.useState(true)

  // Supabase conversation persistence
  const {
    groupedConversations,
    isLoading: convLoading,
    createConversation,
    deleteConversation,
    loadMessages,
    saveMessage,
  } = useAIConversations(userId || null)

  // Welcome message
  const welcomeMessage: UIMessage = React.useMemo(() => ({
    id: "welcome-msg",
    role: "assistant",
      parts: [{ type: "text", text: buildWelcomeContent(role, userName) }],
    
  }), [role, userName])

  // Vercel AI SDK useChat
  const [input, setInput] = useState("")
  const {
    messages,
    status,
    sendMessage,
    setMessages,
    // reload,
  } = useChat({
    // api: "/api/chat",
    initialMessages: [welcomeMessage],
    body: {
      role,
      currentPage,
      userId: userId || "guest",
      conversationId,
      hasImage: !!pendingImageUrl,
    },
    onFinish: async ({ message }: any) => {
      // Persist assistant reply to Supabase
      if (conversationId && userId) {
        const msgId = await saveMessage(conversationId, "assistant", getMessageText(message))

        // Auto-title after first real reply
        if (isFirstReply) {
          setIsFirstReply(false)
          const lastUser = [...messages].reverse().find((m) => m.role === "user")
          if (lastUser) {
            fetch("/api/chat/title", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userMessage: getMessageText(lastUser),
                assistantReply: getMessageText(message).slice(0, 300),
                conversationId,
                userId,
              }),
            }).catch(() => {})
          }
        }

        // Store message ID for feedback
        if (msgId) {
          setFeedbackMap((prev) => ({ ...prev, [message.id]: prev[message.id] }))
        }
      }
    },
  })

    const isLoading = status === 'streaming' || status === 'submitted'
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim()) return
    sendMessage({ role: "user", content: input })
    setInput("")
  }

  // Parse tool results from messages
  React.useEffect(() => {
    const lastMsg = messages.at(-1)
    if (lastMsg?.role === "assistant" && lastMsg.parts?.some((p: any) => p.type === "tool-invocation")) {
      const navItem = (lastMsg.parts?.find((p: any) => p.type === "tool-invocation") as any)?.result as ToolResult | undefined
      if (navItem && navItem.type === "navigation" && navItem.direct) {
        router.push(navItem.path)
        onClose()
      }
    }
  }, [messages, router, onClose])

  // Session restore from sessionStorage (guests) or Supabase (logged in)
  React.useEffect(() => {
    if (!isOpen) return

    if (!userId) {
      // Guest: restore from sessionStorage
      try {
        const saved = sessionStorage.getItem("threadify_ai_session")
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed.messages?.length > 1) {
            setMessages(parsed.messages)
          }
        }
      } catch {}
      return
    }

    // Authenticated: create or restore conversation
    ;(async () => {
      if (!conversationId) {
        const id = await createConversation()
        if (id) {
          setConversationId(id)
          setIsFirstReply(true)
        }
      }
    })()
  }, [isOpen, userId, conversationId, createConversation, setMessages])

  // Persist guest session
  React.useEffect(() => {
    if (!userId && messages.length > 1) {
      try {
        sessionStorage.setItem(
          "threadify_ai_session",
          JSON.stringify({ messages: messages.slice(-20) })
        )
      } catch {}
    }
  }, [messages, userId])

  // Scroll to bottom on new messages
  React.useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isLoading, isOpen])

  // Focus input when opened
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [isOpen])

  // ── Load conversation from sidebar ──────────────────────────────────────────
  const handleSelectConversation = async (id: string) => {
    setConversationId(id)
    setShowSidebar(false)
    const msgs = await loadMessages(id)
    if (msgs.length > 0) {
      setMessages([
        welcomeMessage,
        ...msgs.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: getMessageText(m) || "",
        })),
      ])
    }
    setIsFirstReply(false)
  }

  // ── New conversation ─────────────────────────────────────────────────────────
  const handleNewConversation = async () => {
    setMessages([welcomeMessage])
    setToolResults({})
    setShowSidebar(false)
    setIsFirstReply(true)
    if (userId) {
      const id = await createConversation()
      if (id) setConversationId(id)
    }
  }

  // ── Send message ─────────────────────────────────────────────────────────────
  const handleSend = async (e?: React.FormEvent, text?: string) => {
    if (e) e.preventDefault()
    if (isLoading) return

    const messageText = text || input
    if (!messageText.trim() && !pendingImageUrl) return

    // Persist user message to Supabase
    if (conversationId && userId) {
      await saveMessage(conversationId, "user", messageText as string, pendingImageUrl || undefined)
    }

    // Build parts
    const messageParts: any[] = []
    if (pendingImageUrl) {
      messageParts.push({ type: "image_url", image_url: { url: pendingImageUrl } })
      messageParts.push({ type: "text", text: messageText || "What can you tell me about this image?" })
    } else {
      messageParts.push({ type: "text", text: messageText })
    }

    sendMessage({
      role: "user",
      parts: messageParts
    } as any) // use any to bypass strict type for options if needed

    setPendingImageUrl(null)
    setPendingImageFile(null)
    setInput("")
  }

  // ── Quick chip send ─────────────────────────────────────────────────────────
  const handleChipClick = (text: string) => {
    setInput(text)
    setTimeout(() => {
      sendMessage({ role: "user", parts: [{ type: "text", text }] } as any)
      setInput("")
    }, 50)
  }

  // ── Copy message ─────────────────────────────────────────────────────────────
  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content).catch(() => {})
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // ── Feedback ─────────────────────────────────────────────────────────────────
  const handleFeedback = async (messageId: string, feedback: "up" | "down") => {
    const current = feedbackMap[messageId]
    const newFeedback = current === feedback ? undefined : feedback
    setFeedbackMap((prev) => {
      const next = { ...prev }
      if (newFeedback) next[messageId] = newFeedback
      else delete next[messageId]
      return next
    })

    if (conversationId && userId) {
      try {
        await fetch("/api/chat/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messageId,
            conversationId,
            userId,
            feedback: newFeedback || null,
          }),
        })
      } catch {}
    }
  }

  // ── Image upload ─────────────────────────────────────────────────────────────
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingImageFile(file)
    setIsUploadingImage(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", userId || "guest")
      const res = await fetch("/api/chat/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (data.url) {
        setPendingImageUrl(data.url)
      }
    } catch {
      setPendingImageFile(null)
    } finally {
      setIsUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // ── Voice input ──────────────────────────────────────────────────────────────
  const handleVoiceToggle = async () => {
    if (isRecording && mediaRecorder) {
      mediaRecorder.stop()
      setIsRecording(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        setIsTranscribing(true)
        try {
          const blob = new Blob(chunks, { type: "audio/webm" })
          const formData = new FormData()
          formData.append("audio", blob)
          const res = await fetch("/api/whisper", { method: "POST", body: formData })
          const data = await res.json()
          if (data.text) {
            setInput(data.text)
            inputRef.current?.focus()
          }
        } catch {
          // Voice failed — user can type instead
        } finally {
          setIsTranscribing(false)
        }
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch {
      // Mic permission denied — silently ignore
    }
  }

  // ── Navigation from tool card ─────────────────────────────────────────────────
  const handleNavigate = (path: string, direct: boolean) => {
    router.push(path)
    if (direct) onClose()
  }

  // ── Clear conversation ────────────────────────────────────────────────────────
  const handleClear = () => {
    setMessages([welcomeMessage])
    setToolResults({})
    setPendingImageUrl(null)
    setPendingImageFile(null)
    setIsFirstReply(true)
  }

  const suggestions = ROLE_SUGGESTIONS[role] || ROLE_SUGGESTIONS.customer
  const isThinking = isLoading && messages.at(-1)?.role !== "assistant"
  const lastMsg = messages.at(-1)
  const isStreaming = isLoading && lastMsg?.role === "assistant" && getMessageText(lastMsg).length > 0

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[60] pointer-events-none flex items-end justify-end p-4 md:p-6"
        role="dialog"
        aria-modal="true"
        aria-label="Threadify AI Assistant"
      >
        {/* Mobile backdrop */}
        <motion.div
          variants={modalBackdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
          className="fixed inset-0 bg-background/30 backdrop-blur-sm md:hidden pointer-events-auto"
        />

        {/* Chat Panel */}
        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="pointer-events-auto relative w-[420px] max-w-[calc(100vw-1.5rem)] h-[600px] max-h-[calc(100vh-5rem)] bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Conversation Sidebar overlay */}
          <AIConversationSidebar
            isOpen={showSidebar}
            onClose={() => setShowSidebar(false)}
            groups={groupedConversations}
            activeConversationId={conversationId}
            isLoading={convLoading}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onDeleteConversation={deleteConversation}
          />

          {/* ── Panel Header ──────────────────────────────────────────────────── */}
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" aria-hidden="true" />
                <Sparkles
                  className="w-2.5 h-2.5 text-primary absolute -top-0.5 -right-0.5 animate-pulse"
                  aria-hidden="true"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-serif font-bold text-sm text-foreground">Threadify AI</h3>
                  <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wide">
                    {role}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {isThinking
                    ? "Thinking…"
                    : isStreaming
                    ? "Responding…"
                    : "Your Threadify Copilot"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-0.5">
              {userId && (
                <button
                  onClick={() => setShowSidebar(true)}
                  aria-label="View conversation history"
                  title="Chat History"
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <History className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleNewConversation}
                aria-label="Start a new conversation"
                title="New Chat"
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={handleClear}
                aria-label="Clear conversation"
                title="Clear Chat"
                className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                aria-label="Close AI Assistant"
                title="Close"
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Messages ─────────────────────────────────────────────────────── */}
          <div
            className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-xs
              scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
            aria-live="polite"
            aria-atomic="false"
          >
            {messages.map((msg) => {
              const isUser = msg.role === "user"
              const toolResult = !isUser
                ? (toolResults[msg.id] || ((msg.parts?.filter((p: any) => p.type === "tool-invocation") as any[])?.[0]?.result as ToolResult | undefined))
                : undefined

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"} gap-1`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-3.5 py-3 leading-relaxed ${
                      isUser
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted/50 border border-border/60 text-foreground rounded-tl-sm"
                    }`}
                  >
                    {/* Image preview in message */}
                    {isUser && getMessageText(msg) && typeof getMessageText(msg) !== "string" && (
                      <div className="mb-2">
                        <ImageIcon className="w-4 h-4 opacity-70" aria-label="Image attached" />
                      </div>
                    )}

                    {/* Message content via ReactMarkdown */}
                    <div className="prose prose-xs max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={MarkdownComponents as Record<string, React.ElementType>}
                      >
                        {typeof getMessageText(msg) === "string" ? getMessageText(msg) : ""}
                      </ReactMarkdown>
                    </div>

                    {/* Tool result navigation card */}
                    {toolResult && (
                      <AIToolResultCard result={toolResult} onNavigate={handleNavigate} />
                    )}
                  </div>

                  {/* Message actions (assistant only) */}
                  {!isUser && msg.id !== "welcome-msg" && (
                    <div className="flex items-center gap-2 px-1 text-[10px] text-muted-foreground">
                      <button
                        onClick={() => handleCopy(msg.id, typeof getMessageText(msg) === "string" ? getMessageText(msg) : "")}
                        aria-label="Copy message"
                        className="flex items-center gap-1 hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedId === msg.id ? "Copied" : "Copy"}</span>
                      </button>

                      {msg.id === lastMsg?.id && (
                        <button
                          onClick={() => reload()}
                          aria-label="Regenerate response"
                          className="flex items-center gap-1 hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Retry</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleFeedback(msg.id, "up")}
                        aria-label="Thumbs up — helpful response"
                        aria-pressed={feedbackMap[msg.id] === "up"}
                        className={`p-1 rounded-lg transition-colors ${
                          feedbackMap[msg.id] === "up"
                            ? "text-emerald-500 bg-emerald-500/10"
                            : "hover:text-emerald-500 hover:bg-emerald-500/10"
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => handleFeedback(msg.id, "down")}
                        aria-label="Thumbs down — unhelpful response"
                        aria-pressed={feedbackMap[msg.id] === "down"}
                        className={`p-1 rounded-lg transition-colors ${
                          feedbackMap[msg.id] === "down"
                            ? "text-destructive bg-destructive/10"
                            : "hover:text-destructive hover:bg-destructive/10"
                        }`}
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            {/* "Thinking" indicator — shown only until first token */}
            {isThinking && (
              <div className="flex flex-col items-start gap-1">
                <div className="bg-muted/50 border border-border/60 p-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Quick Suggestions (shown on short conversations) ──────────────── */}
          {messages.length <= 2 && !isLoading && (
            <div className="px-4 py-2.5 border-t border-border/40 bg-muted/10">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" aria-hidden="true" />
                Quick Actions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => handleChipClick(chip.label)}
                    aria-label={`Ask: ${chip.label}`}
                    className="text-[11px] bg-background hover:bg-muted border border-border/60 text-foreground/80 hover:text-foreground rounded-xl px-2.5 py-1 transition-colors flex items-center gap-1 max-w-full truncate"
                  >
                    <span aria-hidden="true">{chip.icon}</span>
                    <span className="truncate">{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Image preview strip ────────────────────────────────────────────── */}
          {(pendingImageUrl || isUploadingImage) && (
            <div className="px-4 py-2 border-t border-border/40 bg-muted/20 flex items-center gap-2">
              {isUploadingImage ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Uploading image…</span>
                </div>
              ) : pendingImageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pendingImageUrl}
                    alt="Image to send"
                    className="w-12 h-12 object-cover rounded-lg border border-border"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {pendingImageFile?.name || "Image attached"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Powered by gpt-4o vision
                    </p>
                  </div>
                  <button
                    onClick={() => { setPendingImageUrl(null); setPendingImageFile(null) }}
                    aria-label="Remove image"
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : null}
            </div>
          )}

          {/* ── Input Footer ──────────────────────────────────────────────────── */}
          <div className="px-3 pt-2.5 pb-3 border-t border-border bg-card shrink-0">
            <form
              onSubmit={handleSend}
              className="flex items-center gap-2"
              aria-label="Send a message to Threadify AI"
            >
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                aria-hidden="true"
                onChange={handleImageSelect}
              />

              {/* Attachment button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                aria-label="Attach an image for AI vision analysis"
                title="Attach Image"
                className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-40 shrink-0"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Text input */}
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend(e as unknown as React.FormEvent)
                  }
                }}
                placeholder={
                  isTranscribing
                    ? "Transcribing…"
                    : isRecording
                    ? "Recording… click mic to stop"
                    : `Ask Threadify AI (${role})…`
                }
                disabled={isLoading || isTranscribing}
                maxLength={1000}
                aria-label="Message input"
                className="flex-1 h-10 px-3.5 bg-muted/40 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50 transition-colors"
              />

              {/* Mic button */}
              <button
                type="button"
                onClick={handleVoiceToggle}
                disabled={isTranscribing}
                aria-label={isRecording ? "Stop recording" : "Start voice input"}
                title={isRecording ? "Stop Recording" : "Voice Input"}
                className={`p-2 rounded-xl transition-colors shrink-0 ${
                  isRecording
                    ? "text-destructive bg-destructive/10 hover:bg-destructive/20"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                } disabled:opacity-40`}
              >
                {isRecording ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Send button */}
              <Button
                type="submit"
                disabled={(!input.trim() && !pendingImageUrl) || isLoading || isTranscribing}
                size="sm"
                aria-label="Send message"
                className="h-10 w-10 p-0 rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 shrink-0"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
              </Button>
            </form>

            <div className="flex justify-between items-center px-1 mt-1.5 text-[9px] text-muted-foreground/60">
              <span>Threadify AI · Verified Guidance</span>
              <span>{input.length}/1000</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
