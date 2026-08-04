"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import {
  FolderKanban,
  Loader2,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TailorPortfolio() {
  const supabase = createClient()
  
  const [bio, setBio] = React.useState("")
  const [images, setImages] = React.useState<string[]>([])
  
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSavingBio, setIsSavingBio] = React.useState(false)
  const [isUploadingImage, setIsUploadingImage] = React.useState(false)
  
  const [statusMsg, setStatusMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null)

  React.useEffect(() => {
    async function loadPortfolio() {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile, error } = await supabase
            .from("tailor_profiles")
            .select("bio, portfolio_images")
            .eq("user_id", user.id)
            .single()

          if (error) {
            // Profile doesn't exist yet, we initialize empty
            setBio("")
            setImages([])
          } else if (profile) {
            setBio(profile.bio || "")
            setImages(profile.portfolio_images || [])
          }
        }
      } catch {
        setStatusMsg({ type: "error", text: "Failed to load portfolio." })
      } finally {
        setIsLoading(false)
      }
    }
    loadPortfolio()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSaveBio = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingBio(true)
    setStatusMsg(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from("tailor_profiles")
        .upsert({
          user_id: user.id,
          bio: bio,
        })

      if (error) {
        setStatusMsg({ type: "error", text: error.message })
      } else {
        setStatusMsg({ type: "success", text: "Biography updated successfully!" })
      }
    } catch {
      setStatusMsg({ type: "error", text: "An unexpected error occurred." })
    } finally {
      setIsSavingBio(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploadingImage(true)
      setStatusMsg(null)
      const file = e.target.files[0]
      const reader = new FileReader()
      
      reader.onloadend = async () => {
        const base64 = reader.result as string
        
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          const updatedImages = [...images, base64]

          const { error } = await supabase
            .from("tailor_profiles")
            .upsert({
              user_id: user.id,
              portfolio_images: updatedImages,
            })

          if (error) {
            setStatusMsg({ type: "error", text: error.message })
          } else {
            setImages(updatedImages)
            setStatusMsg({ type: "success", text: "Image added to portfolio!" })
          }
        } catch {
          setStatusMsg({ type: "error", text: "Upload failed. Please try again." })
        } finally {
          setIsUploadingImage(false)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDeleteImage = async (indexToRemove: number) => {
    setStatusMsg(null)
    const updatedImages = images.filter((_, idx) => idx !== indexToRemove)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from("tailor_profiles")
        .upsert({
          user_id: user.id,
          portfolio_images: updatedImages,
        })

      if (error) {
        setStatusMsg({ type: "error", text: error.message })
      } else {
        setImages(updatedImages)
        setStatusMsg({ type: "success", text: "Image removed from portfolio." })
      }
    } catch {
      setStatusMsg({ type: "error", text: "Failed to remove image." })
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Your Previous Work</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your professional bio and showcase your best customized creations to customers.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-start gap-3 ${
            statusMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-450"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Bio Form */}
          <div className="lg:col-span-4 bg-card border border-border rounded-3xl p-6 h-fit shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <span>Studio Bio</span>
            </h2>

            <form onSubmit={handleSaveBio} className="space-y-4">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell clients about your crafting experience, fabric expertise, sizing details..."
                rows={8}
                className="w-full p-3 border border-border rounded-2xl bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
              />
              <Button
                type="submit"
                disabled={isSavingBio}
                className="w-full bg-primary text-primary-foreground font-semibold h-11 rounded-2xl shadow-sm"
              >
                {isSavingBio ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Save Bio
              </Button>
            </form>
          </div>

          {/* Showcases */}
          <div className="lg:col-span-8 bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-primary" />
                <span>Showcase Gallery</span>
              </h2>

              <label className="inline-block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploadingImage}
                />
                <span className="cursor-pointer text-xs font-semibold px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-2xl shadow flex items-center gap-1.5 h-10">
                  {isUploadingImage ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add Photo
                </span>
              </label>
            </div>

            {images.length === 0 ? (
              <div className="text-center py-16 border border-border border-dashed rounded-2xl space-y-4">
                <FolderKanban className="w-10 h-10 text-muted-foreground/45 mx-auto" />
                <h3 className="text-sm font-bold text-foreground">Empty Gallery</h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Click &apos;Add Photo&apos; to upload pictures of your custom designs to display to prospective clients.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {images.map((src, idx) => (
                  <div key={idx} className="group relative aspect-square border border-border rounded-2xl overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Previous Work item ${idx}`} className="w-full h-full object-cover" />
                    
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(idx)}
                        className="p-2 bg-destructive text-destructive-foreground hover:opacity-90 rounded-full transition-opacity shadow"
                        aria-label="Delete image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
