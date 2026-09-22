"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  UserCheck,
  User,
  Briefcase,
  Camera,
  Shield,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toast } from "@/components/ui/toast"
import { validatePassword } from "@/lib/utils/password"
import { PasswordRequirements } from "@/components/auth/PasswordRequirements"

export default function TailorSettings() {
  const supabase = createClient()

  // General state
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSavingProfile, setIsSavingProfile] = React.useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false)
  const [avatarStatus, setAvatarStatus] = React.useState<{ type: "success" | "error"; text: string } | null>(null)
  const [profileStatus, setProfileStatus] = React.useState<{ type: "success" | "error"; text: string } | null>(null)
  const [payoutStatus, setPayoutStatus] = React.useState<{ type: "success" | "error"; text: string } | null>(null)
  
  // Password Form state
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [newPasswordError, setNewPasswordError] = React.useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = React.useState<string | null>(null)
  const [showPassword, setShowPassword] = React.useState(false)
  const [isChangingPassword, setIsChangingPassword] = React.useState(false)
  const [passwordStatus, setPasswordStatus] = React.useState<{ type: "success" | "error"; text: string } | null>(null)

  // Profile Form state
  const [boutiqueName, setBoutiqueName] = React.useState("")
  const [bio, setBio] = React.useState("")
  const [mobile, setMobile] = React.useState("")
  const [gender, setGender] = React.useState("prefer_not_to_say")
  const [profilePhotoUrl, setProfilePhotoUrl] = React.useState("")

  // Professional Form state
  const [totalYears, setTotalYears] = React.useState<number>(0)
  
  // Account Form state (existing)
  const [razorpayAccountId, setRazorpayAccountId] = React.useState<string | null>(null)
  const [isConnecting, setIsConnecting] = React.useState(false)
  const [businessName, setBusinessName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [accountNumber, setAccountNumber] = React.useState("")
  const [ifsc, setIfsc] = React.useState("")
  const [showToast, setShowToast] = React.useState(false)

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setEmail(user.email || "")
          
          // Fetch existing tailor profile
          const { data: profile } = await supabase
            .from("tailor_profiles")
            .select("*")
            .eq("user_id", user.id)
            .single()

          if (profile) {
            setBoutiqueName(profile.boutique_name || "")
            setBio(profile.bio || "")
            setMobile(profile.mobile || "")
            setGender(profile.gender || "prefer_not_to_say")
            setProfilePhotoUrl(profile.profile_photo_url || "")
            setRazorpayAccountId(profile.razorpay_account_id || null)
          }

          // Fetch experience
          const { data: exp } = await supabase
            .from("tailor_experience")
            .select("*")
            .eq("tailor_id", user.id)
            .single()

          if (exp) {
            setTotalYears(exp.total_years || 0)
          }
        }
      } catch {
        // silently ignore error on initial load
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    setProfileStatus(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error: profileError } = await supabase
        .from("tailor_profiles")
        .update({
          boutique_name: boutiqueName,
          bio: bio,
          mobile: mobile,
          gender: gender,
        })
        .eq("user_id", user.id)

      if (profileError) throw new Error(profileError.message)

      const { error: expError } = await supabase
        .from("tailor_experience")
        .upsert({
          tailor_id: user.id,
          total_years: totalYears,
        })

      if (expError) throw new Error(expError.message)

      setProfileStatus({ type: "success", text: "Profile and Professional Information updated successfully." })
      window.dispatchEvent(new Event("tailor-profile-updated"))
    } catch (err: any) {
      setProfileStatus({ type: "error", text: err.message || "Failed to update profile." })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      // We'll reuse the tailor-portfolios bucket for avatar since it's public
      const { error: uploadError } = await supabase.storage
        .from("tailor-portfolios")
        .upload(storagePath, file, { upsert: true })

      if (uploadError) throw new Error(uploadError.message)

      const { data: publicUrlData } = supabase.storage
        .from("tailor-portfolios")
        .getPublicUrl(storagePath)

      const url = publicUrlData.publicUrl

      const { error: dbError } = await supabase
        .from("tailor_profiles")
        .update({ profile_photo_url: url })
        .eq("user_id", user.id)

      if (dbError) throw new Error(dbError.message)

      setProfilePhotoUrl(url)
      setAvatarStatus({ type: "success", text: "Profile photo updated." })
      window.dispatchEvent(new Event("tailor-profile-updated"))
    } catch (err: any) {
      setAvatarStatus({ type: "error", text: err.message || "Avatar upload failed." })
    } finally {
      setIsUploadingAvatar(false)
      e.target.value = ""
    }
  }

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault()
    setPayoutStatus(null)

    if (!businessName || !accountNumber || !ifsc) {
      setPayoutStatus({ type: "error", text: "Please enter all payout account parameters." })
      return
    }

    setIsConnecting(true)

    try {
      const res = await fetch("/api/tailor/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          email,
          accountNumber,
          ifsc,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setRazorpayAccountId(data.accountId)
        setPayoutStatus({ type: "success", text: "Razorpay linked account created successfully!" })
      } else {
        setPayoutStatus({ type: "error", text: data.error || "Onboarding failed." })
      }
    } catch {
      setPayoutStatus({ type: "error", text: "Failed to connect to the onboarding service." })
    } finally {
      setIsConnecting(false)
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
      setPasswordStatus({ type: "success", text: "Password updated successfully!" })
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      setPasswordStatus({ type: "error", text: err.message || "Failed to update password." })
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-10 max-w-3xl pb-20">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Workspace Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your public identity, professional credentials, and secure payout configurations.
        </p>
      </div>



      {/* Profile & Professional Section */}
      <section className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
        <div className="flex items-center space-x-3 text-primary border-b border-border pb-4">
          <User className="w-6 h-6 shrink-0" />
          <h2 className="text-xl font-serif font-bold text-foreground">Public Profile</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-8">
          {/* Avatar Area */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <div className="relative w-32 h-32 rounded-full overflow-hidden bg-muted border-4 border-background shadow-md">
              {profilePhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profilePhotoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                  <User className="w-12 h-12" />
                </div>
              )}
              
              <label className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isUploadingAvatar}
                />
                {isUploadingAvatar ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </label>
            </div>
            <p className="text-xs text-muted-foreground">Click photo to update</p>
            {avatarStatus && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2 max-w-[200px] text-center ${
                  avatarStatus.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-450"
                    : "bg-destructive/10 border-destructive/20 text-destructive"
                }`}
              >
                {avatarStatus.type === "success" ? (
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{avatarStatus.text}</span>
              </div>
            )}
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSaveProfile} className="flex-grow space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Boutique / Studio Name
                </label>
                <input
                  type="text"
                  value={boutiqueName}
                  onChange={(e) => setBoutiqueName(e.target.value)}
                  placeholder="e.g. The Sartorial Studio"
                  className="w-full h-10 px-3 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Professional Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell clients about your crafting experience, fabric expertise..."
                  rows={4}
                  className="w-full p-3 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Contact Mobile
                  </label>
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91..."
                    className="w-full h-10 px-3 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full h-10 px-3 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    <option value="prefer_not_to_say">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non_binary">Non-binary</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <div className="flex items-center space-x-2 text-foreground mb-4">
                <Briefcase className="w-5 h-5 shrink-0 text-primary" />
                <h3 className="font-semibold">Professional Details</h3>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Years of Experience
                </label>
                <input
                  type="number"
                  min="0"
                  max="70"
                  value={totalYears}
                  onChange={(e) => setTotalYears(parseInt(e.target.value) || 0)}
                  className="w-32 h-10 px-3 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            {profileStatus && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  profileStatus.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-450"
                    : "bg-destructive/10 border-destructive/20 text-destructive"
                }`}
              >
                {profileStatus.type === "success" ? (
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{profileStatus.text}</span>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                disabled={isSavingProfile}
                className="bg-foreground text-background font-semibold h-10 px-6 rounded-full shadow hover:bg-foreground/90 transition-colors"
              >
                {isSavingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Account Section */}
      <section className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 text-primary border-b border-border pb-4">
          <Shield className="w-6 h-6 shrink-0" />
          <h2 className="text-xl font-serif font-bold text-foreground">Account & Payouts</h2>
        </div>

        {payoutStatus && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              payoutStatus.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-450"
                : "bg-destructive/10 border-destructive/20 text-destructive"
            }`}
          >
            {payoutStatus.type === "success" ? (
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{payoutStatus.text}</span>
          </div>
        )}

        {razorpayAccountId ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-450">
              <UserCheck className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-foreground">Payouts Connected</h3>
            </div>
            <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
              Your Razorpay Route Linked Account is active and configured. Customer order disbursements will be split and routed automatically to your registered bank account upon delivery confirmation.
            </p>
            <div className="p-3 bg-muted border border-border rounded-xl flex justify-between items-center text-xs max-w-sm">
              <span className="font-bold text-muted-foreground">Linked Account ID</span>
              <code className="bg-background px-2 py-1 border border-border rounded text-foreground font-mono">
                {razorpayAccountId}
              </code>
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-xl">
            <div className="flex items-center space-x-2 text-primary">
              <CreditCard className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-foreground">Onboard Payout Accounts</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Fill in your legal business name and bank payout credentials. We hold client payments in escrow and split funds upon delivery confirmation.
            </p>

            <form onSubmit={handleOnboard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Legal Business / Tailor Name
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Nandini Couture Boutique"
                  className="w-full h-10 px-3 border border-border rounded-xl bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Connected Contact Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="payouts@atelier.com"
                  className="w-full h-10 px-3 border border-border rounded-xl bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. 9180293810293"
                    className="w-full h-10 px-3 border border-border rounded-xl bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    required
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value)}
                    placeholder="e.g. HDFC0000240"
                    className="w-full h-10 px-3 border border-border rounded-xl bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <Button
                  type="button"
                  onClick={() => setShowToast(true)}
                  className="bg-primary text-primary-foreground font-semibold h-11 px-6 rounded-full shadow-sm opacity-75 cursor-not-allowed hover:opacity-75 transition-colors"
                >
                  Coming Soon
                </Button>
              </div>
            </form>
          </div>
        )}
      </section>

      {/* Security & Password Section */}
      <section className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 text-primary border-b border-border pb-4">
          <Lock className="w-6 h-6 shrink-0" />
          <h2 className="text-xl font-serif font-bold text-foreground">Security & Password</h2>
        </div>

        {passwordStatus && (
          <div
            className={`p-4 rounded-2xl border text-sm flex items-start gap-3 ${
              passwordStatus.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-450"
                : "bg-destructive/10 border-destructive/20 text-destructive"
            }`}
          >
            {passwordStatus.type === "success" ? (
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <span>{passwordStatus.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  if (newPasswordError) setNewPasswordError(null)
                }}
                placeholder="Create a strong password"
                className={`w-full h-10 px-3 pr-10 border rounded-xl bg-background text-sm focus:outline-none focus:ring-1 ${
                  newPasswordError
                    ? "border-destructive focus:ring-destructive focus:border-destructive"
                    : "border-border focus:ring-primary focus:border-primary"
                }`}
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
            <PasswordRequirements
              password={newPassword}
              fieldError={newPasswordError}
              showValidationRules={true}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Confirm New Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (confirmPasswordError) setConfirmPasswordError(null)
              }}
              placeholder="Re-enter new password"
              className={`w-full h-10 px-3 border rounded-xl bg-background text-sm focus:outline-none focus:ring-1 ${
                confirmPasswordError
                  ? "border-destructive focus:ring-destructive focus:border-destructive"
                  : "border-border focus:ring-primary focus:border-primary"
              }`}
            />
            {confirmPasswordError && (
              <div className="mt-1.5 p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{confirmPasswordError}</span>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              disabled={isChangingPassword}
              className="bg-foreground text-background font-semibold h-10 px-6 rounded-full shadow hover:bg-foreground/90 transition-colors"
            >
              {isChangingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Password
            </Button>
          </div>
        </form>
      </section>

      <Toast 
        isOpen={showToast} 
        onClose={() => setShowToast(false)} 
        message="Payment feature is coming soon! We're working on enabling secure online payments. Stay tuned."
      />
    </div>
  )
}
