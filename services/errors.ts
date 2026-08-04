/**
 * Centralized error handling for the Threadify service layer.
 * All service functions should use these utilities to produce
 * consistent error objects that the frontend can handle uniformly.
 */

export type ServiceError =
  | { code: 'NOT_FOUND';          message: string; details?: string }
  | { code: 'UNAUTHORIZED';       message: string; details?: string }
  | { code: 'FORBIDDEN';          message: string; details?: string }
  | { code: 'VALIDATION';         message: string; details?: string }
  | { code: 'CONFLICT';           message: string; details?: string }
  | { code: 'DB_ERROR';           message: string; details?: string }
  | { code: 'NETWORK';            message: string; details?: string }
  | { code: 'UNKNOWN';            message: string; details?: string }

export type ServiceResult<T> =
  | { data: T;    error: null }
  | { data: null; error: ServiceError }

/** Wrap a successful value into a ServiceResult */
export function ok<T>(data: T): ServiceResult<T> {
  return { data, error: null }
}

/** Wrap an error into a ServiceResult */
export function err<T>(error: ServiceError): ServiceResult<T> {
  return { data: null, error }
}

/**
 * Map a Supabase PostgREST error to a ServiceError.
 * Reference: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export function mapSupabaseError(
  supabaseError: { code?: string; message?: string; details?: string } | null,
  context = ''
): ServiceError {
  if (!supabaseError) {
    return { code: 'UNKNOWN', message: 'An unexpected error occurred', details: context }
  }

  const msg    = supabaseError.message ?? 'Database error'
  const detail = supabaseError.details ?? context

  // PostgreSQL error code mapping
  switch (supabaseError.code) {
    case 'PGRST116':   // PostgREST: single row not found
    case '22P02':      // invalid_text_representation (UUID cast failure)
      return { code: 'NOT_FOUND',   message: 'The requested record was not found.', details: detail }

    case '42501':      // insufficient_privilege (RLS denial)
    case 'PGRST301':   // PostgREST: JWT required
      return { code: 'FORBIDDEN',   message: 'You do not have permission to perform this action.', details: detail }

    case '23505':      // unique_violation
      return { code: 'CONFLICT',    message: 'A record with these values already exists.', details: detail }

    case '23503':      // foreign_key_violation
      return { code: 'VALIDATION',  message: 'A referenced record does not exist.', details: detail }

    case '23502':      // not_null_violation
      return { code: 'VALIDATION',  message: `A required field is missing. ${msg}`, details: detail }

    case '23514':      // check_violation
      return { code: 'VALIDATION',  message: `A value failed validation. ${msg}`, details: detail }

    default:
      return { code: 'DB_ERROR',    message: msg, details: detail }
  }
}

/** Map a fetch/network error */
export function mapNetworkError(e: unknown, context = ''): ServiceError {
  const message = e instanceof Error ? e.message : 'Network error'
  return { code: 'NETWORK', message, details: context }
}

/** Map any thrown unknown to a ServiceError */
export function mapUnknownError(e: unknown, context = ''): ServiceError {
  if (e instanceof Error) {
    return { code: 'UNKNOWN', message: e.message, details: context }
  }
  return { code: 'UNKNOWN', message: 'An unexpected error occurred.', details: context }
}
