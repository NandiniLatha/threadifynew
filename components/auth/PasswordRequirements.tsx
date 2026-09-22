"use client"

import * as React from "react"
import { Check, X, AlertCircle } from "lucide-react"
import { validatePassword } from "@/lib/utils/password"

interface PasswordRequirementsProps {
  password: string
  fieldError?: string | null
  showValidationRules?: boolean
  className?: string
}

export function PasswordRequirements({
  password,
  fieldError,
  showValidationRules = true,
  className = "",
}: PasswordRequirementsProps) {
  const result = validatePassword(password)
  const isStarted = password.length > 0

  return (
    <div className={`mt-2 space-y-2 text-xs ${className}`}>
      {/* Field-specific error banner directly below the field */}
      {fieldError && (
        <div
          role="alert"
          className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-2 animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span className="font-medium leading-tight">{fieldError}</span>
        </div>
      )}

      {/* Real-time Checklist of Password Requirements */}
      {showValidationRules && (
        <div className="p-3 bg-muted/40 border border-border/60 rounded-xl space-y-1.5">
          <p className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">
            Password requirements:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-[11px]">
            <div
              className={`flex items-center gap-1.5 transition-colors ${
                result.hasMinLength
                  ? "text-emerald-600 dark:text-emerald-450 font-medium"
                  : isStarted
                  ? "text-muted-foreground"
                  : "text-muted-foreground/80"
              }`}
            >
              {result.hasMinLength ? (
                <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-450" />
              ) : (
                <span className="w-3.5 h-3.5 flex items-center justify-center text-muted-foreground/60">
                  •
                </span>
              )}
              <span>Min. 6 characters</span>
            </div>

            <div
              className={`flex items-center gap-1.5 transition-colors ${
                result.hasUppercase
                  ? "text-emerald-600 dark:text-emerald-450 font-medium"
                  : isStarted
                  ? "text-muted-foreground"
                  : "text-muted-foreground/80"
              }`}
            >
              {result.hasUppercase ? (
                <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-450" />
              ) : (
                <span className="w-3.5 h-3.5 flex items-center justify-center text-muted-foreground/60">
                  •
                </span>
              )}
              <span>1 Uppercase (A-Z)</span>
            </div>

            <div
              className={`flex items-center gap-1.5 transition-colors ${
                result.hasSpecialChar
                  ? "text-emerald-600 dark:text-emerald-450 font-medium"
                  : isStarted
                  ? "text-muted-foreground"
                  : "text-muted-foreground/80"
              }`}
            >
              {result.hasSpecialChar ? (
                <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-450" />
              ) : (
                <span className="w-3.5 h-3.5 flex items-center justify-center text-muted-foreground/60">
                  •
                </span>
              )}
              <span>1 Special (!@#$%)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
