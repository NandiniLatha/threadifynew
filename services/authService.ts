/**
 * Authentication Service
 * Centralized, secure authentication layer. Uses Supabase Auth heavily.
 * Ensures strict typing, rate limiting wrapper capabilities, and
 * prevents internal errors from leaking.
 */

import { createClient } from '@/lib/supabase/client'
import { ok, err, mapSupabaseError, mapUnknownError, type ServiceResult } from './errors'
import type { UserRow } from '@/types/database'

// Supabase browser client for client-side Auth operations
const supabase = createClient()

export interface LoginParams {
  email:     string
  password:  string
}

export interface RegisterParams {
  email:     string
  password:  string
  name:      string
  phone?:    string
}

/**
 * Login a user using email and password.
 */
export async function login(params: LoginParams): Promise<ServiceResult<{ user_id: string }>> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    })

    if (error) {
      // Avoid leaking precise enumeration reasons if possible
      if (error.message.includes('Invalid login credentials')) {
        return err({ code: 'UNAUTHORIZED', message: 'Invalid email or password.' })
      }
      return err(mapSupabaseError(error, 'login'))
    }

    if (!data.user) {
      return err({ code: 'UNKNOWN', message: 'Login succeeded but no user returned.' })
    }

    return ok({ user_id: data.user.id })
  } catch (e) {
    return err(mapUnknownError(e, 'login'))
  }
}

/**
 * Register a new user.
 * Note: Role is strictly ignored here; the DB trigger defaults to 'customer'.
 */
export async function register(params: RegisterParams): Promise<ServiceResult<{ user_id: string; message: string }>> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          name: params.name,
          phone: params.phone ?? '',
          // Explicitly do not send 'role' to avoid tamper attempts, though the backend trigger now ignores it anyway.
        }
      }
    })

    if (error) {
      if (error.message.includes('already registered')) {
        return err({ code: 'CONFLICT', message: 'An account with this email already exists.' })
      }
      return err(mapSupabaseError(error, 'register'))
    }

    if (!data.user) {
      return err({ code: 'UNKNOWN', message: 'Registration succeeded but no user returned.' })
    }

    // Check if email confirmation is required based on identities
    const needsEmailConfirmation = data.user.identities && data.user.identities.length === 0

    return ok({ 
      user_id: data.user.id,
      message: needsEmailConfirmation 
        ? 'Please check your email to verify your account.' 
        : 'Registration successful.'
    })
  } catch (e) {
    return err(mapUnknownError(e, 'register'))
  }
}

/**
 * Log out the current user (current device only).
 */
export async function logout(): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) return err(mapSupabaseError(error, 'logout'))
    return ok(undefined)
  } catch (e) {
    return err(mapUnknownError(e, 'logout'))
  }
}

/**
 * Log out the current user from ALL devices (revokes all refresh tokens).
 */
export async function logoutAllDevices(): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabase.auth.signOut({ scope: 'global' })
    if (error) return err(mapSupabaseError(error, 'logoutAllDevices'))
    return ok(undefined)
  } catch (e) {
    return err(mapUnknownError(e, 'logoutAllDevices'))
  }
}

/**
 * Request a password reset email.
 */
export async function forgotPassword(email: string): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) return err(mapSupabaseError(error, 'forgotPassword'))
    return ok(undefined)
  } catch (e) {
    return err(mapUnknownError(e, 'forgotPassword'))
  }
}

/**
 * Set a new password (used after clicking the reset email link).
 */
export async function resetPassword(newPassword: string): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    
    if (error) return err(mapSupabaseError(error, 'resetPassword'))
    return ok(undefined)
  } catch (e) {
    return err(mapUnknownError(e, 'resetPassword'))
  }
}

/**
 * Get the current authenticated user's profile from the public.users table.
 */
export async function getCurrentUserProfile(): Promise<ServiceResult<UserRow | null>> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ok(null)

    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return ok(null) // Not found (e.g. trigger lag)
      return err(mapSupabaseError(error, 'getCurrentUserProfile'))
    }

    return ok(profile as UserRow)
  } catch (e) {
    return err(mapUnknownError(e, 'getCurrentUserProfile'))
  }
}
