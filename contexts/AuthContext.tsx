'use client'

import React, { createContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import type { UserRow, UserRole } from '@/types/database'
import { getCurrentUserProfile } from '@/services/authService'

export interface AuthContextType {
  user: User | null
  profile: UserRow | null
  role: UserRole | null
  isLoading: boolean
  refreshSession: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  const refreshSession = async () => {
    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setUser(null)
        setProfile(null)
        return
      }

      setUser(session.user)

      const profileResult = await getCurrentUserProfile()
      if (profileResult.data) {
        setProfile(profileResult.data)
      } else {
        // Profile not found, might be a trigger delay
        setProfile(null)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    refreshSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser(session.user)
          const profileResult = await getCurrentUserProfile()
          if (profileResult.data) {
            setProfile(profileResult.data)
          } else {
            setProfile(null)
          }
        } else {
          setUser(null)
          setProfile(null)
        }
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role ?? null,
        isLoading,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
