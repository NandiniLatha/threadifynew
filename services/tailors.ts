/**
 * Tailors service
 */

import { createClient } from '@/lib/supabase/server'
import type { TailorProfileRow } from '@/types/database'
import { ok, err, mapSupabaseError, mapUnknownError, type ServiceResult } from './errors'

export interface TailorPublicProfile {
  user_id:             string
  name:                string | null
  bio:                 string | null
  verification_status: string
  avg_rating:          number
  portfolio_images:    string[]
  featured:            boolean
  location:            string | null
  experience_years:    number | null
  starting_price:      number | null
  response_time_hrs:   number
  availability_status: string
  specialty:           string[]
  measurement_options: string[]
  created_at:          string
  reviews_count?:      number
  orders_completed?:   number
  is_saved?:           boolean
}

export interface TailorFilters {
  category?:      string
  max_price?:     number
  min_rating?:    number
  available_only?: boolean
  featured_only?: boolean
  search?:        string
}

/**
 * List approved tailor profiles for the explore page.
 */
export async function getTailors(
  params: { page?: number; limit?: number; filters?: TailorFilters } = {}
): Promise<ServiceResult<{ data: TailorPublicProfile[]; total: number }>> {
  try {
    const supabase = createClient()
    const { page = 1, limit = 50, filters = {} } = params
    const from = (page - 1) * limit
    const to   = from + limit - 1

    let query = supabase
      .from('tailor_profiles')
      .select(`
        user_id, bio, verification_status, avg_rating, portfolio_images,
        featured, location, experience_years, starting_price,
        response_time_hrs, availability_status, specialty,
        measurement_options, created_at,
        user:users!user_id (name)
      `, { count: 'exact' })
      .eq('verification_status', 'approved')
      .order('featured',   { ascending: false })
      .order('avg_rating', { ascending: false })
      .range(from, to)

    if (filters.available_only) {
      query = query.eq('availability_status', 'accepting_orders')
    }
    if (filters.featured_only) {
      query = query.eq('featured', true)
    }
    if (filters.min_rating != null) {
      query = query.gte('avg_rating', filters.min_rating)
    }
    if (filters.max_price != null) {
      query = query.lte('starting_price', filters.max_price)
    }
    if (filters.category) {
      query = query.contains('specialty', [filters.category])
    }

    const { data, error, count } = await query

    if (error) return err(mapSupabaseError(error, 'getTailors'))

    const mapped = (data ?? []).map((t): TailorPublicProfile => ({
      user_id:             t.user_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      name:                (t as any).user?.name ?? null,
      bio:                 t.bio,
      verification_status: t.verification_status,
      avg_rating:          parseFloat(String(t.avg_rating)) || 5.0,
      portfolio_images:    t.portfolio_images ?? [],
      featured:            t.featured,
      location:            t.location,
      experience_years:    t.experience_years,
      starting_price:      t.starting_price,
      response_time_hrs:   t.response_time_hrs ?? 24,
      availability_status: t.availability_status,
      specialty:           t.specialty ?? [],
      measurement_options: t.measurement_options ?? [],
      created_at:          t.created_at,
    }))

    return ok({ data: mapped, total: count ?? 0 })
  } catch (e) {
    return err(mapUnknownError(e, 'getTailors'))
  }
}

/**
 * Get a single tailor's full public profile.
 */
export async function getTailorById(
  tailorId: string
): Promise<ServiceResult<TailorPublicProfile & { reviews_count: number; orders_completed: number }>> {
  try {
    const supabase = createClient()

    const [profileResult, reviewsResult, ordersResult] = await Promise.all([
      supabase
        .from('tailor_profiles')
        .select(`
          *, user:users!user_id (name, avatar_url)
        `)
        .eq('user_id', tailorId)
        .single(),

      supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('tailor_id', tailorId),

      supabase
        .from('design_requests')
        .select('id', { count: 'exact', head: true })
        .eq('tailor_id', tailorId)
        .in('status', ['delivered', 'reviewed']),
    ])

    if (profileResult.error) {
      return err(mapSupabaseError(profileResult.error, `getTailorById(${tailorId})`))
    }
    if (!profileResult.data) {
      return err({ code: 'NOT_FOUND', message: 'Tailor not found.' })
    }

    const t = profileResult.data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u = (t as any).user

    return ok({
      user_id:             t.user_id,
      name:                u?.name ?? null,
      bio:                 t.bio,
      verification_status: t.verification_status,
      avg_rating:          parseFloat(String(t.avg_rating)) || 5.0,
      portfolio_images:    t.portfolio_images ?? [],
      featured:            t.featured,
      location:            t.location,
      experience_years:    t.experience_years,
      starting_price:      t.starting_price,
      response_time_hrs:   t.response_time_hrs ?? 24,
      availability_status: t.availability_status,
      specialty:           t.specialty ?? [],
      measurement_options: t.measurement_options ?? [],
      created_at:          t.created_at,
      reviews_count:       reviewsResult.count ?? 0,
      orders_completed:    ordersResult.count ?? 0,
    })
  } catch (e) {
    return err(mapUnknownError(e, 'getTailorById'))
  }
}

/**
 * Get saved tailor IDs for the current user.
 */
export async function getSavedTailorIds(): Promise<ServiceResult<string[]>> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('saved_tailors')
      .select('tailor_id')

    if (error) return err(mapSupabaseError(error, 'getSavedTailorIds'))
    return ok((data ?? []).map(r => r.tailor_id))
  } catch (e) {
    return err(mapUnknownError(e, 'getSavedTailorIds'))
  }
}

/**
 * Save a tailor (toggle save).
 */
export async function saveTailor(
  tailorId: string,
  save: boolean
): Promise<ServiceResult<void>> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return err({ code: 'UNAUTHORIZED', message: 'Not authenticated.' })

    if (save) {
      const { error } = await supabase
        .from('saved_tailors')
        .upsert({ customer_id: user.id, tailor_id: tailorId })
      if (error) return err(mapSupabaseError(error, 'saveTailor'))
    } else {
      const { error } = await supabase
        .from('saved_tailors')
        .delete()
        .eq('customer_id', user.id)
        .eq('tailor_id', tailorId)
      if (error) return err(mapSupabaseError(error, 'unsaveTailor'))
    }

    return ok(undefined)
  } catch (e) {
    return err(mapUnknownError(e, 'saveTailor'))
  }
}

/**
 * Update the authenticated tailor's own profile.
 */
export async function updateTailorProfile(
  updates: Partial<Pick<TailorProfileRow,
    'bio' | 'location' | 'experience_years' | 'starting_price' |
    'response_time_hrs' | 'availability_status' | 'specialty' |
    'measurement_options' | 'portfolio_images'
  >>
): Promise<ServiceResult<TailorProfileRow>> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return err({ code: 'UNAUTHORIZED', message: 'Not authenticated.' })

    const { data, error } = await supabase
      .from('tailor_profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return err(mapSupabaseError(error, 'updateTailorProfile'))
    return ok(data as TailorProfileRow)
  } catch (e) {
    return err(mapUnknownError(e, 'updateTailorProfile'))
  }
}
