import { Sparkles, Scissors, Heart } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CustomerDashboardOverview() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Welcome to your Tailor Studio</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review, design, and manage your custom garment requests all in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-card border border-border rounded-3xl shadow-sm space-y-4">
          <Sparkles className="w-8 h-8 text-primary" />
          <h2 className="text-base font-bold text-foreground">Custom Design</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Create new design specifications, analyze images with Google Vision AI, and customize fits.
          </p>
          <div className="pt-2">
            <Link href="/design-studio">
              <Button size="sm" className="bg-primary text-primary-foreground font-semibold h-9 rounded-xl text-xs">
                Open Studio
              </Button>
            </Link>
          </div>
        </div>

        <div className="p-6 bg-card border border-border rounded-3xl shadow-sm space-y-4">
          <Scissors className="w-8 h-8 text-primary" />
          <h2 className="text-base font-bold text-foreground">Active Quotes</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Review side-by-side quotes and estimates received from master tailors for your orders.
          </p>
          <div className="pt-2">
            <Link href="/dashboard/orders">
              <Button size="sm" variant="outline" className="border-border hover:bg-muted font-semibold h-9 rounded-xl text-xs">
                View Proposals
              </Button>
            </Link>
          </div>
        </div>

        <div className="p-6 bg-card border border-border rounded-3xl shadow-sm space-y-4">
          <Heart className="w-8 h-8 text-primary" />
          <h2 className="text-base font-bold text-foreground">Saved Drafts</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Resume customizing designs that you saved as drafts in your wishlist gallery.
          </p>
          <div className="pt-2">
            <Link href="/dashboard/wishlist">
              <Button size="sm" variant="outline" className="border-border hover:bg-muted font-semibold h-9 rounded-xl text-xs">
                View Wishlist
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
