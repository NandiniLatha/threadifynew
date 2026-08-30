"use client"

import * as React from "react"
import type { VisionAnalysisResult } from "@/lib/garment-vision/types"

export interface GarmentClassificationState {
  isAnalyzing: boolean
  visionStepMsg: string | null
  error: string | null
  infoMsg: string | null
  result: (VisionAnalysisResult & { classifierSource?: string; isConfident?: boolean }) | null
}

export function useGarmentClassifier() {
  const [state, setState] = React.useState<GarmentClassificationState>({
    isAnalyzing: false,
    visionStepMsg: null,
    error: null,
    infoMsg: null,
    result: null,
  })

  // Race condition ref for concurrent or rapid sequential uploads
  const currentAnalysisIdRef = React.useRef(0)

  const resetClassifier = React.useCallback(() => {
    currentAnalysisIdRef.current++
    setState({
      isAnalyzing: false,
      visionStepMsg: null,
      error: null,
      infoMsg: null,
      result: null,
    })
  }, [])

  const analyzeImage = React.useCallback(async (base64: string) => {
    const analysisId = ++currentAnalysisIdRef.current
    setState({
      isAnalyzing: true,
      visionStepMsg: null,
      error: null,
      infoMsg: null,
      result: null,
    })

    const isClientVisionEnabled = process.env.NEXT_PUBLIC_CLIENT_VISION_ENABLED === "true"

    if (isClientVisionEnabled) {
      try {
        setState((prev) => ({ ...prev, isAnalyzing: true, visionStepMsg: "Preparing AI Vision..." }))
        const { classifyGarmentClientSide } = await import("@/lib/garment-vision/client-classifier")

        // Race check
        if (analysisId !== currentAnalysisIdRef.current) return null

        setState((prev) => ({ ...prev, visionStepMsg: "Analyzing design..." }))
        const clientResult = await classifyGarmentClientSide({ imageBase64: base64 })

        // Race check
        if (analysisId !== currentAnalysisIdRef.current) return null

        if (clientResult) {
          if (clientResult.detectionStatus === "UNCLEAR_IMAGE" || clientResult.detectionStatus === "NO_GARMENT") {
            setState({
              isAnalyzing: false,
              visionStepMsg: null,
              error: null,
              infoMsg: clientResult.userMessage || "Image cannot be reliably analyzed.",
              result: clientResult,
            })
            return clientResult
          }

          if (clientResult.labels && clientResult.labels.length > 0) {
            setState({
              isAnalyzing: false,
              visionStepMsg: null,
              error: null,
              infoMsg: null,
              result: clientResult,
            })
            return clientResult
          }
        }
      } catch (err) {
        console.warn("Client vision failed, falling back to Granite API:", err)
      }
    }

    try {
      // Race check
      if (analysisId !== currentAnalysisIdRef.current) return null

      setState((prev) => ({ ...prev, isAnalyzing: true, visionStepMsg: "Analyzing design..." }))

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const res = await fetch("/api/vision/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      // Race check
      if (analysisId !== currentAnalysisIdRef.current) return null

      const data = await res.json()
      if (res.ok && data.labels) {
        setState({
          isAnalyzing: false,
          visionStepMsg: null,
          error: null,
          infoMsg: null,
          result: data,
        })
        return data
      } else {
        const errorMsg = data.error || "We couldn't analyze that image — try a clearer photo."
        setState({
          isAnalyzing: false,
          visionStepMsg: null,
          error: errorMsg,
          infoMsg: null,
          result: null,
        })
        return null
      }
    } catch {
      // Race check
      if (analysisId !== currentAnalysisIdRef.current) return null
      const errorMsg = "We couldn't analyze that image — try a clearer photo."
      setState({
        isAnalyzing: false,
        visionStepMsg: null,
        error: errorMsg,
        infoMsg: null,
        result: null,
      })
      return null
    }
  }, [])

  return {
    ...state,
    analyzeImage,
    resetClassifier,
  }
}
