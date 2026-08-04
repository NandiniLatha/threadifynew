"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { formatINR } from "@/lib/utils/currency"
import {
  Heart,
  AlertCircle,
  Tag,
  ArrowRight,
  X,
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
  notes?: string
}

export default function CustomerWishlist() {
  const supabase = createClient()
  
  const [wishlist, setWishlist] = React.useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadWishlist() {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data, error } = await supabase
            .from("wishlist_items")
            .select("id, image_url, ai_tags, budget_min, budget_max, deadline, notes")
            .eq("customer_id", user.id)
            .order("created_at", { ascending: false })

          if (error) {
            setErrorMsg(error.message)
          } else {
            setWishlist(data || [])
          }
        }
      } catch {
        setErrorMsg("Failed to query wishlist drafts.")
      } finally {
        setIsLoading(false)
      }
    }
    loadWishlist()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDeleteDraft = async (id: string) => {
    try {
      const { error } = await supabase
        .from("wishlist_items")
        .delete()
        .eq("id", id)
      
      if (!error) {
        setWishlist((prev) => prev.filter((item) => item.id !== id))
      }
    } catch {
      setErrorMsg("Failed to delete draft.")
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Your Saved Drafts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review ideas saved in your Custom Design drafts and resume them when ready to submit.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      ) : errorMsg ? (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      ) : wishlist.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border border-dashed rounded-3xl space-y-4">
          <Heart className="w-12 h-12 text-muted-foreground/45 mx-auto" />
          <h2 className="text-lg font-bold text-foreground">Wishlist is Empty</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Design drafts that you save in the Custom Design will show up here until you submit them to tailors.
          </p>
          <div className="pt-2">
            <Link href="/design-studio">
              <Button className="bg-primary text-primary-foreground font-semibold px-6 rounded-2xl h-11">
                Go to Custom Design
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {wishlist.map((item) => (
            <div key={item.id} className="group relative bg-card border border-border hover:shadow-sm rounded-3xl p-4 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Thumbnail */}
                <div className="aspect-square relative rounded-2xl overflow-hidden border border-border bg-muted">
                  <Image
                    src={item.image_url}
                    alt="Draft preview"
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                    loading="lazy"
                  />
                  
                  <button
                    type="button"
                    onClick={() => handleDeleteDraft(item.id)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition-opacity opacity-0 group-hover:opacity-100"
                    aria-label="Delete draft"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* AI Tags */}
                <div className="flex flex-wrap gap-1">
                  {item.ai_tags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center text-[9px] font-semibold px-2 py-0.5 bg-primary/5 text-primary border border-primary/10 rounded-full">
                      <Tag className="w-2.5 h-2.5 mr-0.5" />
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Budget */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">
                    {item.budget_min && item.budget_max
                      ? `${formatINR(item.budget_min)} - ${formatINR(item.budget_max)}`
                      : "Budget unspecified"}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-border">
                <Link href="/design-studio">
                  <Button className="w-full flex items-center justify-center space-x-1 bg-primary text-primary-foreground font-semibold h-10 rounded-2xl shadow-sm text-xs">
                    <span>Continue to Request</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
