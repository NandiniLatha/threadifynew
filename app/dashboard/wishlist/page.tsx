"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { formatINR } from "@/lib/utils/currency"
import { inspirationGallery } from "@/lib/data/inspiration-gallery"
import {
  AlertCircle,
  ArrowRight,
  Trash2,
  Bookmark,
  Calendar,
  PenTool
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export const dynamic = "force-dynamic"

interface WishlistItem {
  id: string
  image_url: string
  ai_tags: string[]
  budget_min: number | null
  budget_max: number | null
  deadline: string | null
  item_type: string
  inspiration_id: string | null
  notes?: string
  created_at: string
}

export default function CustomerWishlist() {
  const supabase = createClient()
  
  const [wishlist, setWishlist] = React.useState<WishlistItem[]>([])
  const [inspirations, setInspirations] = React.useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null)
  const [itemToDelete, setItemToDelete] = React.useState<WishlistItem | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [deleteErrorMsg, setDeleteErrorMsg] = React.useState<string | null>(null)

  const loadWishlist = React.useCallback(async () => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from("wishlist_items")
          .select("id, image_url, ai_tags, budget_min, budget_max, deadline, item_type, inspiration_id, notes, created_at")
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false })

        if (error) {
          setErrorMsg(error.message)
        } else {
          const items = data || []
          setWishlist(items.filter(i => i.item_type !== 'inspiration'))
          setInspirations(items.filter(i => i.item_type === 'inspiration'))
        }
      }
    } catch {
      setErrorMsg("Failed to query saved designs.")
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  React.useEffect(() => {
    loadWishlist()
  }, [loadWishlist])

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    setIsDeleting(true)
    setDeleteErrorMsg(null)
    try {
      const { error } = await supabase
        .from("wishlist_items")
        .delete()
        .eq("id", itemToDelete.id)
      
      if (!error) {
        setWishlist((prev) => prev.filter((item) => item.id !== itemToDelete.id))
        setInspirations((prev) => prev.filter((item) => item.id !== itemToDelete.id))
        setSuccessMsg("Saved design removed successfully.")
        setItemToDelete(null)
      } else {
        setDeleteErrorMsg(error.message || "Failed to delete saved design.")
      }
    } catch {
      setDeleteErrorMsg("Failed to delete saved design. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-12 pb-16">
      <div className="border-b border-border/40 pb-8">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground tracking-tight uppercase">Saved Designs</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-3 max-w-2xl leading-relaxed">
          Your personal atelier of custom clothing ideas. Resume your design drafts when you are ready to bring them to life.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-between gap-4 rounded-xl animate-in fade-in">
          <span className="text-sm font-medium">{successMsg}</span>
          <button 
            type="button" 
            onClick={() => setSuccessMsg(null)}
            className="text-xs uppercase font-bold tracking-wider hover:opacity-75"
          >
            Dismiss
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-[3/4] w-full rounded-sm" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : errorMsg ? (
        <div className="p-6 bg-destructive/5 border border-destructive/10 text-destructive flex items-center gap-4 rounded-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{errorMsg}</span>
          <Button onClick={loadWishlist} variant="outline" size="sm" className="ml-auto">Retry</Button>
        </div>
      ) : wishlist.length === 0 && inspirations.length === 0 ? (
        <div className="space-y-16">
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-2xl font-bold uppercase tracking-tight">Discover Inspirations</h2>
              <Link href="/inspiration" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center">
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {inspirationGallery.slice(0, 3).map((galleryItem) => (
                <div key={galleryItem.id} className="group relative flex flex-col h-full bg-card rounded-sm overflow-hidden border border-transparent hover:border-border/50 transition-all duration-500">
                  <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                    <Image
                      src={galleryItem.image}
                      alt={galleryItem.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-1000 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <button
                      type="button"
                      onClick={async () => {
                         await fetch('/api/wishlist/inspiration', {
                           method: 'POST',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify({ inspirationId: galleryItem.id, action: 'save' })
                         })
                         loadWishlist()
                      }}
                      className="absolute top-4 right-4 p-2.5 bg-background/95 backdrop-blur-sm text-foreground rounded-full opacity-0 group-hover:opacity-100 hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-lg"
                      aria-label="Save inspiration"
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                    
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                      <Link href={`/design-studio?inspiration=${galleryItem.id}`}>
                        <Button variant="secondary" className="bg-background text-foreground hover:bg-background/90 rounded-none px-6 py-5 text-xs font-bold uppercase tracking-[0.15em] shadow-xl">
                          <PenTool className="w-3.5 h-3.5 mr-2" /> Use in Design Studio
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="pt-5 flex flex-col flex-1 px-1">
                    <h3 className="font-serif text-lg font-bold text-foreground mb-4 line-clamp-1">{galleryItem.title}</h3>
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      <span className="inline-block bg-muted/50 text-muted-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm border border-border/50">
                        {galleryItem.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center border border-dashed border-border/60 bg-muted/20 rounded-sm">
            <Bookmark className="w-10 h-10 text-muted-foreground/50 mb-6" strokeWidth={1} />
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-3">Your style collection is waiting.</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8">
              Save designs from the Design Studio or get inspired by our curated looks above.
            </p>
            <Link href="/design-studio">
              <Button className="bg-foreground text-background hover:bg-foreground/90 rounded-none px-8 py-6 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-xl hover:shadow-2xl">
                Open Design Studio
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-16">
          {inspirations.length > 0 && (
            <div>
              <h2 className="font-serif text-3xl font-bold mb-8 uppercase tracking-tight">Saved Inspirations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {inspirations.map((item) => {
                  const galleryItem = inspirationGallery.find(g => g.id === item.inspiration_id)
                  if (!galleryItem) return null
                  
                  return (
                    <div key={item.id} className="group relative flex flex-col h-full bg-card rounded-sm overflow-hidden border border-transparent hover:border-border/50 transition-all duration-500">
                      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                        <Image
                          src={galleryItem.image}
                          alt={galleryItem.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-1000 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <button
                          type="button"
                          onClick={async () => {
                             await fetch('/api/wishlist/inspiration', {
                               method: 'POST',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({ inspirationId: galleryItem.id, action: 'unsave' })
                             })
                             setInspirations(prev => prev.filter(i => i.id !== item.id))
                          }}
                          disabled={isDeleting}
                          className="absolute top-4 right-4 p-2.5 bg-background/95 backdrop-blur-sm text-foreground rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-all duration-300 shadow-lg disabled:opacity-50"
                          aria-label="Remove saved inspiration"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                          <Link href={`/design-studio?inspiration=${galleryItem.id}`}>
                            <Button variant="secondary" className="bg-background text-foreground hover:bg-background/90 rounded-none px-6 py-5 text-xs font-bold uppercase tracking-[0.15em] shadow-xl">
                              <PenTool className="w-3.5 h-3.5 mr-2" /> Use in Design Studio
                            </Button>
                          </Link>
                        </div>
                      </div>

                      <div className="pt-5 flex flex-col flex-1 px-1">
                        <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                          <span className="flex items-center"><Calendar className="w-3 h-3 mr-1.5 opacity-70" /> {formatDate(item.created_at)}</span>
                          <span>Inspiration</span>
                        </div>
                        <h3 className="font-serif text-lg font-bold text-foreground mb-4 line-clamp-1">{galleryItem.title}</h3>
                        <div className="flex flex-wrap gap-1.5 mb-5">
                          <span className="inline-block bg-muted/50 text-muted-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm border border-border/50">
                            {galleryItem.category}
                          </span>
                        </div>
                        <div className="mt-auto pt-4 border-t border-border/30 flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground">{galleryItem.estimatedPrice}</span>
                          <Link href={`/design-studio?inspiration=${galleryItem.id}`}>
                            <span className="flex items-center text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/70 transition-colors">
                              Use <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                            </span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {wishlist.length > 0 && (
            <div>
              <h2 className="font-serif text-3xl font-bold mb-8 uppercase tracking-tight">Saved Designs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {wishlist.map((item) => (
                  <div key={item.id} className="group relative flex flex-col h-full bg-card rounded-sm overflow-hidden border border-transparent hover:border-border/50 transition-all duration-500">
                    <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                      <Image
                        src={item.image_url}
                        alt="Saved design draft"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-1000 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteErrorMsg(null)
                          setItemToDelete(item)
                        }}
                        disabled={isDeleting}
                        className="absolute top-4 right-4 p-2.5 bg-background/95 backdrop-blur-sm text-foreground rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-all duration-300 shadow-lg disabled:opacity-50"
                        aria-label="Remove saved design"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <div className="absolute bottom-6 left-0 right-0 flex justify-center translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                        <Link href={`/design-studio?draftId=${item.id}`}>
                          <Button variant="secondary" className="bg-background text-foreground hover:bg-background/90 rounded-none px-6 py-5 text-xs font-bold uppercase tracking-[0.15em] shadow-xl">
                            <PenTool className="w-3.5 h-3.5 mr-2" /> Continue Designing
                          </Button>
                        </Link>
                      </div>
                    </div>

                    <div className="pt-5 flex flex-col flex-1 px-1">
                      <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        <span className="flex items-center"><Calendar className="w-3 h-3 mr-1.5 opacity-70" /> {formatDate(item.created_at)}</span>
                        <span>Draft</span>
                      </div>
                      <h3 className="font-serif text-lg font-bold text-foreground mb-4 line-clamp-1">
                        {item.ai_tags?.[0] ? `${item.ai_tags[0]} Design` : "Custom Design Draft"}
                      </h3>

                      {item.ai_tags && item.ai_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-5">
                          {item.ai_tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="inline-block bg-muted/50 text-muted-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm border border-border/50">
                              {tag}
                            </span>
                          ))}
                          {item.ai_tags.length > 3 && (
                            <span className="inline-block bg-muted/50 text-muted-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm border border-border/50">
                              +{item.ai_tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="mt-auto pt-4 border-t border-border/30 flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">
                          {item.budget_min && item.budget_max
                            ? `${formatINR(item.budget_min)} - ${formatINR(item.budget_max)}`
                            : "Open Budget"}
                        </span>
                        
                        <Link href={`/design-studio?draftId=${item.id}`}>
                          <span className="flex items-center text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/70 transition-colors">
                            Open <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                          </span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-destructive/10 text-destructive rounded-xl shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1 flex-1">
                <h2 id="delete-dialog-title" className="text-lg font-bold text-foreground">
                  Remove Saved Design?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete this saved draft? This action cannot be undone.
                </p>
              </div>
            </div>

            {deleteErrorMsg && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteErrorMsg}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setItemToDelete(null)
                  setDeleteErrorMsg(null)
                }}
                disabled={isDeleting}
                className="rounded-xl border-border"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="rounded-xl font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {isDeleting ? "Removing..." : "Yes, Remove Draft"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

