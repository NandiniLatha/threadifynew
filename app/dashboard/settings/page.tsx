"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Settings,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export default function CustomerSettings() {
  const supabase = createClient()

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)

  const [isLoadingProfile, setIsLoadingProfile] = React.useState(true)
  const [isSavingProfile, setIsSavingProfile] = React.useState(false)
  const [isChangingPassword, setIsChangingPassword] = React.useState(false)
  const [profileStatus, setProfileStatus] = React.useState<{ type: "success" | "error"; text: string } | null>(null)
  const [passwordStatus, setPasswordStatus] = React.useState<{ type: "success" | "error"; text: string } | null>(null)

  React.useEffect(() => {
    async function loadProfile() {
      setIsLoadingProfile(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setEmail(user.email || "")
          const { data: profile } = await supabase
            .from("users")
            .select("name")
            .eq("id", user.id)
            .single()
          if (profile?.name) setName(profile.name)
        }
      } catch {
        // silently fail
      } finally {
        setIsLoadingProfile(false)
      }
    }
    loadProfile()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    setProfileStatus(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated.")

      const { error } = await supabase
        .from("users")
        .update({ name })
        .eq("id", user.id)

      if (error) throw new Error(error.message)
      setProfileStatus({ type: "success", text: "Profile updated successfully!" })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update profile."
      setProfileStatus({ type: "error", text: msg })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordStatus(null)

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: "error", text: "Passwords do not match." })
      return
    }
    if (newPassword.length < 8) {
      setPasswordStatus({ type: "error", text: "Password must be at least 8 characters." })
      return
    }

    setIsChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw new Error(error.message)
      setPasswordStatus({ type: "success", text: "Password changed successfully!" })
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to change password."
      setPasswordStatus({ type: "error", text: msg })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const StatusBanner = ({ status }: { status: { type: "success" | "error"; text: string } | null }) => {
    if (!status) return null
    return (
      <div
        role="alert"
        className={`p-3 rounded-2xl border text-sm flex items-start gap-2.5 ${
          status.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
            : "bg-destructive/10 border-destructive/20 text-destructive"
        }`}
      >
        {status.type === "success" ? (
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
        ) : (
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
        )}
        <span>{status.text}</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Account Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your profile details and security credentials.
        </p>
      </div>

      {isLoadingProfile ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-[400px] rounded-3xl" />
          <Skeleton className="h-[400px] rounded-3xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Details */}
          <section className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5" aria-labelledby="profile-settings-heading">
            <h2 id="profile-settings-heading" className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" aria-hidden="true" />
              Profile Information
            </h2>

            <StatusBanner status={profileStatus} />

            <form onSubmit={handleSaveProfile} className="space-y-4" noValidate>
              <div>
                <label htmlFor="settings-name" className="block text-xs font-semibold text-foreground mb-1.5">
                  Display Name
                </label>
                <input
                  id="settings-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full h-10 px-3 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="settings-email" className="block text-xs font-semibold text-foreground mb-1.5">
                  Email Address
                </label>
                <input
                  id="settings-email"
                  type="email"
                  value={email}
                  readOnly
                  disabled
                  className="w-full h-10 px-3 border border-border rounded-xl bg-muted text-sm text-muted-foreground cursor-not-allowed"
                  aria-describedby="email-readonly-hint"
                />
                <p id="email-readonly-hint" className="text-[10px] text-muted-foreground mt-1">
                  Email address cannot be changed. Contact support if needed.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSavingProfile}
                className="w-full bg-primary text-primary-foreground font-semibold h-11 rounded-2xl shadow-sm"
              >
                {isSavingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" />
                ) : null}
                Save Changes
              </Button>
            </form>
          </section>

          {/* Password */}
          <section className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5" aria-labelledby="password-settings-heading">
            <h2 id="password-settings-heading" className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" aria-hidden="true" />
              Change Password
            </h2>

            <StatusBanner status={passwordStatus} />

            <form onSubmit={handleChangePassword} className="space-y-4" noValidate>
              <div>
                <label htmlFor="new-password" className="block text-xs font-semibold text-foreground mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full h-10 px-3 pr-10 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    aria-describedby="password-length-hint"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p id="password-length-hint" className="text-[10px] text-muted-foreground mt-1">Minimum 8 characters required.</p>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-xs font-semibold text-foreground mb-1.5">
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  className="w-full h-10 px-3 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <Button
                type="submit"
                disabled={isChangingPassword}
                className="w-full bg-primary text-primary-foreground font-semibold h-11 rounded-2xl shadow-sm"
              >
                {isChangingPassword ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" />
                ) : null}
                Update Password
              </Button>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
