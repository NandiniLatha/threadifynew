"use client"

/**
 * useAIConversations — Client-side Supabase hook for AI conversation persistence.
 * Lists, creates, and loads conversations + messages for the logged-in user.
 */

import * as React from "react"
import { createClient } from "@/lib/supabase/client"

export interface AIConversation {
  id: string
  title: string | null
  created_at: string
  updated_at: string
}

export interface AIMessage {
  id: string
  conversation_id: string
  role: "user" | "assistant" | "system" | "tool"
  content: string | null
  image_url: string | null
  tool_calls: Record<string, unknown> | null
  feedback: "up" | "down" | null
  created_at: string
}

export type ConversationGroup = {
  label: string
  conversations: AIConversation[]
}

function groupConversations(conversations: AIConversation[]): ConversationGroup[] {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  const sevenDaysAgo = new Date(todayStart)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const thirtyDaysAgo = new Date(todayStart)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const groups: ConversationGroup[] = [
    { label: "Today", conversations: [] },
    { label: "Yesterday", conversations: [] },
    { label: "Previous 7 Days", conversations: [] },
    { label: "Previous 30 Days", conversations: [] },
    { label: "Older", conversations: [] },
  ]

  for (const conv of conversations) {
    const date = new Date(conv.created_at)
    if (date >= todayStart) {
      groups[0].conversations.push(conv)
    } else if (date >= yesterdayStart) {
      groups[1].conversations.push(conv)
    } else if (date >= sevenDaysAgo) {
      groups[2].conversations.push(conv)
    } else if (date >= thirtyDaysAgo) {
      groups[3].conversations.push(conv)
    } else {
      groups[4].conversations.push(conv)
    }
  }

  return groups.filter((g) => g.conversations.length > 0)
}

export function useAIConversations(userId: string | null) {
  const supabase = createClient()
  const [conversations, setConversations] = React.useState<AIConversation[]>([])
  const [groupedConversations, setGroupedConversations] = React.useState<ConversationGroup[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  const loadConversations = React.useCallback(async () => {
    if (!userId) {
      setConversations([])
      setGroupedConversations([])
      return
    }
    setIsLoading(true)
    try {
      const { data } = await supabase
        .from("ai_conversations")
        .select("id, title, created_at, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(50)

      const convs = (data || []) as AIConversation[]
      setConversations(convs)
      setGroupedConversations(groupConversations(convs))
    } finally {
      setIsLoading(false)
    }
  }, [userId, supabase])

  React.useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const createConversation = React.useCallback(async (): Promise<string | null> => {
    if (!userId) return null
    const { data, error } = await supabase
      .from("ai_conversations")
      .insert({ user_id: userId, title: "New Chat" })
      .select("id")
      .single()
    if (error || !data) return null
    await loadConversations()
    return data.id
  }, [userId, supabase, loadConversations])

  const deleteConversation = React.useCallback(async (conversationId: string) => {
    await supabase.from("ai_conversations").delete().eq("id", conversationId)
    await loadConversations()
  }, [supabase, loadConversations])

  const loadMessages = React.useCallback(async (conversationId: string): Promise<AIMessage[]> => {
    const { data } = await supabase
      .from("ai_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
    return (data || []) as AIMessage[]
  }, [supabase])

  const saveMessage = React.useCallback(async (
    conversationId: string,
    role: AIMessage["role"],
    content: string,
    imageUrl?: string
  ): Promise<string | null> => {
    const { data, error } = await supabase
      .from("ai_messages")
      .insert({
        conversation_id: conversationId,
        role,
        content,
        image_url: imageUrl || null,
      })
      .select("id")
      .single()
    if (error || !data) return null
    return data.id
  }, [supabase])

  const updateTitle = React.useCallback(async (conversationId: string, title: string) => {
    await supabase
      .from("ai_conversations")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", conversationId)
    await loadConversations()
  }, [supabase, loadConversations])

  return {
    conversations,
    groupedConversations,
    isLoading,
    loadConversations,
    createConversation,
    deleteConversation,
    loadMessages,
    saveMessage,
    updateTitle,
  }
}
