/**
 * Global Password Validation Helper for Threadify
 *
 * Rules:
 * 1. Minimum 6 characters
 * 2. At least 1 uppercase letter (A-Z)
 * 3. At least 1 special character (e.g. !@#$%^&*()_+-=[]{};':"|,.<>/?)
 * All conditions must be satisfied.
 */

export const PASSWORD_REQUIREMENTS_MESSAGE =
  "Password must contain at least 6 characters, 1 uppercase letter, and 1 special character."

export interface PasswordValidationResult {
  isValid: boolean
  hasMinLength: boolean
  hasUppercase: boolean
  hasSpecialChar: boolean
  errors: string[]
  errorMessage: string | null
}

export function validatePassword(password: string): PasswordValidationResult {
  const pwd = password || ""
  const hasMinLength = pwd.length >= 6
  const hasUppercase = /[A-Z]/.test(pwd)
  // Check for any standard symbol / special character
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`^]/.test(pwd) || /[^A-Za-z0-9\s]/.test(pwd)

  const errors: string[] = []
  if (!hasMinLength) errors.push("At least 6 characters")
  if (!hasUppercase) errors.push("At least 1 uppercase letter (A-Z)")
  if (!hasSpecialChar) errors.push("At least 1 special character (!@#$%^&*)")

  const isValid = hasMinLength && hasUppercase && hasSpecialChar

  return {
    isValid,
    hasMinLength,
    hasUppercase,
    hasSpecialChar,
    errors,
    errorMessage: isValid ? null : PASSWORD_REQUIREMENTS_MESSAGE,
  }
}
