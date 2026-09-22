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
import { validatePassword } from "@/lib/utils/password"
import { PasswordRequirements } from "@/components/auth/PasswordRequirements"

export default function CustomerSettings() {
  const supabase = createClient()

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [newPasswordError, setNewPasswordError] = React.useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = React.useState<string | null>(null)
  const [showPassword, setShowPassword] = React.useState(false)
  const [avatarUrl, setAvatarUrl] = React.useState("")

  const [isLoadingProfile, setIsLoadingProfile] = React.useState(true)
  const [isSavingProfile, setIsSavingProfile] = React.useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false)
  const [isChangingPassword, setIsChangingPassword] = React.useState(false)
  const [avatarStatus, setAvatarStatus] = React.useState<{ type: "success" | "error"; text: string } | null>(null)
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
            .select("name, avatar_url")
            .eq("id", user.id)
            .single()
          if (profile?.name) setName(profile.name)
          if (profile?.avatar_url) setAvatarUrl(profile.avatar_url)
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
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile.")
      }

      setProfileStatus({ type: "success", text: "Profile updated successfully!" })
      
      // Notify layout to refresh the profile info in the sidebar
      window.dispatchEvent(new Event("profile-updated"))
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
    setNewPasswordError(null)
    setConfirmPasswordError(null)

    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.isValid) {
      setNewPasswordError(passwordValidation.errorMessage)
      return
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your new password.")
      return
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.")
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
        className={`p-3 rounded-2xl border text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in ${
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
              My Profile
            </h2>

            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-3 shrink-0">
                <div className="relative w-28 h-28 rounded-full overflow-hidden bg-muted border-4 border-background shadow-sm">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-serif text-3xl text-primary font-bold bg-primary/10">
                      {name.charAt(0) || "U"}
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={async (e) => {
                        if (!e.target.files || e.target.files.length === 0) return
                        const file = e.target.files[0]
                        if (!file.type.startsWith("image/")) {
                          setAvatarStatus({ type: "error", text: "Please upload a valid image file." })
                          return
                        }
                        setIsUploadingAvatar(true)
                        setAvatarStatus(null)
                        try {
                          const { data: { user } } = await supabase.auth.getUser()
                          if (!user) throw new Error("Not authenticated")

                          const fileExt = file.name.split(".").pop()
                          const fileName = `avatar_${crypto.randomUUID()}.${fileExt}`
                          const storagePath = `${user.id}/${fileName}`

                          const { error: uploadError } = await supabase.storage
                            .from("profile-images")
                            .upload(storagePath, file, { upsert: true })

                          if (uploadError) throw new Error(uploadError.message)

                          const { data: publicUrlData } = supabase.storage
                            .from("profile-images")
                            .getPublicUrl(storagePath)

                          const url = publicUrlData.publicUrl

                          const { error: dbError } = await supabase
                            .from("users")
                            .update({ avatar_url: url })
                            .eq("id", user.id)

                          if (dbError) throw new Error(dbError.message)

                          setAvatarUrl(url)
                          setAvatarStatus({ type: "success", text: "Profile photo updated." })
                          
                          // Notify layout to refresh the profile info in the sidebar
                          window.dispatchEvent(new Event("profile-updated"))
                        } catch (err: any) {
                          setAvatarStatus({ type: "error", text: err.message || "Avatar upload failed." })
                        } finally {
                          setIsUploadingAvatar(false)
                          e.target.value = ""
                        }
                      }}
                      className="hidden"
                      disabled={isUploadingAvatar}
                    />
                    {isUploadingAvatar ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Edit</span>
                    )}
                  </label>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Profile Photo</p>
                {avatarStatus && (
                  <div className="w-full text-center">
                    <StatusBanner status={avatarStatus} />
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveProfile} className="flex-1 space-y-4" noValidate>
              <div>
                <label htmlFor="settings-name" className="block text-xs font-semibold text-foreground mb-1.5">
                  Display Name
                </label>
                <input
                  id="settings-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (profileStatus) setProfileStatus(null)
                  }}
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

              {profileStatus && (
                <StatusBanner status={profileStatus} />
              )}
              </form>
            </div>
          </section>

          {/* Password */}
          <section className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5" aria-labelledby="password-settings-heading">
            <h2 id="password-settings-heading" className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" aria-hidden="true" />
              Change Password
            </h2>

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
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      if (newPasswordError) setNewPasswordError(null)
                      if (passwordStatus) setPasswordStatus(null)
                    }}
                    placeholder="Min. 6 chars, 1 uppercase, 1 symbol"
                    className={`w-full h-10 px-3 pr-10 border rounded-xl bg-background text-sm focus:outline-none focus:ring-1 ${
                      newPasswordError
                        ? "border-destructive focus:ring-destructive focus:border-destructive"
                        : "border-border focus:ring-primary focus:border-primary"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordRequirements
                  password={newPassword}
                  fieldError={newPasswordError}
                />
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
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (confirmPasswordError) setConfirmPasswordError(null)
                    if (passwordStatus) setPasswordStatus(null)
                  }}
                  placeholder="Re-enter your new password"
                  className={`w-full h-10 px-3 border rounded-xl bg-background text-sm focus:outline-none focus:ring-1 ${
                    confirmPasswordError
                      ? "border-destructive focus:ring-destructive focus:border-destructive"
                      : "border-border focus:ring-primary focus:border-primary"
                  }`}
                />
                {confirmPasswordError && (
                  <div className="mt-1.5 p-2 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-1.5 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{confirmPasswordError}</span>
                  </div>
                )}
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

              {passwordStatus && (
                <StatusBanner status={passwordStatus} />
              )}
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
