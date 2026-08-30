"use client"

import * as React from "react"
import type { RagGenerationOutput } from "@/lib/rag/types"

export interface FashionRagState {
  status: "idle" | "loading" | "success" | "error"
  stepMsg?: string
  data?: RagGenerationOutput | null
}

export interface LoadRagParams {
  visionData: any
  detectedTags: string[]
  budgetMin?: string
  budgetMax?: string
  deadline?: string
  notes?: string
}

export function useFashionRag() {
  const [ragState, setRagState] = React.useState<FashionRagState>({ status: "idle", data: null })

  const resetRag = React.useCallback(() => {
    setRagState({ status: "idle", data: null })
  }, [])

  const loadRagRecommendations = React.useCallback(async (params: LoadRagParams) => {
    const { visionData, detectedTags, budgetMin, budgetMax, deadline, notes } = params
    const isRagEnabled = process.env.NEXT_PUBLIC_RAG_ENABLED === "true"
    if (!isRagEnabled) return

    // RAG Safety Guard: Only perform garment-specific RAG retrieval when vision result passes confidence gate
    if (!visionData || visionData.garmentType === "Custom Garment" || visionData.isConfident === false) {
      setRagState({ status: "idle", data: null })
      return
    }

    setRagState({ status: "loading", stepMsg: "Finding matching fashion knowledge..." })

    try {
      const { buildFashionRagQuery } = await import("@/lib/rag/query-builder")
      const { embedText } = await import("@/lib/rag/embeddings")
      const { searchFashionKnowledge } = await import("@/lib/rag/knowledge-store")
      const { generateFashionRecommendation } = await import("@/lib/rag/generator")

      const query = buildFashionRagQuery(visionData || { garmentType: detectedTags[0] })

      setRagState({ status: "loading", stepMsg: "Retrieving vector knowledge..." })
      const embedding = await embedText(query)

      setRagState({ status: "loading", stepMsg: "Preparing recommendations..." })
      const searchRes = await searchFashionKnowledge(embedding, {
        matchCount: 5,
        garmentTypeFilter:
          visionData?.garmentType && visionData.garmentType !== "Custom Garment"
            ? visionData.garmentType
            : undefined,
      })

      if (searchRes.success && searchRes.results.length > 0) {
        const recommendation = await generateFashionRecommendation({
          visionResult: {
            garmentType: visionData?.garmentType || detectedTags[0] || "Custom Garment",
            category: visionData?.category,
            colour: visionData?.colour,
            pattern: visionData?.pattern,
            style: visionData?.style,
            complexity: visionData?.complexity,
            gender: visionData?.gender,
          },
          retrievedKnowledge: searchRes.results,
          userRequirements: {
            budgetINR:
              budgetMin || budgetMax
                ? { min: Number(budgetMin) || 0, max: Number(budgetMax) || 0 }
                : undefined,
            deadlineDays: deadline
              ? Math.max(1, Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
              : undefined,
            customizationInstructions: notes || undefined,
          },
        })

        setRagState({ status: "success", data: recommendation })
      } else {
        setRagState({ status: "error", data: null })
      }
    } catch (err) {
      console.warn("RAG recommendation loading failed gracefully:", err)
      setRagState({ status: "error", data: null })
    }
  }, [])

  return {
    ragState,
    loadRagRecommendations,
    resetRag,
  }
}
