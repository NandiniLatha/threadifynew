import { createClient } from './client'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export type FeatureChannel = 'messages' | 'notifications' | 'orders' | 'requests'

type ListenerCallback = (payload: RealtimePostgresChangesPayload<any>) => void

class RealtimeManager {
  private channels: Map<FeatureChannel, RealtimeChannel> = new Map()
  private listeners: Map<FeatureChannel, Set<ListenerCallback>> = new Map()
  
  // Singleton instance
  private static instance: RealtimeManager
  
  public static getInstance() {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager()
    }
    return RealtimeManager.instance
  }

  public subscribeToFeature(
    feature: FeatureChannel,
    table: string,
    callback: ListenerCallback
  ) {
    if (typeof window === 'undefined') return () => {}

    if (!this.listeners.has(feature)) {
      this.listeners.set(feature, new Set())
    }
    this.listeners.get(feature)!.add(callback)

    if (!this.channels.has(feature)) {
      const supabase = createClient()
      const channel = supabase.channel(feature)
      this.channels.set(feature, channel)
      
      // Register postgres changes BEFORE subscribe
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          const featureListeners = this.listeners.get(feature)
          if (featureListeners) {
            featureListeners.forEach((cb) => cb(payload))
          }
        }
      )
      
      channel.subscribe()
    }

    return () => {
      const featureListeners = this.listeners.get(feature)
      if (featureListeners) {
        featureListeners.delete(callback)
        // Clean up channel if no listeners left
        if (featureListeners.size === 0) {
          const channel = this.channels.get(feature)
          if (channel) {
            const supabase = createClient()
            supabase.removeChannel(channel)
            this.channels.delete(feature)
          }
        }
      }
    }
  }
}

export const realtimeService = typeof window !== 'undefined' ? RealtimeManager.getInstance() : null
