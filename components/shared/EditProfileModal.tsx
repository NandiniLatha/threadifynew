"use client"

import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Camera, Loader2, X } from "lucide-react"

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  initialName: string
  initialBio: string
  initialAvatar: string
  lastChangedAt: string | null
  userId: string
}

export function EditProfileModal({
  isOpen,
  onClose,
  initialName,
  initialBio,
  initialAvatar,
  lastChangedAt,
  userId
}: EditProfileModalProps) {
  const [name, setName] = useState(initialName || "")
  const [bio, setBio] = useState(initialBio || "")
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar || "")
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Calculate if name change is locked
  let daysLeft = 0
  let isNameLocked = false

  if (lastChangedAt) {
    const lastChanged = new Date(lastChangedAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - lastChanged.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays < 14) {
      isNameLocked = true
      daysLeft = 14 - diffDays
    }
  }

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setName(initialName || "")
      setBio(initialBio || "")
      setAvatarUrl(initialAvatar || "")
      setError(null)
    }
  }, [isOpen, initialName, initialBio, initialAvatar])

  if (!isOpen) return null

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath)

      setAvatarUrl(data.publicUrl)
    } catch (err: any) {
      console.error("Upload error:", err)
      setError(`Image not uploaded. Error: ${err.message || err}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          bio: bio,
          avatar_url: avatarUrl
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile")
      }

      window.dispatchEvent(new Event("profile-updated"))
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-serif text-2xl font-bold text-foreground">Edit My Profile</h2>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-24 h-24 rounded-full border-2 border-primary/20 overflow-hidden bg-muted">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground font-serif text-3xl">
                      {name ? name.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  {isUploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-primary hover:underline uppercase tracking-wider"
                disabled={isUploading}
              >
                Change Photo
              </button>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isNameLocked}
                className={`w-full px-4 py-3 bg-background border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all ${
                  isNameLocked ? 'border-border/50 text-muted-foreground bg-muted/50' : 'border-border'
                }`}
                placeholder="Enter your name"
              />
              {isNameLocked && (
                <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-500 font-medium">
                  🔒 You can change your name again in {daysLeft} days
                </p>
              )}
              {!isNameLocked && (
                <p className="mt-1.5 text-[10px] text-muted-foreground uppercase tracking-widest">
                  Can only be changed once every 14 days
                </p>
              )}
            </div>

            {/* Bio Input */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">About Me</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none min-h-[100px]"
                placeholder="Tell us a bit about yourself..."
                maxLength={250}
              />
              <div className="flex justify-between mt-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Optional</p>
                <p className={`text-[10px] font-medium ${bio.length >= 250 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {bio.length}/250
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-muted/30 border-t border-border flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isUploading}
            className="px-6 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
