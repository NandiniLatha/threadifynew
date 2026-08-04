import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from './useAuth'

/**
 * Hook to enforce authentication on the client-side.
 * Redirects to /login if the user is not authenticated after loading.
 * Note: Middleware handles this server-side; this hook is an extra layer for SPA transitions.
 */
export function useRequireAuth() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [user, isLoading, router, pathname])

  return { user, isLoading }
}
