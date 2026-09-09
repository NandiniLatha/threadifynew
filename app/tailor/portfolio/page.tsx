"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import {
  FolderKanban,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  Image as ImageIcon,
  MoreVertical,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface PortfolioItem {
  id: string
  public_url: string
  storage_path: string
  caption: string | null
  display_order: number
}

export default function TailorPortfolio() {
  const supabase = createClient()
  
  const [items, setItems] = React.useState<PortfolioItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isUploading, setIsUploading] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  
  // Edit State
  const [editingItem, setEditingItem] = React.useState<PortfolioItem | null>(null)
  const [editCaption, setEditCaption] = React.useState("")
  const [isSavingEdit, setIsSavingEdit] = React.useState(false)

  const [statusMsg, setStatusMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null)

  const loadPortfolio = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from("tailor_portfolio_items")
          .select("id, public_url, storage_path, caption, display_order")
          .eq("tailor_id", user.id)
          .order("display_order", { ascending: true })
          .order("created_at", { ascending: false })

        if (!error && data) {
          setItems(data)
        }
      }
    } catch {
      setStatusMsg({ type: "error", text: "Failed to load portfolio." })
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  React.useEffect(() => {
    loadPortfolio()
  }, [loadPortfolio])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    // Basic validation
    if (!file.type.startsWith("image/")) {
      setStatusMsg({ type: "error", text: "Please upload a valid image file." })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatusMsg({ type: "error", text: "Image must be less than 10MB." })
      return
    }

    setIsUploading(true)
    setStatusMsg(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const fileExt = file.name.split(".").pop()
      const fileName = `${crypto.randomUUID()}.${fileExt}`
      const storagePath = `${user.id}/${fileName}`

      // Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from("tailor-portfolios")
        .upload(storagePath, file, { upsert: false })

      if (uploadError) throw new Error(uploadError.message)

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("tailor-portfolios")
        .getPublicUrl(storagePath)

      // Insert DB record
      const { error: dbError } = await supabase
        .from("tailor_portfolio_items")
        .insert({
          tailor_id: user.id,
          storage_path: storagePath,
          public_url: publicUrlData.publicUrl,
          media_type: "image",
          caption: null,
          display_order: items.length, // Put at end
        })

      if (dbError) throw new Error(dbError.message)

      setStatusMsg({ type: "success", text: "Portfolio item added successfully." })
      await loadPortfolio()
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Upload failed." })
    } finally {
      setIsUploading(false)
      // Reset file input
      e.target.value = ""
    }
  }

  const handleDelete = async (id: string, storagePath: string) => {
    if (!confirm("Are you sure you want to remove this piece from your portfolio?")) return

    setDeletingId(id)
    setStatusMsg(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Remove from storage
      const { error: storageError } = await supabase.storage
        .from("tailor-portfolios")
        .remove([storagePath])

      if (storageError) console.warn("Failed to delete storage object", storageError)

      // Remove from DB (Storage might fail if file already gone, so we still delete DB)
      const { error: dbError } = await supabase
        .from("tailor_portfolio_items")
        .delete()
        .eq("id", id)
        .eq("tailor_id", user.id)

      if (dbError) throw new Error(dbError.message)

      setItems(items.filter((item) => item.id !== id))
      setStatusMsg({ type: "success", text: "Item removed." })
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to remove item." })
    } finally {
      setDeletingId(null)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingItem) return
    setIsSavingEdit(true)
    setStatusMsg(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase
        .from("tailor_portfolio_items")
        .update({ caption: editCaption })
        .eq("id", editingItem.id)
        .eq("tailor_id", user.id)

      if (error) throw new Error(error.message)

      setItems(items.map(i => i.id === editingItem.id ? { ...i, caption: editCaption } : i))
      setEditingItem(null)
      setStatusMsg({ type: "success", text: "Caption updated." })
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to update item." })
    } finally {
      setIsSavingEdit(false)
    }
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Tailor Shop Portfolio</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Showcase your finest bespoke creations to prospective clients.
          </p>
        </div>

        <label className="shrink-0 relative">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageUpload}
            className="absolute inset-0 w-0 h-0 opacity-0"
            disabled={isUploading}
          />
          <span className={`inline-flex cursor-pointer items-center justify-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
            isUploading 
              ? "bg-muted text-muted-foreground cursor-not-allowed" 
              : "bg-foreground text-background hover:bg-foreground/90 shadow-md"
          }`}>
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Piece
              </>
            )}
          </span>
        </label>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-start gap-3 ${
            statusMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-450"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 border border-border border-dashed rounded-3xl space-y-4 bg-muted/20">
          <ImageIcon className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <h3 className="text-lg font-serif font-bold text-foreground">Your work speaks for you.</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Add your first piece to help customers discover your craft and style. High quality photos attract more custom requests.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <div key={item.id} className="group relative bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="relative aspect-[3/4] bg-muted w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={item.public_url} 
                  alt={item.caption || "Portfolio item"} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                
                {/* Quick Actions overlay */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button
                    onClick={() => {
                      setEditingItem(item)
                      setEditCaption(item.caption || "")
                    }}
                    className="p-2 bg-background/90 backdrop-blur-sm text-foreground hover:bg-foreground hover:text-background rounded-full shadow transition-colors"
                    title="Edit Caption"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  <button
                    disabled={deletingId === item.id}
                    onClick={() => handleDelete(item.id, item.storage_path)}
                    className="p-2 bg-background/90 backdrop-blur-sm text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-full shadow transition-colors disabled:opacity-50"
                    title="Delete Piece"
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="p-4 flex-grow flex items-center bg-card">
                {item.caption ? (
                  <p className="text-sm font-medium text-foreground line-clamp-2">{item.caption}</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No description</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl w-full max-w-md shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-serif text-lg font-bold">Edit Piece details</h3>
              <button onClick={() => setEditingItem(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-20 h-24 shrink-0 rounded-lg overflow-hidden bg-muted border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={editingItem.public_url} className="w-full h-full object-cover" alt="thumbnail" />
                </div>
                <div className="flex-grow space-y-2">
                  <label className="block text-xs font-semibold text-foreground">
                    Caption / Description
                  </label>
                  <textarea
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    placeholder="E.g., Bespoke velvet evening gown with hand-embroidery..."
                    rows={4}
                    className="w-full p-3 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3">
              <Button variant="outline" className="rounded-full" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit} 
                disabled={isSavingEdit}
                className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-6"
              >
                {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
