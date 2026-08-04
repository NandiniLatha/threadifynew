"use client"

/**
 * AIConversationSidebar — Shows conversation history grouped by date.
 * Slides in from the left within the chat panel. No external layout changes.
 */

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, Plus, Trash2, X, ChevronLeft } from "lucide-react"
import { ConversationGroup, AIConversation } from "@/hooks/useAIConversations"

interface AIConversationSidebarProps {
  isOpen: boolean
  onClose: () => void
  groups: ConversationGroup[]
  activeConversationId: string | null
  isLoading: boolean
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onDeleteConversation: (id: string) => void
}

export function AIConversationSidebar({
  isOpen,
  onClose,
  groups,
  activeConversationId,
  isLoading,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: AIConversationSidebarProps) {
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setDeletingId(id)
    await onDeleteConversation(id)
    setDeletingId(null)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="sidebar"
          initial={{ x: "-100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-100%", opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0 z-20 bg-card flex flex-col rounded-3xl overflow-hidden"
          aria-label="Conversation history sidebar"
        >
          {/* Sidebar Header */}
          <div className="px-4 py-3.5 border-b border-border flex items-center justify-between shrink-0 bg-muted/30">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" aria-hidden="true" />
              <h3 className="text-sm font-bold text-foreground font-serif">Chat History</h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onNewConversation}
                aria-label="Start a new conversation"
                title="New Chat"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                aria-label="Close history sidebar"
                title="Close"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conversation List */}
          <div
            className="flex-1 overflow-y-auto py-2 px-2 space-y-1
              scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
          >
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary/40 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {!isLoading && groups.length === 0 && (
              <div className="text-center py-8 px-4">
                <MessageSquare className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No previous conversations.</p>
                <button
                  onClick={onNewConversation}
                  className="mt-3 text-xs text-primary hover:underline font-medium"
                >
                  Start your first chat →
                </button>
              </div>
            )}

            {groups.map((group) => (
              <div key={group.label} className="space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 px-2 pt-3 pb-1">
                  {group.label}
                </p>
                {group.conversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === activeConversationId}
                    isDeleting={deletingId === conv.id}
                    onSelect={() => onSelectConversation(conv.id)}
                    onDelete={(e) => handleDelete(e, conv.id)}
                  />
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ConversationItem({
  conversation,
  isActive,
  isDeleting,
  onSelect,
  onDelete,
}: {
  conversation: AIConversation
  isActive: boolean
  isDeleting: boolean
  onSelect: () => void
  onDelete: (e: React.MouseEvent) => void
}) {
  const [showDelete, setShowDelete] = React.useState(false)

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      aria-current={isActive ? "true" : undefined}
      aria-label={`Load conversation: ${conversation.title || "Untitled chat"}`}
      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all group ${
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      }`}
    >
      <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" aria-hidden="true" />
      <span className="flex-1 text-xs font-medium truncate">
        {conversation.title || "Untitled chat"}
      </span>
      {showDelete && !isDeleting && (
        <button
          onClick={onDelete}
          aria-label="Delete this conversation"
          className="p-0.5 rounded text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
      {isDeleting && (
        <X className="w-3 h-3 text-muted-foreground animate-spin" />
      )}
    </button>
  )
}
