"use client"

import { useEffect, useRef } from "react"
import { realtimeService, FeatureChannel } from "@/lib/supabase/realtime"
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

export function useRealtime<T extends { [key: string]: any }>(
  feature: FeatureChannel,
  table: string,
  onUpdate: (payload: RealtimePostgresChangesPayload<T>) => void,
  enabled: boolean = true
) {
  const onUpdateRef = useRef(onUpdate)

  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    if (!enabled || !realtimeService) return

    const unsubscribe = realtimeService.subscribeToFeature(feature, table, (payload) => {
      onUpdateRef.current(payload as RealtimePostgresChangesPayload<T>)
    })

    return () => {
      unsubscribe()
    }
  }, [feature, table, enabled])
}
