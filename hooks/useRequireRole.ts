import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './useAuth'
import type { UserRole } from '@/types/database'

/**
 * Hook to enforce role-based authorization on the client-side.
 * Redirects if the user does not have the required role.
 */
export function useRequireRole(requiredRole: UserRole) {
  const { user, role, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      router.replace('/login')
      return
    }

    // Role missing or mismatched
    if (role !== requiredRole) {
      if (role === 'admin') router.replace('/admin')
      else if (role === 'tailor') router.replace('/tailor')
      else router.replace('/dashboard')
    }
  }, [user, role, isLoading, requiredRole, router])

  return { user, role, isLoading }
}
